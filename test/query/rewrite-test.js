define([ "../../query/rewrite" ], function (rewrite) {
	var assert = buster.referee.assert;

	buster.testCase("mu-data/query/parse", {
		"test!123" : function () {
			var query = rewrite([]);

			assert.equals(query, "");
		},

		"test!123.p1,.p3" : function () {
			var query = rewrite([
				{
					"op": "!",
					"text": "test!xxx",
					"raw": "test!xxx",
					"resolved": false
				}
			]);

			assert.equals(query, "test!xxx");
		},

		"test!123.p1.p2.p3,.p3" : function () {
			var query = rewrite([
				{
					"op": "!",
					"text": "test!yyy",
					"raw": "test!yyy",
					"resolved": true
				},
				{
					"op": ".",
					"text": "p3",
					"raw": "p3",
					"resolved": false
				},
				{
					"op": "!",
					"text": "test!xxx",
					"raw": "test!xxx",
					"resolved": false
				}
			]);

			assert.equals(query, "test!yyy.p3|test!xxx");
		},

		"test!123.p1,.p2,.p3|test!321.p2" : function () {
			var query = rewrite([
				{
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				},
				{
					"op": ".",
					"text": "p2",
					"raw": "p2",
					"resolved": false
				},
				{
					"op": "!",
					"text": "test!xxx",
					"raw": "test!xxx",
					"resolved": false
				},
				{
					"op": "!",
					"text": "test!321",
					"raw": "test!321",
					"resolved": true
				},
				{
					"op": ".",
					"text": "p1",
					"raw": "p1",
					"resolved": false
				}
			]);

			assert.equals(query, "test!123.p2|test!xxx|test!321.p1");
		},

		"test!'123'.p1,.p2,.p3|test!321.p1,.p2" : function () {
			var query = rewrite([
				{
					"op": "!",
					"text": "test!'123'",
					"raw": "test!123",
					"resolved": true
				},
				{
					"op": ".",
					"text": "p2",
					"raw": "p2",
					"resolved": false
				},
				{
					"op": "!",
					"text": "test!xxx",
					"raw": "test!xxx",
					"resolved": false
				},
				{
					"op": "!",
					"text": "test!321",
					"raw": "test!321",
					"resolved": true
				},
				{
					"op": ".",
					"text": "p1",
					"raw": "p1",
					"resolved": false
				}
			]);

			assert.equals(query, "test!'123'.p2|test!xxx|test!321.p1");
		}
	});
});