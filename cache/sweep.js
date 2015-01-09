define([ "./config" ], function (config) {
	"use strict";

	var UNDEFINED;
	var HEAD = "head";
	var NEXT = "next";

	var NODE_EXPIRES = config.expires;

	return function sweep(timestamp, target, generations) {
		var property;
		var current;
		var expires = 0 | timestamp / 1000;

		// Let `current` be `generations[HEAD]`
		current = generations[HEAD];

		// Fail fast if there's no `current`
		if (current === UNDEFINED) {
			return;
		}

		// Loop ...
		do {
			// Exit if this generation is to young
			if (current[NODE_EXPIRES] > expires) {
				break;
			}

			// Iterate all properties on `current`
			for (property in current) {
				// And is it not a reserved property
				if (property === NODE_EXPIRES || property === NEXT) {
					continue;
				}

				// Delete `target[property]`
				delete target[property];
			}

			// Delete generation
			delete generations[current[NODE_EXPIRES]];
		}
		// Let `current` be `current[NEXT]`
		// ... while there's a `current`
		while ((current = current[NEXT]));

		// Reset `generations[HEAD]`
		generations[HEAD] = current;
	}
});