var _ = require('lodash');
var async = require('async-chainable');
var colors = require('chalk');
var glob = require('glob');
var fspath = require('path');
var mongoose = require('mongoose');

module.exports = function(finish, app) {
	var settings = _.defaults(app.pluginOptions, {
		dbGlobs: [ // Files that should be run before we can load the database - if any are missing the processing stops
			'config/index.js',
			'config/db.js',
			'models/index.js',
		],
		dbMap: 'models/index.js', // File to use to determine the contents of `db` (should also be in dbGlobs so we can determine it exists)
	});

	async()
		.limit(1)
		.forEach(settings.dbGlobs, function(next, dbGlob) {
			glob(dbGlob, function(err, files) {
				if (err) return next(err);
				if (!files.length) return next('INVALID');
				files.forEach(function(file) {
					if (app.verbose >= 2) console.log(colors.blue('[Mongoose]'), 'Load', colors.cyan(file));
					try {
						require(fspath.resolve(file));
						next();
					} catch(e) {
						next(err);
					}
				});
			});
		})
		.then(function(next) {
			// Setup global DB mapping
			app.repl.globals.db = require(fspath.resolve(settings.dbMap));

			// Output the loaded modules
			console.log(colors.blue('[Mongoose]'), 'DB models loaded:', _.keys(app.repl.globals.db).map(function(i) { return colors.cyan(i) }).join(', '))

			// Setup the resolver to return the results of the eval
			app.repl.eval.push(function(next, res) {
				try {
					// If its not a DB return - exit
					if (!_.hasIn(res, 'setOptions') || !_.hasIn(res, 'exec')) return next(null, res);

					// Set slaveOK: true - otherwise we don't get a return
					res.setOptions({slaveOk: true});

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
