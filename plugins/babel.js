/**
* Babel plugin for mfdc-repl
*
* All commands are run via Babel before execution
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-16
*/

var babel = require('babel-core');

module.exports = function(finish, app) {
	app.repl.rewriter.push(function(next, cmd) {
		next(null, babel.transform(cmd).code);
	});

	finish();
};
