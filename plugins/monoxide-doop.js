/**
* Monoxide-Doop plugin for mfdc-repl
*
* Attempt to load a Monoxide environment and provide the `db` global.
* The project should correspond to the MFDC/Doop standard - https://github.com/MomsFriendlyDevCo/Doop
*
* This plugin works by checking for the existence of and then evaluating all globs in `app.pluginOptions.dbGlobs` If that succeeds the `db` object is set to the module export of the `app.pluginOptions.dbMap` module
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-16
*/

var _ = require('lodash');
var async = require('async-chainable');
var colors = require('chalk');
var glob = require('glob');
var fspath = require('path');
var monoxide = require('monoxide');

module.exports = function(finish, app) {
	var settings = _.defaults(app.pluginOptions, {
		appLoader: 'units/core/backend.js',
		dbLoader: 'units/db/loader.js', // Main DB loader module
	});

	async()
		// Check that all files exist {{{
		.forEach([
			settings.appLoader,
			settings.dbLoader,
		], function(next, fileGlob) {
			glob(fileGlob, function(err, files) {
				if (err) return next(err);
				if (!files.length) return next('Not a Monoxide-Doop compatible project');
				next();
			});
		})
		// }}}
		// Setup global.app sudo-structure {{{
		.then(function(next) {
			try {
				if (app.verbose >= 2) console.log(colors.blue('[Monoxide-Doop]'), 'Load', colors.cyan(settings.appLoader));
				require(fspath.resolve(settings.appLoader));
				next();
			} catch (e) {
				next(e);
			}
		})
		// }}}
		// Setup global DB mapping as an async callback {{{
		.then(function(next) {
			if (!_.has(global.app, 'config.mongo.uri')) return next('No app.config.mongo.uri structure present');

			require(fspath.resolve(settings.dbLoader))()
				.on('start', () => { if (app.verbose) console.log(colors.blue('[Monoxide-Doop]'), 'Connecting to', colors.cyan(global.app.config.mongo.uri)) })
				.on('model', path => { if (app.verbose >= 2) console.log(colors.blue('[Monoxide-Doop]'), 'Load model', colors.cyan(fspath.relative(global.app.config.paths.root, path)))})
				.on('error', next)
				.on('end', function(models) {
					app.repl.globals.db = models;
					app.repl.globals.monoxide = monoxide;
					next();
				});
		})
		// }}}
		.then(function(next) {
			// Output the loaded modules
			console.log(colors.blue('[Monoxide-Doop]'), 'DB models loaded:', _.keys(app.repl.globals.db).map(function(i) { return colors.cyan(i) }).join(', '))

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
		.end(finish)
};
