/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./config",
	"../query/parse",
	"../query/reduce",
	"../query/rewrite"
], function QueryServiceModule(query_config, parse, reduce, rewrite) {
	"use strict";

	var UNDEFINED;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_SLICE = ARRAY_PROTO.slice;
	var ARRAY_CONCAT = ARRAY_PROTO.concat;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var LENGTH = "length";
	var QUERIES = "queries";
	var RESOLVED = "resolved";
	var RAW = "raw";
	var ID = "id";
	var Q = "q";

	/**
	 * Factory function create an client for querying the data through an asynchronous {@param request} function (e.g. ajax),
	 * and to further cache the returning data. Optionally you can choose to batch multiple queries into one request within a custom interval, to reduce the
	 * frequency of calling the `request` function.
	 *
	 * @param cache The data cache object in which a resolve query will be stored.
	 * @param request An async function that will resolve the query against some sort of data source,
	 * i.e. from making a network request, or reading from a local file.
	 */
	return function (cache, request) {

		if (cache === UNDEFINED) {
			throw new Error("No cache provided");
		}

		// Current query batches
		var batches = [];
		// Batch scanner interval
		var scanner = null;

		return {
			/**
			 * Start the query batching, this will be running in an interval.
			 * @param {interval} The "batching" interval (in milliseconds) within that multiple queries will be merged into one single request
			 */
			batchStart: function (interval) {
				interval = interval || 200;
				// start the batch scanner, only if we specified an interval other than zero
				if (interval) {
					// Set interval (if we don't have one)
					scanner = setInterval(function scan() {
						// The current batches in processing.
						var curr_batches = batches;

						// Return fast if there is nothing to do
						if (curr_batches[LENGTH] === 0) {
							return;
						}

						// Reset batches
						batches = [];

						var q = [];
						var i;

						// Iterate batches
						for (i = curr_batches[LENGTH]; i--;) {
							// Add batch[Q] to q
							ARRAY_PUSH.apply(q, curr_batches[i][Q]);
						}

						// if there are any query in this batch
						request(q, done, fail);

						function done(data) {
							var batch;
							var queries;
							var id;
							var i;
							var j;

							// Add all new data to cache
							cache.put(data);

							// Iterate ongoing
							for (i = curr_batches[LENGTH]; i--;) {
								batch = curr_batches[i];
								queries = batch[QUERIES];
								id = batch[ID];

								// Iterate queries
								for (j = queries[LENGTH]; j--;) {
									// If we have a corresponding ID, fetch from cache
									if (j in id) {
										queries[j] = cache[id[j]];
									}
								}

								// Resolve batch
								batch.resolve(queries);
							}
						}

						function fail(err) {
							var batch;
							var msg;
							var i;

							// Iterate ongoing
							for (i = curr_batches[LENGTH]; i--;) {
								batch = curr_batches[i];
								msg = [
									batch[QUERIES].join(','),
									err.status,
									err.statusText
								].join('|');

								// Reject (with original queries as argument)
								batch.reject(new Error(msg));
							}
						}
					}, interval);
				}
			},

			/**
			 * Stop the query batching, after that each query will be resolved individually by a request function.
			 */
			batchStop: function () {
				// Only do this if we have an interval
				if (scanner) {
					// Clear interval
					clearInterval(scanner);
					scanner = null;
				}
			},

			/**
			 * Resolve a one query or multiple data queries toward the data cache, if the queried resource
			 * is not in the cache, resolve the query from the specified `request` function, and cache the data
			 * returned from the request function.
			 * @param query The string with query syntax
			 * @param callback Node style callback when the query has been fulfilled by a network request.
			 */
			query: function (query) {
				var q = [];
				var batch = {};
				var queries;
				var callback = arguments[arguments.length - 1];
				if (typeof callback !== 'function') {
					throw new Error('callback must be specified for query');
				}
				var raw_ids = [];

				var ast;
				var i;
				var j;
				var iMax;

				function done(data) {
					var i;
					// Add all new data to cache
					cache.put(data);
					// Iterate queries
					for (i = queries[LENGTH]; i--;) {
						// If we have a corresponding ID, fetch from cache
						if (i in raw_ids) {
							queries[i] = cache[raw_ids[i]];
						}
					}

					// Resolve batch
					callback(null, queries);
				}

				function fail(err) {
					// Reject (with original queries as argument)
					callback(new Error([
						queries.join(','),
						err.status,
						err.statusText
					].join('|')));
				}

				try {
					// Slice and flatten queries
					queries = ARRAY_SLICE.call(arguments, 0, arguments.length - 1);

					// Iterate queries
					for (i = 0, iMax = queries[LENGTH]; i < iMax; i++) {

						// Parse out query AST
						ast = parse(queries[i]);

						// If we have an ID
						if (ast[LENGTH] > 0) {
							// Store raw ID
							raw_ids[i] = ast[0][RAW];
						} else {
							throw new Error('invalid query format: ' + queries[i]);
						}

						// Reduce AST against cache
						ast = reduce(ast, cache);

						// Step backwards through AST
						for (j = ast[LENGTH]; j-- > 0;) {
							// If one of the op is not resolved
							if (!ast[j][RESOLVED]) {
								// Add rewritten (and reduced) query to q
								ARRAY_PUSH.call(q, rewrite(ast));
								break;
							}
						}
					}

					// If all queries were fully reduced, we can quick resolve
					if (q[LENGTH] === 0) {
						// Iterate queries
						for (i = 0; i < iMax; i++) {
							// If we have a corresponding ID, fetch from cache
							if (i in raw_ids) {
								queries[i] = cache[raw_ids[i]];
							}
						}

						// Resolve batch
						callback(null, queries);
					} else {
						// Rather than resolving it immediately, we queue up the query
						if (scanner) {
							batch.resolve = function (queries) { callback(null, queries); };
							batch.reject = function (err) { callback(err); };
							// Store properties on batch
							batch[QUERIES] = queries;
							batch[ID] = raw_ids;
							batch[Q] = q;
							// Add batch to batches
							batches.push(batch);
						} else {
							request(q, done, fail);
						}
					}
				} catch (e) {
					callback(e);
				}
			}
		}
	};
});
