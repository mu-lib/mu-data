define([
	"./put",
	"./purge",
	"poly/object"
], function (put, purge) {
	"use strict";

	return function factory(source) {
		var generations = {};
		var cache = source || {};

		return Object.create(cache, {
			"put": {
				"value": function (node) {
					return put(node, cache, generations);
				}
			},

			"purge": {
				"value": function (expires) {
					return purge(expires, cache, generations);
				}
			}
		});
	};
});