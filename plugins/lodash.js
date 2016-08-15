/**
* Lodash plugin for mfdc-repl
*
* Simple plugin to provide lodash support as the `lodash` and `l` globals
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-15
*/

module.exports = function(finish, app) {
	app.repl.globals.lodash = require('lodash');
	finish();
};
