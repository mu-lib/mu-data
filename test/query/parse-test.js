define([ "../../query/parse" ], function (parse) {
	var UNDEFINED;
	var assert = buster.referee.assert;

	buster.testCase("mu-data/query/parse", {
		"UNDEFINED" : function() {
			var ast = parse(UNDEFINED);

			assert.equals(ast, []);
		},

		"test!123" : function () {
			var ast = parse("test!123");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}]);
		},

		"test!123|xxx!321" : function () {
			var ast = parse("test!123|xxx!321");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}, {
				"op" : "!",
				"text" : "xxx!321",
				"raw" : "xxx!321"
			}]);
		},

		"test!123.p1" : function () {
			var ast = parse("test!123.p1");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}, {
				"op" : ".",
				"text" : "p1",
				"raw" : "p1"
			}]);
		},

		"test!123.p1.p2" : function () {
			var ast = parse("test!123.p1.p2");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}, {
				"op" : ".",
				"text" : "p1",
				"raw" : "p1"
			}, {
				"op" : ".",
				"text" : "p2",
				"raw" : "p2"
			}]);
		},

		"test!123.p1,.p2" : function () {
			var ast = parse("test!123.p1,.p2");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}, {
				"op" : ".",
				"text" : "p1",
				"raw" : "p1"
			}, {
				"op" : ",",
				"text" : "",
				"raw" : ""
			}, {
				"op" : ".",
				"text" : "p2",
				"raw" : "p2"
			}]);
		},

		"test!123.p1,.p2|xxx!321.p3.p4,.p5" : function () {
			var ast = parse("test!123.p1,.p2|xxx!321.p3.p4,.p5");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}, {
				"op" : ".",
				"text" : "p1",
				"raw" : "p1"
			}, {
				"op" : ",",
				"text" : "",
				"raw" : ""
			}, {
				"op" : ".",
				"text" : "p2",
				"raw" : "p2"
			}, {
				"op" : "!",
				"text" : "xxx!321",
				"raw" : "xxx!321"
			}, {
				"op" : ".",
				"text" : "p3",
				"raw" : "p3"
			}, {
				"op" : ".",
				"text" : "p4",
				"raw" : "p4"
			}, {
				"op" : ",",
				"text" : "",
				"raw" : ""
			}, {
				"op" : ".",
				"text" : "p5",
				"raw" : "p5"
			}]);
		},

		"test!123 .p1,   .p2|xxx!321 .p3  .p4   , .p5" : function () {
			var ast = parse("test!123 .p1,   .p2|xxx!321 .p3  .p4   , .p5");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!123",
				"raw" : "test!123"
			}, {
				"op" : ".",
				"text" : "p1",
				"raw" : "p1"
			}, {
				"op" : ",",
				"text" : "",
				"raw" : ""
			}, {
				"op" : ".",
				"text" : "p2",
				"raw" : "p2"
			}, {
				"op" : "!",
				"text" : "xxx!321",
				"raw" : "xxx!321"
			}, {
				"op" : ".",
				"text" : "p3",
				"raw" : "p3"
			}, {
				"op" : ".",
				"text" : "p4",
				"raw" : "p4"
			}, {
				"op" : ",",
				"text" : "",
				"raw" : ""
			}, {
				"op" : ".",
				"text" : "p5",
				"raw" : "p5"
			}]);
		},

		"test!'123 321'" : function () {
			var ast = parse("test!'123 321'");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!'123 321'",
				"raw" : "test!123 321"
			}]);
		},

		/* respect the very first quote as escape character */
		"test!'123\" 321\"'": function () {
		    var ast = parse("test!'\"123\" 321'");
		    assert.equals(ast, [{
		        "op": "!",
		        "text": "test!'\"123\" 321'",
		        "raw": "test!\"123\" 321"
		    }]);
		},

		/* respect the very first quote as escape character */
		"test!\"'123' 321\"": function () {
		    var ast = parse("test!\"'123' 321\"");
		    assert.equals(ast, [{
		        "op": "!",
		        "text": "test!\"'123' 321\"",
		        "raw": "test!'123' 321"
		    }]);
		},

		"test!'123 321'.p1,.'p2 asd'" : function () {
			var ast = parse("test!'123 321'.p1,.'p2 asd'");

			assert.equals(ast, [{
				"op" : "!",
				"text" : "test!'123 321'",
				"raw" : "test!123 321"
			}, {
				"op" : ".",
				"text" : "p1",
				"raw" : "p1"
			}, {
				"op" : ",",
				"text" : "",
				"raw" : ""
			}, {
				"op" : ".",
				"text" : "'p2 asd'",
				"raw" : "p2 asd"
			}]);
		}
	});
});