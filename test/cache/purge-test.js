define([ "../../cache/purge" ], function (purge) {

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	var CACHE = "cache";
	var GENERATIONS = "generations";
	var INDEXED = "indexed";

	buster.testCase("mu-data/index/purge", {
		"setUp": function () {
			var me = this;

			var cache = me[CACHE] = {};

			cache["one"] = {
				"id": "one",
				"maxAge": 1,
				"indexed": 1420794485,
				"expires": 1420794486
			};

			cache["two"] = {
				"id": "two",
				"maxAge": 2,
				"one": cache["one"],
				"indexed": 1420794485,
				"expires": 1420794487
			};

			var generations = me[GENERATIONS] = {};

			generations["1420794487"] = {
				"expires": 1420794487,
				"two": cache["two"]
			};

			generations["1420794486"] = generations["head"] = {
				"expires": 1420794486,
				"one": cache["one"],
				"next": generations["1420794487"]
			};

			me[INDEXED] = 1420794485216;
		},

		"with maxAged data": {
			"'one' is cached for at least one but at most one generation": function () {
				var me = this;
				var cache = me[CACHE];
				var generations = me[GENERATIONS];
				var indexed = me[INDEXED];

				purge(indexed, cache, generations);
				assert.defined(cache["one"], "cache.one should cache for one generation");

				purge(indexed + 1050, cache, generations);
				refute.defined(cache["one"], "cache.one should expire after one generation");
			},

			"'two' is cached for at least one but at most two generations": function () {
				var me = this;
				var cache = me[CACHE];
				var generations = me[GENERATIONS];
				var indexed = me[INDEXED];

				purge(indexed + 1000, cache, generations);
				assert.defined(cache["two"], "cache.two should cache for one generation");

				purge(indexed + 2050, cache, generations);
				refute.defined(cache["two"], "cache.two should expire after two generations");
			}
		}
	});
});