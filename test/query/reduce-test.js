define([ "../../query/reduce" ], function (reduce) {

	var TARGET = "target";
	var INDEXED = "indexed";

	var assert = buster.referee.assert;

	buster.testCase("mu-data/query/reduce", {
		"with static data": {
			"setUp": function () {
				var me = this;

				var target = me[TARGET] = {};

				target["test!xxx"] = {
					"id": "test!xxx",
					"collapsed": true,
					"indexed": 1420793748
				};

				target["test!zzz"] = {
					"id": "test!zzz",
					"collapsed": false,
					"indexed": 1420793748,
					"maxAge": 10,
					"expires": 1420793758
				};

				target["test!abc"] = {
					"id": "test!abc",
					"collapsed": true,
					"indexed": 1420793748
				};

				target["test!yyy"] = {
					"id": "test!yyy",
					"collapsed": false,
					"indexed": 1420793748,
					"maxAge": 10,
					"expires": 1420793758
				};

				target["test!321"] = {
					"id": "test!321",
					"collapsed": false,
					"indexed": 1420793748,
					"maxAge": 10,
					"p2": target["test!yyy"],
					"expires": 1420793758
				};

				target["test!123"] = {
					"id": "test!123",
					"collapsed": false,
					"maxAge": 10,
					"p1": target["test!321"],
					"px": [ target["test!zzz"], target["test!abc"] ],
					"py": [ target["test!zzz"] ],
					"p3": target["test!xxx"],
					"indexed": 1420793748,
					"expires": 1420793758
				};

				me[INDEXED] = 1420793748194;
			},

			"test!123": function () {
				var me = this;

				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, []);
			},

			"test!1234": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!1234",
						"raw": "test!1234"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!1234",
					"raw": "test!1234",
					"resolved": false
				}]);
			},

			"test!123.p1": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p1",
						"raw": "p1"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, []);
			},

			"test!123.p2": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				}, {
					"op": ".",
					"text": "p2",
					"raw": "p2",
					"resolved": false
				}]);
			},

			"test!123.p1.p2": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p1",
						"raw": "p1"
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, []);
			},

			"test!123.p1,.p3": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p1",
						"raw": "p1"
					},
					{
						"op": ",",
						"text": "",
						"raw": ""
					},
					{
						"op": ".",
						"text": "p3",
						"raw": "p3"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!xxx",
					"raw": "test!xxx",
					"resolved": false
				}]);
			},

			"test!123.p1,.p2": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p1",
						"raw": "p1"
					},
					{
						"op": ",",
						"text": "",
						"raw": ""
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				}, {
					"op": ".",
					"text": "p2",
					"raw": "p2",
					"resolved": false
				}]);
			},

			"test!123.p1.p3.p4,.p2": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p1",
						"raw": "p1"
					},
					{
						"op": ".",
						"text": "p3",
						"raw": "p3"
					},
					{
						"op": ".",
						"text": "p4",
						"raw": "p4"
					},
					{
						"op": ",",
						"text": "",
						"raw": ""
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!321",
					"raw": "test!321",
					"resolved": true
				}, {
					"op": ".",
					"text": "p3",
					"raw": "p3",
					"resolved": false
				}, {
					"op": ".",
					"text": "p4",
					"raw": "p4",
					"resolved": false
				}, {
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				}, {
					"op": ".",
					"text": "p2",
					"raw": "p2",
					"resolved": false
				}]);
			},

			"test!123|test!321": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": "!",
						"text": "test!321",
						"raw": "test!321"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, []);
			},

			"test!123.p1,.p2,.p3|test!321.p2": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "p1",
						"raw": "p1"
					},
					{
						"op": ",",
						"text": "",
						"raw": ""
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					},
					{
						"op": ",",
						"text": "",
						"raw": ""
					},
					{
						"op": ".",
						"text": "p3",
						"raw": "p3"
					},
					{
						"op": "!",
						"text": "test!321",
						"raw": "test!321"
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				}, {
					"op": ".",
					"text": "p2",
					"raw": "p2",
					"resolved": false
				}, {
					"op": "!",
					"text": "test!xxx",
					"raw": "test!xxx",
					"resolved": false
				}]);
			},

			"test!123.px": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "px",
						"raw": "px"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				}, {
					"op": ".",
					"text": "px",
					"raw": "px",
					"resolved": false
				}]);
			},

			"test!123.py": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": ".",
						"text": "py",
						"raw": "py"
					}
				], me[TARGET], me[INDEXED]);

				assert.equals(ast, [{
					"op": "!",
					"text": "test!123",
					"raw": "test!123",
					"resolved": true
				}, {
					"op": ".",
					"text": "py",
					"raw": "py",
					"resolved": true
				}]);
			}
		},

		"with maxAged data": {
			"setUp": function () {
				var me = this;

				var target = me[TARGET] = {};

				target["test!xxx"] = {
					"id": "test!xxx",
					"collapsed": false,
					"indexed": 1420793748,
					"maxAge": 5,
					"expires": 1420793753
				};

				target["test!321"] = {
					"id": "test!321",
					"collapsed": true,
					"indexed": 1420793748,
					"maxAge": 1,
					"p2": target["test!xxx"]
				};

				target["test!123"] = {
					"id": "test!123",
					"maxAge": 2,
					"p1": target["test!321"],
					"p3": target["test!xxx"]
				};

				me[INDEXED] = 1420793748194;
			},

			"test!123|test!321": function () {
				var me = this;

				var ast = reduce([
					{
						"op": "!",
						"text": "test!123",
						"raw": "test!123"
					},
					{
						"op": "!",
						"text": "test!321",
						"raw": "test!321"
					}
				], me[TARGET], me[INDEXED] + 1000);

				assert.equals(ast, [{
					"op" : "!",
					"text" : "test!321",
					"raw" : "test!321",
					"resolved" : false
				}]);
			},

			"test!321.p2": function () {
				var me = this;
				var ast = reduce([
					{
						"op": "!",
						"text": "test!321",
						"raw": "test!321"
					},
					{
						"op": ".",
						"text": "p2",
						"raw": "p2"
					}
				], me[TARGET], me[INDEXED] + 1000);

				assert.equals(ast, [{
					"op" : "!",
					"text" : "test!321",
					"raw" : "test!321",
					"resolved" : false
				}, {
					"op" : ".",
					"text" : "p2",
					"raw" : "p2",
					"resolved" : false
				}]);
			}
		}
	});
});