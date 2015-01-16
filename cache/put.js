define([ "./config" ], function (config) {
	"use strict";

	var UNDEFINED;
	var TRUE = true;
	var FALSE = false;
	var NULL = null;
	var OBJECT = Object;
	var ARRAY = Array;
	var HEAD = "head";
	var NEXT = "next";
	var CONSTRUCTOR = "constructor";
	var LENGTH = "length";

	var NODE_ID = config.id;
	var NODE_MAX_AGE = config.max_age;
	var NODE_EXPIRES = config.expires;
	var NODE_INDEXED = config.indexed;
	var NODE_COLLAPSED = config.collapsed;

	function index(node_input, cache, generations, indexed, constructor) {
		var id;
		var i;
		var iMax;
		var expires;
		var expired;
		var head;
		var current;
		var next;
		var generation;
		var property;
		var value;
		var node_cache;

		// Add `node_input` to `cache` (or get the already cached instance)

		// Can't index if there is no `NODE_ID` property
		if (!node_input.hasOwnProperty(NODE_ID)) {
			node_cache = node_input;
		}
		else {
			// Get NODE_ID
			id = node_input[NODE_ID];

			// Update NODE_INDEXED
			node_input[NODE_INDEXED] = indexed;

			// If `id` exists in `cache` we use it ...
			if (cache.hasOwnProperty(id)) {
				node_cache = cache[id];

				// If `node_input` is collapsed we should just return node_cache.
				if(node_input[NODE_COLLAPSED] === TRUE) {
					return node_cache;
				}
			}
			// ... otherwise we add it
			else {
				node_cache = cache[id] = node_input;
			}
		}

		// We have to deep traverse the graph before we do any expiration (as more data for this object can be available)

		// Check if `constructor` ix an `ARRAY`
		if (constructor === ARRAY) {
			// Loop `node_input`
			for (i = 0, iMax = node_input[LENGTH]; i < iMax; i++) {

				// Keep value
				value = node_input[i];

				// Get constructor of value (safely, falling back to UNDEFINED)
				constructor = value === NULL || value === UNDEFINED
					? UNDEFINED
					: value[CONSTRUCTOR];

				// Do magic comparison to see if we recursively index this, or just store it as is
				node_cache[i] = (constructor === OBJECT || constructor === ARRAY && value[LENGTH] !== 0)
					? index(value, cache, generations, indexed, constructor)
					: value;
			}
		}
		// Check if `constructor` is an `OBJECT`
		else if (constructor === OBJECT) {
			// Make sure that `node_input` is not collapsed
			if (node_input[NODE_COLLAPSED] === FALSE) {
				// Prune properties from `node_cache`
				for (property in node_cache) {
					// Except the `NODE_ID` property
					// Except the `NODE_COLLAPSED` property
					// Except the `NODE_EXPIRES` property
					// Except if `property` is _not_ in `node_input`
					if (property !== NODE_ID
						&& property !== NODE_COLLAPSED
						&& property !== NODE_EXPIRES
						&& !(node_input.hasOwnProperty(property))) {
						delete node_cache[property];
					}
				}
			}

			// Index all properties
			for (property in node_input) {
				// Except the `NODE_ID` property
				// Except the `NODE_COLLAPSED` property if equals `FALSE`
				if (property === NODE_ID
					|| (property === NODE_COLLAPSED && node_cache[NODE_COLLAPSED] === FALSE)) {
					continue;
				}

				// Keep value
				value = node_input[property];

				// Get constructor of value (safely, falling back to UNDEFINED)
				constructor = value === NULL || value === UNDEFINED
					? UNDEFINED
					: value[CONSTRUCTOR];

				// Do magic comparison to see if we recursively index this, or just store it as is
				node_cache[property] = (constructor === OBJECT || constructor === ARRAY && value[LENGTH] !== 0)
					? index(value, cache, generations, indexed,  constructor)
					: value;
			}
		}

		// Check if we need to move `node_cache` between generations
		move : {
			// Break fast if `id` is `UNDEFINED`
			if (id === UNDEFINED) {
				break move;
			}

			// Calculate `expires`
			// `0 |` floors
			// `>>>` convert anything other than positive integer to `0`
			expires = 0 | indexed + (node_cache[NODE_MAX_AGE] >>> 0);

			remove : {
				// Break `remove` if the is no `NODE_EXPIRES` on `node_cache`
				if (!(node_cache.hasOwnProperty(NODE_EXPIRES))) {
					break remove;
				}

				// Get expiration from `node_cache`
				expired = node_cache[NODE_EXPIRES];

				// Break `move` if expiration has not changed
				if (expired === expires) {
					break move;
				}

				// If `generations` contains `expired`
				if (generations.hasOwnProperty(expired)) {
					// ... delete `id` ref from `generations[expired]`
					delete generations[expired][id];
				}
			}

			add : {
				// Break `add` if `node_cache` is collapsed
				if(node_cache[NODE_COLLAPSED] === TRUE) {
					break add;
				}

				// Update `node_cache[NODE_EXPIRES]`
				node_cache[NODE_EXPIRES] = expires;

				// If `generations` contains `expires` ...
				if (generations.hasOwnProperty(expires)) {
					// ... add `id` ref to `generations[expires]` ...
					generations[expires][id] = node_cache;
					// ... and break `add`
					break add;
				}

				// Create `generation` with `NODE_EXPIRES` set
				(generation = generations[expires] = {})[NODE_EXPIRES] = expires;

				// Add `node_cache` to `generation`
				generation[id] = node_cache;

				// If `generations[HEAD]` is missing ...
				if (generations[HEAD] === UNDEFINED) {
					// ... store `generation` as `generations[HEAD]` ...
					generations[HEAD] = generation;
					// ... and break `add`
					break add;
				}

				// Step through list as long as there is a `NEXT`, and `NODE_EXPIRES` is "older" than `expires`
				for (current = head = generations[HEAD]; (next = current[NEXT]) !== UNDEFINED && next[NODE_EXPIRES] < expires; current = next);

				// If `current` equals `head` and current is younger ...
				if (current === head && current[NODE_EXPIRES] > expires) {
					// ... link `current` to `generation[NEXT]` ...
					generation[NEXT] = current;
					// ... reset `generations[HEAD]` to `generation` ...
					generations[HEAD] = generation;
					// ... and break `add`
					break add;
				}

				// Insert `generation` between `current` and `current[NEXT]`
				generation[NEXT] = current[NEXT];
				current[NEXT] = generation;
			}
		}

		return node_cache;
	}

	return function put(node, cache, generations, timestamp) {
		var constructor = node === NULL || node === UNDEFINED
			? UNDEFINED
			: node[CONSTRUCTOR];

		// If `constructor` equals `Object` OR `Array` and `node[LENGTH]` is not `0` ...
		return constructor === Object || constructor === Array && node[LENGTH] !== 0
			// ... return the result of indexing the node using `timestamp` or `new Date().getTime()` as a base to calculate `indexed` ...
			? index(node, cache, generations, 0 | (timestamp || new Date().getTime()) / 1000, constructor)
			// ... otherwise just return `node`
			: node;
	}
});