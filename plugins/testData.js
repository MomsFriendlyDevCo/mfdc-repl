/**
* Test data plugin for mfdc-repl
*
* Load various bits of test data into the `test` global
*
* @author Matt Carter <m@ttcarter.com>
* @date 2016-08-15
*/

module.exports = function(finish, app) {
	app.repl.globals.test = {
		scalar: 'FooBarBaz',
		string: 'FooBarBaz',
		number: 123,
		date: new Date(),
		collection: [
			{id: 'foo', name: 'Mr Foo', age: 45},
			{id: 'bar', name: 'Ms Bar', age: 25},
			{id: 'baz', name: 'Mrs Baz', age: 51},
			{id: 'quz', name: 'Mr Quz', age: 18},
		],
		object: {
			foo: 'one',
			bar: 'bar',
			baz: 'baz',
			quz: 'quz',
		},
		array: ['foo', 'bar', 'baz', 'quz'],
	};

	finish();
};
