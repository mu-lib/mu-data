define([
	"../cache/config",
	"./config"
], function (cache_config, query_config) {
	"use strict";

	var UNDEFINED;
	var TRUE = true;
	var FALSE = false;
	var OBJECT = Object;
	var ARRAY = Array;
	var CONSTRUCTOR = "constructor";
	var LENGTH = "length";
	var OP = "op";
	var TEXT = "text";
	var RAW = "raw";
	var RESOLVED = "resolved";

	var RE_RAW = /!(.*[!,|.\s]+.*)/;
	var TO_TEXT = "!'$1'";

	var OP_ID = query_config.id;
	var OP_PROPERTY = query_config.property;
	var OP_PATH = query_config.path;

	var NODE_ID = cache_config.id;
	var NODE_EXPIRES = cache_config.expires;
	var NODE_COLLAPSED = cache_config.collapsed;

	return function reduce(ast, cache, timestamp) {
		var expires = 0 | (timestamp || +new Date()) / 1000;

		var result = []; // Result
		var i;           // Index
		var j;
		var c;
		var l;           // Length
		var o;           // Current operation
		var x;           // Current raw
		var r;           // Current root
		var n;           // Current node
		var d = FALSE;   // Dead flag
		var k = FALSE;   // Keep flag

		// First step is to resolve what we can from the _AST
		for (i = 0, l = ast[LENGTH]; i < l; i++) {
			o = ast[i];

			switch (o[OP]) {
				case OP_ID :
					// Set root
					r = o;

					// Get e from o
					x = o[RAW];

					// Do we have this item in index
					if (x in cache) {
						// Set current node
						n = cache[x];
						// Set dead and RESOLVED if we're not collapsed or expired
						d = o[RESOLVED] = n[NODE_COLLAPSED] !== TRUE && !(NODE_EXPIRES in n && n[NODE_EXPIRES] < expires);
					}
					else {
						// Reset current root and node
						n = UNDEFINED;
						// Reset dead and RESOLVED
						d = o[RESOLVED] = FALSE;
					}
					break;

				case OP_PROPERTY :
					// Get e from o
					x = o[RAW];

					// Was previous op dead?
					if (!d) {
						o[RESOLVED] = FALSE;
					}
					// Do we have a node and this item in the node
					else if (n && x in n) {
						// Set current node
						n = n[x];

						// Get constructor
						c = n[CONSTRUCTOR];

						// If the constructor is an array
						if (c === ARRAY) {
							// Set naive resolved
							o[RESOLVED] = TRUE;

							// Iterate backwards over n
							for (j = n[LENGTH]; j-- > 0;) {
								// Get item
								c = n[j];

								// If the constructor is not an object
								// or the object does not duck-type NODE_ID
								// or the object is not collapsed
								// and the object does not duck-type NODE_EXPIRES
								// or the objects is not expired
								if (c[CONSTRUCTOR] !== OBJECT
									|| !(NODE_ID in c)
									|| c[NODE_COLLAPSED] !== TRUE
									&& !(NODE_EXPIRES in c && c[NODE_EXPIRES] < expires)) {
									continue;
								}

								// Change RESOLVED
								o[RESOLVED] = FALSE;
								break;
							}
						}
						// If the constructor is _not_ an object or n does not duck-type NODE_ID
						else if (c !== OBJECT || !(NODE_ID in n)) {
							o[RESOLVED] = TRUE;
						}
						// We know c _is_ and object and n _does_ duck-type NODE_ID
						else {
							// Change OP to OP_ID
							o[OP] = OP_ID;
							// Update RAW to NODE_ID and TEXT to escaped version of RAW
							o[TEXT] = (o[RAW] = n[NODE_ID]).replace(RE_RAW, TO_TEXT);
							// Set RESOLVED if we're not collapsed or expired
							o[RESOLVED] = n[NODE_COLLAPSED] !== TRUE && !(NODE_EXPIRES in n && n[NODE_EXPIRES] < expires);
						}
					}
					else {
						// Reset current node and RESOLVED
						n = UNDEFINED;
						o[RESOLVED] = FALSE;
					}
					break;

				case OP_PATH :
					// Get e from r
					x = r[RAW];

					// Set current node
					n = cache[x];

					// Change OP to OP_ID
					o[OP] = OP_ID;

					// Copy properties from r
					o[TEXT] = r[TEXT];
					o[RAW] = x;
					o[RESOLVED] = r[RESOLVED];
					break;
			}
		}

		// After that we want to reduce 'dead' operations from the _AST
		while (l-- > 0) {
			o = ast[l];

			switch(o[OP]) {
				case OP_ID :
					// If the keep flag is set, or the op is not RESOLVED
					if (k || o[RESOLVED] !== TRUE) {
						result.unshift(o);
					}

					// Reset keep flag
					k = FALSE;
					break;

				case OP_PROPERTY :
					result.unshift(o);

					// Set keep flag
					k = TRUE;
					break;
			}
		}

		return result;
	}
});