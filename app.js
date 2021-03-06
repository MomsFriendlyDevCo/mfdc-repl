#!/usr/bin/node
var _ = require('lodash');
var async = require('async-chainable');
var colors = require('chalk');
var fs = require('fs');
var glob = require('glob');
var program = require('commander');
var repl = require('repl');
var replHistory = require('repl.history');
var ttys = require('ttys');
var vm = require('vm');
var util = require('util');

program
	.version(require('./package.json').version)
	.usage('[options]')
	.option('-v, --verbose', 'Be verbose. Specify multiple times for increasing verbosity', function(i, v) { return v + 1 }, 0)
	.option('--no-color', 'Force disable color')
	.option('--plugin [glob]', 'Provide glob path for plugins (can be specified multiple times)', function(i, v) { v.push(i); return v }, [])
	.parse(process.argv);

// Apply option defaults {{{
if (!program.plugin || !program.plugin.length) program.plugin = [__dirname + '/plugins/*.js'];
// }}}
// Apply .repl meta structure {{{
program.repl = {
	globals: {
		inspect: {
			depth: 2,
			colors: true,
		},
	},
	rewriter: [],
	eval: [],
};
// }}}

async()
	// Load plugins {{{
	.then('plugins', function(next) {
		var plugins = [];
		async()
			.then(function(next) {
				if (program.verbose >= 2) console.log(colors.blue('[Plugin Scan]'), 'Loading plugins', program.plugin.join(', '));
				next();
			})
			.forEach(program.plugin, function(next, dir) {
				if (program.verbose >= 1) console.log(colors.blue('[Plugin Scan]'), dir);
				glob(dir, function(err, files) {
					if (err) next(err);
					plugins.push(files);
					next();
				});
			})
			.end(function(err) {
				if (err) return next(err);
				next(null, _.flatten(plugins));
			});
	})
	.forEach('plugins', function(next, pluginFile) {
		if (program.verbose >= 1) console.log(colors.blue('[Plugin]'), pluginFile);
		try {
			if (program.verbose >= 3) console.log(colors.blue('[Plugin]'), colors.green('Start'), pluginFile);
			var mod = require(pluginFile);
			mod(function(err) {
				// Ignore errors from plugins (only print if verbose >0)
				if (program.verbose >= 3) console.log(colors.blue('[Plugin]'), colors.red('End'), pluginFile, colors.red('Err Return'), err);
				if (err && program.verbose >= 1) console.log(colors.blue('[Plugin ' + pluginFile + ']'), colors.red('Error'), err);
				next();
			}, program);
		} catch (e) {
			if (program.verbose >= 3) console.log(colors.blue('[Plugin]'), colors.red('CAUGHT ERR'), e);
			next('Error processing "' + pluginFile + '" - ' + e.toString());
		}
	})
	// }}}
	// Run repl {{{
	.then(function(next) {
		if (program.verbose >= 2) {
			console.log(colors.blue('[repl.globals]'), _.keys(program.repl.globals).map(function(i) { return colors.cyan(i) }).join(', '));
		}

		// Move all program.repl.globals into global {{{
		_.extend(global, program.repl.globals);
		// }}}

		// Add blank line if verbose - so there is some spacing {{{
		if (program.verbose >= 1) console.log();
		// }}}

		var r = repl
			.start({
				// BUGFIX: If we are reading from a pipe we need ttys to provide us a user terminal rather than trust process.std{in,out} {{{
				input: ttys.stdin,
				output: ttys.stdout,
				terminal: true,
				// }}}
				useGlobals: true,
				useColors: program.color,
				prompt: colors.blue('NODE> '),
				eval: function(cmd, context, filename, finish) {
					async()
						.forEach(program.repl.rewriter, function(next, func) {
							// Call each rewriter function as a compose operation allowing it to mutate the result before its passed to the next
							func(function(err, newCommand) {
								if (err) return next(err);
								cmd = newCommand;
								next();
							}, cmd);
						})
						.then('result', function(next) {
							try {
								var result = vm.runInContext(cmd, context, filename);
								next(null, result);
							} catch (e) {
								next(e);
							}
						})
						.limit(1)
						.forEach(program.repl.eval, function(next, func) {
							var task = this;
							// Call each eval function as a compose operation allowing it to mutate the result before its passed to the next
							func(function(err, newResult) {
								if (err) return next(err);
								task.result = newResult;
								next();
							}, task.result);
						})
						.end(function(err) {
							finish(err, this.result);
						});
				},
				writer: function(doc) {
					return util.inspect(doc, program.repl.globals.inspect);
				},
			})
			.on('exit', function() {
				console.log('EXIT!');
				next();
			});

		replHistory(r, process.env.HOME + '/.n_repl_history');
	})
	// }}}
	// End {{{
	.end(function(err) {
		if (err) {
			console.log(colors.red('Error'), err.toString());
			process.exit(1);
		} else {
			process.exit(0);
		}
	});
	// }}}
