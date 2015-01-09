define([
	"../../cache/put",
	"when/delay"
], function (put, delay) {

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	var TARGET = "target";
	var GENERATIONS = "generations";
	var INDEXED = "indexed";
	var EXPIRES = "expires";
	var TIMEOUT = "timeout";

	buster.testCase("mu-data/index/put", {
		"setUp": function () {
			var me = this;

			// Initialize `me[TARGET]` and `me[GENERATIONS]`
			me[TARGET] = {};
			me[GENERATIONS] = {};
		},

		"with static data": {
			"setUp": function () {
				var me = this;

				put([{
					"id": "one",
					"two": {
						"id": "two",
						"collapsed": true
					}
				}, {
					"id": "two"
				}, {
					"id": "three",
					"arr": [{
						"id": "one",
						"collapsed": true
					}, {
						"id": "two",
						"collapsed": true
					}],
					"obj": {
						"one": {
							"id": "one",
							"collapsed": true
						}
					}
				}], me[TARGET], me[GENERATIONS]);
			},

			"indexing works as expected": function () {
				var target = this[TARGET];
				var one = target["one"];
				var two = target["two"];
				var three = target["three"];

				var _two = {
					"id": "two",
					"collapsed": true,
					"indexed": two[INDEXED]
				};

				var _one = {
					"id": "one",
					"expires": one[EXPIRES],
					"indexed": one[INDEXED],
					"two": _two
				};

				var _three = {
					"id": "three",
					"indexed": three[INDEXED],
					"expires": three[EXPIRES],
					"arr": [_one, _two],
					"obj": {"one": _one}
				};

				assert.equals(one, _one);
				assert.equals(two, _two);
				assert.equals(three, _three);
			},

			"'one' is defined": function () {
				assert.defined(this[TARGET]["one"]);
			},

			"'one.two' is same as 'two'": function () {
				var target = this[TARGET];

				assert.same(target["one"]["two"], target["two"]);
			},

			"properties of 'one' are pruned after update": function () {
				var me = this;
				var target = me[TARGET];
				var one = target["one"];

				// Update target with a non-collapsed object.
				put({
					"id": "one",
					"collapsed": false
				}, target, me[GENERATIONS]);

				// `one["two"]` should be pruned.
				refute.defined(one["two"]);
			}
		},

		"test obj.indexed is updated for each put" : {
			"setUp" : function () {
				var me = this;

				// Set `me[TIMEOUT]` to `1.5sec`
				me[TIMEOUT] = 1500;

				// Put `foo` in `me[TARGET]`
				var foo = put({
					"id" : "foo",
					"maxAge" : 10
				}, me[TARGET], me[GENERATIONS]);

				// Save the last index.
				me[INDEXED] = foo[INDEXED];

				// Delay 1s to hit a new generation
				return delay(1000);
			},

			"fresh put" : function () {
				var me = this;

				// Put `bar` in `me[TARGET]`
				var bar = put({
					id: "bar"
				}, me[TARGET], me[GENERATIONS]);

				assert(bar[INDEXED] > me[INDEXED]);
			},

			"update put" : function () {
				var me = this;

				// Put `foo` in `me[TARGET]`
				var foo = put({
					id: "foo"
				}, me[TARGET], me[GENERATIONS]);

				assert(foo[INDEXED] > me[INDEXED]);
			}
		}
	});
});