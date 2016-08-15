module.exports = function(finish, app) {
	app.repl.globals.moment = require('moment');
	finish();
};
