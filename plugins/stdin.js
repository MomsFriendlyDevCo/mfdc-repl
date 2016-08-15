var colors = require('chalk');
var tty = require('tty');

module.exports = function(finish, app) {
	if (tty.isatty(process.stdin)) return finish(); // Not a pipe

	var slurped = '';
	process.stdin
		.on('data', function(data) {
			slurped += data;
		})
		.on('end', function() {
			app.repl.globals.input = slurped;
			console.log(colors.blue('[STDIN]'), 'Loaded STDIN into', colors.cyan('input'));
			process.stdin.resume();

			finish();
		});

	if (app.verbose >= 2) console.log(colors.blue('[Stdin]'), 'Waiting for STDIN');
};
