MFDC-REPL
=========
[MFDC's](http://mfdc.biz) own internal REPL command line interface.

This project provides the executable `mrepl` which has the following functionality over regular REPL:

* **Babel pre-compiler** (`babel` plugin) - All code is automatically compiled via [BabelJS](http://babeljs.io) before it is run - making things like arrow functions available on older Node releases
* **Lodash** (`lodash` plugin) - lodash is provided as `lodash`, `l` and `__`
* **Moment** (`moment` plugin) - moment is provided as `moment`
* **Mongoose project support** (`mongoose` plugin) - If the files `./config/index.js`, `./config/db.js` and `./models/index.js` are found they are loaded in that order (with `./models/index.js` expected to return an object containing the available compiled schemas. Models are then provided in the `db` object. e.g. `db.users.find()` will return all users.
* **STDIN slurping** (`stdin` plugin) - Any piped input into the program is provied as the `input` variable. Automatic decoding of the variable will be attempted by `JSON.parse()` otherwise it will be a raw string.
* **History saving** - History saing is enabled by default




Installation
------------
Simply run the following:

	sudo npm install -g @momsfriendlydevco/repl

You should now be able to run the REPL interface with:

	mrepl


Plugins
=======
Plugins are provided in the `plugins/` folder within the main script file.

Each plugin is a simple JavaScript file which is expected to expose a function taking a callback and the main `app` argument. Each plugin can decorate the properties of the program and return the callback when finished.


Some usefully exposed properties:

| Property path        | Type    | Default         | Description                                                           |
|----------------------|---------|-----------------|-----------------------------------------------------------------------|
| `app`                | Object  | Complex         | The main application object - an instance of a `commander` definition |
| `app.verbose`        | Number  | 0               | Verbosity level                                                       |
| `app.plugin`         | Array   | `['./plugins']` | Globs to search for plugins                                           |
| `app.repl`           | Object  | Complex         | Repl options when creating the interface                              |
| `app.repl.globals`   | Object  | `{}`            | Any exported globals that should be available inside the REPL session |
| `app.repl.eval`      | Array   | `[]`            | Array of evaluation functions to run. Each Eval is run as a compose pipeline with the final output being returned to the REPL session |
| `inspect.depth`      | Number  | 2               | How deeply to examine objects when printing results to the console    |
| `inspect.colors`     | Boolean | `true`          | Whether colors are enabled when printing results to the console       |
