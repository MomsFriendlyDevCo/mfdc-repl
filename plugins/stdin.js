/**
* STDIN plugin for mfdc-repl
*
* This plugin will slurp STDIN into the global `input` variable.
* If the stream can be parsed by `JSON.parse` it will be decoded and provided as that object
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-15
*/

var _ = require('lodash');
var colors = require('chalk');
var tty = require('tty');

module.exports = function(finish, app) {
	if (process.stdin.isTTY) {
		if (app.verbose >= 1) console.log(colors.blue('[Stdin]'), 'STDIN is not a pipe - skipping');
		return finish(); // Not a pipe
	}

	var slurped = '';
	process.stdin
		.on('data', function(data) {
			slurped += data;
		})
		.on('end', function() {
			try {
				var json = JSON.parse(slurped);
				if (_.isNumber(json)) {
					app.repl.globals.input = json;
					console.log(colors.blue('[STDIN]'), 'Loaded STDIN into', colors.cyan('input'), colors.grey('(as a number)'));
				} else if (_.isString(json)) {
					app.repl.globals.input = json;
					console.log(colors.blue('[STDIN]'), 'Loaded STDIN into', colors.cyan('input'), colors.grey('(as a JSON string of ' + json.length + ' bytes)'));
				} else if (_.isArray(json)) {
					app.repl.globals.input = json;
					console.log(colors.blue('[STDIN]'), 'Loaded STDIN into', colors.cyan('input'), colors.grey('(as a JSON array of ' + json.length + ' items)'));
				} else if (_.isObject(json)) {
					app.repl.globals.input = json;
					console.log(colors.blue('[STDIN]'), 'Loaded STDIN into', colors.cyan('input'), colors.grey('(as a JSON object of ' + _.keys(json).length + ' root object keys)'));
				}
			} catch (e) {
				console.log('ERR:', e);
				// Ignore errors as they are probably parsing related
				app.repl.globals.input = _.trimEnd(slurped);
				console.log(colors.blue('[STDIN]'), 'Loaded STDIN into', colors.cyan('input'), colors.grey('(as a string of ' + slurped.length + ' bytes)'));
			}

			finish();
		});

	if (app.verbose >= 2) console.log(colors.blue('[Stdin]'), 'Waiting for STDIN');
};
