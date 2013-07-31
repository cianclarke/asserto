var assert = require('assert'),
util = require('util'),
http = require('http');

assert.eql = assert.deepEqual;

/**
 * Assert that `val` is null.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isNull = function(val, msg) {
  assert.strictEqual(null, val, msg);
};

/**
 * Assert that `val` is not null.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isNotNull = function(val, msg) {
  assert.notStrictEqual(null, val, msg);
};

/**
 * Assert that `val` is undefined.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isUndefined = function(val, msg) {
  assert.strictEqual(undefined, val, msg);
};

/**
 * Assert that `val` is not undefined.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isDefined = function(val, msg) {
  assert.notStrictEqual(undefined, val, msg);
};

/**
 * Assert that `obj` is `type`.
 *
 * @param {Mixed} obj
 * @param {String} type
 * @api public
 */

assert.type = function(obj, type, msg) {
  var real = typeof obj;
  msg = msg || 'typeof ' + util.inspect(obj) + ' is ' + real + ', expected ' + type;
  assert.ok(type === real, msg);
};

/**
 * Assert that `str` matches `regexp`.
 *
 * @param {String} str
 * @param {RegExp} regexp
 * @param {String} msg
 */

assert.match = function(str, regexp, msg) {
  msg = msg || util.inspect(str) + ' does not match ' + util.inspect(regexp);
  assert.ok(regexp.test(str), msg);
};

/**
 * Assert that `val` is within `obj`.
 *
 * Examples:
 *
 *    assert.includes('foobar', 'bar');
 *    assert.includes(['foo', 'bar'], 'foo');
 *
 * @param {String|Array} obj
 * @param {Mixed} val
 * @param {String} msg
 */

assert.includes = function(obj, val, msg) {
  msg = msg || util.inspect(obj) + ' does not include ' + util.inspect(val);
  assert.ok(obj.indexOf(val) >= 0, msg);
};

/**
 * Assert length of `val` is `n`.
 *
 * @param {Mixed} val
 * @param {Number} n
 * @param {String} msg
 */

assert.length = function(val, n, msg) {
  msg = msg || util.inspect(val) + ' has length of ' + val.length + ', expected ' + n;
  assert.equal(n, val.length, msg);
};

/**
 * Assert response from `server` with
 * the given `req` object and `res` assertions object.
 *
 * @param {Object} req
 * @param {Object|Function} res
 * @param {Function} cb - function(err, response) { }
 * @param {Object} config - override port with config.port
 */

assert.response = function(req, res, cb, config) {
  var msg = '',
  port = config && config.port || 3000;

  issue();

  function issue() {
    // Issue request
    var timer,
    method = req.method || 'GET',
    status = res.status || res.statusCode,
    data = req.data || req.body,
    requestTimeout = req.timeout || 0,
    encoding = req.encoding || 'utf8';

    var request = http.request({
      host: '127.0.0.1',
      port: port,
      path: req.url,
      method: method,
      headers: req.headers
    });

    // Timeout
    if (requestTimeout) {
      timer = setTimeout(function() {
        delete req.timeout;
        var err = new Error(msg + 'Request timed out after ' + requestTimeout + 'ms.');
        console.log(err);
        cb(err);
      }, requestTimeout);
    }

    if (data) request.write(data);

    request.on('response', function(response) {
      response.body = '';
      response.setEncoding(encoding);
      response.on('data', function(chunk) { response.body += chunk; });
      response.on('end', function() {
        if (timer) clearTimeout(timer);
        try {
          // Assert response body
          if (res.body !== undefined) {
            var eql = res.body instanceof RegExp
            ? res.body.test(response.body)
            : res.body === response.body;
            assert.ok(
            eql,
            msg + 'Invalid response body.\n'
            + '    Expected: ' + util.inspect(res.body) + '\n'
            + '    Got: ' + util.inspect(response.body)
            );
          }

          // Assert response status
          if (typeof status === 'number') {
            assert.equal(
            response.statusCode,
            status,
            msg + 'Invalid response status code.\n'
            + '    Expected: {' + status + '}\n'
            + '    Got: {' + response.statusCode + '}'
            );
          }

          // Assert response headers
          if (res.headers) {
            var keys = Object.keys(res.headers);
            for (var i = 0, len = keys.length; i < len; ++i) {
              var name = keys[i],
              actual = response.headers[name.toLowerCase()],
              expected = res.headers[name],
              eql = expected instanceof RegExp
              ? expected.test(actual)
              : expected == actual;
              assert.ok(
              eql,
              msg + 'Invalid response header {' + name + '}.\n'
              + '    Expected: {' + expected + '}\n'
              + '    Got: {' + actual + '}'
              );
            }
          }

          // Add this to the succeeded bin.
          cb(null, response);
        } catch (err) {
          console.log(err);
          cb(err);
        } finally {

        }
      });
    });

    request.end();
  }
};


module.exports = assert;