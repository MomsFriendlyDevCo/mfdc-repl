/**
* Mongoose-Crux plugin for mfdc-repl
*
* Attempt to load a Mongoose environment and provide the `db` global.
* The project should correspond to the MFDC/Crux standard - https://github.com/MomsFriendlyDevCo/Crux
*
* This plugin works by checking for the existence of and then evaluating all globs in `app.pluginOptions.dbGlobs` If that succeeds the `db` object is set to the module export of the `app.pluginOptions.dbMap` module
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-15
*/

var _ = require('lodash');
var async = require('async-chainable');
var colors = require('chalk');
var glob = require('glob');
var fs = require('fs');
var fspath = require('path');
var mongoose = require('mongoose');

module.exports = function(finish, app) {
	var settings = _.defaults(app.pluginOptions, {
		configMap: 'config/index.js',
		dbLoader: 'config/db.js',
		dbMap: 'models/index.js', // File to use to determine the contents of `db` (should also be in dbGlobs so we can determine it exists)
	});

	async()
		// Check if the setup is actually a Crux project {{{
		.forEach([settings.configMap, settings.dbMap], function(next, file) {
			fs.stat(fspath.resolve(file), function(err) {
				if (err) return next(file + ' not found. Probably not a crux projext');
				next();
			});
		})
		// }}}
		// Load global config {{{
		.then(function(next) {
			global.config = require(fspath.resolve(settings.configMap));
			next();
		})
		// }}}
		// Load DB file {{{
		.then(function(next) {
			try {
				require(fspath.resolve(settings.dbLoader));
				next();
			} catch (e) {
				next(e);
			}
		})
		// }}}
		// Load Model map {{{
		.then(function(next) {
			try {
				app.repl.globals.db = require(fspath.resolve(settings.dbMap));
				next();
			} catch (e) {
				next(e);
			}
		})
		// }}}
		// Setup REPL {{{
		.then(function(next) {
			// Output the loaded modules
			console.log(colors.blue('[Mongoose-Crux]'), 'DB models loaded:', _.keys(app.repl.globals.db).map(function(i) { return colors.cyan(i) }).join(', '))

			// Setup the resolver to return the results of the eval
			app.repl.eval.push(function(next, res) {
				try {
					// If its not a DB return - exit
					if (!_.hasIn(res, '$MONOXIDE') || !_.hasIn(res, 'exec')) return next(null, res);

					// If it is a query attach to the .exec() handler and wait for a response
					res.exec(function(err, doc) {
						if (!_.isObject(doc)) return next(err, doc); // Nothing to do

						// Glue an inspect helper to the object
						doc.inspect = function() {
							if (_.isArray(doc)) {
								return doc.map(function(d) { return d.toObject() });
							} else {
								return doc.toObject();
							}
						};

						next(err, doc);
					});
				} catch (err) {
					return next(err);
				}
			});

			next();
		})
		// }}}
		// End {{{
		.end(finish)
		// }}}
};
