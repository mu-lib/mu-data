define([
	"./put",
	"./purge",
	"poly/object"
], function (put, purge) {
	"use strict";

	return function factory(target) {
		var generations = {};

		return Object.create(target || {}, {
			"put": {
				"value": function (node) {
					return put(node, target, generations);
				}
			},

			"sweep": {
				"value": function (expires) {
					return purge(expires, target, generations);
				}
			}
		});
	};
});