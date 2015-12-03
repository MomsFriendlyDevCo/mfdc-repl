#!/usr/bin/env node
// Usage: mrepl
//
//  or via pipe: echo 'console.log("Hello World")' | mrepl
//
// Load a NodeJS REPL session with some handy modules already loaded
//
// If the following files are found `mrepl` loads in Mongoose mode - ./models.index (assumed to provide back an object of all available models), ./config/index.js, ./config/db.js
// This module also attempts to locate a 'models' directory in the current path - if its found Mongoose is booted and the database becomes available as the 'db' object
// The './models' path is assumed to contain an index.js file which will load all 'real' models as an object (typically using the `require-dir` NPM module)

var _ = require('lodash');
var babel = require('babel-core');
var colors = require('colors');
var fs = require('fs');
var moment = require('moment');
var mongoose = require('mongoose');
var repl = require("repl");
var replHistory = require('repl.history');
var util = require('util');
var vm = require('vm');

var mongooseMode = false; // Whether to supore Mongoose in this session

// Change into the CWD
process.chdir(process.cwd());

if (
	[
		'./models/index.js',
		'./config/index.js',
		'./config/db.js',
	].every(function(file) {
		try {
			fs.statSync(file);
			return true;
		} catch (e) {
			return false;
		}
	})
) {
	mongooseMode = true;
	console.log(colors.blue('[REPL]'), '"' + colors.cyan('models') + '"', 'dir found - loading Mongoose database as', colors.cyan('db'), 'object');
	global.config = require(process.cwd() + '/config');
	require(process.cwd() + '/config/db');

	global.db = require(process.cwd() + '/models');

	if (_.isEmpty(global.db)) {
		console.log(colors.blue('[REPL]'), colors.red('Model error'), './models/index.js loaded but module exported no models.');
		console.log(colors.blue('[REPL]'), colors.red('Model error'), 'This usually occurs when the file loads the models but does not use module.exports');
	} else {
		console.log(colors.blue('[REPL]'), 'Loaded models:', _.keys(global.db).map(function(model) { return colors.cyan(model) }).join(', '));
	}
}


// Pre-loaded modules {{{
global.__ = global.lodash = global.l = _;
global.moment = moment;
global.mrepl = {
	inspect: {
		depth: null,
		colors: true,
	},
};
// }}}

// test. data sets {{{
global.test = {
	scalar: 'FooBarBaz',
	string: 'FooBarBaz',
	number: 123,
	date: new Date(),
	collection: [
		{id: 'foo', name: 'Mr Foo', age: 45},
		{id: 'bar', name: 'Ms Bar', age: 25},
		{id: 'baz', name: 'Mrs Baz', age: 51},
		{id: 'quz', name: 'Mr Quz', age: 18},
	],
	object: {
		foo: 'one',
		bar: 'bar',
		baz: 'baz',
		quz: 'quz',
	},
	array: ['foo', 'bar', 'baz', 'quz'],
};
// }}}

var r = repl
	.start({
		useGlobals: true,
		useColors: true,
		ignoreUndefined: true,
		prompt: colors.blue("NODE> "),
		eval: function(rawCmd, context, filename, next) {
			// Convert from possible Babel code
			var cmd = babel.transform(rawCmd).code;

			if (!mongooseMode) {
				var res = vm.runInContext(cmd, context, filename);
				return next(null, res);
			}

			try {
				// Attempt to run the item and return the response
				var res = vm.runInContext(cmd, context, filename);

				// If its not a query we dont care - pass it to the next handler anyway
				if (!_.isObject(res) || ! res.mongooseCollection) return next(null, res);

				// If it is a query attach to the .exec() handler and wait for a response
				return res.setOptions({slaveOk: true})
					// .lean(true) // Enable return as standard JS object/array - allows coloring
					.exec(function(err, doc) {
						doc.inspect = function() {
							if (_.isArray(doc)) {
								return doc.map(function(d) { return d.toJSON() });
							} else {
								return doc.toObject();
							}
						};
						return next(err, doc);
					});
			} catch (err) {
				return next(err);
			}
			return next(null);
		},
		writer: function(doc) {
			return util.inspect(doc, global.mrepl.inspect);
		},
	})
	.on('exit', function() {
		process.exit(0);
	})

replHistory(r, process.env.HOME + '/.node_history');
