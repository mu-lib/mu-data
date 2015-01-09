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

	function index(node, target, generations, indexed, constructor) {
			var result;
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

			// First add `node` to `target` (or get the already cached instance)
			add : {
				// Can't index if there is no NODE_ID
				if (!(NODE_ID in node)) {
					result = node; // Reuse ref to node (avoids object creation)
					break add;
				}

				// Update NODE_INDEXED
				node[NODE_INDEXED] = indexed;

				// Get NODE_ID
				id = node[NODE_ID];

				// In index, get it!
				if (id in target) {
					result = target[id];

					// Bypass collapsed object that already exists in `target`.
					if(node[NODE_COLLAPSED] === TRUE) {
						return result;
					}

					break add;
				}

				// Not in `target`, add it!
				result = target[id] = node; // Reuse ref to node (avoids object creation)
			}

			// We have to deep traverse the graph before we do any expiration (as more data for this object can be available)

			// Check that this is an ARRAY
			if (constructor === ARRAY) {
				// Index all values
				for (i = 0, iMax = node[LENGTH]; i < iMax; i++) {

					// Keep value
					value = node[i];

					// Get constructor of value (safely, falling back to UNDEFINED)
					constructor = value === NULL || value === UNDEFINED
						? UNDEFINED
						: value[CONSTRUCTOR];

					// Do magic comparison to see if we recursively put this in the index, or plain put
					result[i] = (constructor === OBJECT || constructor === ARRAY && value[LENGTH] !== 0)
						? index(value, target, generations, indexed, constructor)
						: value;
				}
			}

			// Check that this is an OBJECT
			else if (constructor === OBJECT) {
				// Check if _not_ NODE_COLLAPSED
				if (node[NODE_COLLAPSED] === FALSE) {
					// Prune properties from result
					for (property in result) {
						// Except the NODE_ID property
						// and the NODE_COLLAPSED property
						// and the NODE_EXPIRES property
						// if property is _not_ present in node
						if (property !== NODE_ID
							&& property !== NODE_COLLAPSED
							&& property !== NODE_EXPIRES
							&& !(node.hasOwnProperty(property))) {
							delete result[property];
						}
					}
				}

				// Index all properties
				for (property in node) {
					// Except the NODE_ID property
					// or the NODE_COLLAPSED property, if it's false
					if (property === NODE_ID
						|| (property === NODE_COLLAPSED && result[NODE_COLLAPSED] === FALSE)) {
						continue;
					}

					// Keep value
					value = node[property];

					// Get constructor of value (safely, falling back to UNDEFINED)
					constructor = value === NULL || value === UNDEFINED
						? UNDEFINED
						: value[CONSTRUCTOR];

					// Do magic comparison to see if we recursively put this in the index, or plain put
					result[property] = (constructor === OBJECT || constructor === ARRAY && value[LENGTH] !== 0)
						? index(value, target, generations, indexed,  constructor)
						: value;
				}
			}

			// Check if we need to move result between generations
			move : {
				// Break fast if id is UNDEFINED
				if (id === UNDEFINED) {
					break move;
				}

				// Calculate expiration and floor
				// '>>>' means convert anything other than positive integer into 0
				expires = 0 | indexed + (result[NODE_MAX_AGE] >>> 0);

				remove : {
					// Fail fast if there is no old expiration
					if (!(NODE_EXPIRES in result)) {
						break remove;
					}

					// Get current expiration
					expired = result[NODE_EXPIRES];

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
					if(result[NODE_COLLAPSED] === TRUE) {
						break add;
					}

					// Update expiration time
					result[NODE_EXPIRES] = expires;

					// Existing generation
					if (expires in generations) {
						// Add result to generation
						generations[expires][id] = result;
						break add;
					}

					// Create generation with expiration set
					(generation = generations[expires] = {})[NODE_EXPIRES] = expires;

					// Add result to generation
					generation[id] = result;

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

			return result;
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