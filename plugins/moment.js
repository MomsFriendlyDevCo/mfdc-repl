/**
* Moment plugin for mfdc-repl
*
* Simple plugin to provide Moment support as the `moment` global
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-15
*/

module.exports = function(finish, app) {
	app.repl.globals.moment = require('moment');
	finish();
};
