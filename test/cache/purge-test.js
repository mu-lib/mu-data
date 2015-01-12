define([ "../../cache/purge" ], function (purge) {

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	var TARGET = "target";
	var GENERATIONS = "generations";
	var INDEXED = "indexed";

	buster.testCase("mu-data/index/purge", {
		"setUp": function () {
			var me = this;

			var target = me[TARGET] = {};

			target["one"] = {
				"id": "one",
				"maxAge": 1,
				"indexed": 1420794485,
				"expires": 1420794486
			};

			target["two"] = {
				"id": "two",
				"maxAge": 2,
				"one": target["one"],
				"indexed": 1420794485,
				"expires": 1420794487
			};

			var generations = me[GENERATIONS] = {};

			generations["1420794487"] = {
				"expires": 1420794487,
				"two": target["two"]
			};

			generations["1420794486"] = generations["head"] = {
				"expires": 1420794486,
				"one": target["one"],
				"next": generations["1420794487"]
			};

			me[INDEXED] = 1420794485216;
		},

		"with maxAged data": {
			"'one' is cached for at least one but at most one generation": function () {
				var me = this;
				var target = me[TARGET];
				var generations = me[GENERATIONS];
				var indexed = me[INDEXED];

				purge(indexed, target, generations);
				assert.defined(target["one"], "target.one should cache for one generation");

				purge(indexed + 1050, target, generations);
				refute.defined(target["one"], "target.one should expire after one generation");
			},

			"'two' is cached for at least one but at most two generations": function () {
				var me = this;
				var target = me[TARGET];
				var generations = me[GENERATIONS];
				var indexed = me[INDEXED];

				purge(indexed + 1000, target, generations);
				assert.defined(target["two"], "target.two should cache for one generation");

				purge(indexed + 2050, target, generations);
				refute.defined(target["two"], "target.two should expire after two generations");
			}
		}
	});
});