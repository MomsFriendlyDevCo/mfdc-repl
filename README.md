MFDC-REPL
=========
[MFDC's](http://mfdc.biz) own internal REPL command line interface.


This project provides the executable `mrepl` which provides the following functionality over regular REPL:

* **Babel pre-compiler** - All code is automatically compiled via [BabelJS](http://babeljs.io) before it is run - making things like arrow functions available on older Node releases
* **Mongoose Mode** - If the files `./config/index.js`, `./config/db.js` and `./models/index.js` are found they are loaded in that order (with `./models/index.js` expected to return an object containing the available Mongoose compiled schemas. Mongoose objects are then provided in the `db` object. e.g. `db.users.find()` will return all users
* **REPL inspection depth** - By default the inspection depth is infinite (rather than the usual `2`). Override this by setting `mrepl.inspect.depth`
* **Module: Lodash** - lodash is provided as `lodash`, `l` and `__`
* **Module: Moment** - moment is provided as `moment`


Installation
------------
Simply run the following:

	sudo npm install -g mfdc-repl

You should now be able to run the REPL interface with:

	mrepl
