define([ "./config" ], function (config) {
	"use strict";

	var UNDEFINED;
	var LENGTH = "length";
	var OP = "op";
	var TEXT = "text";
	var RAW = "raw";
	var RE_TEXT = /("|')(.*?)\1/;
	var TO_RAW = "$2";

	var OP_ID = config.id;
	var OP_PROPERTY = config.property;
	var OP_PATH = config.path;
	var OP_QUERY = config.query;

	return function parse(query) {
		var i;             // Index
		var l;             // Length
		var c;             // Current character
		var m;             // Current mark
		var q;             // Current quote
		var o;             // Current operation
		var result = [];   // AST

		// Step through the query
		// '>>>' means convert anything other than positive integer into 0
		for (i = m = 0, l = query && query[LENGTH] >>> 0; i < l; i++) {
			c = query.charAt(i);

			switch (c) {
				case "\"" : // Double quote
				/* falls through */
				case "'" :  // Single quote
										// Set / unset quote char
					q = q === c
						? UNDEFINED
						: c;
					break;

				case OP_ID :
					// Break fast if we're quoted
					if (q !== UNDEFINED) {
						break;
					}

					// Init new op
					o = {};
					o[OP] = c;
					break;

				case OP_PROPERTY :
				/* falls through */
				case OP_PATH :
					// Break fast if we're quoted
					if (q !== UNDEFINED) {
						break;
					}

					// If there's an active op, store TEXT and push on result
					if (o !== UNDEFINED) {
						o[RAW] = (o[TEXT] = query.substring(m, i)).replace(RE_TEXT, TO_RAW);
						result.push(o);
					}

					// Init new op
					o = {};
					o[OP] = c;

					// Set mark
					m = i + 1;
					break;

				case OP_QUERY :
				/* falls through */
				case " " :  // Space
				/* falls through */
				case "\t" : // Horizontal tab
				/* falls through */
				case "\r" : // Carriage return
				/* falls through */
				case "\n" : // Newline
										// Break fast if we're quoted
					if (q !== UNDEFINED) {
						break;
					}

					// If there's an active op, store TEXT and push on result
					if (o !== UNDEFINED) {
						o[RAW] = (o[TEXT] = query.substring(m, i)).replace(RE_TEXT, TO_RAW);
						result.push(o);
					}

					// Reset op
					o = UNDEFINED;

					// Set mark
					m = i + 1;
					break;
			}
		}

		// If there's an active op, store TEXT and push on result
		if (o !== UNDEFINED) {
			o[RAW] = (o[TEXT] = query.substring(m, l)).replace(RE_TEXT, TO_RAW);
			result.push(o);
		}

		return result;
	}
});