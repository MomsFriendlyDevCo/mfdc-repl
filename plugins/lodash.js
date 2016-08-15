module.exports = function(finish, app) {
	app.repl.globals.lodash = require('lodash');
	finish();
};
