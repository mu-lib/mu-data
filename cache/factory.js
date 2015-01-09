define([
	"./put",
	"./sweep",
	"poly/object"
], function (put, sweep) {
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
					return sweep(expires, target, generations);
				}
			}
		});
	};
});