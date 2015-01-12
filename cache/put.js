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

	function index(node_index, target, generations, indexed, constructor) {
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

		// First add `node_index` to `target` (or get the already cached instance)

		// Can't index if there is no `NODE_ID` property
		if (!node_index.hasOwnProperty(NODE_ID)) {
			// Reuse ref to `node_index` (avoids object creation)
			node_cache = node_index;
		}
		else {
			// Get NODE_ID
			id = node_index[NODE_ID];

			// Update NODE_INDEXED
			node_index[NODE_INDEXED] = indexed;

			// If `id` exists in `target` we use it ...
			if (target.hasOwnProperty(id)) {
				node_cache = target[id];

				// Bypass collapsed object that already exists in `target`.
				if(node_index[NODE_COLLAPSED] === TRUE) {
					return node_cache;
				}
			}
			// ... otherwise we add it
			else {
				// Reuse ref to `node_index` (avoids object creation)
				node_cache = target[id] = node_index;
			}
		}

		// We have to deep traverse the graph before we do any expiration (as more data for this object can be available)

		// Check that this is an ARRAY
		if (constructor === ARRAY) {
			// Index all values
			for (i = 0, iMax = node_index[LENGTH]; i < iMax; i++) {

				// Keep value
				value = node_index[i];

				// Get constructor of value (safely, falling back to UNDEFINED)
				constructor = value === NULL || value === UNDEFINED
					? UNDEFINED
					: value[CONSTRUCTOR];

				// Do magic comparison to see if we recursively put this in the index, or plain put
				node_cache[i] = (constructor === OBJECT || constructor === ARRAY && value[LENGTH] !== 0)
					? index(value, target, generations, indexed, constructor)
					: value;
			}
		}
		// Check that this is an OBJECT
		else if (constructor === OBJECT) {
			// Check if _not_ NODE_COLLAPSED
			if (node_index[NODE_COLLAPSED] === FALSE) {
				// Prune properties from node_cache
				for (property in node_cache) {
					// Except the NODE_ID property
					// and the NODE_COLLAPSED property
					// and the NODE_EXPIRES property
					// if property is _not_ present in node_index
					if (property !== NODE_ID
						&& property !== NODE_COLLAPSED
						&& property !== NODE_EXPIRES
						&& !(node_index.hasOwnProperty(property))) {
						delete node_cache[property];
					}
				}
			}

			// Index all properties
			for (property in node_index) {
				// Except the NODE_ID property
				// or the NODE_COLLAPSED property, if it's false
				if (property === NODE_ID
					|| (property === NODE_COLLAPSED && node_cache[NODE_COLLAPSED] === FALSE)) {
					continue;
				}

				// Keep value
				value = node_index[property];

				// Get constructor of value (safely, falling back to UNDEFINED)
				constructor = value === NULL || value === UNDEFINED
					? UNDEFINED
					: value[CONSTRUCTOR];

				// Do magic comparison to see if we recursively put this in the index, or plain put
				node_cache[property] = (constructor === OBJECT || constructor === ARRAY && value[LENGTH] !== 0)
					? index(value, target, generations, indexed,  constructor)
					: value;
			}
		}

		// Check if we need to move node_cache between generations
		move : {
			// Break fast if id is UNDEFINED
			if (id === UNDEFINED) {
				break move;
			}

			// Calculate expiration and floor
			// '>>>' means convert anything other than positive integer into 0
			expires = 0 | indexed + (node_cache[NODE_MAX_AGE] >>> 0);

			remove : {
				// Fail fast if there is no old expiration
				if (!(NODE_EXPIRES in node_cache)) {
					break remove;
				}

				// Get current expiration
				expired = node_cache[NODE_EXPIRES];

				// If expiration has not changed, we can continue
				if (expired === expires) {
					break move;
				}

				// Remove ref from generation (if that generation exists)
				if (expired in generations) {
					delete generations[expired][id];
				}
			}

			add : {
				// Collapsed object should not be collected by GC.
				if(node_cache[NODE_COLLAPSED] === TRUE) {
					break add;
				}

				// Update expiration time
				node_cache[NODE_EXPIRES] = expires;

				// Existing generation
				if (expires in generations) {
					// Add node_cache to generation
					generations[expires][id] = node_cache;
					break add;
				}

				// Create generation with expiration set
				(generation = generations[expires] = {})[NODE_EXPIRES] = expires;

				// Add node_cache to generation
				generation[id] = node_cache;

				// Short circuit if there is no head
				if (generations[HEAD] === UNDEFINED) {
					generations[HEAD] = generation;
					break add;
				}

				// Step through list as long as there is a next, and expiration is "older" than the next expiration
				for (current = head = generations[HEAD]; (next = current[NEXT]) !== UNDEFINED && next[NODE_EXPIRES] < expires; current = next);

				// Check if we're still on the head and if we're younger
				if (current === head && current[NODE_EXPIRES] > expires) {
					// Next generation is the current one (head)
					generation[NEXT] = current;

					// Reset head to new generation
					generations[HEAD] = generation;
					break add;
				}

				// Insert new generation between current and current.next
				generation[NEXT] = current[NEXT];
				current[NEXT] = generation;
			}
		}

		return node_cache;
	}

	return function put(node, target, generations, now) {
		var constructor = node === NULL || node === UNDEFINED
			? UNDEFINED
			: node[CONSTRUCTOR];

		// Do magic comparison to see if we should index this object
		return constructor === Object || constructor === Array && node[LENGTH] !== 0
			? index(node, target, generations, 0 | (now || new Date().getTime()) / 1000, constructor)
			: node;
}
});