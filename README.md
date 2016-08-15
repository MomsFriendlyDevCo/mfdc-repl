MFDC-REPL
=========
[MFDC's](http://mfdc.biz) own internal REPL command line interface.


This project provides the executable `mrepl` which provides the following functionality over regular REPL:

* **Babel pre-compiler** - All code is automatically compiled via [BabelJS](http://babeljs.io) before it is run - making things like arrow functions available on older Node releases
* **REPL inspection depth** - By default the inspection depth is infinite (rather than the usual `2`). Override this by setting `mrepl.inspect.depth`
* **Module: Lodash** - lodash is provided as `lodash`, `l` and `__`
* **Module: Moment** - moment is provided as `moment`
* **Database Mode** - If the files `./config/index.js`, `./config/db.js` and `./models/index.js` are found they are loaded in that order (with `./models/index.js` expected to return an object containing the available compiled schemas. Models are then provided in the `db` object. e.g. `db.users.find()` will return all users. MFDC-REPL currently supports both [MongooseJS](http://mongoosejs.com) and [Monoxide](https://github.com/hash-bang/Monoxide) models.


Installation
------------
Simply run the following:

	sudo npm install -g mfdc-repl

You should now be able to run the REPL interface with:

	mrepl


Plugins
=======
Plugins are provided in the `plugins/` folder within the main script file.

Each plugin is a simple JavaScript file which is expected to expose a function taking a callback and the main `app` argument. Each plugin can decorate the properties of the program and return the callback when finished.


Some usefully exposed properties:

| Property path      | Type   | Default         | Description                                                           |
|--------------------|--------|-----------------|-----------------------------------------------------------------------|
| `app`              | Object | Complex         | The main application object - an instance of a `commander` definition |
| `app.verbose`      | Number | 0               | Verbosity level                                                       |
| `app.plugin`       | Array  | `['./plugins']` | Globs to search for plugins                                           |
| `app.repl`         | Object | Complex         | Repl options when creating the interface                              |
| `app.repl.globals` | Object | `{}`            | Any exported globals that should be available inside the REPL session |
| `app.repl.eval`    | Array  | `[]`            | Array of evaluation functions to run. Each Eval is run as a compose pipeline with the final output being returned to the REPL session |
