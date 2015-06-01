define([
	"../../query/factory",
	"../../cache/factory",
	"when/when"
], function (QueryFactory, CacheFactory, when) {

	var UNDEFINED;
	var TIMEOUT = "timeout";
	var CACHE = "cache";
	var assert = buster.referee.assert;
	var MATCH_UNDEFINED = function (val) {
		return val === UNDEFINED;
	};

	var REQUEST_CACHE = {
		'test!1234': {
			"id": "test!1234",
			"maxAge": 1000,
			"collapsed": false
		},
		'test!124': {
			"id": "test!124",
			"maxAge": 1000,
			"collapsed": false
		}
	};

	// cache is NOT shared across test cases.
	function createCache() {
		var now = +new Date();
		var cache = CacheFactory();
		/* fill in some cache */
		cache.put([
			{
				"id": "test!123",
				"collapsed": false,
				"maxAge": 1000
			},
			{
				"id": "test!1234",
				"collapsed": true
			},
			{
				"id": "test!xyz",
				"p1": {"id": 'test!123'},
				"p2": {"id": 'test!1234'},
				"collapsed": false,
				"maxAge": 1000
			}
		]);
		return cache;
	}

	buster.testCase("mu-data/query/index", {
		"query(no batch)": {
			"setUp": function () {
				var me = this;
				var service = QueryFactory(createCache(), function queryRequest(queries, ok, fail) {
					me.requestSpy(queries);
					/* ajax request mock */
					var retval = queries.map(function (query) {
						return REQUEST_CACHE[query];
					});
					setTimeout(function () {
						ok(retval);
					}, 200);
				});
				this.query = service.query;
				this.requestSpy = this.spy();
			},
			"test!123(query hit cache)": function (done) {
				var me = this;
				this.query("test!123", function (err, data) {
					assert(me.requestSpy.notCalled);
					assert.match(data, [
						{
							"id": "test!123",
							"collapsed": false
						}
					]);
					done();
				});
			},
			"test!xyz.p1(query hit cache, property expander also hit cache)": function (done) {
				var me = this;
				this.query("test!xyz.p1", function (err, data) {
					assert.isNull(err);
					assert(me.requestSpy.notCalled);
					assert.match(data, [
						{
							"id": "test!xyz",
							"p1": {
								"id": 'test!123',
								"collapsed": false
							},
							"p2": {
								"id": 'test!1234',
								"collapsed": true
							},
							"collapsed": false
						}
					]);
					done();
				});
			},
			"test!xyz.p2(query hit cache, property expander from network)": function (done) {
				var me = this;
				this.query("test!xyz.p2", function (err, data) {
					assert.isNull(err);
					assert(me.requestSpy.calledOnce);
					assert.match(data, [
						{
							"id": "test!xyz",
							"p1": {
								"id": "test!123",
								"collapsed": false,
							},
							"p2": {
								"id": "test!1234",
								"collapsed": false
							},
							"collapsed": false
						}
					]);
					done();
				});
			},
			"test!1234(not in cache, from request)": function (done) {
				var me = this;
				this.query("test!1234", function (err, data) {
					assert(me.requestSpy.calledOnce);
					assert.match(data, [
						{
							"id": "test!1234",
							"collapsed": false
						}
					]);
					done();
				});
			},
			"test!123, test!1234 (two queries, one from cache, one from request)": function (done) {
				var me = this;
				this.query("test!123", "test!1234", function (err, data) {
					assert(me.requestSpy.calledOnce);
					assert.match(data, [
						{
							"id": "test!123",
							"collapsed": false
						},
						{
							"id": "test!1234",
							"collapsed": false
						}
					]);
					done();
				});
			},
			"test!124, test!125 (two queries, both from request, but the 2nd query fails)": function (done) {
				var me = this;
				this.query("test!124", "test!125", function (err, data) {
					assert(me.requestSpy.calledOnce);
					assert.calledWith(me.requestSpy, [
						"test!124",
						"test!125"
					]);
					assert.match(data, [
						{
							"id": "test!124",
							"collapsed": false
						},
						MATCH_UNDEFINED
					]);
					done();
				});
			},
			"test?124, test!1234 (one query with syntax error)": function (done) {
				var me = this;
				this.query("test?124", "test!1234", function (err, data) {
					assert(me.requestSpy.notCalled);
					assert(data === UNDEFINED);
					assert(err instanceof Error);
					assert(/invalid query/.test(err.message));
					done();
				});
			}
		},
		"query(with batch:300ms)": {
			"setUp": function () {
				var me = this;
				var service = QueryFactory(createCache(), function queryRequest(queries, ok, fail) {
					me.requestSpy(queries);
					/* ajax request mock */
					var retval = queries.map(function (query) {
						return REQUEST_CACHE[query];
					});
					setTimeout(function () {
						ok(retval);
					}, 200);
				});
				this.queryService = service;
				this.query = service.query;
				this.requestSpy = this.spy();
				me[TIMEOUT] = 1000;
				service.batchStart(300);
			},
			"tearDown": function () {
				this.queryService.batchStop();
			},
			"test!123(query hit cache)": function (done) {
				var me = this;
				this.query("test!123", function (err, data) {
					assert(me.requestSpy.notCalled);
					assert.match(data, [
						{
							"id": "test!123",
							"collapsed": false
						}
					]);
					done();
				});
			},
			"test!124 + test!1234 (from one request batch)": function () {
				var me = this;
				var d1 = when.defer();
				var d2 = when.defer();

				// issue query #1
				me.query("test!124", function (err, data) {
					assert.isNull(err);
					assert.match(data, [
						{
							"id": "test!124",
							"collapsed": false
						}
					]);
					d1.resolve();
				});

				// issue query #2
				setTimeout(function () {
					me.query("test!1234", function (err, data) {
						assert.isNull(err);
						assert.match(data, [
							{
								"id": "test!1234",
								"collapsed": false
							},
						]);
						d2.resolve();
					});
				}, 200);

				return when.all([d1.promise, d2.promise]).then(function () {
					/* request is batched */
					assert(me.requestSpy.calledOnce);
				});
			},
			"test!124 + test!1234 + test!125 (from two request batches)": function () {
				var me = this;
				var d1 = when.defer();
				var d2 = when.defer();
				var d3 = when.defer();

				// issue query #1
				me.query("test!124", function (err, data) {
					assert.isNull(err);
					assert.match(data, [
						{
							"id": "test!124",
							"collapsed": false
						}
					]);
					d1.resolve();
				});

				// issue query #2
				setTimeout(function () {
					me.query("test!1234", function (err, data) {
						assert.isNull(err);
						assert.match(data, [
							{
								"id": "test!1234",
								"collapsed": false
							},
						]);
						d2.resolve();
					});
				}, 200);

				// issue query #3
				setTimeout(function () {
					me.query("test!125", function (err, data) {
						assert.isNull(err);
						assert.match(data, [ MATCH_UNDEFINED,]);
						d3.resolve();
					});
				}, 500);

				return when.all([d1.promise, d2.promise, d3.promise]).then(function () {
					/* request is batched */
					assert(me.requestSpy.calledTwice);
				});
			},
			"test!124 + test!1234 (batch stopped)": function () {
				this.queryService.batchStop();

				var me = this;
				var d1 = when.defer();
				var d2 = when.defer();

				// issue query #1
				me.query("test!124", function (err, data) {
					assert.isNull(err);
					assert.match(data, [
						{
							"id": "test!124",
							"collapsed": false
						}
					]);
					d1.resolve();
				});

				// issue query #2
				setTimeout(function () {
					me.query("test!1234", function (err, data) {
						assert.isNull(err);
						/* request is batched */
						assert.match(data, [
							{
								"id": "test!1234",
								"collapsed": false
							},
						]);
						d2.resolve();
					});
				}, 200);

				return when.all([
					d1.promise,
					d2.promise
				]).then(function () {
					assert(me.requestSpy.calledTwice);
				});
			}
		}
	});
});