/**
* Lodash plugin for mfdc-repl
*
* Simple plugin to provide lodash support as the `lodash`, `l` and '__' globals
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-15
*/

module.exports = function(finish, app) {
	app.repl.globals.lodash = require('lodash');
	app.repl.globals.l = app.repl.globals.lodash;
	app.repl.globals.__ = app.repl.globals.lodash;

	finish();
};
