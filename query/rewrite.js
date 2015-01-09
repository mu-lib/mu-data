define([ "./config" ], function (config) {
	"use strict";

	var LENGTH = "length";
	var OP = "op";
	var TEXT = "text";

	var OP_ID = config.id;
	var OP_PROPERTY = config.property;
	var OP_QUERY = config.query;

	return function rewrite(ast) {
		var result = ""; // Result
		var l;           // Current length
		var i;           // Current index
		var o;           // Current operation

		// Step through AST
		for (i = 0, l = ast[LENGTH]; i < l; i++) {
			o = ast[i];

			switch(o[OP]) {
				case OP_ID :
					// If this is the first OP_ID, there's no need to add OP_QUERY
					result += i === 0
						? o[TEXT]
						: OP_QUERY + o[TEXT];
					break;

				case OP_PROPERTY :
					result += OP_PROPERTY + o[TEXT];
					break;
			}
		}

		return result;
	}
});