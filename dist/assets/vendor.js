/* jshint ignore:start */

window.EmberENV = {"FEATURES":{}};
var runningTests = false;



/* jshint ignore:end */

;var define, requireModule, require, requirejs;

(function() {

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    };
  } else {
    _isArray = Array.isArray;
  }

  var registry = {}, seen = {};
  var FAILED = false;

  var uuid = 0;

  function tryFinally(tryable, finalizer) {
    try {
      return tryable();
    } finally {
      finalizer();
    }
  }

  function unsupportedModule(length) {
    throw new Error("an unsupported module was defined, expected `define(name, deps, module)` instead got: `" + length + "` arguments to define`");
  }

  var defaultDeps = ['require', 'exports', 'module'];

  function Module(name, deps, callback, exports) {
    this.id       = uuid++;
    this.name     = name;
    this.deps     = !deps.length && callback.length ? defaultDeps : deps;
    this.exports  = exports || { };
    this.callback = callback;
    this.state    = undefined;
    this._require  = undefined;
  }


  Module.prototype.makeRequire = function() {
    var name = this.name;

    return this._require || (this._require = function(dep) {
      return require(resolve(dep, name));
    });
  }

  define = function(name, deps, callback) {
    if (arguments.length < 2) {
      unsupportedModule(arguments.length);
    }

    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }

    registry[name] = new Module(name, deps, callback);
  };

  // we don't support all of AMD
  // define.amd = {};
  // we will support petals...
  define.petal = { };

  function Alias(path) {
    this.name = path;
  }

  define.alias = function(path) {
    return new Alias(path);
  };

  function reify(mod, name, seen) {
    var deps = mod.deps;
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    // TODO: new Module
    // TODO: seen refactor
    var module = { };

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        module.exports = reified[i] = seen;
      } else if (dep === 'require') {
        reified[i] = mod.makeRequire();
      } else if (dep === 'module') {
        mod.exports = seen;
        module = reified[i] = mod;
      } else {
        reified[i] = requireFrom(resolve(dep, name), name);
      }
    }

    return {
      deps: reified,
      module: module
    };
  }

  function requireFrom(name, origin) {
    var mod = registry[name];
    if (!mod) {
      throw new Error('Could not find module `' + name + '` imported from `' + origin + '`');
    }
    return require(name);
  }

  function missingModule(name) {
    throw new Error('Could not find module ' + name);
  }
  requirejs = require = requireModule = function(name) {
    var mod = registry[name];


    if (mod && mod.callback instanceof Alias) {
      mod = registry[mod.callback.name];
    }

    if (!mod) { missingModule(name); }

    if (mod.state !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    tryFinally(function() {
      reified = reify(mod, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    }, function() {
      if (!loaded) {
        mod.state = FAILED;
      }
    });

    var obj;
    if (module === undefined && reified.module.exports) {
      obj = reified.module.exports;
    } else {
      obj = seen[name] = module;
    }

    if (obj !== null &&
        (typeof obj === 'object' || typeof obj === 'function') &&
          obj['default'] === undefined) {
      obj['default'] = obj;
    }

    return (seen[name] = obj);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase = nameParts.slice(0, -1);

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') {
        if (parentBase.length === 0) {
          throw new Error('Cannot access parent module of root');
        }
        parentBase.pop();
      } else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

;(function() {
/* global define, Ember */
define('ember', [], function() {
  "use strict";

  return {
    'default': Ember
  };
});

define('ember-data', [], function() {
  "use strict";

  return {
    'default': DS
  };
});
})();

define('jquery', [], function() {
  "use strict";

  return {
    'default': jQuery
  };
});

;(function() {
define("ember/load-initializers",
  [],
  function() {
    "use strict";

    return {
      'default': function(app, prefix) {
        var initializersRegExp = new RegExp('^' + prefix + '/initializers');

        Ember.keys(requirejs._eak_seen).filter(function(key) {
          return initializersRegExp.test(key);
        }).forEach(function(moduleName) {
          var module = require(moduleName, null, null, true);
          if (!module) { throw new Error(moduleName + ' must export an initializer.'); }
          app.initializer(module['default']);
        });
      }
    }
  }
);
})();

;define("ic-ajax",
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*!
     * ic-ajax
     *
     * - (c) 2013 Instructure, Inc
     * - please see license at https://github.com/instructure/ic-ajax/blob/master/LICENSE
     * - inspired by discourse ajax: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
     */

    var Ember = __dependency1__["default"] || __dependency1__;

    /*
     * jQuery.ajax wrapper, supports the same signature except providing
     * `success` and `error` handlers will throw an error (use promises instead)
     * and it resolves only the response (no access to jqXHR or textStatus).
     */

    function request() {
      return raw.apply(null, arguments).then(function(result) {
        return result.response;
      }, null, 'ic-ajax: unwrap raw ajax response');
    }

    __exports__.request = request;__exports__["default"] = request;

    /*
     * Same as `request` except it resolves an object with `{response, textStatus,
     * jqXHR}`, useful if you need access to the jqXHR object for headers, etc.
     */

    function raw() {
      return makePromise(parseArgs.apply(null, arguments));
    }

    __exports__.raw = raw;var __fixtures__ = {};
    __exports__.__fixtures__ = __fixtures__;
    /*
     * Defines a fixture that will be used instead of an actual ajax
     * request to a given url. This is useful for testing, allowing you to
     * stub out responses your application will send without requiring
     * libraries like sinon or mockjax, etc.
     *
     * For example:
     *
     *    defineFixture('/self', {
     *      response: { firstName: 'Ryan', lastName: 'Florence' },
     *      textStatus: 'success'
     *      jqXHR: {}
     *    });
     *
     * @param {String} url
     * @param {Object} fixture
     */

    function defineFixture(url, fixture) {
      if (fixture.response) {
        fixture.response = JSON.parse(JSON.stringify(fixture.response));
      }
      __fixtures__[url] = fixture;
    }

    __exports__.defineFixture = defineFixture;/*
     * Looks up a fixture by url.
     *
     * @param {String} url
     */

    function lookupFixture (url) {
      return __fixtures__ && __fixtures__[url];
    }

    __exports__.lookupFixture = lookupFixture;function makePromise(settings) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        var fixture = lookupFixture(settings.url);
        if (fixture) {
          if (fixture.textStatus === 'success' || fixture.textStatus == null) {
            return Ember.run.later(null, resolve, fixture);
          } else {
            return Ember.run.later(null, reject, fixture);
          }
        }
        settings.success = makeSuccess(resolve);
        settings.error = makeError(reject);
        Ember.$.ajax(settings);
      }, 'ic-ajax: ' + (settings.type || 'GET') + ' to ' + settings.url);
    };

    function parseArgs() {
      var settings = {};
      if (arguments.length === 1) {
        if (typeof arguments[0] === "string") {
          settings.url = arguments[0];
        } else {
          settings = arguments[0];
        }
      } else if (arguments.length === 2) {
        settings = arguments[1];
        settings.url = arguments[0];
      }
      if (settings.success || settings.error) {
        throw new Ember.Error("ajax should use promises, received 'success' or 'error' callback");
      }
      return settings;
    }

    function makeSuccess(resolve) {
      return function(response, textStatus, jqXHR) {
        Ember.run(null, resolve, {
          response: response,
          textStatus: textStatus,
          jqXHR: jqXHR
        });
      }
    }

    function makeError(reject) {
      return function(jqXHR, textStatus, errorThrown) {
        Ember.run(null, reject, {
          jqXHR: jqXHR,
          textStatus: textStatus,
          errorThrown: errorThrown
        });
      };
    }
  });
;(function() {
    "use strict";
    /**
      @module ember-data
    */

    var ember$data$lib$system$adapter$$get = Ember.get;

    var ember$data$lib$system$adapter$$errorProps = [
      'description',
      'fileName',
      'lineNumber',
      'message',
      'name',
      'number',
      'stack'
    ];

    /**
      A `DS.InvalidError` is used by an adapter to signal the external API
      was unable to process a request because the content was not
      semantically correct or meaningful per the API. Usually this means a
      record failed some form of server side validation. When a promise
      from an adapter is rejected with a `DS.InvalidError` the record will
      transition to the `invalid` state and the errors will be set to the
      `errors` property on the record.

      This function should return the entire payload as received from the
      server.  Error object extraction and normalization of model errors
      should be performed by `extractErrors` on the serializer.

      Example

      ```javascript
      App.ApplicationAdapter = DS.RESTAdapter.extend({
        ajaxError: function(jqXHR) {
          var error = this._super(jqXHR);

          if (jqXHR && jqXHR.status === 422) {
            var jsonErrors = Ember.$.parseJSON(jqXHR.responseText);
            return new DS.InvalidError(jsonErrors);
          } else {
            return error;
          }
        }
      });
      ```

      The `DS.InvalidError` must be constructed with a single object whose
      keys are the invalid model properties, and whose values contain
      arrays of the corresponding error messages. For example:

      ```javascript
      return new DS.InvalidError({
        length: ['Must be less than 15'],
        name: ['Must not be blank']
      });
      ```

      @class InvalidError
      @namespace DS
    */
    function ember$data$lib$system$adapter$$InvalidError(errors) {
      var tmp = Error.prototype.constructor.call(this, "The backend rejected the commit because it was invalid: " + Ember.inspect(errors));
      this.errors = errors;

      for (var i=0, l=ember$data$lib$system$adapter$$errorProps.length; i<l; i++) {
        this[ember$data$lib$system$adapter$$errorProps[i]] = tmp[ember$data$lib$system$adapter$$errorProps[i]];
      }
    }

    ember$data$lib$system$adapter$$InvalidError.prototype = Ember.create(Error.prototype);

    /**
      An adapter is an object that receives requests from a store and
      translates them into the appropriate action to take against your
      persistence layer. The persistence layer is usually an HTTP API, but
      may be anything, such as the browser's local storage. Typically the
      adapter is not invoked directly instead its functionality is accessed
      through the `store`.

      ### Creating an Adapter

      Create a new subclass of `DS.Adapter`, then assign
      it to the `ApplicationAdapter` property of the application.

      ```javascript
      var MyAdapter = DS.Adapter.extend({
        // ...your code here
      });

      App.ApplicationAdapter = MyAdapter;
      ```

      Model-specific adapters can be created by assigning your adapter
      class to the `ModelName` + `Adapter` property of the application.

      ```javascript
      var MyPostAdapter = DS.Adapter.extend({
        // ...Post-specific adapter code goes here
      });

      App.PostAdapter = MyPostAdapter;
      ```

      `DS.Adapter` is an abstract base class that you should override in your
      application to customize it for your backend. The minimum set of methods
      that you should implement is:

        * `find()`
        * `createRecord()`
        * `updateRecord()`
        * `deleteRecord()`
        * `findAll()`
        * `findQuery()`

      To improve the network performance of your application, you can optimize
      your adapter by overriding these lower-level methods:

        * `findMany()`


      For an example implementation, see `DS.RESTAdapter`, the
      included REST adapter.

      @class Adapter
      @namespace DS
      @extends Ember.Object
    */

    var ember$data$lib$system$adapter$$Adapter = Ember.Object.extend({

      /**
        If you would like your adapter to use a custom serializer you can
        set the `defaultSerializer` property to be the name of the custom
        serializer.

        Note the `defaultSerializer` serializer has a lower priority than
        a model specific serializer (i.e. `PostSerializer`) or the
        `application` serializer.

        ```javascript
        var DjangoAdapter = DS.Adapter.extend({
          defaultSerializer: 'django'
        });
        ```

        @property defaultSerializer
        @type {String}
      */

      /**
        The `find()` method is invoked when the store is asked for a record that
        has not previously been loaded. In response to `find()` being called, you
        should query your persistence layer for a record with the given ID. Once
        found, you can asynchronously call the store's `push()` method to push
        the record into the store.

        Here is an example `find` implementation:

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          find: function(store, type, id) {
            var url = [type.typeKey, id].join('/');

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.getJSON(url).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method find
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} id
        @return {Promise} promise
      */
      find: Ember.required(Function),

      /**
        The `findAll()` method is called when you call `find` on the store
        without an ID (i.e. `store.find('post')`).

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          findAll: function(store, type, sinceToken) {
            var url = type;
            var query = { since: sinceToken };
            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.getJSON(url, query).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @private
        @method findAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} sinceToken
        @return {Promise} promise
      */
      findAll: null,

      /**
        This method is called when you call `find` on the store with a
        query object as the second parameter (i.e. `store.find('person', {
        page: 1 })`).

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          findQuery: function(store, type, query) {
            var url = type;
            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.getJSON(url, query).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @private
        @method findQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} query
        @param {DS.AdapterPopulatedRecordArray} recordArray
        @return {Promise} promise
      */
      findQuery: null,

      /**
        If the globally unique IDs for your records should be generated on the client,
        implement the `generateIdForRecord()` method. This method will be invoked
        each time you create a new record, and the value returned from it will be
        assigned to the record's `primaryKey`.

        Most traditional REST-like HTTP APIs will not use this method. Instead, the ID
        of the record will be set by the server, and your adapter will update the store
        with the new ID when it calls `didCreateRecord()`. Only implement this method if
        you intend to generate record IDs on the client-side.

        The `generateIdForRecord()` method will be invoked with the requesting store as
        the first parameter and the newly created record as the second parameter:

        ```javascript
        generateIdForRecord: function(store, inputProperties) {
          var uuid = App.generateUUIDWithStatisticallyLowOddsOfCollision();
          return uuid;
        }
        ```

        @method generateIdForRecord
        @param {DS.Store} store
        @param {Object} inputProperties a hash of properties to set on the
          newly created record.
        @return {String|Number} id
      */
      generateIdForRecord: null,

      /**
        Proxies to the serializer's `serialize` method.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          createRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var url = type;

            // ...
          }
        });
        ```

        @method serialize
        @param {DS.Model} record
        @param {Object}   options
        @return {Object} serialized record
      */
      serialize: function(record, options) {
        var snapshot = record._createSnapshot();
        return ember$data$lib$system$adapter$$get(record, 'store').serializerFor(snapshot.typeKey).serialize(snapshot, options);
      },

      /**
        Implement this method in a subclass to handle the creation of
        new records.

        Serializes the record and send it to the server.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          createRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var url = type;

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.ajax({
                type: 'POST',
                url: url,
                dataType: 'json',
                data: data
              }).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method createRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the record
        @param {DS.Model} record
        @return {Promise} promise
      */
      createRecord: Ember.required(Function),

      /**
        Implement this method in a subclass to handle the updating of
        a record.

        Serializes the record update and send it to the server.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          updateRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var id = record.get('id');
            var url = [type, id].join('/');

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.ajax({
                type: 'PUT',
                url: url,
                dataType: 'json',
                data: data
              }).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method updateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the record
        @param {DS.Model} record
        @return {Promise} promise
      */
      updateRecord: Ember.required(Function),

      /**
        Implement this method in a subclass to handle the deletion of
        a record.

        Sends a delete request for the record to the server.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          deleteRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var id = record.get('id');
            var url = [type, id].join('/');

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.ajax({
                type: 'DELETE',
                url: url,
                dataType: 'json',
                data: data
              }).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method deleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the record
        @param {DS.Model} record
        @return {Promise} promise
      */
      deleteRecord: Ember.required(Function),

      /**
        By default the store will try to coalesce all `fetchRecord` calls within the same runloop
        into as few requests as possible by calling groupRecordsForFindMany and passing it into a findMany call.
        You can opt out of this behaviour by either not implementing the findMany hook or by setting
        coalesceFindRequests to false

        @property coalesceFindRequests
        @type {boolean}
      */
      coalesceFindRequests: true,

      /**
        Find multiple records at once if coalesceFindRequests is true

        @method findMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the records
        @param {Array}    ids
        @param {Array} records
        @return {Promise} promise
      */

      /**
        Organize records into groups, each of which is to be passed to separate
        calls to `findMany`.

        For example, if your api has nested URLs that depend on the parent, you will
        want to group records by their parent.

        The default implementation returns the records as a single group.

        @method groupRecordsForFindMany
        @param {DS.Store} store
        @param {Array} records
        @return {Array}  an array of arrays of records, each of which is to be
                          loaded separately by `findMany`.
      */
      groupRecordsForFindMany: function (store, records) {
        return [records];
      }
    });

    var ember$data$lib$system$adapter$$default = ember$data$lib$system$adapter$$Adapter;
    /**
      @module ember-data
    */
    var ember$data$lib$adapters$fixture_adapter$$get = Ember.get;
    var ember$data$lib$adapters$fixture_adapter$$fmt = Ember.String.fmt;
    var ember$data$lib$adapters$fixture_adapter$$indexOf = Ember.EnumerableUtils.indexOf;

    var ember$data$lib$adapters$fixture_adapter$$counter = 0;

    var ember$data$lib$adapters$fixture_adapter$$default = ember$data$lib$system$adapter$$default.extend({
      // by default, fixtures are already in normalized form
      serializer: null,

      /**
        If `simulateRemoteResponse` is `true` the `FixtureAdapter` will
        wait a number of milliseconds before resolving promises with the
        fixture values. The wait time can be configured via the `latency`
        property.

        @property simulateRemoteResponse
        @type {Boolean}
        @default true
      */
      simulateRemoteResponse: true,

      /**
        By default the `FixtureAdapter` will simulate a wait of the
        `latency` milliseconds before resolving promises with the fixture
        values. This behavior can be turned off via the
        `simulateRemoteResponse` property.

        @property latency
        @type {Number}
        @default 50
      */
      latency: 50,

      /**
        Implement this method in order to provide data associated with a type

        @method fixturesForType
        @param {Subclass of DS.Model} type
        @return {Array}
      */
      fixturesForType: function(type) {
        if (type.FIXTURES) {
          var fixtures = Ember.A(type.FIXTURES);
          return fixtures.map(function(fixture) {
            var fixtureIdType = typeof fixture.id;
            if (fixtureIdType !== "number" && fixtureIdType !== "string") {
              throw new Error(ember$data$lib$adapters$fixture_adapter$$fmt('the id property must be defined as a number or string for fixture %@', [fixture]));
            }
            fixture.id = fixture.id + '';
            return fixture;
          });
        }
        return null;
      },

      /**
        Implement this method in order to query fixtures data

        @method queryFixtures
        @param {Array} fixture
        @param {Object} query
        @param {Subclass of DS.Model} type
        @return {Promise|Array}
      */
      queryFixtures: function(fixtures, query, type) {
        Ember.assert('Not implemented: You must override the DS.FixtureAdapter::queryFixtures method to support querying the fixture store.');
      },

      /**
        @method updateFixtures
        @param {Subclass of DS.Model} type
        @param {Array} fixture
      */
      updateFixtures: function(type, fixture) {
        if (!type.FIXTURES) {
          type.FIXTURES = [];
        }

        var fixtures = type.FIXTURES;

        this.deleteLoadedFixture(type, fixture);

        fixtures.push(fixture);
      },

      /**
        Implement this method in order to provide json for CRUD methods

        @method mockJSON
        @param {DS.Store} store
        @param {Subclass of DS.Model} type
        @param {DS.Model} record
      */
      mockJSON: function(store, type, record) {
        var snapshot = record._createSnapshot();
        return store.serializerFor(snapshot.typeKey).serialize(snapshot, { includeId: true });
      },

      /**
        @method generateIdForRecord
        @param {DS.Store} store
        @param {DS.Model} record
        @return {String} id
      */
      generateIdForRecord: function(store) {
        return "fixture-" + ember$data$lib$adapters$fixture_adapter$$counter++;
      },

      /**
        @method find
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} id
        @return {Promise} promise
      */
      find: function(store, type, id) {
        var fixtures = this.fixturesForType(type);
        var fixture;

        Ember.assert("Unable to find fixtures for model type "+type.toString() +". If you're defining your fixtures using `Model.FIXTURES = ...`, please change it to `Model.reopenClass({ FIXTURES: ... })`.", fixtures);

        if (fixtures) {
          fixture = Ember.A(fixtures).findBy('id', id);
        }

        if (fixture) {
          return this.simulateRemoteCall(function() {
            return fixture;
          }, this);
        }
      },

      /**
        @method findMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Array} ids
        @return {Promise} promise
      */
      findMany: function(store, type, ids) {
        var fixtures = this.fixturesForType(type);

        Ember.assert("Unable to find fixtures for model type "+type.toString(), fixtures);

        if (fixtures) {
          fixtures = fixtures.filter(function(item) {
            return ember$data$lib$adapters$fixture_adapter$$indexOf(ids, item.id) !== -1;
          });
        }

        if (fixtures) {
          return this.simulateRemoteCall(function() {
            return fixtures;
          }, this);
        }
      },

      /**
        @private
        @method findAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} sinceToken
        @return {Promise} promise
      */
      findAll: function(store, type) {
        var fixtures = this.fixturesForType(type);

        Ember.assert("Unable to find fixtures for model type "+type.toString(), fixtures);

        return this.simulateRemoteCall(function() {
          return fixtures;
        }, this);
      },

      /**
        @private
        @method findQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} query
        @param {DS.AdapterPopulatedRecordArray} recordArray
        @return {Promise} promise
      */
      findQuery: function(store, type, query, array) {
        var fixtures = this.fixturesForType(type);

        Ember.assert("Unable to find fixtures for model type " + type.toString(), fixtures);

        fixtures = this.queryFixtures(fixtures, query, type);

        if (fixtures) {
          return this.simulateRemoteCall(function() {
            return fixtures;
          }, this);
        }
      },

      /**
        @method createRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      createRecord: function(store, type, record) {
        var fixture = this.mockJSON(store, type, record);

        this.updateFixtures(type, fixture);

        return this.simulateRemoteCall(function() {
          return fixture;
        }, this);
      },

      /**
        @method updateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      updateRecord: function(store, type, record) {
        var fixture = this.mockJSON(store, type, record);

        this.updateFixtures(type, fixture);

        return this.simulateRemoteCall(function() {
          return fixture;
        }, this);
      },

      /**
        @method deleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      deleteRecord: function(store, type, record) {
        this.deleteLoadedFixture(type, record);

        return this.simulateRemoteCall(function() {
          // no payload in a deletion
          return null;
        });
      },

      /*
        @method deleteLoadedFixture
        @private
        @param type
        @param record
      */
      deleteLoadedFixture: function(type, record) {
        var existingFixture = this.findExistingFixture(type, record);

        if (existingFixture) {
          var index = ember$data$lib$adapters$fixture_adapter$$indexOf(type.FIXTURES, existingFixture);
          type.FIXTURES.splice(index, 1);
          return true;
        }
      },

      /*
        @method findExistingFixture
        @private
        @param type
        @param record
      */
      findExistingFixture: function(type, record) {
        var fixtures = this.fixturesForType(type);
        var id = ember$data$lib$adapters$fixture_adapter$$get(record, 'id');

        return this.findFixtureById(fixtures, id);
      },

      /*
        @method findFixtureById
        @private
        @param fixtures
        @param id
      */
      findFixtureById: function(fixtures, id) {
        return Ember.A(fixtures).find(function(r) {
          if (''+ember$data$lib$adapters$fixture_adapter$$get(r, 'id') === ''+id) {
            return true;
          } else {
            return false;
          }
        });
      },

      /*
        @method simulateRemoteCall
        @private
        @param callback
        @param context
      */
      simulateRemoteCall: function(callback, context) {
        var adapter = this;

        return new Ember.RSVP.Promise(function(resolve) {
          var value = Ember.copy(callback.call(context), true);
          if (ember$data$lib$adapters$fixture_adapter$$get(adapter, 'simulateRemoteResponse')) {
            // Schedule with setTimeout
            Ember.run.later(function() {
              resolve(value);
            }, ember$data$lib$adapters$fixture_adapter$$get(adapter, 'latency'));
          } else {
            // Asynchronous, but at the of the runloop with zero latency
            Ember.run.schedule('actions', null, function() {
              resolve(value);
            });
          }
        }, "DS: FixtureAdapter#simulateRemoteCall");
      }
    });

    /*
     The Map/MapWithDefault/OrderedSet code has been in flux as we try
     to catch up with ES6. This is difficult as we support multiple
     versions of Ember.
     This file is currently here in case we have to polyfill ember's code
     across a few releases. As ES6 comes to a close we should have a smaller
     and smaller gap in implementations between Ember releases.
    */
    var ember$data$lib$system$map$$Map            = Ember.Map;
    var ember$data$lib$system$map$$MapWithDefault = Ember.MapWithDefault;
    var ember$data$lib$system$map$$OrderedSet     = Ember.OrderedSet;

    var ember$data$lib$system$map$$default = ember$data$lib$system$map$$Map;
    var ember$data$lib$adapters$rest_adapter$$get = Ember.get;
    var ember$data$lib$adapters$rest_adapter$$forEach = Ember.ArrayPolyfills.forEach;

    var ember$data$lib$adapters$rest_adapter$$default = ember$data$lib$system$adapter$$Adapter.extend({
      defaultSerializer: '-rest',

      /**
        By default, the RESTAdapter will send the query params sorted alphabetically to the
        server.

        For example:

        ```js
          store.find('posts', {sort: 'price', category: 'pets'});
        ```

        will generate a requests like this `/posts?category=pets&sort=price`, even if the
        parameters were specified in a different order.

        That way the generated URL will be deterministic and that simplifies caching mechanisms
        in the backend.

        Setting `sortQueryParams` to a falsey value will respect the original order.

        In case you want to sort the query parameters with a different criteria, set
        `sortQueryParams` to your custom sort function.

        ```js
        export default DS.RESTAdapter.extend({
          sortQueryParams: function(params) {
            var sortedKeys = Object.keys(params).sort().reverse();
            var len = sortedKeys.length, newParams = {};

            for (var i = 0; i < len; i++) {
              newParams[sortedKeys[i]] = params[sortedKeys[i]];
            }
            return newParams;
          }
        });
        ```

        @method sortQueryParams
        @param {Object} obj
        @return {Object}
      */
      sortQueryParams: function(obj) {
        var keys = Ember.keys(obj);
        var len = keys.length;
        if (len < 2) {
          return obj;
        }
        var newQueryParams = {};
        var sortedKeys = keys.sort();

        for (var i = 0; i < len; i++) {
          newQueryParams[sortedKeys[i]] = obj[sortedKeys[i]];
        }
        return newQueryParams;
      },

      /**
        By default the RESTAdapter will send each find request coming from a `store.find`
        or from accessing a relationship separately to the server. If your server supports passing
        ids as a query string, you can set coalesceFindRequests to true to coalesce all find requests
        within a single runloop.

        For example, if you have an initial payload of:

        ```javascript
        {
          post: {
            id: 1,
            comments: [1, 2]
          }
        }
        ```

        By default calling `post.get('comments')` will trigger the following requests(assuming the
        comments haven't been loaded before):

        ```
        GET /comments/1
        GET /comments/2
        ```

        If you set coalesceFindRequests to `true` it will instead trigger the following request:

        ```
        GET /comments?ids[]=1&ids[]=2
        ```

        Setting coalesceFindRequests to `true` also works for `store.find` requests and `belongsTo`
        relationships accessed within the same runloop. If you set `coalesceFindRequests: true`

        ```javascript
        store.find('comment', 1);
        store.find('comment', 2);
        ```

        will also send a request to: `GET /comments?ids[]=1&ids[]=2`

        Note: Requests coalescing rely on URL building strategy. So if you override `buildURL` in your app
        `groupRecordsForFindMany` more likely should be overridden as well in order for coalescing to work.

        @property coalesceFindRequests
        @type {boolean}
      */
      coalesceFindRequests: false,

      /**
        Endpoint paths can be prefixed with a `namespace` by setting the namespace
        property on the adapter:

        ```javascript
        DS.RESTAdapter.reopen({
          namespace: 'api/1'
        });
        ```

        Requests for `App.Post` would now target `/api/1/post/`.

        @property namespace
        @type {String}
      */

      /**
        An adapter can target other hosts by setting the `host` property.

        ```javascript
        DS.RESTAdapter.reopen({
          host: 'https://api.example.com'
        });
        ```

        Requests for `App.Post` would now target `https://api.example.com/post/`.

        @property host
        @type {String}
      */

      /**
        Some APIs require HTTP headers, e.g. to provide an API
        key. Arbitrary headers can be set as key/value pairs on the
        `RESTAdapter`'s `headers` object and Ember Data will send them
        along with each ajax request. For dynamic headers see [headers
        customization](/api/data/classes/DS.RESTAdapter.html#toc_headers-customization).

        ```javascript
        App.ApplicationAdapter = DS.RESTAdapter.extend({
          headers: {
            "API_KEY": "secret key",
            "ANOTHER_HEADER": "Some header value"
          }
        });
        ```

        @property headers
        @type {Object}
      */

      /**
        Called by the store in order to fetch the JSON for a given
        type and ID.

        The `find` method makes an Ajax request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        This method performs an HTTP `GET` request with the id provided as part of the query string.

        @method find
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} id
        @param {DS.Model} record
        @return {Promise} promise
      */
      find: function(store, type, id, record) {
        return this.ajax(this.buildURL(type.typeKey, id, record), 'GET');
      },

      /**
        Called by the store in order to fetch a JSON array for all
        of the records for a given type.

        The `findAll` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        @private
        @method findAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} sinceToken
        @return {Promise} promise
      */
      findAll: function(store, type, sinceToken) {
        var query;

        if (sinceToken) {
          query = { since: sinceToken };
        }

        return this.ajax(this.buildURL(type.typeKey), 'GET', { data: query });
      },

      /**
        Called by the store in order to fetch a JSON array for
        the records that match a particular query.

        The `findQuery` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        The `query` argument is a simple JavaScript object that will be passed directly
        to the server as parameters.

        @private
        @method findQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} query
        @return {Promise} promise
      */
      findQuery: function(store, type, query) {
        if (this.sortQueryParams) {
          query = this.sortQueryParams(query);
        }
        return this.ajax(this.buildURL(type.typeKey), 'GET', { data: query });
      },

      /**
        Called by the store in order to fetch several records together if `coalesceFindRequests` is true

        For example, if the original payload looks like:

        ```js
        {
          "id": 1,
          "title": "Rails is omakase",
          "comments": [ 1, 2, 3 ]
        }
        ```

        The IDs will be passed as a URL-encoded Array of IDs, in this form:

        ```
        ids[]=1&ids[]=2&ids[]=3
        ```

        Many servers, such as Rails and PHP, will automatically convert this URL-encoded array
        into an Array for you on the server-side. If you want to encode the
        IDs, differently, just override this (one-line) method.

        The `findMany` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        @method findMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Array} ids
        @param {Array} records
        @return {Promise} promise
      */
      findMany: function(store, type, ids, records) {
        return this.ajax(this.buildURL(type.typeKey, ids, records), 'GET', { data: { ids: ids } });
      },

      /**
        Called by the store in order to fetch a JSON array for
        the unloaded records in a has-many relationship that were originally
        specified as a URL (inside of `links`).

        For example, if your original payload looks like this:

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "links": { "comments": "/posts/1/comments" }
          }
        }
        ```

        This method will be called with the parent record and `/posts/1/comments`.

        The `findHasMany` method will make an Ajax (HTTP GET) request to the originally specified URL.
        If the URL is host-relative (starting with a single slash), the
        request will use the host specified on the adapter (if any).

        @method findHasMany
        @param {DS.Store} store
        @param {DS.Model} record
        @param {String} url
        @return {Promise} promise
      */
      findHasMany: function(store, record, url, relationship) {
        var host = ember$data$lib$adapters$rest_adapter$$get(this, 'host');
        var id   = ember$data$lib$adapters$rest_adapter$$get(record, 'id');
        var type = record.constructor.typeKey;

        if (host && url.charAt(0) === '/' && url.charAt(1) !== '/') {
          url = host + url;
        }

        return this.ajax(this.urlPrefix(url, this.buildURL(type, id)), 'GET');
      },

      /**
        Called by the store in order to fetch a JSON array for
        the unloaded records in a belongs-to relationship that were originally
        specified as a URL (inside of `links`).

        For example, if your original payload looks like this:

        ```js
        {
          "person": {
            "id": 1,
            "name": "Tom Dale",
            "links": { "group": "/people/1/group" }
          }
        }
        ```

        This method will be called with the parent record and `/people/1/group`.

        The `findBelongsTo` method will make an Ajax (HTTP GET) request to the originally specified URL.

        @method findBelongsTo
        @param {DS.Store} store
        @param {DS.Model} record
        @param {String} url
        @return {Promise} promise
      */
      findBelongsTo: function(store, record, url, relationship) {
        var id   = ember$data$lib$adapters$rest_adapter$$get(record, 'id');
        var type = record.constructor.typeKey;

        return this.ajax(this.urlPrefix(url, this.buildURL(type, id)), 'GET');
      },

      /**
        Called by the store when a newly created record is
        saved via the `save` method on a model record instance.

        The `createRecord` method serializes the record and makes an Ajax (HTTP POST) request
        to a URL computed by `buildURL`.

        See `serialize` for information on how to customize the serialized form
        of a record.

        @method createRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      createRecord: function(store, type, record) {
        var data = {};
        var serializer = store.serializerFor(type.typeKey);

        var snapshot = record._createSnapshot();
        serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

        return this.ajax(this.buildURL(type.typeKey, null, record), "POST", { data: data });
      },

      /**
        Called by the store when an existing record is saved
        via the `save` method on a model record instance.

        The `updateRecord` method serializes the record and makes an Ajax (HTTP PUT) request
        to a URL computed by `buildURL`.

        See `serialize` for information on how to customize the serialized form
        of a record.

        @method updateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      updateRecord: function(store, type, record) {
        var data = {};
        var serializer = store.serializerFor(type.typeKey);

        var snapshot = record._createSnapshot();
        serializer.serializeIntoHash(data, type, snapshot);

        var id = ember$data$lib$adapters$rest_adapter$$get(record, 'id');

        return this.ajax(this.buildURL(type.typeKey, id, record), "PUT", { data: data });
      },

      /**
        Called by the store when a record is deleted.

        The `deleteRecord` method  makes an Ajax (HTTP DELETE) request to a URL computed by `buildURL`.

        @method deleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      deleteRecord: function(store, type, record) {
        var id = ember$data$lib$adapters$rest_adapter$$get(record, 'id');

        return this.ajax(this.buildURL(type.typeKey, id, record), "DELETE");
      },

      /**
        Builds a URL for a given type and optional ID.

        By default, it pluralizes the type's name (for example, 'post'
        becomes 'posts' and 'person' becomes 'people'). To override the
        pluralization see [pathForType](#method_pathForType).

        If an ID is specified, it adds the ID to the path generated
        for the type, separated by a `/`.

        @method buildURL
        @param {String} type
        @param {String} id
        @param {DS.Model} record
        @return {String} url
      */
      buildURL: function(type, id, record) {
        var url = [];
        var host = ember$data$lib$adapters$rest_adapter$$get(this, 'host');
        var prefix = this.urlPrefix();

        if (type) { url.push(this.pathForType(type)); }

        //We might get passed in an array of ids from findMany
        //in which case we don't want to modify the url, as the
        //ids will be passed in through a query param
        if (id && !Ember.isArray(id)) { url.push(encodeURIComponent(id)); }

        if (prefix) { url.unshift(prefix); }

        url = url.join('/');
        if (!host && url) { url = '/' + url; }

        return url;
      },

      /**
        @method urlPrefix
        @private
        @param {String} path
        @param {String} parentUrl
        @return {String} urlPrefix
      */
      urlPrefix: function(path, parentURL) {
        var host = ember$data$lib$adapters$rest_adapter$$get(this, 'host');
        var namespace = ember$data$lib$adapters$rest_adapter$$get(this, 'namespace');
        var url = [];

        if (path) {
          // Protocol relative url
          //jscs:disable disallowEmptyBlocks
          if (/^\/\//.test(path)) {
            // Do nothing, the full host is already included. This branch
            // avoids the absolute path logic and the relative path logic.

          // Absolute path
          } else if (path.charAt(0) === '/') {
            //jscs:enable disallowEmptyBlocks
            if (host) {
              path = path.slice(1);
              url.push(host);
            }
          // Relative path
          } else if (!/^http(s)?:\/\//.test(path)) {
            url.push(parentURL);
          }
        } else {
          if (host) { url.push(host); }
          if (namespace) { url.push(namespace); }
        }

        if (path) {
          url.push(path);
        }

        return url.join('/');
      },

      _stripIDFromURL: function(store, record) {
        var type = record.constructor;
        var url = this.buildURL(type.typeKey, record.get('id'), record);

        var expandedURL = url.split('/');
        //Case when the url is of the format ...something/:id
        var lastSegment = expandedURL[expandedURL.length - 1];
        var id = record.get('id');
        if (lastSegment === id) {
          expandedURL[expandedURL.length - 1] = "";
        } else if (ember$data$lib$adapters$rest_adapter$$endsWith(lastSegment, '?id=' + id)) {
          //Case when the url is of the format ...something?id=:id
          expandedURL[expandedURL.length - 1] = lastSegment.substring(0, lastSegment.length - id.length - 1);
        }

        return expandedURL.join('/');
      },

      // http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
      maxUrlLength: 2048,

      /**
        Organize records into groups, each of which is to be passed to separate
        calls to `findMany`.

        This implementation groups together records that have the same base URL but
        differing ids. For example `/comments/1` and `/comments/2` will be grouped together
        because we know findMany can coalesce them together as `/comments?ids[]=1&ids[]=2`

        It also supports urls where ids are passed as a query param, such as `/comments?id=1`
        but not those where there is more than 1 query param such as `/comments?id=2&name=David`
        Currently only the query param of `id` is supported. If you need to support others, please
        override this or the `_stripIDFromURL` method.

        It does not group records that have differing base urls, such as for example: `/posts/1/comments/2`
        and `/posts/2/comments/3`

        @method groupRecordsForFindMany
        @param {DS.Store} store
        @param {Array} records
        @return {Array}  an array of arrays of records, each of which is to be
                          loaded separately by `findMany`.
      */
      groupRecordsForFindMany: function (store, records) {
        var groups = ember$data$lib$system$map$$MapWithDefault.create({ defaultValue: function() { return []; } });
        var adapter = this;
        var maxUrlLength = this.maxUrlLength;

        ember$data$lib$adapters$rest_adapter$$forEach.call(records, function(record) {
          var baseUrl = adapter._stripIDFromURL(store, record);
          groups.get(baseUrl).push(record);
        });

        function splitGroupToFitInUrl(group, maxUrlLength, paramNameLength) {
          var baseUrl = adapter._stripIDFromURL(store, group[0]);
          var idsSize = 0;
          var splitGroups = [[]];

          ember$data$lib$adapters$rest_adapter$$forEach.call(group, function(record) {
            var additionalLength = encodeURIComponent(record.get('id')).length + paramNameLength;
            if (baseUrl.length + idsSize + additionalLength >= maxUrlLength) {
              idsSize = 0;
              splitGroups.push([]);
            }

            idsSize += additionalLength;

            var lastGroupIndex = splitGroups.length - 1;
            splitGroups[lastGroupIndex].push(record);
          });

          return splitGroups;
        }

        var groupsArray = [];
        groups.forEach(function(group, key) {
          var paramNameLength = '&ids%5B%5D='.length;
          var splitGroups = splitGroupToFitInUrl(group, maxUrlLength, paramNameLength);

          ember$data$lib$adapters$rest_adapter$$forEach.call(splitGroups, function(splitGroup) {
            groupsArray.push(splitGroup);
          });
        });

        return groupsArray;
      },

      /**
        Determines the pathname for a given type.

        By default, it pluralizes the type's name (for example,
        'post' becomes 'posts' and 'person' becomes 'people').

        ### Pathname customization

        For example if you have an object LineItem with an
        endpoint of "/line_items/".

        ```js
        App.ApplicationAdapter = DS.RESTAdapter.extend({
          pathForType: function(type) {
            var decamelized = Ember.String.decamelize(type);
            return Ember.String.pluralize(decamelized);
          }
        });
        ```

        @method pathForType
        @param {String} type
        @return {String} path
      **/
      pathForType: function(type) {
        var camelized = Ember.String.camelize(type);
        return Ember.String.pluralize(camelized);
      },

      /**
        Takes an ajax response, and returns an error payload.

        Returning a `DS.InvalidError` from this method will cause the
        record to transition into the `invalid` state and make the
        `errors` object available on the record.

        This function should return the entire payload as received from the
        server.  Error object extraction and normalization of model errors
        should be performed by `extractErrors` on the serializer.

        Example

        ```javascript
        App.ApplicationAdapter = DS.RESTAdapter.extend({
          ajaxError: function(jqXHR) {
            var error = this._super(jqXHR);

            if (jqXHR && jqXHR.status === 422) {
              var jsonErrors = Ember.$.parseJSON(jqXHR.responseText);

              return new DS.InvalidError(jsonErrors);
            } else {
              return error;
            }
          }
        });
        ```

        Note: As a correctness optimization, the default implementation of
        the `ajaxError` method strips out the `then` method from jquery's
        ajax response (jqXHR). This is important because the jqXHR's
        `then` method fulfills the promise with itself resulting in a
        circular "thenable" chain which may cause problems for some
        promise libraries.

        @method ajaxError
        @param  {Object} jqXHR
        @param  {Object} responseText
        @return {Object} jqXHR
      */
      ajaxError: function(jqXHR, responseText, errorThrown) {
        var isObject = jqXHR !== null && typeof jqXHR === 'object';

        if (isObject) {
          jqXHR.then = null;
          if (!jqXHR.errorThrown) {
            if (typeof errorThrown === 'string') {
              jqXHR.errorThrown = new Error(errorThrown);
            } else {
              jqXHR.errorThrown = errorThrown;
            }
          }
        }

        return jqXHR;
      },

      /**
        Takes an ajax response, and returns the json payload.

        By default this hook just returns the jsonPayload passed to it.
        You might want to override it in two cases:

        1. Your API might return useful results in the request headers.
        If you need to access these, you can override this hook to copy them
        from jqXHR to the payload object so they can be processed in you serializer.


        2. Your API might return errors as successful responses with status code
        200 and an Errors text or object. You can return a DS.InvalidError from
        this hook and it will automatically reject the promise and put your record
        into the invalid state.

        @method ajaxSuccess
        @param  {Object} jqXHR
        @param  {Object} jsonPayload
        @return {Object} jsonPayload
      */

      ajaxSuccess: function(jqXHR, jsonPayload) {
        return jsonPayload;
      },

      /**
        Takes a URL, an HTTP method and a hash of data, and makes an
        HTTP request.

        When the server responds with a payload, Ember Data will call into `extractSingle`
        or `extractArray` (depending on whether the original query was for one record or
        many records).

        By default, `ajax` method has the following behavior:

        * It sets the response `dataType` to `"json"`
        * If the HTTP method is not `"GET"`, it sets the `Content-Type` to be
          `application/json; charset=utf-8`
        * If the HTTP method is not `"GET"`, it stringifies the data passed in. The
          data is the serialized record in the case of a save.
        * Registers success and failure handlers.

        @method ajax
        @private
        @param {String} url
        @param {String} type The request type GET, POST, PUT, DELETE etc.
        @param {Object} options
        @return {Promise} promise
      */
      ajax: function(url, type, options) {
        var adapter = this;

        return new Ember.RSVP.Promise(function(resolve, reject) {
          var hash = adapter.ajaxOptions(url, type, options);

          hash.success = function(json, textStatus, jqXHR) {
            json = adapter.ajaxSuccess(jqXHR, json);
            if (json instanceof ember$data$lib$system$adapter$$InvalidError) {
              Ember.run(null, reject, json);
            } else {
              Ember.run(null, resolve, json);
            }
          };

          hash.error = function(jqXHR, textStatus, errorThrown) {
            Ember.run(null, reject, adapter.ajaxError(jqXHR, jqXHR.responseText, errorThrown));
          };

          Ember.$.ajax(hash);
        }, 'DS: RESTAdapter#ajax ' + type + ' to ' + url);
      },

      /**
        @method ajaxOptions
        @private
        @param {String} url
        @param {String} type The request type GET, POST, PUT, DELETE etc.
        @param {Object} options
        @return {Object}
      */
      ajaxOptions: function(url, type, options) {
        var hash = options || {};
        hash.url = url;
        hash.type = type;
        hash.dataType = 'json';
        hash.context = this;

        if (hash.data && type !== 'GET') {
          hash.contentType = 'application/json; charset=utf-8';
          hash.data = JSON.stringify(hash.data);
        }

        var headers = ember$data$lib$adapters$rest_adapter$$get(this, 'headers');
        if (headers !== undefined) {
          hash.beforeSend = function (xhr) {
            ember$data$lib$adapters$rest_adapter$$forEach.call(Ember.keys(headers), function(key) {
              xhr.setRequestHeader(key, headers[key]);
            });
          };
        }

        return hash;
      }
    });

    //From http://stackoverflow.com/questions/280634/endswith-in-javascript
    function ember$data$lib$adapters$rest_adapter$$endsWith(string, suffix) {
      if (typeof String.prototype.endsWith !== 'function') {
        return string.indexOf(suffix, string.length - suffix.length) !== -1;
      } else {
        return string.endsWith(suffix);
      }
    }
    var ember$inflector$lib$system$inflector$$capitalize = Ember.String.capitalize;

    var ember$inflector$lib$system$inflector$$BLANK_REGEX = /^\s*$/;
    var ember$inflector$lib$system$inflector$$LAST_WORD_DASHED_REGEX = /(\w+[_-])([a-z\d]+$)/;
    var ember$inflector$lib$system$inflector$$LAST_WORD_CAMELIZED_REGEX = /(\w+)([A-Z][a-z\d]*$)/;
    var ember$inflector$lib$system$inflector$$CAMELIZED_REGEX = /[A-Z][a-z\d]*$/;

    function ember$inflector$lib$system$inflector$$loadUncountable(rules, uncountable) {
      for (var i = 0, length = uncountable.length; i < length; i++) {
        rules.uncountable[uncountable[i].toLowerCase()] = true;
      }
    }

    function ember$inflector$lib$system$inflector$$loadIrregular(rules, irregularPairs) {
      var pair;

      for (var i = 0, length = irregularPairs.length; i < length; i++) {
        pair = irregularPairs[i];

        //pluralizing
        rules.irregular[pair[0].toLowerCase()] = pair[1];
        rules.irregular[pair[1].toLowerCase()] = pair[1];

        //singularizing
        rules.irregularInverse[pair[1].toLowerCase()] = pair[0];
        rules.irregularInverse[pair[0].toLowerCase()] = pair[0];
      }
    }

    /**
      Inflector.Ember provides a mechanism for supplying inflection rules for your
      application. Ember includes a default set of inflection rules, and provides an
      API for providing additional rules.

      Examples:

      Creating an inflector with no rules.

      ```js
      var inflector = new Ember.Inflector();
      ```

      Creating an inflector with the default ember ruleset.

      ```js
      var inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

      inflector.pluralize('cow'); //=> 'kine'
      inflector.singularize('kine'); //=> 'cow'
      ```

      Creating an inflector and adding rules later.

      ```javascript
      var inflector = Ember.Inflector.inflector;

      inflector.pluralize('advice'); // => 'advices'
      inflector.uncountable('advice');
      inflector.pluralize('advice'); // => 'advice'

      inflector.pluralize('formula'); // => 'formulas'
      inflector.irregular('formula', 'formulae');
      inflector.pluralize('formula'); // => 'formulae'

      // you would not need to add these as they are the default rules
      inflector.plural(/$/, 's');
      inflector.singular(/s$/i, '');
      ```

      Creating an inflector with a nondefault ruleset.

      ```javascript
      var rules = {
        plurals:  [ /$/, 's' ],
        singular: [ /\s$/, '' ],
        irregularPairs: [
          [ 'cow', 'kine' ]
        ],
        uncountable: [ 'fish' ]
      };

      var inflector = new Ember.Inflector(rules);
      ```

      @class Inflector
      @namespace Ember
    */
    function ember$inflector$lib$system$inflector$$Inflector(ruleSet) {
      ruleSet = ruleSet || {};
      ruleSet.uncountable = ruleSet.uncountable || ember$inflector$lib$system$inflector$$makeDictionary();
      ruleSet.irregularPairs = ruleSet.irregularPairs || ember$inflector$lib$system$inflector$$makeDictionary();

      var rules = this.rules = {
        plurals:  ruleSet.plurals || [],
        singular: ruleSet.singular || [],
        irregular: ember$inflector$lib$system$inflector$$makeDictionary(),
        irregularInverse: ember$inflector$lib$system$inflector$$makeDictionary(),
        uncountable: ember$inflector$lib$system$inflector$$makeDictionary()
      };

      ember$inflector$lib$system$inflector$$loadUncountable(rules, ruleSet.uncountable);
      ember$inflector$lib$system$inflector$$loadIrregular(rules, ruleSet.irregularPairs);

      this.enableCache();
    }

    if (!Object.create && !Object.create(null).hasOwnProperty) {
      throw new Error("This browser does not support Object.create(null), please polyfil with es5-sham: http://git.io/yBU2rg");
    }

    function ember$inflector$lib$system$inflector$$makeDictionary() {
      var cache = Object.create(null);
      cache['_dict'] = null;
      delete cache['_dict'];
      return cache;
    }

    ember$inflector$lib$system$inflector$$Inflector.prototype = {
      /**
        @public

        As inflections can be costly, and commonly the same subset of words are repeatedly
        inflected an optional cache is provided.

        @method enableCache
      */
      enableCache: function() {
        this.purgeCache();

        this.singularize = function(word) {
          this._cacheUsed = true;
          return this._sCache[word] || (this._sCache[word] = this._singularize(word));
        };

        this.pluralize = function(word) {
          this._cacheUsed = true;
          return this._pCache[word] || (this._pCache[word] = this._pluralize(word));
        };
      },

      /**
        @public

        @method purgedCache
      */
      purgeCache: function() {
        this._cacheUsed = false;
        this._sCache = ember$inflector$lib$system$inflector$$makeDictionary();
        this._pCache = ember$inflector$lib$system$inflector$$makeDictionary();
      },

      /**
        @public
        disable caching

        @method disableCache;
      */
      disableCache: function() {
        this._sCache = null;
        this._pCache = null;
        this.singularize = function(word) {
          return this._singularize(word);
        };

        this.pluralize = function(word) {
          return this._pluralize(word);
        };
      },

      /**
        @method plural
        @param {RegExp} regex
        @param {String} string
      */
      plural: function(regex, string) {
        if (this._cacheUsed) { this.purgeCache(); }
        this.rules.plurals.push([regex, string.toLowerCase()]);
      },

      /**
        @method singular
        @param {RegExp} regex
        @param {String} string
      */
      singular: function(regex, string) {
        if (this._cacheUsed) { this.purgeCache(); }
        this.rules.singular.push([regex, string.toLowerCase()]);
      },

      /**
        @method uncountable
        @param {String} regex
      */
      uncountable: function(string) {
        if (this._cacheUsed) { this.purgeCache(); }
        ember$inflector$lib$system$inflector$$loadUncountable(this.rules, [string.toLowerCase()]);
      },

      /**
        @method irregular
        @param {String} singular
        @param {String} plural
      */
      irregular: function (singular, plural) {
        if (this._cacheUsed) { this.purgeCache(); }
        ember$inflector$lib$system$inflector$$loadIrregular(this.rules, [[singular, plural]]);
      },

      /**
        @method pluralize
        @param {String} word
      */
      pluralize: function(word) {
        return this._pluralize(word);
      },

      _pluralize: function(word) {
        return this.inflect(word, this.rules.plurals, this.rules.irregular);
      },
      /**
        @method singularize
        @param {String} word
      */
      singularize: function(word) {
        return this._singularize(word);
      },

      _singularize: function(word) {
        return this.inflect(word, this.rules.singular,  this.rules.irregularInverse);
      },

      /**
        @protected

        @method inflect
        @param {String} word
        @param {Object} typeRules
        @param {Object} irregular
      */
      inflect: function(word, typeRules, irregular) {
        var inflection, substitution, result, lowercase, wordSplit,
          firstPhrase, lastWord, isBlank, isCamelized, isUncountable,
          isIrregular, isIrregularInverse, rule;

        isBlank = ember$inflector$lib$system$inflector$$BLANK_REGEX.test(word);
        isCamelized = ember$inflector$lib$system$inflector$$CAMELIZED_REGEX.test(word);
        firstPhrase = "";

        if (isBlank) {
          return word;
        }

        lowercase = word.toLowerCase();
        wordSplit = ember$inflector$lib$system$inflector$$LAST_WORD_DASHED_REGEX.exec(word) || ember$inflector$lib$system$inflector$$LAST_WORD_CAMELIZED_REGEX.exec(word);
        if (wordSplit){
          firstPhrase = wordSplit[1];
          lastWord = wordSplit[2].toLowerCase();
        }

        isUncountable = this.rules.uncountable[lowercase] || this.rules.uncountable[lastWord];

        if (isUncountable) {
          return word;
        }

        isIrregular = irregular && (irregular[lowercase] || irregular[lastWord]);

        if (isIrregular) {
          if (irregular[lowercase]){
            return isIrregular;
          }
          else {
            isIrregular = (isCamelized) ? ember$inflector$lib$system$inflector$$capitalize(isIrregular) : isIrregular;
            return firstPhrase + isIrregular;
          }
        }

        for (var i = typeRules.length, min = 0; i > min; i--) {
           inflection = typeRules[i-1];
           rule = inflection[0];

          if (rule.test(word)) {
            break;
          }
        }

        inflection = inflection || [];

        rule = inflection[0];
        substitution = inflection[1];

        result = word.replace(rule, substitution);

        return result;
      }
    };

    var ember$inflector$lib$system$inflector$$default = ember$inflector$lib$system$inflector$$Inflector;

    function ember$inflector$lib$system$string$$pluralize(word) {
      return ember$inflector$lib$system$inflector$$default.inflector.pluralize(word);
    }

    function ember$inflector$lib$system$string$$singularize(word) {
      return ember$inflector$lib$system$inflector$$default.inflector.singularize(word);
    }

    var ember$inflector$lib$system$inflections$$default = {
      plurals: [
        [/$/, 's'],
        [/s$/i, 's'],
        [/^(ax|test)is$/i, '$1es'],
        [/(octop|vir)us$/i, '$1i'],
        [/(octop|vir)i$/i, '$1i'],
        [/(alias|status)$/i, '$1es'],
        [/(bu)s$/i, '$1ses'],
        [/(buffal|tomat)o$/i, '$1oes'],
        [/([ti])um$/i, '$1a'],
        [/([ti])a$/i, '$1a'],
        [/sis$/i, 'ses'],
        [/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
        [/(hive)$/i, '$1s'],
        [/([^aeiouy]|qu)y$/i, '$1ies'],
        [/(x|ch|ss|sh)$/i, '$1es'],
        [/(matr|vert|ind)(?:ix|ex)$/i, '$1ices'],
        [/^(m|l)ouse$/i, '$1ice'],
        [/^(m|l)ice$/i, '$1ice'],
        [/^(ox)$/i, '$1en'],
        [/^(oxen)$/i, '$1'],
        [/(quiz)$/i, '$1zes']
      ],

      singular: [
        [/s$/i, ''],
        [/(ss)$/i, '$1'],
        [/(n)ews$/i, '$1ews'],
        [/([ti])a$/i, '$1um'],
        [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i, '$1sis'],
        [/(^analy)(sis|ses)$/i, '$1sis'],
        [/([^f])ves$/i, '$1fe'],
        [/(hive)s$/i, '$1'],
        [/(tive)s$/i, '$1'],
        [/([lr])ves$/i, '$1f'],
        [/([^aeiouy]|qu)ies$/i, '$1y'],
        [/(s)eries$/i, '$1eries'],
        [/(m)ovies$/i, '$1ovie'],
        [/(x|ch|ss|sh)es$/i, '$1'],
        [/^(m|l)ice$/i, '$1ouse'],
        [/(bus)(es)?$/i, '$1'],
        [/(o)es$/i, '$1'],
        [/(shoe)s$/i, '$1'],
        [/(cris|test)(is|es)$/i, '$1is'],
        [/^(a)x[ie]s$/i, '$1xis'],
        [/(octop|vir)(us|i)$/i, '$1us'],
        [/(alias|status)(es)?$/i, '$1'],
        [/^(ox)en/i, '$1'],
        [/(vert|ind)ices$/i, '$1ex'],
        [/(matr)ices$/i, '$1ix'],
        [/(quiz)zes$/i, '$1'],
        [/(database)s$/i, '$1']
      ],

      irregularPairs: [
        ['person', 'people'],
        ['man', 'men'],
        ['child', 'children'],
        ['sex', 'sexes'],
        ['move', 'moves'],
        ['cow', 'kine'],
        ['zombie', 'zombies']
      ],

      uncountable: [
        'equipment',
        'information',
        'rice',
        'money',
        'species',
        'series',
        'fish',
        'sheep',
        'jeans',
        'police'
      ]
    };

    ember$inflector$lib$system$inflector$$default.inflector = new ember$inflector$lib$system$inflector$$default(ember$inflector$lib$system$inflections$$default);

    /**
     *
     * If you have Ember Inflector (such as if Ember Data is present),
     * singularize a word. For example, turn "oxen" into "ox".
     *
     * Example:
     *
     * {{singularize myProperty}}
     * {{singularize "oxen"}}
     *
     * @for Ember.Handlebars.helpers
     * @method singularize
     * @param {String|Property} word word to singularize
    */
    Ember.Handlebars.helper('singularize', ember$inflector$lib$system$string$$singularize);

    /**
     *
     * If you have Ember Inflector (such as if Ember Data is present),
     * pluralize a word. For example, turn "ox" into "oxen".
     *
     * Example:
     *
     * {{pluralize count myProperty}}
     * {{pluralize 1 "oxen"}}
     * {{pluralize myProperty}}
     * {{pluralize "ox"}}
     *
     * @for Ember.Handlebars.helpers
     * @method pluralize
     * @param {Number|Property} [count] count of objects
     * @param {String|Property} word word to pluralize
    */
    Ember.Handlebars.helper('pluralize', function(count, word, options) {
      if(arguments.length < 3) {
        return ember$inflector$lib$system$string$$pluralize(count);
      } else {
        /* jshint eqeqeq: false */
        if(count != 1) {
          /* jshint eqeqeq: true */
          word = ember$inflector$lib$system$string$$pluralize(word);
        }
        return count + " " + word;
      }
    });

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.String) {
      /**
        See {{#crossLink "Ember.String/pluralize"}}{{/crossLink}}

        @method pluralize
        @for String
      */
      String.prototype.pluralize = function() {
        return ember$inflector$lib$system$string$$pluralize(this);
      };

      /**
        See {{#crossLink "Ember.String/singularize"}}{{/crossLink}}

        @method singularize
        @for String
      */
      String.prototype.singularize = function() {
        return ember$inflector$lib$system$string$$singularize(this);
      };
    }

    ember$inflector$lib$system$inflector$$default.defaultRules = ember$inflector$lib$system$inflections$$default;
    Ember.Inflector        = ember$inflector$lib$system$inflector$$default;

    Ember.String.pluralize   = ember$inflector$lib$system$string$$pluralize;
    Ember.String.singularize = ember$inflector$lib$system$string$$singularize;

    var ember$inflector$lib$main$$default = ember$inflector$lib$system$inflector$$default;

    /**
      @module ember-data
    */

    var activemodel$adapter$lib$system$active_model_adapter$$decamelize = Ember.String.decamelize;
    var activemodel$adapter$lib$system$active_model_adapter$$underscore = Ember.String.underscore;

    /**
      The ActiveModelAdapter is a subclass of the RESTAdapter designed to integrate
      with a JSON API that uses an underscored naming convention instead of camelCasing.
      It has been designed to work out of the box with the
      [active\_model\_serializers](http://github.com/rails-api/active_model_serializers)
      Ruby gem. This Adapter expects specific settings using ActiveModel::Serializers,
      `embed :ids, embed_in_root: true` which sideloads the records.

      This adapter extends the DS.RESTAdapter by making consistent use of the camelization,
      decamelization and pluralization methods to normalize the serialized JSON into a
      format that is compatible with a conventional Rails backend and Ember Data.

      ## JSON Structure

      The ActiveModelAdapter expects the JSON returned from your server to follow
      the REST adapter conventions substituting underscored keys for camelcased ones.

      Unlike the DS.RESTAdapter, async relationship keys must be the singular form
      of the relationship name, followed by "_id" for DS.belongsTo relationships,
      or "_ids" for DS.hasMany relationships.

      ### Conventional Names

      Attribute names in your JSON payload should be the underscored versions of
      the attributes in your Ember.js models.

      For example, if you have a `Person` model:

      ```js
      App.FamousPerson = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.attr('string')
      });
      ```

      The JSON returned should look like this:

      ```js
      {
        "famous_person": {
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation": "President"
        }
      }
      ```

      Let's imagine that `Occupation` is just another model:

      ```js
      App.Person = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.belongsTo('occupation')
      });

      App.Occupation = DS.Model.extend({
        name: DS.attr('string'),
        salary: DS.attr('number'),
        people: DS.hasMany('person')
      });
      ```

      The JSON needed to avoid extra server calls, should look like this:

      ```js
      {
        "people": [{
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation_id": 1
        }],

        "occupations": [{
          "id": 1,
          "name": "President",
          "salary": 100000,
          "person_ids": [1]
        }]
      }
      ```

      @class ActiveModelAdapter
      @constructor
      @namespace DS
      @extends DS.RESTAdapter
    **/

    var activemodel$adapter$lib$system$active_model_adapter$$ActiveModelAdapter = ember$data$lib$adapters$rest_adapter$$default.extend({
      defaultSerializer: '-active-model',
      /**
        The ActiveModelAdapter overrides the `pathForType` method to build
        underscored URLs by decamelizing and pluralizing the object type name.

        ```js
          this.pathForType("famousPerson");
          //=> "famous_people"
        ```

        @method pathForType
        @param {String} type
        @return String
      */
      pathForType: function(type) {
        var decamelized = activemodel$adapter$lib$system$active_model_adapter$$decamelize(type);
        var underscored = activemodel$adapter$lib$system$active_model_adapter$$underscore(decamelized);
        return ember$inflector$lib$system$string$$pluralize(underscored);
      },

      /**
        The ActiveModelAdapter overrides the `ajaxError` method
        to return a DS.InvalidError for all 422 Unprocessable Entity
        responses.

        A 422 HTTP response from the server generally implies that the request
        was well formed but the API was unable to process it because the
        content was not semantically correct or meaningful per the API.

        For more information on 422 HTTP Error code see 11.2 WebDAV RFC 4918
        https://tools.ietf.org/html/rfc4918#section-11.2

        @method ajaxError
        @param {Object} jqXHR
        @return error
      */
      ajaxError: function(jqXHR) {
        var error = this._super.apply(this, arguments);

        if (jqXHR && jqXHR.status === 422) {
          return new ember$data$lib$system$adapter$$InvalidError(Ember.$.parseJSON(jqXHR.responseText));
        } else {
          return error;
        }
      }
    });

    var activemodel$adapter$lib$system$active_model_adapter$$default = activemodel$adapter$lib$system$active_model_adapter$$ActiveModelAdapter;
    /**
      @module ember-data
    */

    /**
      `DS.Serializer` is an abstract base class that you should override in your
      application to customize it for your backend. The minimum set of methods
      that you should implement is:

        * `extract()`
        * `serialize()`

      And you can optionally override the following methods:

        * `normalize()`

      For an example implementation, see
      [DS.JSONSerializer](DS.JSONSerializer.html), the included JSON serializer.

      @class Serializer
      @namespace DS
      @extends Ember.Object
    */

    var ember$data$lib$system$serializer$$Serializer = Ember.Object.extend({

      /**
        The `extract` method is used to deserialize the payload received from your
        data source into the form that Ember Data expects.

        @method extract
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String|Number} id
        @param {String} requestType
        @return {Object}
      */
      extract: Ember.required(Function),

      /**
        The `serialize` method is used when a record is saved in order to convert
        the record into the form that your external data source expects.

        `serialize` takes an optional `options` hash with a single option:

        - `includeId`: If this is `true`, `serialize` should include the ID
          in the serialized object it builds.

        @method serialize
        @param {subclass of DS.Model} record
        @param {Object} [options]
        @return {Object}
      */
      serialize: Ember.required(Function),

      /**
        The `normalize` method is used to convert a payload received from your
        external data source into the normalized form `store.push()` expects. You
        should override this method, munge the hash and return the normalized
        payload.

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @return {Object}
      */
      normalize: function(type, hash) {
        return hash;
      }

    });

    var ember$data$lib$system$serializer$$default = ember$data$lib$system$serializer$$Serializer;

    var ember$data$lib$serializers$json_serializer$$get = Ember.get;
    var ember$data$lib$serializers$json_serializer$$isNone = Ember.isNone;
    var ember$data$lib$serializers$json_serializer$$map = Ember.ArrayPolyfills.map;
    var ember$data$lib$serializers$json_serializer$$merge = Ember.merge;

    var ember$data$lib$serializers$json_serializer$$default = ember$data$lib$system$serializer$$default.extend({
      /**
        The primaryKey is used when serializing and deserializing
        data. Ember Data always uses the `id` property to store the id of
        the record. The external source may not always follow this
        convention. In these cases it is useful to override the
        primaryKey property to match the primaryKey of your external
        store.

        Example

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          primaryKey: '_id'
        });
        ```

        @property primaryKey
        @type {String}
        @default 'id'
      */
      primaryKey: 'id',

      /**
        The `attrs` object can be used to declare a simple mapping between
        property names on `DS.Model` records and payload keys in the
        serialized JSON object representing the record. An object with the
        property `key` can also be used to designate the attribute's key on
        the response payload.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: DS.attr('string'),
          lastName: DS.attr('string'),
          occupation: DS.attr('string'),
          admin: DS.attr('boolean')
        });

        App.PersonSerializer = DS.JSONSerializer.extend({
          attrs: {
            admin: 'is_admin',
            occupation: {key: 'career'}
          }
        });
        ```

        You can also remove attributes by setting the `serialize` key to
        false in your mapping object.

        Example

        ```javascript
        App.PersonSerializer = DS.JSONSerializer.extend({
          attrs: {
            admin: {serialize: false},
            occupation: {key: 'career'}
          }
        });
        ```

        When serialized:

        ```javascript
        {
          "career": "magician"
        }
        ```

        Note that the `admin` is now not included in the payload.

        @property attrs
        @type {Object}
      */

      /**
       Given a subclass of `DS.Model` and a JSON object this method will
       iterate through each attribute of the `DS.Model` and invoke the
       `DS.Transform#deserialize` method on the matching property of the
       JSON object.  This method is typically called after the
       serializer's `normalize` method.

       @method applyTransforms
       @private
       @param {subclass of DS.Model} type
       @param {Object} data The data to transform
       @return {Object} data The transformed data object
      */
      applyTransforms: function(type, data) {
        type.eachTransformedAttribute(function applyTransform(key, type) {
          if (!data.hasOwnProperty(key)) { return; }

          var transform = this.transformFor(type);
          data[key] = transform.deserialize(data[key]);
        }, this);

        return data;
      },

      /**
        Normalizes a part of the JSON payload returned by
        the server. You should override this method, munge the hash
        and call super if you have generic normalization to do.

        It takes the type of the record that is being normalized
        (as a DS.Model class), the property where the hash was
        originally found, and the hash to normalize.

        You can use this method, for example, to normalize underscored keys to camelized
        or other general-purpose normalizations.

        Example

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          normalize: function(type, hash) {
            var fields = Ember.get(type, 'fields');
            fields.forEach(function(field) {
              var payloadField = Ember.String.underscore(field);
              if (field === payloadField) { return; }

              hash[field] = hash[payloadField];
              delete hash[payloadField];
            });
            return this._super.apply(this, arguments);
          }
        });
        ```

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @return {Object}
      */
      normalize: function(type, hash) {
        if (!hash) { return hash; }

        this.normalizeId(hash);
        this.normalizeAttributes(type, hash);
        this.normalizeRelationships(type, hash);

        this.normalizeUsingDeclaredMapping(type, hash);
        this.applyTransforms(type, hash);
        return hash;
      },

      /**
        You can use this method to normalize all payloads, regardless of whether they
        represent single records or an array.

        For example, you might want to remove some extraneous data from the payload:

        ```js
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          normalizePayload: function(payload) {
            delete payload.version;
            delete payload.status;
            return payload;
          }
        });
        ```

        @method normalizePayload
        @param {Object} payload
        @return {Object} the normalized payload
      */
      normalizePayload: function(payload) {
        return payload;
      },

      /**
        @method normalizeAttributes
        @private
      */
      normalizeAttributes: function(type, hash) {
        var payloadKey;

        if (this.keyForAttribute) {
          type.eachAttribute(function(key) {
            payloadKey = this.keyForAttribute(key);
            if (key === payloadKey) { return; }
            if (!hash.hasOwnProperty(payloadKey)) { return; }

            hash[key] = hash[payloadKey];
            delete hash[payloadKey];
          }, this);
        }
      },

      /**
        @method normalizeRelationships
        @private
      */
      normalizeRelationships: function(type, hash) {
        var payloadKey;

        if (this.keyForRelationship) {
          type.eachRelationship(function(key, relationship) {
            payloadKey = this.keyForRelationship(key, relationship.kind);
            if (key === payloadKey) { return; }
            if (!hash.hasOwnProperty(payloadKey)) { return; }

            hash[key] = hash[payloadKey];
            delete hash[payloadKey];
          }, this);
        }
      },

      /**
        @method normalizeUsingDeclaredMapping
        @private
      */
      normalizeUsingDeclaredMapping: function(type, hash) {
        var attrs = ember$data$lib$serializers$json_serializer$$get(this, 'attrs');
        var payloadKey, key;

        if (attrs) {
          for (key in attrs) {
            payloadKey = this._getMappedKey(key);
            if (!hash.hasOwnProperty(payloadKey)) { continue; }

            if (payloadKey !== key) {
              hash[key] = hash[payloadKey];
              delete hash[payloadKey];
            }
          }
        }
      },

      /**
        @method normalizeId
        @private
      */
      normalizeId: function(hash) {
        var primaryKey = ember$data$lib$serializers$json_serializer$$get(this, 'primaryKey');

        if (primaryKey === 'id') { return; }

        hash.id = hash[primaryKey];
        delete hash[primaryKey];
      },

      /**
        @method normalizeErrors
        @private
      */
      normalizeErrors: function(type, hash) {
        this.normalizeId(hash);
        this.normalizeAttributes(type, hash);
        this.normalizeRelationships(type, hash);
      },

      /**
        Looks up the property key that was set by the custom `attr` mapping
        passed to the serializer.

        @method _getMappedKey
        @private
        @param {String} key
        @return {String} key
      */
      _getMappedKey: function(key) {
        var attrs = ember$data$lib$serializers$json_serializer$$get(this, 'attrs');
        var mappedKey;
        if (attrs && attrs[key]) {
          mappedKey = attrs[key];
          //We need to account for both the {title: 'post_title'} and
          //{title: {key: 'post_title'}} forms
          if (mappedKey.key) {
            mappedKey = mappedKey.key;
          }
          if (typeof mappedKey === 'string') {
            key = mappedKey;
          }
        }

        return key;
      },

      /**
        Check attrs.key.serialize property to inform if the `key`
        can be serialized

        @method _canSerialize
        @private
        @param {String} key
        @return {boolean} true if the key can be serialized
      */
      _canSerialize: function(key) {
        var attrs = ember$data$lib$serializers$json_serializer$$get(this, 'attrs');

        return !attrs || !attrs[key] || attrs[key].serialize !== false;
      },

      // SERIALIZE
      /**
        Called when a record is saved in order to convert the
        record into JSON.

        By default, it creates a JSON object with a key for
        each attribute and belongsTo relationship.

        For example, consider this model:

        ```javascript
        App.Comment = DS.Model.extend({
          title: DS.attr(),
          body: DS.attr(),

          author: DS.belongsTo('user')
        });
        ```

        The default serialization would create a JSON object like:

        ```javascript
        {
          "title": "Rails is unagi",
          "body": "Rails? Omakase? O_O",
          "author": 12
        }
        ```

        By default, attributes are passed through as-is, unless
        you specified an attribute type (`DS.attr('date')`). If
        you specify a transform, the JavaScript value will be
        serialized when inserted into the JSON hash.

        By default, belongs-to relationships are converted into
        IDs when inserted into the JSON hash.

        ## IDs

        `serialize` takes an options hash with a single option:
        `includeId`. If this option is `true`, `serialize` will,
        by default include the ID in the JSON object it builds.

        The adapter passes in `includeId: true` when serializing
        a record for `createRecord`, but not for `updateRecord`.

        ## Customization

        Your server may expect a different JSON format than the
        built-in serialization format.

        In that case, you can implement `serialize` yourself and
        return a JSON hash of your choosing.

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          serialize: function(snapshot, options) {
            var json = {
              POST_TTL: snapshot.attr('title'),
              POST_BDY: snapshot.attr('body'),
              POST_CMS: snapshot.hasMany('comments', { ids: true })
            }

            if (options.includeId) {
              json.POST_ID_ = snapshot.id;
            }

            return json;
          }
        });
        ```

        ## Customizing an App-Wide Serializer

        If you want to define a serializer for your entire
        application, you'll probably want to use `eachAttribute`
        and `eachRelationship` on the record.

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          serialize: function(snapshot, options) {
            var json = {};

            snapshot.eachAttribute(function(name) {
              json[serverAttributeName(name)] = snapshot.attr(name);
            })

            snapshot.eachRelationship(function(name, relationship) {
              if (relationship.kind === 'hasMany') {
                json[serverHasManyName(name)] = snapshot.hasMany(name, { ids: true });
              }
            });

            if (options.includeId) {
              json.ID_ = snapshot.id;
            }

            return json;
          }
        });

        function serverAttributeName(attribute) {
          return attribute.underscore().toUpperCase();
        }

        function serverHasManyName(name) {
          return serverAttributeName(name.singularize()) + "_IDS";
        }
        ```

        This serializer will generate JSON that looks like this:

        ```javascript
        {
          "TITLE": "Rails is omakase",
          "BODY": "Yep. Omakase.",
          "COMMENT_IDS": [ 1, 2, 3 ]
        }
        ```

        ## Tweaking the Default JSON

        If you just want to do some small tweaks on the default JSON,
        you can call super first and make the tweaks on the returned
        JSON.

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          serialize: function(snapshot, options) {
            var json = this._super.apply(this, arguments);

            json.subject = json.title;
            delete json.title;

            return json;
          }
        });
        ```

        @method serialize
        @param {DS.Snapshot} snapshot
        @param {Object} options
        @return {Object} json
      */
      serialize: function(snapshot, options) {
        var json = {};

        if (options && options.includeId) {
          var id = snapshot.id;

          if (id) {
            json[ember$data$lib$serializers$json_serializer$$get(this, 'primaryKey')] = id;
          }
        }

        snapshot.eachAttribute(function(key, attribute) {
          this.serializeAttribute(snapshot, json, key, attribute);
        }, this);

        snapshot.eachRelationship(function(key, relationship) {
          if (relationship.kind === 'belongsTo') {
            this.serializeBelongsTo(snapshot, json, relationship);
          } else if (relationship.kind === 'hasMany') {
            this.serializeHasMany(snapshot, json, relationship);
          }
        }, this);

        return json;
      },

      /**
        You can use this method to customize how a serialized record is added to the complete
        JSON hash to be sent to the server. By default the JSON Serializer does not namespace
        the payload and just sends the raw serialized JSON object.
        If your server expects namespaced keys, you should consider using the RESTSerializer.
        Otherwise you can override this method to customize how the record is added to the hash.

        For example, your server may expect underscored root objects.

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          serializeIntoHash: function(data, type, snapshot, options) {
            var root = Ember.String.decamelize(type.typeKey);
            data[root] = this.serialize(snapshot, options);
          }
        });
        ```

        @method serializeIntoHash
        @param {Object} hash
        @param {subclass of DS.Model} type
        @param {DS.Snapshot} snapshot
        @param {Object} options
      */
      serializeIntoHash: function(hash, type, snapshot, options) {
        ember$data$lib$serializers$json_serializer$$merge(hash, this.serialize(snapshot, options));
      },

      /**
       `serializeAttribute` can be used to customize how `DS.attr`
       properties are serialized

       For example if you wanted to ensure all your attributes were always
       serialized as properties on an `attributes` object you could
       write:

       ```javascript
       App.ApplicationSerializer = DS.JSONSerializer.extend({
         serializeAttribute: function(snapshot, json, key, attributes) {
           json.attributes = json.attributes || {};
           this._super(snapshot, json.attributes, key, attributes);
         }
       });
       ```

       @method serializeAttribute
       @param {DS.Snapshot} snapshot
       @param {Object} json
       @param {String} key
       @param {Object} attribute
      */
      serializeAttribute: function(snapshot, json, key, attribute) {
        var type = attribute.type;

        if (this._canSerialize(key)) {
          var value = snapshot.attr(key);
          if (type) {
            var transform = this.transformFor(type);
            value = transform.serialize(value);
          }

          // if provided, use the mapping provided by `attrs` in
          // the serializer
          var payloadKey =  this._getMappedKey(key);

          if (payloadKey === key && this.keyForAttribute) {
            payloadKey = this.keyForAttribute(key);
          }

          json[payloadKey] = value;
        }
      },

      /**
       `serializeBelongsTo` can be used to customize how `DS.belongsTo`
       properties are serialized.

       Example

       ```javascript
       App.PostSerializer = DS.JSONSerializer.extend({
         serializeBelongsTo: function(snapshot, json, relationship) {
           var key = relationship.key;

           var belongsTo = snapshot.belongsTo(key);

           key = this.keyForRelationship ? this.keyForRelationship(key, "belongsTo") : key;

           json[key] = Ember.isNone(belongsTo) ? belongsTo : belongsTo.record.toJSON();
         }
       });
       ```

       @method serializeBelongsTo
       @param {DS.Snapshot} snapshot
       @param {Object} json
       @param {Object} relationship
      */
      serializeBelongsTo: function(snapshot, json, relationship) {
        var key = relationship.key;

        if (this._canSerialize(key)) {
          var belongsToId = snapshot.belongsTo(key, { id: true });

          // if provided, use the mapping provided by `attrs` in
          // the serializer
          var payloadKey = this._getMappedKey(key);
          if (payloadKey === key && this.keyForRelationship) {
            payloadKey = this.keyForRelationship(key, "belongsTo");
          }

          //Need to check whether the id is there for new&async records
          if (ember$data$lib$serializers$json_serializer$$isNone(belongsToId)) {
            json[payloadKey] = null;
          } else {
            json[payloadKey] = belongsToId;
          }

          if (relationship.options.polymorphic) {
            this.serializePolymorphicType(snapshot, json, relationship);
          }
        }
      },

      /**
       `serializeHasMany` can be used to customize how `DS.hasMany`
       properties are serialized.

       Example

       ```javascript
       App.PostSerializer = DS.JSONSerializer.extend({
         serializeHasMany: function(snapshot, json, relationship) {
           var key = relationship.key;
           if (key === 'comments') {
             return;
           } else {
             this._super.apply(this, arguments);
           }
         }
       });
       ```

       @method serializeHasMany
       @param {DS.Snapshot} snapshot
       @param {Object} json
       @param {Object} relationship
      */
      serializeHasMany: function(snapshot, json, relationship) {
        var key = relationship.key;

        if (this._canSerialize(key)) {
          var payloadKey;

          // if provided, use the mapping provided by `attrs` in
          // the serializer
          payloadKey = this._getMappedKey(key);
          if (payloadKey === key && this.keyForRelationship) {
            payloadKey = this.keyForRelationship(key, "hasMany");
          }

          var relationshipType = snapshot.type.determineRelationshipType(relationship);

          if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
            json[payloadKey] = snapshot.hasMany(key, { ids: true });
            // TODO support for polymorphic manyToNone and manyToMany relationships
          }
        }
      },

      /**
        You can use this method to customize how polymorphic objects are
        serialized. Objects are considered to be polymorphic if
        `{polymorphic: true}` is pass as the second argument to the
        `DS.belongsTo` function.

        Example

        ```javascript
        App.CommentSerializer = DS.JSONSerializer.extend({
          serializePolymorphicType: function(snapshot, json, relationship) {
            var key = relationship.key,
                belongsTo = snapshot.belongsTo(key);
            key = this.keyForAttribute ? this.keyForAttribute(key) : key;

            if (Ember.isNone(belongsTo)) {
              json[key + "_type"] = null;
            } else {
              json[key + "_type"] = belongsTo.typeKey;
            }
          }
        });
       ```

        @method serializePolymorphicType
        @param {DS.Snapshot} snapshot
        @param {Object} json
        @param {Object} relationship
      */
      serializePolymorphicType: Ember.K,

      // EXTRACT

      /**
        The `extract` method is used to deserialize payload data from the
        server. By default the `JSONSerializer` does not push the records
        into the store. However records that subclass `JSONSerializer`
        such as the `RESTSerializer` may push records into the store as
        part of the extract call.

        This method delegates to a more specific extract method based on
        the `requestType`.

        To override this method with a custom one, make sure to call
        `this._super(store, type, payload, id, requestType)` with your
        pre-processed data.

        Here's an example of using `extract` manually:

        ```javascript
        socket.on('message', function(message) {
          var data = message.data;
          var type = store.modelFor(message.modelName);
          var serializer = store.serializerFor(type.typeKey);
          var record = serializer.extract(store, type, data, data.id, 'single');

          store.push(message.modelName, record);
        });
        ```

        @method extract
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extract: function(store, type, payload, id, requestType) {
        this.extractMeta(store, type, payload);

        var specificExtract = "extract" + requestType.charAt(0).toUpperCase() + requestType.substr(1);
        return this[specificExtract](store, type, payload, id, requestType);
      },

      /**
        `extractFindAll` is a hook into the extract method used when a
        call is made to `DS.Store#findAll`. By default this method is an
        alias for [extractArray](#method_extractArray).

        @method extractFindAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindAll: function(store, type, payload, id, requestType) {
        return this.extractArray(store, type, payload, id, requestType);
      },
      /**
        `extractFindQuery` is a hook into the extract method used when a
        call is made to `DS.Store#findQuery`. By default this method is an
        alias for [extractArray](#method_extractArray).

        @method extractFindQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindQuery: function(store, type, payload, id, requestType) {
        return this.extractArray(store, type, payload, id, requestType);
      },
      /**
        `extractFindMany` is a hook into the extract method used when a
        call is made to `DS.Store#findMany`. By default this method is
        alias for [extractArray](#method_extractArray).

        @method extractFindMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindMany: function(store, type, payload, id, requestType) {
        return this.extractArray(store, type, payload, id, requestType);
      },
      /**
        `extractFindHasMany` is a hook into the extract method used when a
        call is made to `DS.Store#findHasMany`. By default this method is
        alias for [extractArray](#method_extractArray).

        @method extractFindHasMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindHasMany: function(store, type, payload, id, requestType) {
        return this.extractArray(store, type, payload, id, requestType);
      },

      /**
        `extractCreateRecord` is a hook into the extract method used when a
        call is made to `DS.Model#save` and the record is new. By default
        this method is alias for [extractSave](#method_extractSave).

        @method extractCreateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractCreateRecord: function(store, type, payload, id, requestType) {
        return this.extractSave(store, type, payload, id, requestType);
      },
      /**
        `extractUpdateRecord` is a hook into the extract method used when
        a call is made to `DS.Model#save` and the record has been updated.
        By default this method is alias for [extractSave](#method_extractSave).

        @method extractUpdateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractUpdateRecord: function(store, type, payload, id, requestType) {
        return this.extractSave(store, type, payload, id, requestType);
      },
      /**
        `extractDeleteRecord` is a hook into the extract method used when
        a call is made to `DS.Model#save` and the record has been deleted.
        By default this method is alias for [extractSave](#method_extractSave).

        @method extractDeleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractDeleteRecord: function(store, type, payload, id, requestType) {
        return this.extractSave(store, type, payload, id, requestType);
      },

      /**
        `extractFind` is a hook into the extract method used when
        a call is made to `DS.Store#find`. By default this method is
        alias for [extractSingle](#method_extractSingle).

        @method extractFind
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractFind: function(store, type, payload, id, requestType) {
        return this.extractSingle(store, type, payload, id, requestType);
      },
      /**
        `extractFindBelongsTo` is a hook into the extract method used when
        a call is made to `DS.Store#findBelongsTo`. By default this method is
        alias for [extractSingle](#method_extractSingle).

        @method extractFindBelongsTo
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractFindBelongsTo: function(store, type, payload, id, requestType) {
        return this.extractSingle(store, type, payload, id, requestType);
      },
      /**
        `extractSave` is a hook into the extract method used when a call
        is made to `DS.Model#save`. By default this method is alias
        for [extractSingle](#method_extractSingle).

        @method extractSave
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractSave: function(store, type, payload, id, requestType) {
        return this.extractSingle(store, type, payload, id, requestType);
      },

      /**
        `extractSingle` is used to deserialize a single record returned
        from the adapter.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractSingle: function(store, type, payload) {
            payload.comments = payload._embedded.comment;
            delete payload._embedded;

            return this._super(store, type, payload);
          },
        });
        ```

        @method extractSingle
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractSingle: function(store, type, payload, id, requestType) {
        payload = this.normalizePayload(payload);
        return this.normalize(type, payload);
      },

      /**
        `extractArray` is used to deserialize an array of records
        returned from the adapter.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractArray: function(store, type, payload) {
            return payload.map(function(json) {
              return this.extractSingle(store, type, json);
            }, this);
          }
        });
        ```

        @method extractArray
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractArray: function(store, type, arrayPayload, id, requestType) {
        var normalizedPayload = this.normalizePayload(arrayPayload);
        var serializer = this;

        return ember$data$lib$serializers$json_serializer$$map.call(normalizedPayload, function(singlePayload) {
          return serializer.normalize(type, singlePayload);
        });
      },

      /**
        `extractMeta` is used to deserialize any meta information in the
        adapter payload. By default Ember Data expects meta information to
        be located on the `meta` property of the payload object.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractMeta: function(store, type, payload) {
            if (payload && payload._pagination) {
              store.setMetadataFor(type, payload._pagination);
              delete payload._pagination;
            }
          }
        });
        ```

        @method extractMeta
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
      */
      extractMeta: function(store, type, payload) {
        if (payload && payload.meta) {
          store.setMetadataFor(type, payload.meta);
          delete payload.meta;
        }
      },

      /**
        `extractErrors` is used to extract model errors when a call is made
        to `DS.Model#save` which fails with an `InvalidError`. By default
        Ember Data expects error information to be located on the `errors`
        property of the payload object.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractErrors: function(store, type, payload, id) {
            if (payload && typeof payload === 'object' && payload._problems) {
              payload = payload._problems;
              this.normalizeErrors(type, payload);
            }
            return payload;
          }
        });
        ```

        @method extractErrors
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @return {Object} json The deserialized errors
      */
      extractErrors: function(store, type, payload, id) {
        if (payload && typeof payload === 'object' && payload.errors) {
          payload = payload.errors;
          this.normalizeErrors(type, payload);
        }
        return payload;
      },

      /**
       `keyForAttribute` can be used to define rules for how to convert an
       attribute name in your model to a key in your JSON.

       Example

       ```javascript
       App.ApplicationSerializer = DS.RESTSerializer.extend({
         keyForAttribute: function(attr) {
           return Ember.String.underscore(attr).toUpperCase();
         }
       });
       ```

       @method keyForAttribute
       @param {String} key
       @return {String} normalized key
      */
      keyForAttribute: function(key) {
        return key;
      },

      /**
       `keyForRelationship` can be used to define a custom key when
       serializing relationship properties. By default `JSONSerializer`
       does not provide an implementation of this method.

       Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          keyForRelationship: function(key, relationship) {
             return 'rel_' + Ember.String.underscore(key);
          }
        });
        ```

       @method keyForRelationship
       @param {String} key
       @param {String} relationship type
       @return {String} normalized key
      */

      keyForRelationship: function(key, type) {
        return key;
      },

      // HELPERS

      /**
       @method transformFor
       @private
       @param {String} attributeType
       @param {Boolean} skipAssertion
       @return {DS.Transform} transform
      */
      transformFor: function(attributeType, skipAssertion) {
        var transform = this.container.lookup('transform:' + attributeType);
        Ember.assert("Unable to find transform for '" + attributeType + "'", skipAssertion || !!transform);
        return transform;
      }
    });

    var ember$data$lib$serializers$rest_serializer$$forEach = Ember.ArrayPolyfills.forEach;
    var ember$data$lib$serializers$rest_serializer$$map = Ember.ArrayPolyfills.map;
    var ember$data$lib$serializers$rest_serializer$$camelize = Ember.String.camelize;

    function ember$data$lib$serializers$rest_serializer$$coerceId(id) {
      return id == null ? null : id + '';
    }

    /**
      Normally, applications will use the `RESTSerializer` by implementing
      the `normalize` method and individual normalizations under
      `normalizeHash`.

      This allows you to do whatever kind of munging you need, and is
      especially useful if your server is inconsistent and you need to
      do munging differently for many different kinds of responses.

      See the `normalize` documentation for more information.

      ## Across the Board Normalization

      There are also a number of hooks that you might find useful to define
      across-the-board rules for your payload. These rules will be useful
      if your server is consistent, or if you're building an adapter for
      an infrastructure service, like Parse, and want to encode service
      conventions.

      For example, if all of your keys are underscored and all-caps, but
      otherwise consistent with the names you use in your models, you
      can implement across-the-board rules for how to convert an attribute
      name in your model to a key in your JSON.

      ```js
      App.ApplicationSerializer = DS.RESTSerializer.extend({
        keyForAttribute: function(attr) {
          return Ember.String.underscore(attr).toUpperCase();
        }
      });
      ```

      You can also implement `keyForRelationship`, which takes the name
      of the relationship as the first parameter, and the kind of
      relationship (`hasMany` or `belongsTo`) as the second parameter.

      @class RESTSerializer
      @namespace DS
      @extends DS.JSONSerializer
    */
    var ember$data$lib$serializers$rest_serializer$$RESTSerializer = ember$data$lib$serializers$json_serializer$$default.extend({
      /**
        If you want to do normalizations specific to some part of the payload, you
        can specify those under `normalizeHash`.

        For example, given the following json where the the `IDs` under
        `"comments"` are provided as `_id` instead of `id`.

        ```javascript
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "comments": [ 1, 2 ]
          },
          "comments": [{
            "_id": 1,
            "body": "FIRST"
          }, {
            "_id": 2,
            "body": "Rails is unagi"
          }]
        }
        ```

        You use `normalizeHash` to normalize just the comments:

        ```javascript
        App.PostSerializer = DS.RESTSerializer.extend({
          normalizeHash: {
            comments: function(hash) {
              hash.id = hash._id;
              delete hash._id;
              return hash;
            }
          }
        });
        ```

        The key under `normalizeHash` is usually just the original key
        that was in the original payload. However, key names will be
        impacted by any modifications done in the `normalizePayload`
        method. The `DS.RESTSerializer`'s default implementation makes no
        changes to the payload keys.

        @property normalizeHash
        @type {Object}
        @default undefined
      */

      /**
        Normalizes a part of the JSON payload returned by
        the server. You should override this method, munge the hash
        and call super if you have generic normalization to do.

        It takes the type of the record that is being normalized
        (as a DS.Model class), the property where the hash was
        originally found, and the hash to normalize.

        For example, if you have a payload that looks like this:

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "comments": [ 1, 2 ]
          },
          "comments": [{
            "id": 1,
            "body": "FIRST"
          }, {
            "id": 2,
            "body": "Rails is unagi"
          }]
        }
        ```

        The `normalize` method will be called three times:

        * With `App.Post`, `"posts"` and `{ id: 1, title: "Rails is omakase", ... }`
        * With `App.Comment`, `"comments"` and `{ id: 1, body: "FIRST" }`
        * With `App.Comment`, `"comments"` and `{ id: 2, body: "Rails is unagi" }`

        You can use this method, for example, to normalize underscored keys to camelized
        or other general-purpose normalizations.

        If you want to do normalizations specific to some part of the payload, you
        can specify those under `normalizeHash`.

        For example, if the `IDs` under `"comments"` are provided as `_id` instead of
        `id`, you can specify how to normalize just the comments:

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          normalizeHash: {
            comments: function(hash) {
              hash.id = hash._id;
              delete hash._id;
              return hash;
            }
          }
        });
        ```

        The key under `normalizeHash` is just the original key that was in the original
        payload.

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @param {String} prop
        @return {Object}
      */
      normalize: function(type, hash, prop) {
        this.normalizeId(hash);
        this.normalizeAttributes(type, hash);
        this.normalizeRelationships(type, hash);

        this.normalizeUsingDeclaredMapping(type, hash);

        if (this.normalizeHash && this.normalizeHash[prop]) {
          this.normalizeHash[prop](hash);
        }

        this.applyTransforms(type, hash);
        return hash;
      },


      /**
        Called when the server has returned a payload representing
        a single record, such as in response to a `find` or `save`.

        It is your opportunity to clean up the server's response into the normalized
        form expected by Ember Data.

        If you want, you can just restructure the top-level of your payload, and
        do more fine-grained normalization in the `normalize` method.

        For example, if you have a payload like this in response to a request for
        post 1:

        ```js
        {
          "id": 1,
          "title": "Rails is omakase",

          "_embedded": {
            "comment": [{
              "_id": 1,
              "comment_title": "FIRST"
            }, {
              "_id": 2,
              "comment_title": "Rails is unagi"
            }]
          }
        }
        ```

        You could implement a serializer that looks like this to get your payload
        into shape:

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          // First, restructure the top-level so it's organized by type
          extractSingle: function(store, type, payload, id) {
            var comments = payload._embedded.comment;
            delete payload._embedded;

            payload = { comments: comments, post: payload };
            return this._super(store, type, payload, id);
          },

          normalizeHash: {
            // Next, normalize individual comments, which (after `extract`)
            // are now located under `comments`
            comments: function(hash) {
              hash.id = hash._id;
              hash.title = hash.comment_title;
              delete hash._id;
              delete hash.comment_title;
              return hash;
            }
          }
        })
        ```

        When you call super from your own implementation of `extractSingle`, the
        built-in implementation will find the primary record in your normalized
        payload and push the remaining records into the store.

        The primary record is the single hash found under `post` or the first
        element of the `posts` array.

        The primary record has special meaning when the record is being created
        for the first time or updated (`createRecord` or `updateRecord`). In
        particular, it will update the properties of the record that was saved.

        @method extractSingle
        @param {DS.Store} store
        @param {subclass of DS.Model} primaryType
        @param {Object} payload
        @param {String} recordId
        @return {Object} the primary response to the original request
      */
      extractSingle: function(store, primaryType, rawPayload, recordId) {
        var payload = this.normalizePayload(rawPayload);
        var primaryTypeName = primaryType.typeKey;
        var primaryRecord;

        for (var prop in payload) {
          var typeName  = this.typeForRoot(prop);

          if (!store.modelFactoryFor(typeName)) {
            Ember.warn(this.warnMessageNoModelForKey(prop, typeName), false);
            continue;
          }
          var type = store.modelFor(typeName);
          var isPrimary = type.typeKey === primaryTypeName;
          var value = payload[prop];

          if (value === null) {
            continue;
          }

          // legacy support for singular resources
          if (isPrimary && Ember.typeOf(value) !== "array" ) {
            primaryRecord = this.normalize(primaryType, value, prop);
            continue;
          }

          /*jshint loopfunc:true*/
          ember$data$lib$serializers$rest_serializer$$forEach.call(value, function(hash) {
            var typeName = this.typeForRoot(prop);
            var type = store.modelFor(typeName);
            var typeSerializer = store.serializerFor(type);

            hash = typeSerializer.normalize(type, hash, prop);

            var isFirstCreatedRecord = isPrimary && !recordId && !primaryRecord;
            var isUpdatedRecord = isPrimary && ember$data$lib$serializers$rest_serializer$$coerceId(hash.id) === recordId;

            // find the primary record.
            //
            // It's either:
            // * the record with the same ID as the original request
            // * in the case of a newly created record that didn't have an ID, the first
            //   record in the Array
            if (isFirstCreatedRecord || isUpdatedRecord) {
              primaryRecord = hash;
            } else {
              store.push(typeName, hash);
            }
          }, this);
        }

        return primaryRecord;
      },

      /**
        Called when the server has returned a payload representing
        multiple records, such as in response to a `findAll` or `findQuery`.

        It is your opportunity to clean up the server's response into the normalized
        form expected by Ember Data.

        If you want, you can just restructure the top-level of your payload, and
        do more fine-grained normalization in the `normalize` method.

        For example, if you have a payload like this in response to a request for
        all posts:

        ```js
        {
          "_embedded": {
            "post": [{
              "id": 1,
              "title": "Rails is omakase"
            }, {
              "id": 2,
              "title": "The Parley Letter"
            }],
            "comment": [{
              "_id": 1,
              "comment_title": "Rails is unagi"
              "post_id": 1
            }, {
              "_id": 2,
              "comment_title": "Don't tread on me",
              "post_id": 2
            }]
          }
        }
        ```

        You could implement a serializer that looks like this to get your payload
        into shape:

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          // First, restructure the top-level so it's organized by type
          // and the comments are listed under a post's `comments` key.
          extractArray: function(store, type, payload) {
            var posts = payload._embedded.post;
            var comments = [];
            var postCache = {};

            posts.forEach(function(post) {
              post.comments = [];
              postCache[post.id] = post;
            });

            payload._embedded.comment.forEach(function(comment) {
              comments.push(comment);
              postCache[comment.post_id].comments.push(comment);
              delete comment.post_id;
            });

            payload = { comments: comments, posts: payload };

            return this._super(store, type, payload);
          },

          normalizeHash: {
            // Next, normalize individual comments, which (after `extract`)
            // are now located under `comments`
            comments: function(hash) {
              hash.id = hash._id;
              hash.title = hash.comment_title;
              delete hash._id;
              delete hash.comment_title;
              return hash;
            }
          }
        })
        ```

        When you call super from your own implementation of `extractArray`, the
        built-in implementation will find the primary array in your normalized
        payload and push the remaining records into the store.

        The primary array is the array found under `posts`.

        The primary record has special meaning when responding to `findQuery`
        or `findHasMany`. In particular, the primary array will become the
        list of records in the record array that kicked off the request.

        If your primary array contains secondary (embedded) records of the same type,
        you cannot place these into the primary array `posts`. Instead, place the
        secondary items into an underscore prefixed property `_posts`, which will
        push these items into the store and will not affect the resulting query.

        @method extractArray
        @param {DS.Store} store
        @param {subclass of DS.Model} primaryType
        @param {Object} payload
        @return {Array} The primary array that was returned in response
          to the original query.
      */
      extractArray: function(store, primaryType, rawPayload) {
        var payload = this.normalizePayload(rawPayload);
        var primaryTypeName = primaryType.typeKey;
        var primaryArray;

        for (var prop in payload) {
          var typeKey = prop;
          var forcedSecondary = false;

          if (prop.charAt(0) === '_') {
            forcedSecondary = true;
            typeKey = prop.substr(1);
          }

          var typeName = this.typeForRoot(typeKey);
          if (!store.modelFactoryFor(typeName)) {
            Ember.warn(this.warnMessageNoModelForKey(prop, typeName), false);
            continue;
          }
          var type = store.modelFor(typeName);
          var typeSerializer = store.serializerFor(type);
          var isPrimary = (!forcedSecondary && (type.typeKey === primaryTypeName));

          /*jshint loopfunc:true*/
          var normalizedArray = ember$data$lib$serializers$rest_serializer$$map.call(payload[prop], function(hash) {
            return typeSerializer.normalize(type, hash, prop);
          }, this);

          if (isPrimary) {
            primaryArray = normalizedArray;
          } else {
            store.pushMany(typeName, normalizedArray);
          }
        }

        return primaryArray;
      },

      /**
        This method allows you to push a payload containing top-level
        collections of records organized per type.

        ```js
        {
          "posts": [{
            "id": "1",
            "title": "Rails is omakase",
            "author", "1",
            "comments": [ "1" ]
          }],
          "comments": [{
            "id": "1",
            "body": "FIRST"
          }],
          "users": [{
            "id": "1",
            "name": "@d2h"
          }]
        }
        ```

        It will first normalize the payload, so you can use this to push
        in data streaming in from your server structured the same way
        that fetches and saves are structured.

        @method pushPayload
        @param {DS.Store} store
        @param {Object} payload
      */
      pushPayload: function(store, rawPayload) {
        var payload = this.normalizePayload(rawPayload);

        for (var prop in payload) {
          var typeName = this.typeForRoot(prop);
          if (!store.modelFactoryFor(typeName, prop)) {
            Ember.warn(this.warnMessageNoModelForKey(prop, typeName), false);
            continue;
          }
          var type = store.modelFor(typeName);
          var typeSerializer = store.serializerFor(type);

          /*jshint loopfunc:true*/
          var normalizedArray = ember$data$lib$serializers$rest_serializer$$map.call(Ember.makeArray(payload[prop]), function(hash) {
            return typeSerializer.normalize(type, hash, prop);
          }, this);

          store.pushMany(typeName, normalizedArray);
        }
      },

      /**
        This method is used to convert each JSON root key in the payload
        into a typeKey that it can use to look up the appropriate model for
        that part of the payload. By default the typeKey for a model is its
        name in camelCase, so if your JSON root key is 'fast-car' you would
        use typeForRoot to convert it to 'fastCar' so that Ember Data finds
        the `FastCar` model.

        If you diverge from this norm you should also consider changes to
        store._normalizeTypeKey as well.

        For example, your server may return prefixed root keys like so:

        ```js
        {
          "response-fast-car": {
            "id": "1",
            "name": "corvette"
          }
        }
        ```

        In order for Ember Data to know that the model corresponding to
        the 'response-fast-car' hash is `FastCar` (typeKey: 'fastCar'),
        you can override typeForRoot to convert 'response-fast-car' to
        'fastCar' like so:

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          typeForRoot: function(root) {
            // 'response-fast-car' should become 'fast-car'
            var subRoot = root.substring(9);

            // _super normalizes 'fast-car' to 'fastCar'
            return this._super(subRoot);
          }
        });
        ```

        @method typeForRoot
        @param {String} key
        @return {String} the model's typeKey
      */
      typeForRoot: function(key) {
        return ember$data$lib$serializers$rest_serializer$$camelize(ember$inflector$lib$system$string$$singularize(key));
      },

      // SERIALIZE

      /**
        Called when a record is saved in order to convert the
        record into JSON.

        By default, it creates a JSON object with a key for
        each attribute and belongsTo relationship.

        For example, consider this model:

        ```js
        App.Comment = DS.Model.extend({
          title: DS.attr(),
          body: DS.attr(),

          author: DS.belongsTo('user')
        });
        ```

        The default serialization would create a JSON object like:

        ```js
        {
          "title": "Rails is unagi",
          "body": "Rails? Omakase? O_O",
          "author": 12
        }
        ```

        By default, attributes are passed through as-is, unless
        you specified an attribute type (`DS.attr('date')`). If
        you specify a transform, the JavaScript value will be
        serialized when inserted into the JSON hash.

        By default, belongs-to relationships are converted into
        IDs when inserted into the JSON hash.

        ## IDs

        `serialize` takes an options hash with a single option:
        `includeId`. If this option is `true`, `serialize` will,
        by default include the ID in the JSON object it builds.

        The adapter passes in `includeId: true` when serializing
        a record for `createRecord`, but not for `updateRecord`.

        ## Customization

        Your server may expect a different JSON format than the
        built-in serialization format.

        In that case, you can implement `serialize` yourself and
        return a JSON hash of your choosing.

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          serialize: function(snapshot, options) {
            var json = {
              POST_TTL: snapshot.attr('title'),
              POST_BDY: snapshot.attr('body'),
              POST_CMS: snapshot.hasMany('comments', { ids: true })
            }

            if (options.includeId) {
              json.POST_ID_ = snapshot.id;
            }

            return json;
          }
        });
        ```

        ## Customizing an App-Wide Serializer

        If you want to define a serializer for your entire
        application, you'll probably want to use `eachAttribute`
        and `eachRelationship` on the record.

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          serialize: function(snapshot, options) {
            var json = {};

            snapshot.eachAttribute(function(name) {
              json[serverAttributeName(name)] = snapshot.attr(name);
            })

            snapshot.eachRelationship(function(name, relationship) {
              if (relationship.kind === 'hasMany') {
                json[serverHasManyName(name)] = snapshot.hasMany(name, { ids: true });
              }
            });

            if (options.includeId) {
              json.ID_ = snapshot.id;
            }

            return json;
          }
        });

        function serverAttributeName(attribute) {
          return attribute.underscore().toUpperCase();
        }

        function serverHasManyName(name) {
          return serverAttributeName(name.singularize()) + "_IDS";
        }
        ```

        This serializer will generate JSON that looks like this:

        ```js
        {
          "TITLE": "Rails is omakase",
          "BODY": "Yep. Omakase.",
          "COMMENT_IDS": [ 1, 2, 3 ]
        }
        ```

        ## Tweaking the Default JSON

        If you just want to do some small tweaks on the default JSON,
        you can call super first and make the tweaks on the returned
        JSON.

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          serialize: function(snapshot, options) {
            var json = this._super(snapshot, options);

            json.subject = json.title;
            delete json.title;

            return json;
          }
        });
        ```

        @method serialize
        @param {DS.Snapshot} snapshot
        @param {Object} options
        @return {Object} json
      */
      serialize: function(snapshot, options) {
        return this._super.apply(this, arguments);
      },

      /**
        You can use this method to customize the root keys serialized into the JSON.
        By default the REST Serializer sends the typeKey of a model, which is a camelized
        version of the name.

        For example, your server may expect underscored root objects.

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          serializeIntoHash: function(data, type, record, options) {
            var root = Ember.String.decamelize(type.typeKey);
            data[root] = this.serialize(record, options);
          }
        });
        ```

        @method serializeIntoHash
        @param {Object} hash
        @param {subclass of DS.Model} type
        @param {DS.Snapshot} snapshot
        @param {Object} options
      */
      serializeIntoHash: function(hash, type, snapshot, options) {
        hash[type.typeKey] = this.serialize(snapshot, options);
      },

      /**
        You can use this method to customize how polymorphic objects are serialized.
        By default the JSON Serializer creates the key by appending `Type` to
        the attribute and value from the model's camelcased model name.

        @method serializePolymorphicType
        @param {DS.Snapshot} snapshot
        @param {Object} json
        @param {Object} relationship
      */
      serializePolymorphicType: function(snapshot, json, relationship) {
        var key = relationship.key;
        var belongsTo = snapshot.belongsTo(key);
        key = this.keyForAttribute ? this.keyForAttribute(key) : key;
        if (Ember.isNone(belongsTo)) {
          json[key + "Type"] = null;
        } else {
          json[key + "Type"] = Ember.String.camelize(belongsTo.typeKey);
        }
      }
    });

    Ember.runInDebug(function() {
      ember$data$lib$serializers$rest_serializer$$RESTSerializer.reopen({
        warnMessageNoModelForKey: function(prop, typeKey) {
          return 'Encountered "' + prop + '" in payload, but no model was found for model name "' + typeKey + '" (resolved model name using ' + this.constructor.toString() + '.typeForRoot("' + prop + '"))';
        }
      });
    });

    var ember$data$lib$serializers$rest_serializer$$default = ember$data$lib$serializers$rest_serializer$$RESTSerializer;
    /**
      @module ember-data
    */

    var activemodel$adapter$lib$system$active_model_serializer$$forEach = Ember.EnumerableUtils.forEach;
    var activemodel$adapter$lib$system$active_model_serializer$$camelize =   Ember.String.camelize;
    var activemodel$adapter$lib$system$active_model_serializer$$capitalize = Ember.String.capitalize;
    var activemodel$adapter$lib$system$active_model_serializer$$decamelize = Ember.String.decamelize;
    var activemodel$adapter$lib$system$active_model_serializer$$underscore = Ember.String.underscore;

    /**
      The ActiveModelSerializer is a subclass of the RESTSerializer designed to integrate
      with a JSON API that uses an underscored naming convention instead of camelCasing.
      It has been designed to work out of the box with the
      [active\_model\_serializers](http://github.com/rails-api/active_model_serializers)
      Ruby gem. This Serializer expects specific settings using ActiveModel::Serializers,
      `embed :ids, embed_in_root: true` which sideloads the records.

      This serializer extends the DS.RESTSerializer by making consistent
      use of the camelization, decamelization and pluralization methods to
      normalize the serialized JSON into a format that is compatible with
      a conventional Rails backend and Ember Data.

      ## JSON Structure

      The ActiveModelSerializer expects the JSON returned from your server
      to follow the REST adapter conventions substituting underscored keys
      for camelcased ones.

      ### Conventional Names

      Attribute names in your JSON payload should be the underscored versions of
      the attributes in your Ember.js models.

      For example, if you have a `Person` model:

      ```js
      App.FamousPerson = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.attr('string')
      });
      ```

      The JSON returned should look like this:

      ```js
      {
        "famous_person": {
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation": "President"
        }
      }
      ```

      Let's imagine that `Occupation` is just another model:

      ```js
      App.Person = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.belongsTo('occupation')
      });

      App.Occupation = DS.Model.extend({
        name: DS.attr('string'),
        salary: DS.attr('number'),
        people: DS.hasMany('person')
      });
      ```

      The JSON needed to avoid extra server calls, should look like this:

      ```js
      {
        "people": [{
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation_id": 1
        }],

        "occupations": [{
          "id": 1,
          "name": "President",
          "salary": 100000,
          "person_ids": [1]
        }]
      }
      ```

      @class ActiveModelSerializer
      @namespace DS
      @extends DS.RESTSerializer
    */
    var activemodel$adapter$lib$system$active_model_serializer$$ActiveModelSerializer = ember$data$lib$serializers$rest_serializer$$default.extend({
      // SERIALIZE

      /**
        Converts camelCased attributes to underscored when serializing.

        @method keyForAttribute
        @param {String} attribute
        @return String
      */
      keyForAttribute: function(attr) {
        return activemodel$adapter$lib$system$active_model_serializer$$decamelize(attr);
      },

      /**
        Underscores relationship names and appends "_id" or "_ids" when serializing
        relationship keys.

        @method keyForRelationship
        @param {String} key
        @param {String} kind
        @return String
      */
      keyForRelationship: function(rawKey, kind) {
        var key = activemodel$adapter$lib$system$active_model_serializer$$decamelize(rawKey);
        if (kind === "belongsTo") {
          return key + "_id";
        } else if (kind === "hasMany") {
          return ember$inflector$lib$system$string$$singularize(key) + "_ids";
        } else {
          return key;
        }
      },

      /*
        Does not serialize hasMany relationships by default.
      */
      serializeHasMany: Ember.K,

      /**
        Underscores the JSON root keys when serializing.

        @method serializeIntoHash
        @param {Object} hash
        @param {subclass of DS.Model} type
        @param {DS.Snapshot} snapshot
        @param {Object} options
      */
      serializeIntoHash: function(data, type, snapshot, options) {
        var root = activemodel$adapter$lib$system$active_model_serializer$$underscore(activemodel$adapter$lib$system$active_model_serializer$$decamelize(type.typeKey));
        data[root] = this.serialize(snapshot, options);
      },

      /**
        Serializes a polymorphic type as a fully capitalized model name.

        @method serializePolymorphicType
        @param {DS.Snapshot} snapshot
        @param {Object} json
        @param {Object} relationship
      */
      serializePolymorphicType: function(snapshot, json, relationship) {
        var key = relationship.key;
        var belongsTo = snapshot.belongsTo(key);
        var jsonKey = activemodel$adapter$lib$system$active_model_serializer$$underscore(key + "_type");

        if (Ember.isNone(belongsTo)) {
          json[jsonKey] = null;
        } else {
          json[jsonKey] = activemodel$adapter$lib$system$active_model_serializer$$capitalize(activemodel$adapter$lib$system$active_model_serializer$$camelize(belongsTo.typeKey));
        }
      },

      // EXTRACT

      /**
        Add extra step to `DS.RESTSerializer.normalize` so links are normalized.

        If your payload looks like:

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "links": { "flagged_comments": "api/comments/flagged" }
          }
        }
        ```

        The normalized version would look like this

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "links": { "flaggedComments": "api/comments/flagged" }
          }
        }
        ```

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @param {String} prop
        @return Object
      */

      normalize: function(type, hash, prop) {
        this.normalizeLinks(hash);

        return this._super(type, hash, prop);
      },

      /**
        Convert `snake_cased` links  to `camelCase`

        @method normalizeLinks
        @param {Object} data
      */

      normalizeLinks: function(data) {
        if (data.links) {
          var links = data.links;

          for (var link in links) {
            var camelizedLink = activemodel$adapter$lib$system$active_model_serializer$$camelize(link);

            if (camelizedLink !== link) {
              links[camelizedLink] = links[link];
              delete links[link];
            }
          }
        }
      },

      /**
        Normalize the polymorphic type from the JSON.

        Normalize:
        ```js
          {
            id: "1"
            minion: { type: "evil_minion", id: "12"}
          }
        ```

        To:
        ```js
          {
            id: "1"
            minion: { type: "evilMinion", id: "12"}
          }
        ```

        @method normalizeRelationships
        @private
      */
      normalizeRelationships: function(type, hash) {

        if (this.keyForRelationship) {
          type.eachRelationship(function(key, relationship) {
            var payloadKey, payload;
            if (relationship.options.polymorphic) {
              payloadKey = this.keyForAttribute(key);
              payload = hash[payloadKey];
              if (payload && payload.type) {
                payload.type = this.typeForRoot(payload.type);
              } else if (payload && relationship.kind === "hasMany") {
                var self = this;
                activemodel$adapter$lib$system$active_model_serializer$$forEach(payload, function(single) {
                  single.type = self.typeForRoot(single.type);
                });
              }
            } else {
              payloadKey = this.keyForRelationship(key, relationship.kind);
              if (!hash.hasOwnProperty(payloadKey)) { return; }
              payload = hash[payloadKey];
            }

            hash[key] = payload;

            if (key !== payloadKey) {
              delete hash[payloadKey];
            }
          }, this);
        }
      }
    });

    var activemodel$adapter$lib$system$active_model_serializer$$default = activemodel$adapter$lib$system$active_model_serializer$$ActiveModelSerializer;
    /**
      This is used internally to enable deprecation of container paths and provide
      a decent message to the user indicating how to fix the issue.

      @class ContainerProxy
      @namespace DS
      @private
    */
    function ember$data$lib$system$container_proxy$$ContainerProxy(container) {
      this.container = container;
    }

    ember$data$lib$system$container_proxy$$ContainerProxy.prototype.aliasedFactory = function(path, preLookup) {
      var _this = this;

      return {
        create: function() {
          if (preLookup) { preLookup(); }

          return _this.container.lookup(path);
        }
      };
    };

    ember$data$lib$system$container_proxy$$ContainerProxy.prototype.registerAlias = function(source, dest, preLookup) {
      var factory = this.aliasedFactory(dest, preLookup);

      return this.container.register(source, factory);
    };

    ember$data$lib$system$container_proxy$$ContainerProxy.prototype.registerDeprecation = function(deprecated, valid) {
      var preLookupCallback = function() {
        Ember.deprecate("You tried to look up '" + deprecated + "', " +
                        "but this has been deprecated in favor of '" + valid + "'.", false);
      };

      return this.registerAlias(deprecated, valid, preLookupCallback);
    };

    ember$data$lib$system$container_proxy$$ContainerProxy.prototype.registerDeprecations = function(proxyPairs) {
      var i, proxyPair, deprecated, valid;

      for (i = proxyPairs.length; i > 0; i--) {
        proxyPair = proxyPairs[i - 1];
        deprecated = proxyPair['deprecated'];
        valid = proxyPair['valid'];

        this.registerDeprecation(deprecated, valid);
      }
    };

    var ember$data$lib$system$container_proxy$$default = ember$data$lib$system$container_proxy$$ContainerProxy;
    function activemodel$adapter$lib$setup$container$$setupActiveModelAdapter(container, application) {
      var proxy = new ember$data$lib$system$container_proxy$$default(container);
      proxy.registerDeprecations([
        { deprecated: 'serializer:_ams',  valid: 'serializer:-active-model' },
        { deprecated: 'adapter:_ams',     valid: 'adapter:-active-model' }
      ]);

      container.register('serializer:-active-model', activemodel$adapter$lib$system$active_model_serializer$$default);
      container.register('adapter:-active-model', activemodel$adapter$lib$system$active_model_adapter$$default);
    }
    var activemodel$adapter$lib$setup$container$$default = activemodel$adapter$lib$setup$container$$setupActiveModelAdapter;
    /**
      @module ember-data
    */

    /**
      All Ember Data methods and functions are defined inside of this namespace.

      @class DS
      @static
    */

    /**
      @property VERSION
      @type String
      @default '1.0.0-beta.15'
      @static
    */
    /*jshint -W079 */
    var ember$data$lib$core$$DS = Ember.Namespace.create({
      VERSION: '1.0.0-beta.15'
    });

    if (Ember.libraries) {
      Ember.libraries.registerCoreLibrary('Ember Data', ember$data$lib$core$$DS.VERSION);
    }

    var ember$data$lib$core$$default = ember$data$lib$core$$DS;
    var ember$data$lib$system$promise_proxies$$Promise = Ember.RSVP.Promise;
    var ember$data$lib$system$promise_proxies$$get = Ember.get;

    /**
      A `PromiseArray` is an object that acts like both an `Ember.Array`
      and a promise. When the promise is resolved the resulting value
      will be set to the `PromiseArray`'s `content` property. This makes
      it easy to create data bindings with the `PromiseArray` that will be
      updated when the promise resolves.

      For more information see the [Ember.PromiseProxyMixin
      documentation](/api/classes/Ember.PromiseProxyMixin.html).

      Example

      ```javascript
      var promiseArray = DS.PromiseArray.create({
        promise: $.getJSON('/some/remote/data.json')
      });

      promiseArray.get('length'); // 0

      promiseArray.then(function() {
        promiseArray.get('length'); // 100
      });
      ```

      @class PromiseArray
      @namespace DS
      @extends Ember.ArrayProxy
      @uses Ember.PromiseProxyMixin
    */
    var ember$data$lib$system$promise_proxies$$PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);

    /**
      A `PromiseObject` is an object that acts like both an `Ember.Object`
      and a promise. When the promise is resolved, then the resulting value
      will be set to the `PromiseObject`'s `content` property. This makes
      it easy to create data bindings with the `PromiseObject` that will
      be updated when the promise resolves.

      For more information see the [Ember.PromiseProxyMixin
      documentation](/api/classes/Ember.PromiseProxyMixin.html).

      Example

      ```javascript
      var promiseObject = DS.PromiseObject.create({
        promise: $.getJSON('/some/remote/data.json')
      });

      promiseObject.get('name'); // null

      promiseObject.then(function() {
        promiseObject.get('name'); // 'Tomster'
      });
      ```

      @class PromiseObject
      @namespace DS
      @extends Ember.ObjectProxy
      @uses Ember.PromiseProxyMixin
    */
    var ember$data$lib$system$promise_proxies$$PromiseObject = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);

    var ember$data$lib$system$promise_proxies$$promiseObject = function(promise, label) {
      return ember$data$lib$system$promise_proxies$$PromiseObject.create({
        promise: ember$data$lib$system$promise_proxies$$Promise.resolve(promise, label)
      });
    };

    var ember$data$lib$system$promise_proxies$$promiseArray = function(promise, label) {
      return ember$data$lib$system$promise_proxies$$PromiseArray.create({
        promise: ember$data$lib$system$promise_proxies$$Promise.resolve(promise, label)
      });
    };

    /**
      A PromiseManyArray is a PromiseArray that also proxies certain method calls
      to the underlying manyArray.
      Right now we proxy:

        * `reload()`
        * `createRecord()`
        * `on()`
        * `one()`
        * `trigger()`
        * `off()`
        * `has()`

      @class PromiseManyArray
      @namespace DS
      @extends Ember.ArrayProxy
    */

    function ember$data$lib$system$promise_proxies$$proxyToContent(method) {
      return function() {
        var content = ember$data$lib$system$promise_proxies$$get(this, 'content');
        return content[method].apply(content, arguments);
      };
    }

    var ember$data$lib$system$promise_proxies$$PromiseManyArray = ember$data$lib$system$promise_proxies$$PromiseArray.extend({
      reload: function() {
        //I don't think this should ever happen right now, but worth guarding if we refactor the async relationships
        Ember.assert('You are trying to reload an async manyArray before it has been created', ember$data$lib$system$promise_proxies$$get(this, 'content'));
        return ember$data$lib$system$promise_proxies$$PromiseManyArray.create({
          promise: ember$data$lib$system$promise_proxies$$get(this, 'content').reload()
        });
      },

      createRecord: ember$data$lib$system$promise_proxies$$proxyToContent('createRecord'),

      on: ember$data$lib$system$promise_proxies$$proxyToContent('on'),

      one: ember$data$lib$system$promise_proxies$$proxyToContent('one'),

      trigger: ember$data$lib$system$promise_proxies$$proxyToContent('trigger'),

      off: ember$data$lib$system$promise_proxies$$proxyToContent('off'),

      has: ember$data$lib$system$promise_proxies$$proxyToContent('has')
    });

    var ember$data$lib$system$promise_proxies$$promiseManyArray = function(promise, label) {
      return ember$data$lib$system$promise_proxies$$PromiseManyArray.create({
        promise: ember$data$lib$system$promise_proxies$$Promise.resolve(promise, label)
      });
    };


    var ember$data$lib$system$record_arrays$record_array$$get = Ember.get;
    var ember$data$lib$system$record_arrays$record_array$$set = Ember.set;

    var ember$data$lib$system$record_arrays$record_array$$default = Ember.ArrayProxy.extend(Ember.Evented, {
      /**
        The model type contained by this record array.

        @property type
        @type DS.Model
      */
      type: null,

      /**
        The array of client ids backing the record array. When a
        record is requested from the record array, the record
        for the client id at the same index is materialized, if
        necessary, by the store.

        @property content
        @private
        @type Ember.Array
      */
      content: null,

      /**
        The flag to signal a `RecordArray` is currently loading data.

        Example

        ```javascript
        var people = store.all('person');
        people.get('isLoaded'); // true
        ```

        @property isLoaded
        @type Boolean
      */
      isLoaded: false,
      /**
        The flag to signal a `RecordArray` is currently loading data.

        Example

        ```javascript
        var people = store.all('person');
        people.get('isUpdating'); // false
        people.update();
        people.get('isUpdating'); // true
        ```

        @property isUpdating
        @type Boolean
      */
      isUpdating: false,

      /**
        The store that created this record array.

        @property store
        @private
        @type DS.Store
      */
      store: null,

      /**
        Retrieves an object from the content by index.

        @method objectAtContent
        @private
        @param {Number} index
        @return {DS.Model} record
      */
      objectAtContent: function(index) {
        var content = ember$data$lib$system$record_arrays$record_array$$get(this, 'content');

        return content.objectAt(index);
      },

      /**
        Used to get the latest version of all of the records in this array
        from the adapter.

        Example

        ```javascript
        var people = store.all('person');
        people.get('isUpdating'); // false
        people.update();
        people.get('isUpdating'); // true
        ```

        @method update
      */
      update: function() {
        if (ember$data$lib$system$record_arrays$record_array$$get(this, 'isUpdating')) { return; }

        var store = ember$data$lib$system$record_arrays$record_array$$get(this, 'store');
        var type = ember$data$lib$system$record_arrays$record_array$$get(this, 'type');

        return store.fetchAll(type, this);
      },

      /**
        Adds a record to the `RecordArray` without duplicates

        @method addRecord
        @private
        @param {DS.Model} record
        @param {DS.Model} an optional index to insert at
      */
      addRecord: function(record, idx) {
        var content = ember$data$lib$system$record_arrays$record_array$$get(this, 'content');
        if (idx === undefined) {
          content.addObject(record);
        } else if (!content.contains(record)) {
          content.insertAt(idx, record);
        }
      },

      _pushRecord: function(record) {
        ember$data$lib$system$record_arrays$record_array$$get(this, 'content').pushObject(record);
      },

      /**
        Adds a record to the `RecordArray`, but allows duplicates

        @deprecated
        @method pushRecord
        @private
        @param {DS.Model} record
      */
      pushRecord: function(record) {
        Ember.deprecate('Usage of `recordArray.pushRecord` is deprecated, use `recordArray.addObject` instead');
        this._pushRecord(record);
      },
      /**
        Removes a record to the `RecordArray`.

        @method removeRecord
        @private
        @param {DS.Model} record
      */
      removeRecord: function(record) {
        ember$data$lib$system$record_arrays$record_array$$get(this, 'content').removeObject(record);
      },

      /**
        Saves all of the records in the `RecordArray`.

        Example

        ```javascript
        var messages = store.all('message');
        messages.forEach(function(message) {
          message.set('hasBeenSeen', true);
        });
        messages.save();
        ```

        @method save
        @return {DS.PromiseArray} promise
      */
      save: function() {
        var recordArray = this;
        var promiseLabel = "DS: RecordArray#save " + ember$data$lib$system$record_arrays$record_array$$get(this, 'type');
        var promise = Ember.RSVP.all(this.invoke("save"), promiseLabel).then(function(array) {
          return recordArray;
        }, null, "DS: RecordArray#save return RecordArray");

        return ember$data$lib$system$promise_proxies$$PromiseArray.create({ promise: promise });
      },

      _dissociateFromOwnRecords: function() {
        var array = this;

        this.forEach(function(record) {
          var recordArrays = record._recordArrays;

          if (recordArrays) {
            recordArrays["delete"](array);
          }
        });
      },

      /**
        @method _unregisterFromManager
        @private
      */
      _unregisterFromManager: function() {
        var manager = ember$data$lib$system$record_arrays$record_array$$get(this, 'manager');
        //We will stop needing this stupid if statement soon, once manyArray are refactored to not be RecordArrays
        if (manager) {
          manager.unregisterFilteredRecordArray(this);
        }
      },

      willDestroy: function() {
        this._unregisterFromManager();
        this._dissociateFromOwnRecords();
        ember$data$lib$system$record_arrays$record_array$$set(this, 'content', undefined);
        this._super.apply(this, arguments);
      }
    });

    /**
      @module ember-data
    */

    var ember$data$lib$system$record_arrays$filtered_record_array$$get = Ember.get;

    var ember$data$lib$system$record_arrays$filtered_record_array$$default = ember$data$lib$system$record_arrays$record_array$$default.extend({
      /**
        The filterFunction is a function used to test records from the store to
        determine if they should be part of the record array.

        Example

        ```javascript
        var allPeople = store.all('person');
        allPeople.mapBy('name'); // ["Tom Dale", "Yehuda Katz", "Trek Glowacki"]

        var people = store.filter('person', function(person) {
          if (person.get('name').match(/Katz$/)) { return true; }
        });
        people.mapBy('name'); // ["Yehuda Katz"]

        var notKatzFilter = function(person) {
          return !person.get('name').match(/Katz$/);
        };
        people.set('filterFunction', notKatzFilter);
        people.mapBy('name'); // ["Tom Dale", "Trek Glowacki"]
        ```

        @method filterFunction
        @param {DS.Model} record
        @return {Boolean} `true` if the record should be in the array
      */
      filterFunction: null,
      isLoaded: true,

      replace: function() {
        var type = ember$data$lib$system$record_arrays$filtered_record_array$$get(this, 'type').toString();
        throw new Error("The result of a client-side filter (on " + type + ") is immutable.");
      },

      /**
        @method updateFilter
        @private
      */
      _updateFilter: function() {
        var manager = ember$data$lib$system$record_arrays$filtered_record_array$$get(this, 'manager');
        manager.updateFilter(this, ember$data$lib$system$record_arrays$filtered_record_array$$get(this, 'type'), ember$data$lib$system$record_arrays$filtered_record_array$$get(this, 'filterFunction'));
      },

      updateFilter: Ember.observer(function() {
        Ember.run.once(this, this._updateFilter);
      }, 'filterFunction')
    });

    /**
      @module ember-data
    */

    var ember$data$lib$system$record_arrays$adapter_populated_record_array$$get = Ember.get;

    function ember$data$lib$system$record_arrays$adapter_populated_record_array$$cloneNull(source) {
      var clone = Ember.create(null);
      for (var key in source) {
        clone[key] = source[key];
      }
      return clone;
    }

    var ember$data$lib$system$record_arrays$adapter_populated_record_array$$default = ember$data$lib$system$record_arrays$record_array$$default.extend({
      query: null,

      replace: function() {
        var type = ember$data$lib$system$record_arrays$adapter_populated_record_array$$get(this, 'type').toString();
        throw new Error("The result of a server query (on " + type + ") is immutable.");
      },

      /**
        @method load
        @private
        @param {Array} data
      */
      load: function(data) {
        var store = ember$data$lib$system$record_arrays$adapter_populated_record_array$$get(this, 'store');
        var type = ember$data$lib$system$record_arrays$adapter_populated_record_array$$get(this, 'type');
        var records = store.pushMany(type, data);
        var meta = store.metadataFor(type);

        this.setProperties({
          content: Ember.A(records),
          isLoaded: true,
          meta: ember$data$lib$system$record_arrays$adapter_populated_record_array$$cloneNull(meta)
        });

        records.forEach(function(record) {
          this.manager.recordArraysForRecord(record).add(this);
        }, this);

        // TODO: should triggering didLoad event be the last action of the runLoop?
        Ember.run.once(this, 'trigger', 'didLoad');
      }
    });

    var ember$data$lib$system$record_arrays$many_array$$get = Ember.get;
    var ember$data$lib$system$record_arrays$many_array$$set = Ember.set;

    var ember$data$lib$system$record_arrays$many_array$$default = Ember.Object.extend(Ember.MutableArray, Ember.Evented, {
      init: function() {
        this.currentState = Ember.A([]);
      },

      record: null,

      canonicalState: null,
      currentState: null,

      length: 0,

      objectAt: function(index) {
        if (this.currentState[index]) {
          return this.currentState[index];
        } else {
          return this.canonicalState[index];
        }
      },

      flushCanonical: function() {
        //TODO make this smarter, currently its plenty stupid
        var toSet = this.canonicalState.slice(0);
        //a hack for not removing new records
        //TODO remove once we have proper diffing
        var newRecords = this.currentState.filter(function(record) {
          return record.get('isNew');
        });
        toSet = toSet.concat(newRecords);
        var oldLength = this.length;
        this.arrayContentWillChange(0, this.length, toSet.length);
        this.set('length', toSet.length);
        this.currentState = toSet;
        this.arrayContentDidChange(0, oldLength, this.length);
        //TODO Figure out to notify only on additions and maybe only if unloaded
        this.relationship.notifyHasManyChanged();
        this.record.updateRecordArrays();
      },
      /**
        `true` if the relationship is polymorphic, `false` otherwise.

        @property {Boolean} isPolymorphic
        @private
      */
      isPolymorphic: false,

      /**
        The loading state of this array

        @property {Boolean} isLoaded
      */
      isLoaded: false,

       /**
         The relationship which manages this array.

         @property {ManyRelationship} relationship
         @private
       */
      relationship: null,

      internalReplace: function(idx, amt, objects) {
        if (!objects) {
          objects = [];
        }
        this.arrayContentWillChange(idx, amt, objects.length);
        this.currentState.splice.apply(this.currentState, [idx, amt].concat(objects));
        this.set('length', this.currentState.length);
        this.arrayContentDidChange(idx, amt, objects.length);
        if (objects) {
          //TODO(Igor) probably needed only for unloaded records
          this.relationship.notifyHasManyChanged();
        }
        this.record.updateRecordArrays();
      },

      //TODO(Igor) optimize
      internalRemoveRecords: function(records) {
        var index;
        for (var i=0; i < records.length; i++) {
          index = this.currentState.indexOf(records[i]);
          this.internalReplace(index, 1);
        }
      },

      //TODO(Igor) optimize
      internalAddRecords: function(records, idx) {
        if (idx === undefined) {
          idx = this.currentState.length;
        }
        this.internalReplace(idx, 0, records);
      },

      replace: function(idx, amt, objects) {
        var records;
        if (amt > 0) {
          records = this.currentState.slice(idx, idx+amt);
          this.get('relationship').removeRecords(records);
        }
        if (objects) {
          this.get('relationship').addRecords(objects, idx);
        }
      },
      /**
        Used for async `hasMany` arrays
        to keep track of when they will resolve.

        @property {Ember.RSVP.Promise} promise
        @private
      */
      promise: null,

      /**
        @method loadingRecordsCount
        @param {Number} count
        @private
      */
      loadingRecordsCount: function(count) {
        this.loadingRecordsCount = count;
      },

      /**
        @method loadedRecord
        @private
      */
      loadedRecord: function() {
        this.loadingRecordsCount--;
        if (this.loadingRecordsCount === 0) {
          ember$data$lib$system$record_arrays$many_array$$set(this, 'isLoaded', true);
          this.trigger('didLoad');
        }
      },

      /**
        @method reload
        @public
      */
      reload: function() {
        return this.relationship.reload();
      },

      /**
        Saves all of the records in the `ManyArray`.

        Example

        ```javascript
        store.find('inbox', 1).then(function(inbox) {
          inbox.get('messages').then(function(messages) {
            messages.forEach(function(message) {
              message.set('isRead', true);
            });
            messages.save()
          });
        });
        ```

        @method save
        @return {DS.PromiseArray} promise
      */
      save: function() {
        var manyArray = this;
        var promiseLabel = "DS: ManyArray#save " + ember$data$lib$system$record_arrays$many_array$$get(this, 'type');
        var promise = Ember.RSVP.all(this.invoke("save"), promiseLabel).then(function(array) {
          return manyArray;
        }, null, "DS: ManyArray#save return ManyArray");

        return ember$data$lib$system$promise_proxies$$PromiseArray.create({ promise: promise });
      },

      /**
        Create a child record within the owner

        @method createRecord
        @private
        @param {Object} hash
        @return {DS.Model} record
      */
      createRecord: function(hash) {
        var store = ember$data$lib$system$record_arrays$many_array$$get(this, 'store');
        var type = ember$data$lib$system$record_arrays$many_array$$get(this, 'type');
        var record;

        Ember.assert("You cannot add '" + type.typeKey + "' records to this polymorphic relationship.", !ember$data$lib$system$record_arrays$many_array$$get(this, 'isPolymorphic'));

        record = store.createRecord(type, hash);
        this.pushObject(record);

        return record;
      },

      /**
        @method addRecord
        @param {DS.Model} record
        @deprecated Use `addObject()` instead
      */
      addRecord: function(record) {
        Ember.deprecate('Using manyArray.addRecord() has been deprecated. You should use manyArray.addObject() instead.');
        this.addObject(record);
      },

      /**
        @method removeRecord
        @param {DS.Model} record
        @deprecated Use `removeObject()` instead
      */
      removeRecord: function(record) {
        Ember.deprecate('Using manyArray.removeRecord() has been deprecated. You should use manyArray.removeObject() instead.');
        this.removeObject(record);
      }
    });

    var ember$data$lib$system$record_array_manager$$get = Ember.get;
    var ember$data$lib$system$record_array_manager$$forEach = Ember.EnumerableUtils.forEach;
    var ember$data$lib$system$record_array_manager$$indexOf = Ember.EnumerableUtils.indexOf;

    var ember$data$lib$system$record_array_manager$$default = Ember.Object.extend({
      init: function() {
        this.filteredRecordArrays = ember$data$lib$system$map$$MapWithDefault.create({
          defaultValue: function() { return []; }
        });

        this.changedRecords = [];
        this._adapterPopulatedRecordArrays = [];
      },

      recordDidChange: function(record) {
        if (this.changedRecords.push(record) !== 1) { return; }

        Ember.run.schedule('actions', this, this.updateRecordArrays);
      },

      recordArraysForRecord: function(record) {
        record._recordArrays = record._recordArrays || ember$data$lib$system$map$$OrderedSet.create();
        return record._recordArrays;
      },

      /**
        This method is invoked whenever data is loaded into the store by the
        adapter or updated by the adapter, or when a record has changed.

        It updates all record arrays that a record belongs to.

        To avoid thrashing, it only runs at most once per run loop.

        @method updateRecordArrays
        @param {Class} type
        @param {Number|String} clientId
      */
      updateRecordArrays: function() {
        ember$data$lib$system$record_array_manager$$forEach(this.changedRecords, function(record) {
          if (ember$data$lib$system$record_array_manager$$get(record, 'isDeleted')) {
            this._recordWasDeleted(record);
          } else {
            this._recordWasChanged(record);
          }
        }, this);

        this.changedRecords.length = 0;
      },

      _recordWasDeleted: function (record) {
        var recordArrays = record._recordArrays;

        if (!recordArrays) { return; }

        recordArrays.forEach(function(array) {
          array.removeRecord(record);
        });

        record._recordArrays = null;
      },


      //Don't need to update non filtered arrays on simple changes
      _recordWasChanged: function (record) {
        var type = record.constructor;
        var recordArrays = this.filteredRecordArrays.get(type);
        var filter;

        ember$data$lib$system$record_array_manager$$forEach(recordArrays, function(array) {
          filter = ember$data$lib$system$record_array_manager$$get(array, 'filterFunction');
          if (filter) {
            this.updateRecordArray(array, filter, type, record);
          }
        }, this);
      },

      //Need to update live arrays on loading
      recordWasLoaded: function(record) {
        var type = record.constructor;
        var recordArrays = this.filteredRecordArrays.get(type);
        var filter;

        ember$data$lib$system$record_array_manager$$forEach(recordArrays, function(array) {
          filter = ember$data$lib$system$record_array_manager$$get(array, 'filterFunction');
          this.updateRecordArray(array, filter, type, record);
        }, this);
      },
      /**
        Update an individual filter.

        @method updateRecordArray
        @param {DS.FilteredRecordArray} array
        @param {Function} filter
        @param {Class} type
        @param {Number|String} clientId
      */
      updateRecordArray: function(array, filter, type, record) {
        var shouldBeInArray;

        if (!filter) {
          shouldBeInArray = true;
        } else {
          shouldBeInArray = filter(record);
        }

        var recordArrays = this.recordArraysForRecord(record);

        if (shouldBeInArray) {
          if (!recordArrays.has(array)) {
            array._pushRecord(record);
            recordArrays.add(array);
          }
        } else if (!shouldBeInArray) {
          recordArrays["delete"](array);
          array.removeRecord(record);
        }
      },

      /**
        This method is invoked if the `filterFunction` property is
        changed on a `DS.FilteredRecordArray`.

        It essentially re-runs the filter from scratch. This same
        method is invoked when the filter is created in th first place.

        @method updateFilter
        @param {Array} array
        @param {String} type
        @param {Function} filter
      */
      updateFilter: function(array, type, filter) {
        var typeMap = this.store.typeMapFor(type);
        var records = typeMap.records;
        var record;

        for (var i = 0, l = records.length; i < l; i++) {
          record = records[i];

          if (!ember$data$lib$system$record_array_manager$$get(record, 'isDeleted') && !ember$data$lib$system$record_array_manager$$get(record, 'isEmpty')) {
            this.updateRecordArray(array, filter, type, record);
          }
        }
      },

      /**
        Create a `DS.RecordArray` for a type and register it for updates.

        @method createRecordArray
        @param {Class} type
        @return {DS.RecordArray}
      */
      createRecordArray: function(type) {
        var array = ember$data$lib$system$record_arrays$record_array$$default.create({
          type: type,
          content: Ember.A(),
          store: this.store,
          isLoaded: true,
          manager: this
        });

        this.registerFilteredRecordArray(array, type);

        return array;
      },

      /**
        Create a `DS.FilteredRecordArray` for a type and register it for updates.

        @method createFilteredRecordArray
        @param {Class} type
        @param {Function} filter
        @param {Object} query (optional
        @return {DS.FilteredRecordArray}
      */
      createFilteredRecordArray: function(type, filter, query) {
        var array = ember$data$lib$system$record_arrays$filtered_record_array$$default.create({
          query: query,
          type: type,
          content: Ember.A(),
          store: this.store,
          manager: this,
          filterFunction: filter
        });

        this.registerFilteredRecordArray(array, type, filter);

        return array;
      },

      /**
        Create a `DS.AdapterPopulatedRecordArray` for a type with given query.

        @method createAdapterPopulatedRecordArray
        @param {Class} type
        @param {Object} query
        @return {DS.AdapterPopulatedRecordArray}
      */
      createAdapterPopulatedRecordArray: function(type, query) {
        var array = ember$data$lib$system$record_arrays$adapter_populated_record_array$$default.create({
          type: type,
          query: query,
          content: Ember.A(),
          store: this.store,
          manager: this
        });

        this._adapterPopulatedRecordArrays.push(array);

        return array;
      },

      /**
        Register a RecordArray for a given type to be backed by
        a filter function. This will cause the array to update
        automatically when records of that type change attribute
        values or states.

        @method registerFilteredRecordArray
        @param {DS.RecordArray} array
        @param {Class} type
        @param {Function} filter
      */
      registerFilteredRecordArray: function(array, type, filter) {
        var recordArrays = this.filteredRecordArrays.get(type);
        recordArrays.push(array);

        this.updateFilter(array, type, filter);
      },

      /**
        Unregister a FilteredRecordArray.
        So manager will not update this array.

        @method unregisterFilteredRecordArray
        @param {DS.RecordArray} array
      */
      unregisterFilteredRecordArray: function(array) {
        var recordArrays = this.filteredRecordArrays.get(array.type);
        var index = ember$data$lib$system$record_array_manager$$indexOf(recordArrays, array);
        recordArrays.splice(index, 1);
      },

      willDestroy: function() {
        this._super.apply(this, arguments);

        this.filteredRecordArrays.forEach(function(value) {
          ember$data$lib$system$record_array_manager$$forEach(ember$data$lib$system$record_array_manager$$flatten(value), ember$data$lib$system$record_array_manager$$destroy);
        });
        ember$data$lib$system$record_array_manager$$forEach(this._adapterPopulatedRecordArrays, ember$data$lib$system$record_array_manager$$destroy);
      }
    });

    function ember$data$lib$system$record_array_manager$$destroy(entry) {
      entry.destroy();
    }

    function ember$data$lib$system$record_array_manager$$flatten(list) {
      var length = list.length;
      var result = Ember.A();

      for (var i = 0; i < length; i++) {
        result = result.concat(list[i]);
      }

      return result;
    }
    /**
      @module ember-data
    */

    var ember$data$lib$system$model$states$$get = Ember.get;
    var ember$data$lib$system$model$states$$set = Ember.set;
    /*
      This file encapsulates the various states that a record can transition
      through during its lifecycle.
    */
    /**
      ### State

      Each record has a `currentState` property that explicitly tracks what
      state a record is in at any given time. For instance, if a record is
      newly created and has not yet been sent to the adapter to be saved,
      it would be in the `root.loaded.created.uncommitted` state.  If a
      record has had local modifications made to it that are in the
      process of being saved, the record would be in the
      `root.loaded.updated.inFlight` state. (This state paths will be
      explained in more detail below.)

      Events are sent by the record or its store to the record's
      `currentState` property. How the state reacts to these events is
      dependent on which state it is in. In some states, certain events
      will be invalid and will cause an exception to be raised.

      States are hierarchical and every state is a substate of the
      `RootState`. For example, a record can be in the
      `root.deleted.uncommitted` state, then transition into the
      `root.deleted.inFlight` state. If a child state does not implement
      an event handler, the state manager will attempt to invoke the event
      on all parent states until the root state is reached. The state
      hierarchy of a record is described in terms of a path string. You
      can determine a record's current state by getting the state's
      `stateName` property:

      ```javascript
      record.get('currentState.stateName');
      //=> "root.created.uncommitted"
       ```

      The hierarchy of valid states that ship with ember data looks like
      this:

      ```text
      * root
        * deleted
          * saved
          * uncommitted
          * inFlight
        * empty
        * loaded
          * created
            * uncommitted
            * inFlight
          * saved
          * updated
            * uncommitted
            * inFlight
        * loading
      ```

      The `DS.Model` states are themselves stateless. What that means is
      that, the hierarchical states that each of *those* points to is a
      shared data structure. For performance reasons, instead of each
      record getting its own copy of the hierarchy of states, each record
      points to this global, immutable shared instance. How does a state
      know which record it should be acting on? We pass the record
      instance into the state's event handlers as the first argument.

      The record passed as the first parameter is where you should stash
      state about the record if needed; you should never store data on the state
      object itself.

      ### Events and Flags

      A state may implement zero or more events and flags.

      #### Events

      Events are named functions that are invoked when sent to a record. The
      record will first look for a method with the given name on the
      current state. If no method is found, it will search the current
      state's parent, and then its grandparent, and so on until reaching
      the top of the hierarchy. If the root is reached without an event
      handler being found, an exception will be raised. This can be very
      helpful when debugging new features.

      Here's an example implementation of a state with a `myEvent` event handler:

      ```javascript
      aState: DS.State.create({
        myEvent: function(manager, param) {
          console.log("Received myEvent with", param);
        }
      })
      ```

      To trigger this event:

      ```javascript
      record.send('myEvent', 'foo');
      //=> "Received myEvent with foo"
      ```

      Note that an optional parameter can be sent to a record's `send()` method,
      which will be passed as the second parameter to the event handler.

      Events should transition to a different state if appropriate. This can be
      done by calling the record's `transitionTo()` method with a path to the
      desired state. The state manager will attempt to resolve the state path
      relative to the current state. If no state is found at that path, it will
      attempt to resolve it relative to the current state's parent, and then its
      parent, and so on until the root is reached. For example, imagine a hierarchy
      like this:

          * created
            * uncommitted <-- currentState
            * inFlight
          * updated
            * inFlight

      If we are currently in the `uncommitted` state, calling
      `transitionTo('inFlight')` would transition to the `created.inFlight` state,
      while calling `transitionTo('updated.inFlight')` would transition to
      the `updated.inFlight` state.

      Remember that *only events* should ever cause a state transition. You should
      never call `transitionTo()` from outside a state's event handler. If you are
      tempted to do so, create a new event and send that to the state manager.

      #### Flags

      Flags are Boolean values that can be used to introspect a record's current
      state in a more user-friendly way than examining its state path. For example,
      instead of doing this:

      ```javascript
      var statePath = record.get('stateManager.currentPath');
      if (statePath === 'created.inFlight') {
        doSomething();
      }
      ```

      You can say:

      ```javascript
      if (record.get('isNew') && record.get('isSaving')) {
        doSomething();
      }
      ```

      If your state does not set a value for a given flag, the value will
      be inherited from its parent (or the first place in the state hierarchy
      where it is defined).

      The current set of flags are defined below. If you want to add a new flag,
      in addition to the area below, you will also need to declare it in the
      `DS.Model` class.


       * [isEmpty](DS.Model.html#property_isEmpty)
       * [isLoading](DS.Model.html#property_isLoading)
       * [isLoaded](DS.Model.html#property_isLoaded)
       * [isDirty](DS.Model.html#property_isDirty)
       * [isSaving](DS.Model.html#property_isSaving)
       * [isDeleted](DS.Model.html#property_isDeleted)
       * [isNew](DS.Model.html#property_isNew)
       * [isValid](DS.Model.html#property_isValid)

      @namespace DS
      @class RootState
    */

    function ember$data$lib$system$model$states$$didSetProperty(record, context) {
      if (context.value === context.originalValue) {
        delete record._attributes[context.name];
        record.send('propertyWasReset', context.name);
      } else if (context.value !== context.oldValue) {
        record.send('becomeDirty');
      }

      record.updateRecordArraysLater();
    }

    // Implementation notes:
    //
    // Each state has a boolean value for all of the following flags:
    //
    // * isLoaded: The record has a populated `data` property. When a
    //   record is loaded via `store.find`, `isLoaded` is false
    //   until the adapter sets it. When a record is created locally,
    //   its `isLoaded` property is always true.
    // * isDirty: The record has local changes that have not yet been
    //   saved by the adapter. This includes records that have been
    //   created (but not yet saved) or deleted.
    // * isSaving: The record has been committed, but
    //   the adapter has not yet acknowledged that the changes have
    //   been persisted to the backend.
    // * isDeleted: The record was marked for deletion. When `isDeleted`
    //   is true and `isDirty` is true, the record is deleted locally
    //   but the deletion was not yet persisted. When `isSaving` is
    //   true, the change is in-flight. When both `isDirty` and
    //   `isSaving` are false, the change has persisted.
    // * isError: The adapter reported that it was unable to save
    //   local changes to the backend. This may also result in the
    //   record having its `isValid` property become false if the
    //   adapter reported that server-side validations failed.
    // * isNew: The record was created on the client and the adapter
    //   did not yet report that it was successfully saved.
    // * isValid: The adapter did not report any server-side validation
    //   failures.

    // The dirty state is a abstract state whose functionality is
    // shared between the `created` and `updated` states.
    //
    // The deleted state shares the `isDirty` flag with the
    // subclasses of `DirtyState`, but with a very different
    // implementation.
    //
    // Dirty states have three child states:
    //
    // `uncommitted`: the store has not yet handed off the record
    //   to be saved.
    // `inFlight`: the store has handed off the record to be saved,
    //   but the adapter has not yet acknowledged success.
    // `invalid`: the record has invalid information and cannot be
    //   send to the adapter yet.
    var ember$data$lib$system$model$states$$DirtyState = {
      initialState: 'uncommitted',

      // FLAGS
      isDirty: true,

      // SUBSTATES

      // When a record first becomes dirty, it is `uncommitted`.
      // This means that there are local pending changes, but they
      // have not yet begun to be saved, and are not invalid.
      uncommitted: {
        // EVENTS
        didSetProperty: ember$data$lib$system$model$states$$didSetProperty,

        //TODO(Igor) reloading now triggers a
        //loadingData event, though it seems fine?
        loadingData: Ember.K,

        propertyWasReset: function(record, name) {
          var length = Ember.keys(record._attributes).length;
          var stillDirty = length > 0;

          if (!stillDirty) { record.send('rolledBack'); }
        },

        pushedData: Ember.K,

        becomeDirty: Ember.K,

        willCommit: function(record) {
          record.transitionTo('inFlight');
        },

        reloadRecord: function(record, resolve) {
          resolve(ember$data$lib$system$model$states$$get(record, 'store').reloadRecord(record));
        },

        rolledBack: function(record) {
          record.transitionTo('loaded.saved');
        },

        becameInvalid: function(record) {
          record.transitionTo('invalid');
        },

        rollback: function(record) {
          record.rollback();
          record.triggerLater('ready');
        }
      },

      // Once a record has been handed off to the adapter to be
      // saved, it is in the 'in flight' state. Changes to the
      // record cannot be made during this window.
      inFlight: {
        // FLAGS
        isSaving: true,

        // EVENTS
        didSetProperty: ember$data$lib$system$model$states$$didSetProperty,
        becomeDirty: Ember.K,
        pushedData: Ember.K,

        unloadRecord: function(record) {
          Ember.assert("You can only unload a record which is not inFlight. `" + Ember.inspect(record) + " `", false);
        },

        // TODO: More robust semantics around save-while-in-flight
        willCommit: Ember.K,

        didCommit: function(record) {
          var dirtyType = ember$data$lib$system$model$states$$get(this, 'dirtyType');

          record.transitionTo('saved');
          record.send('invokeLifecycleCallbacks', dirtyType);
        },

        becameInvalid: function(record) {
          record.transitionTo('invalid');
          record.send('invokeLifecycleCallbacks');
        },

        becameError: function(record) {
          record.transitionTo('uncommitted');
          record.triggerLater('becameError', record);
        }
      },

      // A record is in the `invalid` if the adapter has indicated
      // the the record failed server-side invalidations.
      invalid: {
        // FLAGS
        isValid: false,

        // EVENTS
        deleteRecord: function(record) {
          record.transitionTo('deleted.uncommitted');
          record.disconnectRelationships();
        },

        didSetProperty: function(record, context) {
          ember$data$lib$system$model$states$$get(record, 'errors').remove(context.name);

          ember$data$lib$system$model$states$$didSetProperty(record, context);
        },

        becomeDirty: Ember.K,

        willCommit: function(record) {
          ember$data$lib$system$model$states$$get(record, 'errors').clear();
          record.transitionTo('inFlight');
        },

        rolledBack: function(record) {
          ember$data$lib$system$model$states$$get(record, 'errors').clear();
          record.triggerLater('ready');
        },

        becameValid: function(record) {
          record.transitionTo('uncommitted');
        },

        invokeLifecycleCallbacks: function(record) {
          record.triggerLater('becameInvalid', record);
        },

        exit: function(record) {
          record._inFlightAttributes = {};
        }
      }
    };

    // The created and updated states are created outside the state
    // chart so we can reopen their substates and add mixins as
    // necessary.

    function ember$data$lib$system$model$states$$deepClone(object) {
      var clone = {};
      var value;

      for (var prop in object) {
        value = object[prop];
        if (value && typeof value === 'object') {
          clone[prop] = ember$data$lib$system$model$states$$deepClone(value);
        } else {
          clone[prop] = value;
        }
      }

      return clone;
    }

    function ember$data$lib$system$model$states$$mixin(original, hash) {
      for (var prop in hash) {
        original[prop] = hash[prop];
      }

      return original;
    }

    function ember$data$lib$system$model$states$$dirtyState(options) {
      var newState = ember$data$lib$system$model$states$$deepClone(ember$data$lib$system$model$states$$DirtyState);
      return ember$data$lib$system$model$states$$mixin(newState, options);
    }

    var ember$data$lib$system$model$states$$createdState = ember$data$lib$system$model$states$$dirtyState({
      dirtyType: 'created',
      // FLAGS
      isNew: true
    });

    ember$data$lib$system$model$states$$createdState.uncommitted.rolledBack = function(record) {
      record.transitionTo('deleted.saved');
    };

    var ember$data$lib$system$model$states$$updatedState = ember$data$lib$system$model$states$$dirtyState({
      dirtyType: 'updated'
    });

    ember$data$lib$system$model$states$$createdState.uncommitted.deleteRecord = function(record) {
      record.disconnectRelationships();
      record.transitionTo('deleted.saved');
    };

    ember$data$lib$system$model$states$$createdState.uncommitted.rollback = function(record) {
      ember$data$lib$system$model$states$$DirtyState.uncommitted.rollback.apply(this, arguments);
      record.transitionTo('deleted.saved');
    };

    ember$data$lib$system$model$states$$createdState.uncommitted.pushedData = function(record) {
      record.transitionTo('loaded.updated.uncommitted');
      record.triggerLater('didLoad');
    };

    ember$data$lib$system$model$states$$createdState.uncommitted.propertyWasReset = Ember.K;

    function ember$data$lib$system$model$states$$assertAgainstUnloadRecord(record) {
      Ember.assert("You can only unload a record which is not inFlight. `" + Ember.inspect(record) + "`", false);
    }

    ember$data$lib$system$model$states$$updatedState.inFlight.unloadRecord = ember$data$lib$system$model$states$$assertAgainstUnloadRecord;

    ember$data$lib$system$model$states$$updatedState.uncommitted.deleteRecord = function(record) {
      record.transitionTo('deleted.uncommitted');
      record.disconnectRelationships();
    };

    var ember$data$lib$system$model$states$$RootState = {
      // FLAGS
      isEmpty: false,
      isLoading: false,
      isLoaded: false,
      isDirty: false,
      isSaving: false,
      isDeleted: false,
      isNew: false,
      isValid: true,

      // DEFAULT EVENTS

      // Trying to roll back if you're not in the dirty state
      // doesn't change your state. For example, if you're in the
      // in-flight state, rolling back the record doesn't move
      // you out of the in-flight state.
      rolledBack: Ember.K,
      unloadRecord: function(record) {
        // clear relationships before moving to deleted state
        // otherwise it fails
        record.clearRelationships();
        record.transitionTo('deleted.saved');
      },


      propertyWasReset: Ember.K,

      // SUBSTATES

      // A record begins its lifecycle in the `empty` state.
      // If its data will come from the adapter, it will
      // transition into the `loading` state. Otherwise, if
      // the record is being created on the client, it will
      // transition into the `created` state.
      empty: {
        isEmpty: true,

        // EVENTS
        loadingData: function(record, promise) {
          record._loadingPromise = promise;
          record.transitionTo('loading');
        },

        loadedData: function(record) {
          record.transitionTo('loaded.created.uncommitted');
          record.triggerLater('ready');
        },

        pushedData: function(record) {
          record.transitionTo('loaded.saved');
          record.triggerLater('didLoad');
          record.triggerLater('ready');
        }
      },

      // A record enters this state when the store asks
      // the adapter for its data. It remains in this state
      // until the adapter provides the requested data.
      //
      // Usually, this process is asynchronous, using an
      // XHR to retrieve the data.
      loading: {
        // FLAGS
        isLoading: true,

        exit: function(record) {
          record._loadingPromise = null;
        },

        // EVENTS
        pushedData: function(record) {
          record.transitionTo('loaded.saved');
          record.triggerLater('didLoad');
          record.triggerLater('ready');
          ember$data$lib$system$model$states$$set(record, 'isError', false);
        },

        becameError: function(record) {
          record.triggerLater('becameError', record);
        },

        notFound: function(record) {
          record.transitionTo('empty');
        }
      },

      // A record enters this state when its data is populated.
      // Most of a record's lifecycle is spent inside substates
      // of the `loaded` state.
      loaded: {
        initialState: 'saved',

        // FLAGS
        isLoaded: true,

        //TODO(Igor) Reloading now triggers a loadingData event,
        //but it should be ok?
        loadingData: Ember.K,

        // SUBSTATES

        // If there are no local changes to a record, it remains
        // in the `saved` state.
        saved: {
          setup: function(record) {
            var attrs = record._attributes;
            var isDirty = Ember.keys(attrs).length > 0;

            if (isDirty) {
              record.adapterDidDirty();
            }
          },

          // EVENTS
          didSetProperty: ember$data$lib$system$model$states$$didSetProperty,

          pushedData: Ember.K,

          becomeDirty: function(record) {
            record.transitionTo('updated.uncommitted');
          },

          willCommit: function(record) {
            record.transitionTo('updated.inFlight');
          },

          reloadRecord: function(record, resolve) {
            resolve(ember$data$lib$system$model$states$$get(record, 'store').reloadRecord(record));
          },

          deleteRecord: function(record) {
            record.transitionTo('deleted.uncommitted');
            record.disconnectRelationships();
          },

          unloadRecord: function(record) {
            // clear relationships before moving to deleted state
            // otherwise it fails
            record.clearRelationships();
            record.transitionTo('deleted.saved');
          },

          didCommit: function(record) {
            record.send('invokeLifecycleCallbacks', ember$data$lib$system$model$states$$get(record, 'lastDirtyType'));
          },

          // loaded.saved.notFound would be triggered by a failed
          // `reload()` on an unchanged record
          notFound: Ember.K

        },

        // A record is in this state after it has been locally
        // created but before the adapter has indicated that
        // it has been saved.
        created: ember$data$lib$system$model$states$$createdState,

        // A record is in this state if it has already been
        // saved to the server, but there are new local changes
        // that have not yet been saved.
        updated: ember$data$lib$system$model$states$$updatedState
      },

      // A record is in this state if it was deleted from the store.
      deleted: {
        initialState: 'uncommitted',
        dirtyType: 'deleted',

        // FLAGS
        isDeleted: true,
        isLoaded: true,
        isDirty: true,

        // TRANSITIONS
        setup: function(record) {
          record.updateRecordArrays();
        },

        // SUBSTATES

        // When a record is deleted, it enters the `start`
        // state. It will exit this state when the record
        // starts to commit.
        uncommitted: {

          // EVENTS

          willCommit: function(record) {
            record.transitionTo('inFlight');
          },

          rollback: function(record) {
            record.rollback();
            record.triggerLater('ready');
          },

          becomeDirty: Ember.K,
          deleteRecord: Ember.K,

          rolledBack: function(record) {
            record.transitionTo('loaded.saved');
            record.triggerLater('ready');
          }
        },

        // After a record starts committing, but
        // before the adapter indicates that the deletion
        // has saved to the server, a record is in the
        // `inFlight` substate of `deleted`.
        inFlight: {
          // FLAGS
          isSaving: true,

          // EVENTS

          unloadRecord: ember$data$lib$system$model$states$$assertAgainstUnloadRecord,

          // TODO: More robust semantics around save-while-in-flight
          willCommit: Ember.K,
          didCommit: function(record) {
            record.transitionTo('saved');

            record.send('invokeLifecycleCallbacks');
          },

          becameError: function(record) {
            record.transitionTo('uncommitted');
            record.triggerLater('becameError', record);
          }
        },

        // Once the adapter indicates that the deletion has
        // been saved, the record enters the `saved` substate
        // of `deleted`.
        saved: {
          // FLAGS
          isDirty: false,

          setup: function(record) {
            var store = ember$data$lib$system$model$states$$get(record, 'store');
            store._dematerializeRecord(record);
          },

          invokeLifecycleCallbacks: function(record) {
            record.triggerLater('didDelete', record);
            record.triggerLater('didCommit', record);
          },

          willCommit: Ember.K,

          didCommit: Ember.K
        }
      },

      invokeLifecycleCallbacks: function(record, dirtyType) {
        if (dirtyType === 'created') {
          record.triggerLater('didCreate', record);
        } else {
          record.triggerLater('didUpdate', record);
        }

        record.triggerLater('didCommit', record);
      }
    };

    function ember$data$lib$system$model$states$$wireState(object, parent, name) {
      /*jshint proto:true*/
      // TODO: Use Object.create and copy instead
      object = ember$data$lib$system$model$states$$mixin(parent ? Ember.create(parent) : {}, object);
      object.parentState = parent;
      object.stateName = name;

      for (var prop in object) {
        if (!object.hasOwnProperty(prop) || prop === 'parentState' || prop === 'stateName') { continue; }
        if (typeof object[prop] === 'object') {
          object[prop] = ember$data$lib$system$model$states$$wireState(object[prop], object, name + "." + prop);
        }
      }

      return object;
    }

    ember$data$lib$system$model$states$$RootState = ember$data$lib$system$model$states$$wireState(ember$data$lib$system$model$states$$RootState, null, "root");

    var ember$data$lib$system$model$states$$default = ember$data$lib$system$model$states$$RootState;
    var ember$data$lib$system$model$errors$$get = Ember.get;
    var ember$data$lib$system$model$errors$$isEmpty = Ember.isEmpty;
    var ember$data$lib$system$model$errors$$map = Ember.EnumerableUtils.map;

    var ember$data$lib$system$model$errors$$default = Ember.Object.extend(Ember.Enumerable, Ember.Evented, {
      /**
        Register with target handler

        @method registerHandlers
        @param {Object} target
        @param {Function} becameInvalid
        @param {Function} becameValid
      */
      registerHandlers: function(target, becameInvalid, becameValid) {
        this.on('becameInvalid', target, becameInvalid);
        this.on('becameValid', target, becameValid);
      },

      /**
        @property errorsByAttributeName
        @type {Ember.MapWithDefault}
        @private
      */
      errorsByAttributeName: Ember.reduceComputed("content", {
        initialValue: function() {
          return ember$data$lib$system$map$$MapWithDefault.create({
            defaultValue: function() {
              return Ember.A();
            }
          });
        },

        addedItem: function(errors, error) {
          errors.get(error.attribute).pushObject(error);

          return errors;
        },

        removedItem: function(errors, error) {
          errors.get(error.attribute).removeObject(error);

          return errors;
        }
      }),

      /**
        Returns errors for a given attribute

        ```javascript
        var user = store.createRecord('user', {
          username: 'tomster',
          email: 'invalidEmail'
        });
        user.save().catch(function(){
          user.get('errors').errorsFor('email'); // returns:
          // [{attribute: "email", message: "Doesn't look like a valid email."}]
        });
        ```

        @method errorsFor
        @param {String} attribute
        @return {Array}
      */
      errorsFor: function(attribute) {
        return ember$data$lib$system$model$errors$$get(this, 'errorsByAttributeName').get(attribute);
      },

      /**
        An array containing all of the error messages for this
        record. This is useful for displaying all errors to the user.

        ```handlebars
        {{#each message in model.errors.messages}}
          <div class="error">
            {{message}}
          </div>
        {{/each}}
        ```

        @property messages
        @type {Array}
      */
      messages: Ember.computed.mapBy('content', 'message'),

      /**
        @property content
        @type {Array}
        @private
      */
      content: Ember.computed(function() {
        return Ember.A();
      }),

      /**
        @method unknownProperty
        @private
      */
      unknownProperty: function(attribute) {
        var errors = this.errorsFor(attribute);
        if (ember$data$lib$system$model$errors$$isEmpty(errors)) { return null; }
        return errors;
      },

      /**
        @method nextObject
        @private
      */
      nextObject: function(index, previousObject, context) {
        return ember$data$lib$system$model$errors$$get(this, 'content').objectAt(index);
      },

      /**
        Total number of errors.

        @property length
        @type {Number}
        @readOnly
      */
      length: Ember.computed.oneWay('content.length').readOnly(),

      /**
        @property isEmpty
        @type {Boolean}
        @readOnly
      */
      isEmpty: Ember.computed.not('length').readOnly(),

      /**
        Adds error messages to a given attribute and sends
        `becameInvalid` event to the record.

        Example:

        ```javascript
        if (!user.get('username') {
          user.get('errors').add('username', 'This field is required');
        }
        ```

        @method add
        @param {String} attribute
        @param {Array|String} messages
      */
      add: function(attribute, messages) {
        var wasEmpty = ember$data$lib$system$model$errors$$get(this, 'isEmpty');

        messages = this._findOrCreateMessages(attribute, messages);
        ember$data$lib$system$model$errors$$get(this, 'content').addObjects(messages);

        this.notifyPropertyChange(attribute);
        this.enumerableContentDidChange();

        if (wasEmpty && !ember$data$lib$system$model$errors$$get(this, 'isEmpty')) {
          this.trigger('becameInvalid');
        }
      },

      /**
        @method _findOrCreateMessages
        @private
      */
      _findOrCreateMessages: function(attribute, messages) {
        var errors = this.errorsFor(attribute);

        return ember$data$lib$system$model$errors$$map(Ember.makeArray(messages), function(message) {
          return errors.findBy('message', message) || {
            attribute: attribute,
            message: message
          };
        });
      },

      /**
        Removes all error messages from the given attribute and sends
        `becameValid` event to the record if there no more errors left.

        Example:

        ```javascript
        App.User = DS.Model.extend({
          email: DS.attr('string'),
          twoFactorAuth: DS.attr('boolean'),
          phone: DS.attr('string')
        });

        App.UserEditRoute = Ember.Route.extend({
          actions: {
            save: function(user) {
               if (!user.get('twoFactorAuth')) {
                 user.get('errors').remove('phone');
               }
               user.save();
             }
          }
        });
        ```

        @method remove
        @param {String} attribute
      */
      remove: function(attribute) {
        if (ember$data$lib$system$model$errors$$get(this, 'isEmpty')) { return; }

        var content = ember$data$lib$system$model$errors$$get(this, 'content').rejectBy('attribute', attribute);
        ember$data$lib$system$model$errors$$get(this, 'content').setObjects(content);

        this.notifyPropertyChange(attribute);
        this.enumerableContentDidChange();

        if (ember$data$lib$system$model$errors$$get(this, 'isEmpty')) {
          this.trigger('becameValid');
        }
      },

      /**
        Removes all error messages and sends `becameValid` event
        to the record.

        Example:

        ```javascript
        App.UserEditRoute = Ember.Route.extend({
          actions: {
            retrySave: function(user) {
               user.get('errors').clear();
               user.save();
             }
          }
        });
        ```

        @method clear
      */
      clear: function() {
        if (ember$data$lib$system$model$errors$$get(this, 'isEmpty')) { return; }

        ember$data$lib$system$model$errors$$get(this, 'content').clear();
        this.enumerableContentDidChange();

        this.trigger('becameValid');
      },

      /**
        Checks if there is error messages for the given attribute.

        ```javascript
        App.UserEditRoute = Ember.Route.extend({
          actions: {
            save: function(user) {
               if (user.get('errors').has('email')) {
                 return alert('Please update your email before attempting to save.');
               }
               user.save();
             }
          }
        });
        ```

        @method has
        @param {String} attribute
        @return {Boolean} true if there some errors on given attribute
      */
      has: function(attribute) {
        return !ember$data$lib$system$model$errors$$isEmpty(this.errorsFor(attribute));
      }
    });

    function ember$data$lib$system$merge$$merge(original, updates) {
      if (!updates || typeof updates !== 'object') {
        return original;
      }

      var props = Ember.keys(updates);
      var prop;
      var length = props.length;

      for (var i = 0; i < length; i++) {
        prop = props[i];
        original[prop] = updates[prop];
      }

      return original;
    }

    var ember$data$lib$system$merge$$default = ember$data$lib$system$merge$$merge;

    var ember$data$lib$system$relationships$state$relationship$$forEach = Ember.EnumerableUtils.forEach;

    var ember$data$lib$system$relationships$state$relationship$$Relationship = function(store, record, inverseKey, relationshipMeta) {
      this.members = new ember$data$lib$system$map$$OrderedSet();
      this.canonicalMembers = new ember$data$lib$system$map$$OrderedSet();
      this.store = store;
      this.key = relationshipMeta.key;
      this.inverseKey = inverseKey;
      this.record = record;
      this.isAsync = relationshipMeta.options.async;
      this.relationshipMeta = relationshipMeta;
      //This probably breaks for polymorphic relationship in complex scenarios, due to
      //multiple possible typeKeys
      this.inverseKeyForImplicit = this.store.modelFor(this.record.constructor).typeKey + this.key;
      this.linkPromise = null;
    };

    ember$data$lib$system$relationships$state$relationship$$Relationship.prototype = {
      constructor: ember$data$lib$system$relationships$state$relationship$$Relationship,

      destroy: Ember.K,

      clear: function() {
        var members = this.members.list;
        var member;

        while (members.length > 0) {
          member = members[0];
          this.removeRecord(member);
        }
      },

      disconnect: function() {
        this.members.forEach(function(member) {
          this.removeRecordFromInverse(member);
        }, this);
      },

      reconnect: function() {
        this.members.forEach(function(member) {
          this.addRecordToInverse(member);
        }, this);
      },

      removeRecords: function(records) {
        var self = this;
        ember$data$lib$system$relationships$state$relationship$$forEach(records, function(record) {
          self.removeRecord(record);
        });
      },

      addRecords: function(records, idx) {
        var self = this;
        ember$data$lib$system$relationships$state$relationship$$forEach(records, function(record) {
          self.addRecord(record, idx);
          if (idx !== undefined) {
            idx++;
          }
        });
      },

      addCanonicalRecords: function(records, idx) {
        for (var i=0; i<records.length; i++) {
          if (idx !== undefined) {
            this.addCanonicalRecord(records[i], i+idx);
          } else {
            this.addCanonicalRecord(records[i]);
          }
        }
      },

      addCanonicalRecord: function(record, idx) {
        if (!this.canonicalMembers.has(record)) {
          this.canonicalMembers.add(record);
          if (this.inverseKey) {
            record._relationships[this.inverseKey].addCanonicalRecord(this.record);
          } else {
            if (!record._implicitRelationships[this.inverseKeyForImplicit]) {
              record._implicitRelationships[this.inverseKeyForImplicit] = new ember$data$lib$system$relationships$state$relationship$$Relationship(this.store, record, this.key,  { options: {} });
            }
            record._implicitRelationships[this.inverseKeyForImplicit].addCanonicalRecord(this.record);
          }
        }
        this.flushCanonicalLater();
      },

      removeCanonicalRecords: function(records, idx) {
        for (var i=0; i<records.length; i++) {
          if (idx !== undefined) {
            this.removeCanonicalRecord(records[i], i+idx);
          } else {
            this.removeCanonicalRecord(records[i]);
          }
        }
      },

      removeCanonicalRecord: function(record, idx) {
        if (this.canonicalMembers.has(record)) {
          this.removeCanonicalRecordFromOwn(record);
          if (this.inverseKey) {
            this.removeCanonicalRecordFromInverse(record);
          } else {
            if (record._implicitRelationships[this.inverseKeyForImplicit]) {
              record._implicitRelationships[this.inverseKeyForImplicit].removeCanonicalRecord(this.record);
            }
          }
        }
        this.flushCanonicalLater();
      },

      addRecord: function(record, idx) {
        if (!this.members.has(record)) {
          this.members.add(record);
          this.notifyRecordRelationshipAdded(record, idx);
          if (this.inverseKey) {
            record._relationships[this.inverseKey].addRecord(this.record);
          } else {
            if (!record._implicitRelationships[this.inverseKeyForImplicit]) {
              record._implicitRelationships[this.inverseKeyForImplicit] = new ember$data$lib$system$relationships$state$relationship$$Relationship(this.store, record, this.key,  { options: {} });
            }
            record._implicitRelationships[this.inverseKeyForImplicit].addRecord(this.record);
          }
          this.record.updateRecordArraysLater();
        }
      },

      removeRecord: function(record) {
        if (this.members.has(record)) {
          this.removeRecordFromOwn(record);
          if (this.inverseKey) {
            this.removeRecordFromInverse(record);
          } else {
            if (record._implicitRelationships[this.inverseKeyForImplicit]) {
              record._implicitRelationships[this.inverseKeyForImplicit].removeRecord(this.record);
            }
          }
        }
      },

      addRecordToInverse: function(record) {
        if (this.inverseKey) {
          record._relationships[this.inverseKey].addRecord(this.record);
        }
      },

      removeRecordFromInverse: function(record) {
        var inverseRelationship = record._relationships[this.inverseKey];
        //Need to check for existence, as the record might unloading at the moment
        if (inverseRelationship) {
          inverseRelationship.removeRecordFromOwn(this.record);
        }
      },

      removeRecordFromOwn: function(record) {
        this.members["delete"](record);
        this.notifyRecordRelationshipRemoved(record);
        this.record.updateRecordArrays();
      },

      removeCanonicalRecordFromInverse: function(record) {
        var inverseRelationship = record._relationships[this.inverseKey];
        //Need to check for existence, as the record might unloading at the moment
        if (inverseRelationship) {
          inverseRelationship.removeCanonicalRecordFromOwn(this.record);
        }
      },

      removeCanonicalRecordFromOwn: function(record) {
        this.canonicalMembers["delete"](record);
        this.flushCanonicalLater();
      },

      flushCanonical: function() {
        this.willSync = false;
        //a hack for not removing new records
        //TODO remove once we have proper diffing
        var newRecords = [];
        for (var i=0; i<this.members.list.length; i++) {
          if (this.members.list[i].get('isNew')) {
            newRecords.push(this.members.list[i]);
          }
        }
        //TODO(Igor) make this less abysmally slow
        this.members = this.canonicalMembers.copy();
        for (i=0; i<newRecords.length; i++) {
          this.members.add(newRecords[i]);
        }
      },

      flushCanonicalLater: function() {
        if (this.willSync) {
          return;
        }
        this.willSync = true;
        var self = this;
        this.store._backburner.join(function() {
          self.store._backburner.schedule('syncRelationships', self, self.flushCanonical);
        });
      },

      updateLink: function(link) {
        Ember.warn("You have pushed a record of type '" + this.record.constructor.typeKey + "' with '" + this.key + "' as a link, but the association is not an async relationship.", this.isAsync);
        Ember.assert("You have pushed a record of type '" + this.record.constructor.typeKey + "' with '" + this.key + "' as a link, but the value of that link is not a string.", typeof link === 'string' || link === null);
        if (link !== this.link) {
          this.link = link;
          this.linkPromise = null;
          this.record.notifyPropertyChange(this.key);
        }
      },

      findLink: function() {
        if (this.linkPromise) {
          return this.linkPromise;
        } else {
          var promise = this.fetchLink();
          this.linkPromise = promise;
          return promise.then(function(result) {
            return result;
          });
        }
      },

      updateRecordsFromAdapter: function(records) {
        //TODO(Igor) move this to a proper place
        var self = this;
        //TODO Once we have adapter support, we need to handle updated and canonical changes
        self.computeChanges(records);
      },

      notifyRecordRelationshipAdded: Ember.K,
      notifyRecordRelationshipRemoved: Ember.K
    };




    var ember$data$lib$system$relationships$state$relationship$$default = ember$data$lib$system$relationships$state$relationship$$Relationship;

    var ember$data$lib$system$relationships$state$has_many$$ManyRelationship = function(store, record, inverseKey, relationshipMeta) {
      this._super$constructor(store, record, inverseKey, relationshipMeta);
      this.belongsToType = relationshipMeta.type;
      this.canonicalState = [];
      this.manyArray = ember$data$lib$system$record_arrays$many_array$$default.create({
        canonicalState: this.canonicalState,
        store: this.store,
        relationship: this,
        type: this.belongsToType,
        record: record
      });
      this.isPolymorphic = relationshipMeta.options.polymorphic;
      this.manyArray.isPolymorphic = this.isPolymorphic;
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype = Ember.create(ember$data$lib$system$relationships$state$relationship$$default.prototype);
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.constructor = ember$data$lib$system$relationships$state$has_many$$ManyRelationship;
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype._super$constructor = ember$data$lib$system$relationships$state$relationship$$default;

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.destroy = function() {
      this.manyArray.destroy();
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype._super$addCanonicalRecord = ember$data$lib$system$relationships$state$relationship$$default.prototype.addCanonicalRecord;
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.addCanonicalRecord = function(record, idx) {
      if (this.canonicalMembers.has(record)) {
        return;
      }
      if (idx !== undefined) {
        this.canonicalState.splice(idx, 0, record);
      } else {
        this.canonicalState.push(record);
      }
      this._super$addCanonicalRecord(record, idx);
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype._super$addRecord = ember$data$lib$system$relationships$state$relationship$$default.prototype.addRecord;
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.addRecord = function(record, idx) {
      if (this.members.has(record)) {
        return;
      }
      this._super$addRecord(record, idx);
      this.manyArray.internalAddRecords([record], idx);
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype._super$removeCanonicalRecordFromOwn = ember$data$lib$system$relationships$state$relationship$$default.prototype.removeCanonicalRecordFromOwn;
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.removeCanonicalRecordFromOwn = function(record, idx) {
      var i = idx;
      if (!this.canonicalMembers.has(record)) {
        return;
      }
      if (i === undefined) {
        i = this.canonicalState.indexOf(record);
      }
      if (i > -1) {
        this.canonicalState.splice(i, 1);
      }
      this._super$removeCanonicalRecordFromOwn(record, idx);
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype._super$flushCanonical = ember$data$lib$system$relationships$state$relationship$$default.prototype.flushCanonical;
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.flushCanonical = function() {
      this.manyArray.flushCanonical();
      this._super$flushCanonical();
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype._super$removeRecordFromOwn = ember$data$lib$system$relationships$state$relationship$$default.prototype.removeRecordFromOwn;
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.removeRecordFromOwn = function(record, idx) {
      if (!this.members.has(record)) {
        return;
      }
      this._super$removeRecordFromOwn(record, idx);
      if (idx !== undefined) {
        //TODO(Igor) not used currently, fix
        this.manyArray.currentState.removeAt(idx);
      } else {
        this.manyArray.internalRemoveRecords([record]);
      }
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.notifyRecordRelationshipAdded = function(record, idx) {
      var type = this.relationshipMeta.type;
      Ember.assert("You cannot add '" + record.constructor.typeKey + "' records to the " + this.record.constructor.typeKey + "." + this.key + " relationship (only '" + this.belongsToType.typeKey + "' allowed)", (function () {
        if (record instanceof type) {
          return true;
        } else if (Ember.MODEL_FACTORY_INJECTIONS) {
          return record instanceof type.superclass;
        }

        return false;
      })());

      this.record.notifyHasManyAdded(this.key, record, idx);
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.reload = function() {
      var self = this;
      if (this.link) {
        return this.fetchLink();
      } else {
        return this.store.scheduleFetchMany(this.manyArray.toArray()).then(function() {
          //Goes away after the manyArray refactor
          self.manyArray.set('isLoaded', true);
          return self.manyArray;
        });
      }
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.computeChanges = function(records) {
      var members = this.canonicalMembers;
      var recordsToRemove = [];
      var length;
      var record;
      var i;

      records = ember$data$lib$system$relationships$state$has_many$$setForArray(records);

      members.forEach(function(member) {
        if (records.has(member)) { return; }

        recordsToRemove.push(member);
      });

      this.removeCanonicalRecords(recordsToRemove);

      // Using records.toArray() since currently using
      // removeRecord can modify length, messing stuff up
      // forEach since it directly looks at "length" each
      // iteration
      records = records.toArray();
      length = records.length;
      for (i = 0; i < length; i++) {
        record = records[i];
        this.removeCanonicalRecord(record);
        this.addCanonicalRecord(record, i);
      }
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.fetchLink = function() {
      var self = this;
      return this.store.findHasMany(this.record, this.link, this.relationshipMeta).then(function(records) {
        self.updateRecordsFromAdapter(records);
        return self.manyArray;
      });
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.findRecords = function() {
      var manyArray = this.manyArray;
      return this.store.findMany(manyArray.toArray()).then(function() {
        //Goes away after the manyArray refactor
        manyArray.set('isLoaded', true);
        return manyArray;
      });
    };
    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.notifyHasManyChanged = function() {
      this.record.notifyHasManyAdded(this.key);
    };

    ember$data$lib$system$relationships$state$has_many$$ManyRelationship.prototype.getRecords = function() {
      //TODO(Igor) sync server here, once our syncing is not stupid
      if (this.isAsync) {
        var self = this;
        var promise;
        if (this.link) {
          promise = this.findLink().then(function() {
            return self.findRecords();
          });
        } else {
          promise = this.findRecords();
        }
        return ember$data$lib$system$promise_proxies$$PromiseManyArray.create({
          content: this.manyArray,
          promise: promise
        });
      } else {
        Ember.assert("You looked up the '" + this.key + "' relationship on a '" + this.record.constructor.typeKey + "' with id " + this.record.get('id') +  " but some of the associated records were not loaded. Either make sure they are all loaded together with the parent record, or specify that the relationship is async (`DS.hasMany({ async: true })`)", this.manyArray.isEvery('isEmpty', false));

        //TODO(Igor) WTF DO I DO HERE?
        if (!this.manyArray.get('isDestroyed')) {
          this.manyArray.set('isLoaded', true);
        }
        return this.manyArray;
      }
    };

    function ember$data$lib$system$relationships$state$has_many$$setForArray(array) {
      var set = new ember$data$lib$system$map$$OrderedSet();

      if (array) {
        for (var i=0, l=array.length; i<l; i++) {
          set.add(array[i]);
        }
      }

      return set;
    }

    var ember$data$lib$system$relationships$state$has_many$$default = ember$data$lib$system$relationships$state$has_many$$ManyRelationship;

    var ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship = function(store, record, inverseKey, relationshipMeta) {
      this._super$constructor(store, record, inverseKey, relationshipMeta);
      this.record = record;
      this.key = relationshipMeta.key;
      this.inverseRecord = null;
      this.canonicalState = null;
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype = Ember.create(ember$data$lib$system$relationships$state$relationship$$default.prototype);
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.constructor = ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship;
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype._super$constructor = ember$data$lib$system$relationships$state$relationship$$default;

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.setRecord = function(newRecord) {
      if (newRecord) {
        this.addRecord(newRecord);
      } else if (this.inverseRecord) {
        this.removeRecord(this.inverseRecord);
      }
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.setCanonicalRecord = function(newRecord) {
      if (newRecord) {
        this.addCanonicalRecord(newRecord);
      } else if (this.inverseRecord) {
        this.removeCanonicalRecord(this.inverseRecord);
      }
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype._super$addCanonicalRecord = ember$data$lib$system$relationships$state$relationship$$default.prototype.addCanonicalRecord;
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.addCanonicalRecord = function(newRecord) {
      if (this.canonicalMembers.has(newRecord)) { return;}

      if (this.canonicalState) {
        this.removeCanonicalRecord(this.canonicalState);
      }

      this.canonicalState = newRecord;
      this._super$addCanonicalRecord(newRecord);
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype._super$flushCanonical = ember$data$lib$system$relationships$state$relationship$$default.prototype.flushCanonical;
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.flushCanonical = function() {
      //temporary fix to not remove newly created records if server returned null.
      //TODO remove once we have proper diffing
      if (this.inverseRecord && this.inverseRecord.get('isNew') && !this.canonicalState) {
        return;
      }
      this.inverseRecord = this.canonicalState;
      this.record.notifyBelongsToChanged(this.key);
      this._super$flushCanonical();
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype._super$addRecord = ember$data$lib$system$relationships$state$relationship$$default.prototype.addRecord;
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.addRecord = function(newRecord) {
      if (this.members.has(newRecord)) { return;}
      var type = this.relationshipMeta.type;
      Ember.assert("You can only add a '" + type.typeKey + "' record to this relationship", (function () {
        if (newRecord instanceof type) {
          return true;
        } else if (Ember.MODEL_FACTORY_INJECTIONS) {
          return newRecord instanceof type.superclass;
        }

        return false;
      })());

      if (this.inverseRecord) {
        this.removeRecord(this.inverseRecord);
      }

      this.inverseRecord = newRecord;
      this._super$addRecord(newRecord);
      this.record.notifyBelongsToChanged(this.key);
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.setRecordPromise = function(newPromise) {
      var content = newPromise.get && newPromise.get('content');
      Ember.assert("You passed in a promise that did not originate from an EmberData relationship. You can only pass promises that come from a belongsTo or hasMany relationship to the get call.", content !== undefined);
      this.setRecord(content);
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype._super$removeRecordFromOwn = ember$data$lib$system$relationships$state$relationship$$default.prototype.removeRecordFromOwn;
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.removeRecordFromOwn = function(record) {
      if (!this.members.has(record)) { return;}
      this.inverseRecord = null;
      this._super$removeRecordFromOwn(record);
      this.record.notifyBelongsToChanged(this.key);
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype._super$removeCanonicalRecordFromOwn = ember$data$lib$system$relationships$state$relationship$$default.prototype.removeCanonicalRecordFromOwn;
    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.removeCanonicalRecordFromOwn = function(record) {
      if (!this.canonicalMembers.has(record)) { return;}
      this.canonicalState = null;
      this._super$removeCanonicalRecordFromOwn(record);
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.findRecord = function() {
      if (this.inverseRecord) {
        return this.store._findByRecord(this.inverseRecord);
      } else {
        return Ember.RSVP.Promise.resolve(null);
      }
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.fetchLink = function() {
      var self = this;
      return this.store.findBelongsTo(this.record, this.link, this.relationshipMeta).then(function(record) {
        if (record) {
          self.addRecord(record);
        }
        return record;
      });
    };

    ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship.prototype.getRecord = function() {
      //TODO(Igor) flushCanonical here once our syncing is not stupid
      if (this.isAsync) {
        var promise;
        if (this.link) {
          var self = this;
          promise = this.findLink().then(function() {
            return self.findRecord();
          });
        } else {
          promise = this.findRecord();
        }

        return ember$data$lib$system$promise_proxies$$PromiseObject.create({
          promise: promise,
          content: this.inverseRecord
        });
      } else {
        Ember.assert("You looked up the '" + this.key + "' relationship on a '" + this.record.constructor.typeKey + "' with id " + this.record.get('id') +  " but some of the associated records were not loaded. Either make sure they are all loaded together with the parent record, or specify that the relationship is async (`DS.belongsTo({ async: true })`)", this.inverseRecord === null || !this.inverseRecord.get('isEmpty'));
        return this.inverseRecord;
      }
    };

    var ember$data$lib$system$relationships$state$belongs_to$$default = ember$data$lib$system$relationships$state$belongs_to$$BelongsToRelationship;

    var ember$data$lib$system$relationships$state$create$$createRelationshipFor = function(record, relationshipMeta, store) {
      var inverseKey;
      var inverse = record.constructor.inverseFor(relationshipMeta.key);

      if (inverse) {
        inverseKey = inverse.name;
      }

      if (relationshipMeta.kind === 'hasMany') {
        return new ember$data$lib$system$relationships$state$has_many$$default(store, record, inverseKey, relationshipMeta);
      } else {
        return new ember$data$lib$system$relationships$state$belongs_to$$default(store, record, inverseKey, relationshipMeta);
      }
    };

    var ember$data$lib$system$relationships$state$create$$default = ember$data$lib$system$relationships$state$create$$createRelationshipFor;
    /**
      @module ember-data
    */

    var ember$data$lib$system$snapshot$$get = Ember.get;

    /**
      @class Snapshot
      @namespace DS
      @private
      @constructor
      @param {DS.Model} record The record to create a snapshot from
    */
    function ember$data$lib$system$snapshot$$Snapshot(record) {
      this._attributes = Ember.create(null);
      this._belongsToRelationships = Ember.create(null);
      this._belongsToIds = Ember.create(null);
      this._hasManyRelationships = Ember.create(null);
      this._hasManyIds = Ember.create(null);

      record.eachAttribute(function(keyName) {
        this._attributes[keyName] = ember$data$lib$system$snapshot$$get(record, keyName);
      }, this);

      this.id = ember$data$lib$system$snapshot$$get(record, 'id');
      this.record = record;
      this.type = record.constructor;
      this.typeKey = record.constructor.typeKey;

      // The following code is here to keep backwards compatibility when accessing
      // `constructor` directly.
      //
      // With snapshots you should use `type` instead of `constructor`.
      //
      // Remove for Ember Data 1.0.
      if (Ember.platform.hasPropertyAccessors) {
        var callDeprecate = true;

        Ember.defineProperty(this, 'constructor', {
          get: function() {
            // Ugly hack since accessing error.stack (done in `Ember.deprecate()`)
            // causes the internals of Chrome to access the constructor, which then
            // causes an infinite loop if accessed and calls `Ember.deprecate()`
            // again.
            if (callDeprecate) {
              callDeprecate = false;
              Ember.deprecate('Usage of `snapshot.constructor` is deprecated, use `snapshot.type` instead.');
              callDeprecate = true;
            }

            return this.type;
          }
        });
      } else {
        this.constructor = this.type;
      }
    }

    ember$data$lib$system$snapshot$$Snapshot.prototype = {
      constructor: ember$data$lib$system$snapshot$$Snapshot,

      /**
        The id of the snapshot's underlying record

        Example

        ```javascript
        var post = store.push('post', { id: 1, author: 'Tomster', title: 'Ember.js rocks' });
        var snapshot = post._createSnapshot();

        snapshot.id; // => '1'
        ```

        @property id
        @type {String}
      */
      id: null,

      /**
        The underlying record for this snapshot. Can be used to access methods and
        properties defined on the record.

        Example

        ```javascript
        var json = snapshot.record.toJSON();
        ```

        @property record
        @type {DS.Model}
      */
      record: null,

      /**
        The type of the underlying record for this snapshot, as a subclass of DS.Model.

        @property type
        @type {subclass of DS.Model}
      */
      type: null,

      /**
        The name of the type of the underlying record for this snapshot, as a string.

        @property typeKey
        @type {String}
      */
      typeKey: null,

      /**
        Returns the value of an attribute.

        Example

        ```javascript
        var post = store.createRecord('post', { author: 'Tomster', title: 'Ember.js rocks' });
        var snapshot = post._createSnapshot();

        snapshot.attr('author'); // => 'Tomster'
        snapshot.attr('title'); // => 'Ember.js rocks'
        ```

        Note: Values are loaded eagerly and cached when the snapshot is created.

        @method attr
        @param {String} keyName
        @return {Object} The attribute value or undefined
      */
      attr: function(keyName) {
        if (keyName in this._attributes) {
          return this._attributes[keyName];
        }
        throw new Ember.Error("Model '" + Ember.inspect(this.record) + "' has no attribute named '" + keyName + "' defined.");
      },

      /**
        Returns all attributes and their corresponding values.

        Example

        ```javascript
        var post = store.createRecord('post', { author: 'Tomster', title: 'Ember.js rocks' });
        var snapshot = post._createSnapshot();

        snapshot.attributes(); // => { author: 'Tomster', title: 'Ember.js rocks' }
        ```

        @method attributes
        @return {Array} All attributes for the current snapshot
      */
      attributes: function() {
        return Ember.copy(this._attributes);
      },

      /**
        Returns the current value of a belongsTo relationship.

        `belongsTo` takes an optional hash of options as a second parameter,
        currently supported options are:

       - `id`: set to `true` if you only want the ID of the related record to be
          returned.

        Example

        ```javascript
        var post = store.push('post', { id: 1, title: 'Hello World' });
        var comment = store.createRecord('comment', { body: 'Lorem ipsum', post: post });
        var snapshot = comment._createSnapshot();

        snapshot.belongsTo('post'); // => DS.Snapshot of post
        snapshot.belongsTo('post', { id: true }); // => '1'
        ```

        Calling `belongsTo` will return a new Snapshot as long as there's any
        data available, such as an ID. If there's no data available `belongsTo` will
        return undefined.

        Note: Relationships are loaded lazily and cached upon first access.

        @method belongsTo
        @param {String} keyName
        @param {Object} [options]
        @return {DS.Snapshot|String|undefined} A snapshot or ID of a belongsTo relationship, or undefined
      */
      belongsTo: function(keyName, options) {
        var id = options && options.id;
        var result;
        var relationship, inverseRecord;

        if (id && keyName in this._belongsToIds) {
          return this._belongsToIds[keyName];
        }

        if (!id && keyName in this._belongsToRelationships) {
          return this._belongsToRelationships[keyName];
        }

        relationship = this.record._relationships[keyName];
        if (!(relationship && relationship.relationshipMeta.kind === 'belongsTo')) {
          throw new Ember.Error("Model '" + Ember.inspect(this.record) + "' has no belongsTo relationship named '" + keyName + "' defined.");
        }

        inverseRecord = ember$data$lib$system$snapshot$$get(relationship, 'inverseRecord');
        if (id) {
          if (inverseRecord) {
            result = ember$data$lib$system$snapshot$$get(inverseRecord, 'id');
          }
          this._belongsToIds[keyName] = result;
        } else {
          if (inverseRecord) {
            result = inverseRecord._createSnapshot();
          }
          this._belongsToRelationships[keyName] = result;
        }

        return result;
      },

      /**
        Returns the current value of a hasMany relationship.

        `hasMany` takes an optional hash of options as a second parameter,
        currently supported options are:

       - `ids`: set to `true` if you only want the IDs of the related records to be
          returned.

        Example

        ```javascript
        var post = store.createRecord('post', { title: 'Hello World', comments: [2, 3] });
        var snapshot = post._createSnapshot();

        snapshot.hasMany('comments'); // => [DS.Snapshot, DS.Snapshot]
        snapshot.hasMany('comments', { ids: true }); // => ['2', '3']
        ```

        Note: Relationships are loaded lazily and cached upon first access.

        @method hasMany
        @param {String} keyName
        @param {Object} [options]
        @return {Array} An array of snapshots or IDs of a hasMany relationship
      */
      hasMany: function(keyName, options) {
        var ids = options && options.ids;
        var results = [];
        var relationship, members;

        if (ids && keyName in this._hasManyIds) {
          return this._hasManyIds[keyName];
        }

        if (!ids && keyName in this._hasManyRelationships) {
          return this._hasManyRelationships[keyName];
        }

        relationship = this.record._relationships[keyName];
        if (!(relationship && relationship.relationshipMeta.kind === 'hasMany')) {
          throw new Ember.Error("Model '" + Ember.inspect(this.record) + "' has no hasMany relationship named '" + keyName + "' defined.");
        }

        members = ember$data$lib$system$snapshot$$get(relationship, 'members');

        if (ids) {
          members.forEach(function(member) {
            results.push(ember$data$lib$system$snapshot$$get(member, 'id'));
          });
          this._hasManyIds[keyName] = results;
        } else {
          members.forEach(function(member) {
            results.push(member._createSnapshot());
          });
          this._hasManyRelationships[keyName] = results;
        }

        return results;
      },

      /**
        Iterates through all the attributes of the model, calling the passed
        function on each attribute.

        Example

        ```javascript
        snapshot.eachAttribute(function(name, meta) {
          // ...
        });
        ```

        @method eachAttribute
        @param {Function} callback the callback to execute
        @param {Object} [binding] the value to which the callback's `this` should be bound
      */
      eachAttribute: function(callback, binding) {
        this.record.eachAttribute(callback, binding);
      },

      /**
        Iterates through all the relationships of the model, calling the passed
        function on each relationship.

        Example

        ```javascript
        snapshot.eachRelationship(function(name, relationship) {
          // ...
        });
        ```

        @method eachRelationship
        @param {Function} callback the callback to execute
        @param {Object} [binding] the value to which the callback's `this` should be bound
      */
      eachRelationship: function(callback, binding) {
        this.record.eachRelationship(callback, binding);
      },

      /**
        @method get
        @param {String} keyName
        @return {Object} The property value
        @deprecated Use [attr](#method_attr), [belongsTo](#method_belongsTo) or [hasMany](#method_hasMany) instead
      */
      get: function(keyName) {
        Ember.deprecate('Using DS.Snapshot.get() is deprecated. Use .attr(), .belongsTo() or .hasMany() instead.');

        if (keyName === 'id') {
          return this.id;
        }

        if (keyName in this._attributes) {
          return this.attr(keyName);
        }

        var relationship = this.record._relationships[keyName];

        if (relationship && relationship.relationshipMeta.kind === 'belongsTo') {
          return this.belongsTo(keyName);
        }
        if (relationship && relationship.relationshipMeta.kind === 'hasMany') {
          return this.hasMany(keyName);
        }

        return ember$data$lib$system$snapshot$$get(this.record, keyName);
      },

      /**
        @method unknownProperty
        @param {String} keyName
        @return {Object} The property value
        @deprecated Use [attr](#method_attr), [belongsTo](#method_belongsTo) or [hasMany](#method_hasMany) instead
      */
      unknownProperty: function(keyName) {
        return this.get(keyName);
      }
    };

    var ember$data$lib$system$snapshot$$default = ember$data$lib$system$snapshot$$Snapshot;

    /**
      @module ember-data
    */

    var ember$data$lib$system$model$model$$get = Ember.get;
    var ember$data$lib$system$model$model$$set = Ember.set;
    var ember$data$lib$system$model$model$$Promise = Ember.RSVP.Promise;
    var ember$data$lib$system$model$model$$forEach = Ember.ArrayPolyfills.forEach;
    var ember$data$lib$system$model$model$$map = Ember.ArrayPolyfills.map;

    var ember$data$lib$system$model$model$$retrieveFromCurrentState = Ember.computed('currentState', function(key, value) {
      return ember$data$lib$system$model$model$$get(ember$data$lib$system$model$model$$get(this, 'currentState'), key);
    }).readOnly();

    var ember$data$lib$system$model$model$$_extractPivotNameCache = Ember.create(null);
    var ember$data$lib$system$model$model$$_splitOnDotCache = Ember.create(null);

    function ember$data$lib$system$model$model$$splitOnDot(name) {
      return ember$data$lib$system$model$model$$_splitOnDotCache[name] || (
        (ember$data$lib$system$model$model$$_splitOnDotCache[name] = name.split('.'))
      );
    }

    function ember$data$lib$system$model$model$$extractPivotName(name) {
      return ember$data$lib$system$model$model$$_extractPivotNameCache[name] || (
        (ember$data$lib$system$model$model$$_extractPivotNameCache[name] = ember$data$lib$system$model$model$$splitOnDot(name)[0])
      );
    }

    // Like Ember.merge, but instead returns a list of keys
    // for values that fail a strict equality check
    // instead of the original object.
    function ember$data$lib$system$model$model$$mergeAndReturnChangedKeys(original, updates) {
      var changedKeys = [];

      if (!updates || typeof updates !== 'object') {
        return changedKeys;
      }

      var keys   = Ember.keys(updates);
      var length = keys.length;
      var i, val, key;

      for (i = 0; i < length; i++) {
        key = keys[i];
        val = updates[key];

        if (original[key] !== val) {
          changedKeys.push(key);
        }

        original[key] = val;
      }
      return changedKeys;
    }

    /**

      The model class that all Ember Data records descend from.

      @class Model
      @namespace DS
      @extends Ember.Object
      @uses Ember.Evented
    */
    var ember$data$lib$system$model$model$$Model = Ember.Object.extend(Ember.Evented, {
      _recordArrays: undefined,
      _relationships: undefined,
      /**
        If this property is `true` the record is in the `empty`
        state. Empty is the first state all records enter after they have
        been created. Most records created by the store will quickly
        transition to the `loading` state if data needs to be fetched from
        the server or the `created` state if the record is created on the
        client. A record can also enter the empty state if the adapter is
        unable to locate the record.

        @property isEmpty
        @type {Boolean}
        @readOnly
      */
      isEmpty: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `loading` state. A
        record enters this state when the store asks the adapter for its
        data. It remains in this state until the adapter provides the
        requested data.

        @property isLoading
        @type {Boolean}
        @readOnly
      */
      isLoading: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `loaded` state. A
        record enters this state when its data is populated. Most of a
        record's lifecycle is spent inside substates of the `loaded`
        state.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isLoaded'); // true

        store.find('model', 1).then(function(model) {
          model.get('isLoaded'); // true
        });
        ```

        @property isLoaded
        @type {Boolean}
        @readOnly
      */
      isLoaded: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `dirty` state. The
        record has local changes that have not yet been saved by the
        adapter. This includes records that have been created (but not yet
        saved) or deleted.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isDirty'); // true

        store.find('model', 1).then(function(model) {
          model.get('isDirty'); // false
          model.set('foo', 'some value');
          model.get('isDirty'); // true
        });
        ```

        @property isDirty
        @type {Boolean}
        @readOnly
      */
      isDirty: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `saving` state. A
        record enters the saving state when `save` is called, but the
        adapter has not yet acknowledged that the changes have been
        persisted to the backend.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isSaving'); // false
        var promise = record.save();
        record.get('isSaving'); // true
        promise.then(function() {
          record.get('isSaving'); // false
        });
        ```

        @property isSaving
        @type {Boolean}
        @readOnly
      */
      isSaving: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `deleted` state
        and has been marked for deletion. When `isDeleted` is true and
        `isDirty` is true, the record is deleted locally but the deletion
        was not yet persisted. When `isSaving` is true, the change is
        in-flight. When both `isDirty` and `isSaving` are false, the
        change has persisted.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isDeleted');    // false
        record.deleteRecord();

        // Locally deleted
        record.get('isDeleted');    // true
        record.get('isDirty');      // true
        record.get('isSaving');     // false

        // Persisting the deletion
        var promise = record.save();
        record.get('isDeleted');    // true
        record.get('isSaving');     // true

        // Deletion Persisted
        promise.then(function() {
          record.get('isDeleted');  // true
          record.get('isSaving');   // false
          record.get('isDirty');    // false
        });
        ```

        @property isDeleted
        @type {Boolean}
        @readOnly
      */
      isDeleted: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `new` state. A
        record will be in the `new` state when it has been created on the
        client and the adapter has not yet report that it was successfully
        saved.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isNew'); // true

        record.save().then(function(model) {
          model.get('isNew'); // false
        });
        ```

        @property isNew
        @type {Boolean}
        @readOnly
      */
      isNew: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `valid` state.

        A record will be in the `valid` state when the adapter did not report any
        server-side validation failures.

        @property isValid
        @type {Boolean}
        @readOnly
      */
      isValid: ember$data$lib$system$model$model$$retrieveFromCurrentState,
      /**
        If the record is in the dirty state this property will report what
        kind of change has caused it to move into the dirty
        state. Possible values are:

        - `created` The record has been created by the client and not yet saved to the adapter.
        - `updated` The record has been updated by the client and not yet saved to the adapter.
        - `deleted` The record has been deleted by the client and not yet saved to the adapter.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('dirtyType'); // 'created'
        ```

        @property dirtyType
        @type {String}
        @readOnly
      */
      dirtyType: ember$data$lib$system$model$model$$retrieveFromCurrentState,

      /**
        If `true` the adapter reported that it was unable to save local
        changes to the backend for any reason other than a server-side
        validation error.

        Example

        ```javascript
        record.get('isError'); // false
        record.set('foo', 'valid value');
        record.save().then(null, function() {
          record.get('isError'); // true
        });
        ```

        @property isError
        @type {Boolean}
        @readOnly
      */
      isError: false,
      /**
        If `true` the store is attempting to reload the record form the adapter.

        Example

        ```javascript
        record.get('isReloading'); // false
        record.reload();
        record.get('isReloading'); // true
        ```

        @property isReloading
        @type {Boolean}
        @readOnly
      */
      isReloading: false,

      /**
        The `clientId` property is a transient numerical identifier
        generated at runtime by the data store. It is important
        primarily because newly created objects may not yet have an
        externally generated id.

        @property clientId
        @private
        @type {Number|String}
      */
      clientId: null,
      /**
        All ember models have an id property. This is an identifier
        managed by an external source. These are always coerced to be
        strings before being used internally. Note when declaring the
        attributes for a model it is an error to declare an id
        attribute.

        ```javascript
        var record = store.createRecord('model');
        record.get('id'); // null

        store.find('model', 1).then(function(model) {
          model.get('id'); // '1'
        });
        ```

        @property id
        @type {String}
      */
      id: null,

      /**
        @property currentState
        @private
        @type {Object}
      */
      currentState: ember$data$lib$system$model$states$$default.empty,

      /**
        When the record is in the `invalid` state this object will contain
        any errors returned by the adapter. When present the errors hash
        typically contains keys corresponding to the invalid property names
        and values which are an array of error messages.

        ```javascript
        record.get('errors.length'); // 0
        record.set('foo', 'invalid value');
        record.save().then(null, function() {
          record.get('errors').get('foo'); // ['foo should be a number.']
        });
        ```

        @property errors
        @type {DS.Errors}
      */
      errors: Ember.computed(function() {
        var errors = ember$data$lib$system$model$errors$$default.create();

        errors.registerHandlers(this, function() {
          this.send('becameInvalid');
        }, function() {
          this.send('becameValid');
        });

        return errors;
      }).readOnly(),

      /**
        Create a JSON representation of the record, using the serialization
        strategy of the store's adapter.

       `serialize` takes an optional hash as a parameter, currently
        supported options are:

       - `includeId`: `true` if the record's ID should be included in the
          JSON representation.

        @method serialize
        @param {Object} options
        @return {Object} an object whose values are primitive JSON values only
      */
      serialize: function(options) {
        var store = ember$data$lib$system$model$model$$get(this, 'store');
        return store.serialize(this, options);
      },

      /**
        Use [DS.JSONSerializer](DS.JSONSerializer.html) to
        get the JSON representation of a record.

        `toJSON` takes an optional hash as a parameter, currently
        supported options are:

        - `includeId`: `true` if the record's ID should be included in the
          JSON representation.

        @method toJSON
        @param {Object} options
        @return {Object} A JSON representation of the object.
      */
      toJSON: function(options) {
        // container is for lazy transform lookups
        var serializer = ember$data$lib$serializers$json_serializer$$default.create({ container: this.container });
        var snapshot = this._createSnapshot();

        return serializer.serialize(snapshot, options);
      },

      /**
        Fired when the record is ready to be interacted with,
        that is either loaded from the server or created locally.

        @event ready
      */
      ready: function() {
        this.store.recordArrayManager.recordWasLoaded(this);
      },
      /**
        Fired when the record is loaded from the server.

        @event didLoad
      */
      didLoad: Ember.K,

      /**
        Fired when the record is updated.

        @event didUpdate
      */
      didUpdate: Ember.K,

      /**
        Fired when the record is created.

        @event didCreate
      */
      didCreate: Ember.K,

      /**
        Fired when the record is deleted.

        @event didDelete
      */
      didDelete: Ember.K,

      /**
        Fired when the record becomes invalid.

        @event becameInvalid
      */
      becameInvalid: Ember.K,

      /**
        Fired when the record enters the error state.

        @event becameError
      */
      becameError: Ember.K,

      /**
        @property data
        @private
        @type {Object}
      */
      data: Ember.computed(function() {
        this._data = this._data || {};
        return this._data;
      }).readOnly(),

      _data: null,

      init: function() {
        this._super.apply(this, arguments);
        this._setup();
      },

      _setup: function() {
        this._changesToSync = {};
        this._deferredTriggers = [];
        this._data = {};
        this._attributes = Ember.create(null);
        this._inFlightAttributes = Ember.create(null);
        this._relationships = {};
        /*
          implicit relationships are relationship which have not been declared but the inverse side exists on
          another record somewhere
          For example if there was
          ```
            App.Comment = DS.Model.extend({
              name: DS.attr()
            })
          ```
          but there is also
          ```
            App.Post = DS.Model.extend({
              name: DS.attr(),
              comments: DS.hasMany('comment')
            })
          ```

          would have a implicit post relationship in order to be do things like remove ourselves from the post
          when we are deleted
        */
        this._implicitRelationships = Ember.create(null);
        var model = this;
        //TODO Move into a getter for better perf
        this.constructor.eachRelationship(function(key, descriptor) {
          model._relationships[key] = ember$data$lib$system$relationships$state$create$$default(model, descriptor, model.store);
        });

      },

      /**
        @method send
        @private
        @param {String} name
        @param {Object} context
      */
      send: function(name, context) {
        var currentState = ember$data$lib$system$model$model$$get(this, 'currentState');

        if (!currentState[name]) {
          this._unhandledEvent(currentState, name, context);
        }

        return currentState[name](this, context);
      },

      /**
        @method transitionTo
        @private
        @param {String} name
      */
      transitionTo: function(name) {
        // POSSIBLE TODO: Remove this code and replace with
        // always having direct references to state objects

        var pivotName = ember$data$lib$system$model$model$$extractPivotName(name);
        var currentState = ember$data$lib$system$model$model$$get(this, 'currentState');
        var state = currentState;

        do {
          if (state.exit) { state.exit(this); }
          state = state.parentState;
        } while (!state.hasOwnProperty(pivotName));

        var path = ember$data$lib$system$model$model$$splitOnDot(name);
        var setups = [];
        var enters = [];
        var i, l;

        for (i=0, l=path.length; i<l; i++) {
          state = state[path[i]];

          if (state.enter) { enters.push(state); }
          if (state.setup) { setups.push(state); }
        }

        for (i=0, l=enters.length; i<l; i++) {
          enters[i].enter(this);
        }

        ember$data$lib$system$model$model$$set(this, 'currentState', state);

        for (i=0, l=setups.length; i<l; i++) {
          setups[i].setup(this);
        }

        this.updateRecordArraysLater();
      },

      _unhandledEvent: function(state, name, context) {
        var errorMessage = "Attempted to handle event `" + name + "` ";
        errorMessage    += "on " + String(this) + " while in state ";
        errorMessage    += state.stateName + ". ";

        if (context !== undefined) {
          errorMessage  += "Called with " + Ember.inspect(context) + ".";
        }

        throw new Ember.Error(errorMessage);
      },

      withTransaction: function(fn) {
        var transaction = ember$data$lib$system$model$model$$get(this, 'transaction');
        if (transaction) { fn(transaction); }
      },

      /**
        @method loadingData
        @private
        @param {Promise} promise
      */
      loadingData: function(promise) {
        this.send('loadingData', promise);
      },

      /**
        @method loadedData
        @private
      */
      loadedData: function() {
        this.send('loadedData');
      },

      /**
        @method notFound
        @private
      */
      notFound: function() {
        this.send('notFound');
      },

      /**
        @method pushedData
        @private
      */
      pushedData: function() {
        this.send('pushedData');
      },

      /**
        Marks the record as deleted but does not save it. You must call
        `save` afterwards if you want to persist it. You might use this
        method if you want to allow the user to still `rollback()` a
        delete after it was made.

        Example

        ```javascript
        App.ModelDeleteRoute = Ember.Route.extend({
          actions: {
            softDelete: function() {
              this.controller.get('model').deleteRecord();
            },
            confirm: function() {
              this.controller.get('model').save();
            },
            undo: function() {
              this.controller.get('model').rollback();
            }
          }
        });
        ```

        @method deleteRecord
      */
      deleteRecord: function() {
        this.send('deleteRecord');
      },

      /**
        Same as `deleteRecord`, but saves the record immediately.

        Example

        ```javascript
        App.ModelDeleteRoute = Ember.Route.extend({
          actions: {
            delete: function() {
              var controller = this.controller;
              controller.get('model').destroyRecord().then(function() {
                controller.transitionToRoute('model.index');
              });
            }
          }
        });
        ```

        @method destroyRecord
        @return {Promise} a promise that will be resolved when the adapter returns
        successfully or rejected if the adapter returns with an error.
      */
      destroyRecord: function() {
        this.deleteRecord();
        return this.save();
      },

      /**
        @method unloadRecord
        @private
      */
      unloadRecord: function() {
        if (this.isDestroyed) { return; }

        this.send('unloadRecord');
      },

      /**
        @method clearRelationships
        @private
      */
      clearRelationships: function() {
        this.eachRelationship(function(name, relationship) {
          var rel = this._relationships[name];
          if (rel) {
            //TODO(Igor) figure out whether we want to clear or disconnect
            rel.clear();
            rel.destroy();
          }
        }, this);
      },

      disconnectRelationships: function() {
        this.eachRelationship(function(name, relationship) {
          this._relationships[name].disconnect();
        }, this);
        var model = this;
        ember$data$lib$system$model$model$$forEach.call(Ember.keys(this._implicitRelationships), function(key) {
          model._implicitRelationships[key].disconnect();
        });
      },

      reconnectRelationships: function() {
        this.eachRelationship(function(name, relationship) {
          this._relationships[name].reconnect();
        }, this);
        var model = this;
        ember$data$lib$system$model$model$$forEach.call(Ember.keys(this._implicitRelationships), function(key) {
          model._implicitRelationships[key].reconnect();
        });
      },


      /**
        @method updateRecordArrays
        @private
      */
      updateRecordArrays: function() {
        this._updatingRecordArraysLater = false;
        ember$data$lib$system$model$model$$get(this, 'store').dataWasUpdated(this.constructor, this);
      },

      /**
        When a find request is triggered on the store, the user can optionally pass in
        attributes and relationships to be preloaded. These are meant to behave as if they
        came back from the server, except the user obtained them out of band and is informing
        the store of their existence. The most common use case is for supporting client side
        nested URLs, such as `/posts/1/comments/2` so the user can do
        `store.find('comment', 2, {post:1})` without having to fetch the post.

        Preloaded data can be attributes and relationships passed in either as IDs or as actual
        models.

        @method _preloadData
        @private
        @param {Object} preload
      */
      _preloadData: function(preload) {
        var record = this;
        //TODO(Igor) consider the polymorphic case
        ember$data$lib$system$model$model$$forEach.call(Ember.keys(preload), function(key) {
          var preloadValue = ember$data$lib$system$model$model$$get(preload, key);
          var relationshipMeta = record.constructor.metaForProperty(key);
          if (relationshipMeta.isRelationship) {
            record._preloadRelationship(key, preloadValue);
          } else {
            ember$data$lib$system$model$model$$get(record, '_data')[key] = preloadValue;
          }
        });
      },

      _preloadRelationship: function(key, preloadValue) {
        var relationshipMeta = this.constructor.metaForProperty(key);
        var type = relationshipMeta.type;
        if (relationshipMeta.kind === 'hasMany') {
          this._preloadHasMany(key, preloadValue, type);
        } else {
          this._preloadBelongsTo(key, preloadValue, type);
        }
      },

      _preloadHasMany: function(key, preloadValue, type) {
        Ember.assert("You need to pass in an array to set a hasMany property on a record", Ember.isArray(preloadValue));
        var record = this;

        var recordsToSet = ember$data$lib$system$model$model$$map.call(preloadValue, function(recordToPush) {
          return record._convertStringOrNumberIntoRecord(recordToPush, type);
        });
        //We use the pathway of setting the hasMany as if it came from the adapter
        //because the user told us that they know this relationships exists already
        this._relationships[key].updateRecordsFromAdapter(recordsToSet);
      },

      _preloadBelongsTo: function(key, preloadValue, type) {
        var recordToSet = this._convertStringOrNumberIntoRecord(preloadValue, type);

        //We use the pathway of setting the hasMany as if it came from the adapter
        //because the user told us that they know this relationships exists already
        this._relationships[key].setRecord(recordToSet);
      },

      _convertStringOrNumberIntoRecord: function(value, type) {
        if (Ember.typeOf(value) === 'string' || Ember.typeOf(value) === 'number') {
          return this.store.recordForId(type, value);
        }
        return value;
      },

      /**
        @method _notifyProperties
        @private
      */
      _notifyProperties: function(keys) {
        Ember.beginPropertyChanges();
        var key;
        for (var i = 0, length = keys.length; i < length; i++) {
          key = keys[i];
          this.notifyPropertyChange(key);
        }
        Ember.endPropertyChanges();
      },

      /**
        Returns an object, whose keys are changed properties, and value is
        an [oldProp, newProp] array.

        Example

        ```javascript
        App.Mascot = DS.Model.extend({
          name: attr('string')
        });

        var person = store.createRecord('person');
        person.changedAttributes(); // {}
        person.set('name', 'Tomster');
        person.changedAttributes(); // {name: [undefined, 'Tomster']}
        ```

        @method changedAttributes
        @return {Object} an object, whose keys are changed properties,
          and value is an [oldProp, newProp] array.
      */
      changedAttributes: function() {
        var oldData = ember$data$lib$system$model$model$$get(this, '_data');
        var newData = ember$data$lib$system$model$model$$get(this, '_attributes');
        var diffData = {};
        var prop;

        for (prop in newData) {
          diffData[prop] = [oldData[prop], newData[prop]];
        }

        return diffData;
      },

      /**
        @method adapterWillCommit
        @private
      */
      adapterWillCommit: function() {
        this.send('willCommit');
      },

      /**
        If the adapter did not return a hash in response to a commit,
        merge the changed attributes and relationships into the existing
        saved data.

        @method adapterDidCommit
      */
      adapterDidCommit: function(data) {
        var changedKeys;
        ember$data$lib$system$model$model$$set(this, 'isError', false);

        if (data) {
          changedKeys = ember$data$lib$system$model$model$$mergeAndReturnChangedKeys(this._data, data);
        } else {
          ember$data$lib$system$merge$$default(this._data, this._inFlightAttributes);
        }

        this._inFlightAttributes = Ember.create(null);

        this.send('didCommit');
        this.updateRecordArraysLater();

        if (!data) { return; }

        this._notifyProperties(changedKeys);
      },

      /**
        @method adapterDidDirty
        @private
      */
      adapterDidDirty: function() {
        this.send('becomeDirty');
        this.updateRecordArraysLater();
      },


      /**
        @method updateRecordArraysLater
        @private
      */
      updateRecordArraysLater: function() {
        // quick hack (something like this could be pushed into run.once
        if (this._updatingRecordArraysLater) { return; }
        this._updatingRecordArraysLater = true;

        Ember.run.schedule('actions', this, this.updateRecordArrays);
      },

      /**
        @method setupData
        @private
        @param {Object} data
      */
      setupData: function(data) {
        Ember.assert("Expected an object as `data` in `setupData`", Ember.typeOf(data) === 'object');

        var changedKeys = ember$data$lib$system$model$model$$mergeAndReturnChangedKeys(this._data, data);

        this.pushedData();

        this._notifyProperties(changedKeys);
      },

      materializeId: function(id) {
        ember$data$lib$system$model$model$$set(this, 'id', id);
      },

      materializeAttributes: function(attributes) {
        Ember.assert("Must pass an object to materializeAttributes", !!attributes);
        ember$data$lib$system$merge$$default(this._data, attributes);
      },

      materializeAttribute: function(name, value) {
        this._data[name] = value;
      },

      /**
        If the model `isDirty` this function will discard any unsaved
        changes

        Example

        ```javascript
        record.get('name'); // 'Untitled Document'
        record.set('name', 'Doc 1');
        record.get('name'); // 'Doc 1'
        record.rollback();
        record.get('name'); // 'Untitled Document'
        ```

        @method rollback
      */
      rollback: function() {
        var dirtyKeys = Ember.keys(this._attributes);

        this._attributes = Ember.create(null);

        if (ember$data$lib$system$model$model$$get(this, 'isError')) {
          this._inFlightAttributes = Ember.create(null);
          ember$data$lib$system$model$model$$set(this, 'isError', false);
        }

        //Eventually rollback will always work for relationships
        //For now we support it only out of deleted state, because we
        //have an explicit way of knowing when the server acked the relationship change
        if (ember$data$lib$system$model$model$$get(this, 'isDeleted')) {
          this.reconnectRelationships();
        }

        if (ember$data$lib$system$model$model$$get(this, 'isNew')) {
          this.clearRelationships();
        }

        if (!ember$data$lib$system$model$model$$get(this, 'isValid')) {
          this._inFlightAttributes = Ember.create(null);
        }

        this.send('rolledBack');

        this._notifyProperties(dirtyKeys);
      },

      /**
        @method _createSnapshot
        @private
      */
      _createSnapshot: function() {
        return new ember$data$lib$system$snapshot$$default(this);
      },

      toStringExtension: function() {
        return ember$data$lib$system$model$model$$get(this, 'id');
      },

      /**
        Save the record and persist any changes to the record to an
        external source via the adapter.

        Example

        ```javascript
        record.set('name', 'Tomster');
        record.save().then(function() {
          // Success callback
        }, function() {
          // Error callback
        });
        ```
        @method save
        @return {Promise} a promise that will be resolved when the adapter returns
        successfully or rejected if the adapter returns with an error.
      */
      save: function() {
        var promiseLabel = "DS: Model#save " + this;
        var resolver = Ember.RSVP.defer(promiseLabel);

        this.get('store').scheduleSave(this, resolver);
        this._inFlightAttributes = this._attributes;
        this._attributes = Ember.create(null);

        return ember$data$lib$system$promise_proxies$$PromiseObject.create({
          promise: resolver.promise
        });
      },

      /**
        Reload the record from the adapter.

        This will only work if the record has already finished loading
        and has not yet been modified (`isLoaded` but not `isDirty`,
        or `isSaving`).

        Example

        ```javascript
        App.ModelViewRoute = Ember.Route.extend({
          actions: {
            reload: function() {
              this.controller.get('model').reload().then(function(model) {
                // do something with the reloaded model
              });
            }
          }
        });
        ```

        @method reload
        @return {Promise} a promise that will be resolved with the record when the
        adapter returns successfully or rejected if the adapter returns
        with an error.
      */
      reload: function() {
        ember$data$lib$system$model$model$$set(this, 'isReloading', true);

        var record = this;
        var promiseLabel = "DS: Model#reload of " + this;
        var promise = new ember$data$lib$system$model$model$$Promise(function(resolve) {
          record.send('reloadRecord', resolve);
        }, promiseLabel).then(function() {
          record.set('isReloading', false);
          record.set('isError', false);
          return record;
        }, function(reason) {
          record.set('isError', true);
          throw reason;
        }, "DS: Model#reload complete, update flags")['finally'](function () {
          record.updateRecordArrays();
        });

        return ember$data$lib$system$promise_proxies$$PromiseObject.create({
          promise: promise
        });
      },

      // FOR USE DURING COMMIT PROCESS

      /**
        @method adapterDidInvalidate
        @private
      */
      adapterDidInvalidate: function(errors) {
        var recordErrors = ember$data$lib$system$model$model$$get(this, 'errors');
        for (var key in errors) {
          if (!errors.hasOwnProperty(key)) {
            continue;
          }
          recordErrors.add(key, errors[key]);
        }
        this._saveWasRejected();
      },

      /**
        @method adapterDidError
        @private
      */
      adapterDidError: function() {
        this.send('becameError');
        ember$data$lib$system$model$model$$set(this, 'isError', true);
        this._saveWasRejected();
      },

      _saveWasRejected: function() {
        var keys = Ember.keys(this._inFlightAttributes);
        for (var i=0; i < keys.length; i++) {
          if (this._attributes[keys[i]] === undefined) {
            this._attributes[keys[i]] = this._inFlightAttributes[keys[i]];
          }
        }
        this._inFlightAttributes = Ember.create(null);
      },

      /**
        Override the default event firing from Ember.Evented to
        also call methods with the given name.

        @method trigger
        @private
        @param {String} name
      */
      trigger: function() {
        var length = arguments.length;
        var args = new Array(length - 1);
        var name = arguments[0];

        for (var i = 1; i < length; i++) {
          args[i - 1] = arguments[i];
        }

        Ember.tryInvoke(this, name, args);
        this._super.apply(this, arguments);
      },

      triggerLater: function() {
        var length = arguments.length;
        var args = new Array(length);

        for (var i = 0; i < length; i++) {
          args[i] = arguments[i];
        }

        if (this._deferredTriggers.push(args) !== 1) {
          return;
        }
        Ember.run.schedule('actions', this, '_triggerDeferredTriggers');
      },

      _triggerDeferredTriggers: function() {
        for (var i=0, l= this._deferredTriggers.length; i<l; i++) {
          this.trigger.apply(this, this._deferredTriggers[i]);
        }

        this._deferredTriggers.length = 0;
      },

      willDestroy: function() {
        this._super.apply(this, arguments);
        this.clearRelationships();
      },

      // This is a temporary solution until we refactor DS.Model to not
      // rely on the data property.
      willMergeMixin: function(props) {
        Ember.assert('`data` is a reserved property name on DS.Model objects. Please choose a different property name for ' + this.constructor.toString(), !props.data);
      }
    });

    ember$data$lib$system$model$model$$Model.reopenClass({
      /**
        Alias DS.Model's `create` method to `_create`. This allows us to create DS.Model
        instances from within the store, but if end users accidentally call `create()`
        (instead of `createRecord()`), we can raise an error.

        @method _create
        @private
        @static
      */
      _create: ember$data$lib$system$model$model$$Model.create,

      /**
        Override the class' `create()` method to raise an error. This
        prevents end users from inadvertently calling `create()` instead
        of `createRecord()`. The store is still able to create instances
        by calling the `_create()` method. To create an instance of a
        `DS.Model` use [store.createRecord](DS.Store.html#method_createRecord).

        @method create
        @private
        @static
      */
      create: function() {
        throw new Ember.Error("You should not call `create` on a model. Instead, call `store.createRecord` with the attributes you would like to set.");
      }
    });

    var ember$data$lib$system$model$model$$default = ember$data$lib$system$model$model$$Model;

    /**
      @module ember-data
    */

    var ember$data$lib$system$model$attributes$$get = Ember.get;

    /**
      @class Model
      @namespace DS
    */
    ember$data$lib$system$model$model$$default.reopenClass({
      /**
        A map whose keys are the attributes of the model (properties
        described by DS.attr) and whose values are the meta object for the
        property.

        Example

        ```javascript

        App.Person = DS.Model.extend({
          firstName: attr('string'),
          lastName: attr('string'),
          birthday: attr('date')
        });

        var attributes = Ember.get(App.Person, 'attributes')

        attributes.forEach(function(name, meta) {
          console.log(name, meta);
        });

        // prints:
        // firstName {type: "string", isAttribute: true, options: Object, parentType: function, name: "firstName"}
        // lastName {type: "string", isAttribute: true, options: Object, parentType: function, name: "lastName"}
        // birthday {type: "date", isAttribute: true, options: Object, parentType: function, name: "birthday"}
        ```

        @property attributes
        @static
        @type {Ember.Map}
        @readOnly
      */
      attributes: Ember.computed(function() {
        var map = ember$data$lib$system$map$$Map.create();

        this.eachComputedProperty(function(name, meta) {
          if (meta.isAttribute) {
            Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: DS.attr('<type>')` from " + this.toString(), name !== 'id');

            meta.name = name;
            map.set(name, meta);
          }
        });

        return map;
      }).readOnly(),

      /**
        A map whose keys are the attributes of the model (properties
        described by DS.attr) and whose values are type of transformation
        applied to each attribute. This map does not include any
        attributes that do not have an transformation type.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: attr(),
          lastName: attr('string'),
          birthday: attr('date')
        });

        var transformedAttributes = Ember.get(App.Person, 'transformedAttributes')

        transformedAttributes.forEach(function(field, type) {
          console.log(field, type);
        });

        // prints:
        // lastName string
        // birthday date
        ```

        @property transformedAttributes
        @static
        @type {Ember.Map}
        @readOnly
      */
      transformedAttributes: Ember.computed(function() {
        var map = ember$data$lib$system$map$$Map.create();

        this.eachAttribute(function(key, meta) {
          if (meta.type) {
            map.set(key, meta.type);
          }
        });

        return map;
      }).readOnly(),

      /**
        Iterates through the attributes of the model, calling the passed function on each
        attribute.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(name, meta);
        ```

        - `name` the name of the current property in the iteration
        - `meta` the meta object for the attribute property in the iteration

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: attr('string'),
          lastName: attr('string'),
          birthday: attr('date')
        });

        App.Person.eachAttribute(function(name, meta) {
          console.log(name, meta);
        });

        // prints:
        // firstName {type: "string", isAttribute: true, options: Object, parentType: function, name: "firstName"}
        // lastName {type: "string", isAttribute: true, options: Object, parentType: function, name: "lastName"}
        // birthday {type: "date", isAttribute: true, options: Object, parentType: function, name: "birthday"}
       ```

        @method eachAttribute
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @static
      */
      eachAttribute: function(callback, binding) {
        ember$data$lib$system$model$attributes$$get(this, 'attributes').forEach(function(meta, name) {
          callback.call(binding, name, meta);
        }, binding);
      },

      /**
        Iterates through the transformedAttributes of the model, calling
        the passed function on each attribute. Note the callback will not be
        called for any attributes that do not have an transformation type.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(name, type);
        ```

        - `name` the name of the current property in the iteration
        - `type` a string containing the name of the type of transformed
          applied to the attribute

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: attr(),
          lastName: attr('string'),
          birthday: attr('date')
        });

        App.Person.eachTransformedAttribute(function(name, type) {
          console.log(name, type);
        });

        // prints:
        // lastName string
        // birthday date
       ```

        @method eachTransformedAttribute
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @static
      */
      eachTransformedAttribute: function(callback, binding) {
        ember$data$lib$system$model$attributes$$get(this, 'transformedAttributes').forEach(function(type, name) {
          callback.call(binding, name, type);
        });
      }
    });


    ember$data$lib$system$model$model$$default.reopen({
      eachAttribute: function(callback, binding) {
        this.constructor.eachAttribute(callback, binding);
      }
    });

    function ember$data$lib$system$model$attributes$$getDefaultValue(record, options, key) {
      if (typeof options.defaultValue === "function") {
        return options.defaultValue.apply(null, arguments);
      } else {
        return options.defaultValue;
      }
    }

    function ember$data$lib$system$model$attributes$$hasValue(record, key) {
      return key in record._attributes ||
             key in record._inFlightAttributes ||
             record._data.hasOwnProperty(key);
    }

    function ember$data$lib$system$model$attributes$$getValue(record, key) {
      if (key in record._attributes) {
        return record._attributes[key];
      } else if (key in record._inFlightAttributes) {
        return record._inFlightAttributes[key];
      } else {
        return record._data[key];
      }
    }

    function ember$data$lib$system$model$attributes$$attr(type, options) {
      if (typeof type === 'object') {
        options = type;
        type = undefined;
      } else {
        options = options || {};
      }

      var meta = {
        type: type,
        isAttribute: true,
        options: options
      };

      return Ember.computed(function(key, value) {
        if (arguments.length > 1) {
          Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: DS.attr('<type>')` from " + this.constructor.toString(), key !== 'id');
          var oldValue = ember$data$lib$system$model$attributes$$getValue(this, key);

          if (value !== oldValue) {
            // Add the new value to the changed attributes hash; it will get deleted by
            // the 'didSetProperty' handler if it is no different from the original value
            this._attributes[key] = value;

            this.send('didSetProperty', {
              name: key,
              oldValue: oldValue,
              originalValue: this._data[key],
              value: value
            });
          }

          return value;
        } else if (ember$data$lib$system$model$attributes$$hasValue(this, key)) {
          return ember$data$lib$system$model$attributes$$getValue(this, key);
        } else {
          return ember$data$lib$system$model$attributes$$getDefaultValue(this, options, key);
        }

      // `data` is never set directly. However, it may be
      // invalidated from the state manager's setData
      // event.
      }).meta(meta);
    }
    var ember$data$lib$system$model$attributes$$default = ember$data$lib$system$model$attributes$$attr;
    //Stanley told me to do this
    var ember$data$lib$system$store$$Backburner = Ember.__loader.require('backburner')['default'] || Ember.__loader.require('backburner')['Backburner'];

    //Shim Backburner.join
    if (!ember$data$lib$system$store$$Backburner.prototype.join) {
      var ember$data$lib$system$store$$isString = function(suspect) {
        return typeof suspect === 'string';
      };

      ember$data$lib$system$store$$Backburner.prototype.join = function(/*target, method, args */) {
        var method, target;

        if (this.currentInstance) {
          var length = arguments.length;
          if (length === 1) {
            method = arguments[0];
            target = null;
          } else {
            target = arguments[0];
            method = arguments[1];
          }

          if (ember$data$lib$system$store$$isString(method)) {
            method = target[method];
          }

          if (length === 1) {
            return method();
          } else if (length === 2) {
            return method.call(target);
          } else {
            var args = new Array(length - 2);
            for (var i =0, l = length - 2; i < l; i++) {
              args[i] = arguments[i + 2];
            }
            return method.apply(target, args);
          }
        } else {
          return this.run.apply(this, arguments);
        }
      };
    }


    var ember$data$lib$system$store$$get = Ember.get;
    var ember$data$lib$system$store$$set = Ember.set;
    var ember$data$lib$system$store$$once = Ember.run.once;
    var ember$data$lib$system$store$$isNone = Ember.isNone;
    var ember$data$lib$system$store$$forEach = Ember.EnumerableUtils.forEach;
    var ember$data$lib$system$store$$indexOf = Ember.EnumerableUtils.indexOf;
    var ember$data$lib$system$store$$map = Ember.EnumerableUtils.map;
    var ember$data$lib$system$store$$Promise = Ember.RSVP.Promise;
    var ember$data$lib$system$store$$copy = Ember.copy;
    var ember$data$lib$system$store$$Store;

    var ember$data$lib$system$store$$camelize = Ember.String.camelize;

    // Implementors Note:
    //
    //   The variables in this file are consistently named according to the following
    //   scheme:
    //
    //   * +id+ means an identifier managed by an external source, provided inside
    //     the data provided by that source. These are always coerced to be strings
    //     before being used internally.
    //   * +clientId+ means a transient numerical identifier generated at runtime by
    //     the data store. It is important primarily because newly created objects may
    //     not yet have an externally generated id.
    //   * +reference+ means a record reference object, which holds metadata about a
    //     record, even if it has not yet been fully materialized.
    //   * +type+ means a subclass of DS.Model.

    // Used by the store to normalize IDs entering the store.  Despite the fact
    // that developers may provide IDs as numbers (e.g., `store.find(Person, 1)`),
    // it is important that internally we use strings, since IDs may be serialized
    // and lose type information.  For example, Ember's router may put a record's
    // ID into the URL, and if we later try to deserialize that URL and find the
    // corresponding record, we will not know if it is a string or a number.
    function ember$data$lib$system$store$$coerceId(id) {
      return id == null ? null : id+'';
    }

    /**
      The store contains all of the data for records loaded from the server.
      It is also responsible for creating instances of `DS.Model` that wrap
      the individual data for a record, so that they can be bound to in your
      Handlebars templates.

      Define your application's store like this:

      ```javascript
      MyApp.ApplicationStore = DS.Store.extend();
      ```

      Most Ember.js applications will only have a single `DS.Store` that is
      automatically created by their `Ember.Application`.

      You can retrieve models from the store in several ways. To retrieve a record
      for a specific id, use `DS.Store`'s `find()` method:

      ```javascript
      store.find('person', 123).then(function (person) {
      });
      ```

      By default, the store will talk to your backend using a standard
      REST mechanism. You can customize how the store talks to your
      backend by specifying a custom adapter:

      ```javascript
      MyApp.ApplicationAdapter = MyApp.CustomAdapter
      ```

      You can learn more about writing a custom adapter by reading the `DS.Adapter`
      documentation.

      ### Store createRecord() vs. push() vs. pushPayload()

      The store provides multiple ways to create new record objects. They have
      some subtle differences in their use which are detailed below:

      [createRecord](#method_createRecord) is used for creating new
      records on the client side. This will return a new record in the
      `created.uncommitted` state. In order to persist this record to the
      backend you will need to call `record.save()`.

      [push](#method_push) is used to notify Ember Data's store of new or
      updated records that exist in the backend. This will return a record
      in the `loaded.saved` state. The primary use-case for `store#push` is
      to notify Ember Data about record updates (full or partial) that happen
      outside of the normal adapter methods (for example
      [SSE](http://dev.w3.org/html5/eventsource/) or [Web
      Sockets](http://www.w3.org/TR/2009/WD-websockets-20091222/)).

      [pushPayload](#method_pushPayload) is a convenience wrapper for
      `store#push` that will deserialize payloads if the
      Serializer implements a `pushPayload` method.

      Note: When creating a new record using any of the above methods
      Ember Data will update `DS.RecordArray`s such as those returned by
      `store#all()`, `store#findAll()` or `store#filter()`. This means any
      data bindings or computed properties that depend on the RecordArray
      will automatically be synced to include the new or updated record
      values.

      @class Store
      @namespace DS
      @extends Ember.Object
    */
    ember$data$lib$system$store$$Store = Ember.Object.extend({

      /**
        @method init
        @private
      */
      init: function() {
        this._backburner = new ember$data$lib$system$store$$Backburner(['normalizeRelationships', 'syncRelationships', 'finished']);
        // internal bookkeeping; not observable
        this.typeMaps = {};
        this.recordArrayManager = ember$data$lib$system$record_array_manager$$default.create({
          store: this
        });
        this._pendingSave = [];
        //Used to keep track of all the find requests that need to be coalesced
        this._pendingFetch = ember$data$lib$system$map$$Map.create();
      },

      /**
        The adapter to use to communicate to a backend server or other persistence layer.

        This can be specified as an instance, class, or string.

        If you want to specify `App.CustomAdapter` as a string, do:

        ```js
        adapter: 'custom'
        ```

        @property adapter
        @default DS.RESTAdapter
        @type {DS.Adapter|String}
      */
      adapter: '-rest',

      /**
        Returns a JSON representation of the record using a custom
        type-specific serializer, if one exists.

        The available options are:

        * `includeId`: `true` if the record's ID should be included in
          the JSON representation

        @method serialize
        @private
        @param {DS.Model} record the record to serialize
        @param {Object} options an options hash
      */
      serialize: function(record, options) {
        var snapshot = record._createSnapshot();
        return this.serializerFor(snapshot.typeKey).serialize(snapshot, options);
      },

      /**
        This property returns the adapter, after resolving a possible
        string key.

        If the supplied `adapter` was a class, or a String property
        path resolved to a class, this property will instantiate the
        class.

        This property is cacheable, so the same instance of a specified
        adapter class should be used for the lifetime of the store.

        @property defaultAdapter
        @private
        @return DS.Adapter
      */
      defaultAdapter: Ember.computed('adapter', function() {
        var adapter = ember$data$lib$system$store$$get(this, 'adapter');

        Ember.assert('You tried to set `adapter` property to an instance of `DS.Adapter`, where it should be a name or a factory', !(adapter instanceof ember$data$lib$system$adapter$$Adapter));

        if (typeof adapter === 'string') {
          adapter = this.container.lookup('adapter:' + adapter) || this.container.lookup('adapter:application') || this.container.lookup('adapter:-rest');
        }

        if (DS.Adapter.detect(adapter)) {
          adapter = adapter.create({
            container: this.container
          });
        }

        return adapter;
      }),

      // .....................
      // . CREATE NEW RECORD .
      // .....................

      /**
        Create a new record in the current store. The properties passed
        to this method are set on the newly created record.

        To create a new instance of `App.Post`:

        ```js
        store.createRecord('post', {
          title: "Rails is omakase"
        });
        ```

        @method createRecord
        @param {String} type
        @param {Object} properties a hash of properties to set on the
          newly created record.
        @return {DS.Model} record
      */
      createRecord: function(typeName, inputProperties) {
        var type = this.modelFor(typeName);
        var properties = ember$data$lib$system$store$$copy(inputProperties) || {};

        // If the passed properties do not include a primary key,
        // give the adapter an opportunity to generate one. Typically,
        // client-side ID generators will use something like uuid.js
        // to avoid conflicts.

        if (ember$data$lib$system$store$$isNone(properties.id)) {
          properties.id = this._generateId(type, properties);
        }

        // Coerce ID to a string
        properties.id = ember$data$lib$system$store$$coerceId(properties.id);

        var record = this.buildRecord(type, properties.id);

        // Move the record out of its initial `empty` state into
        // the `loaded` state.
        record.loadedData();

        // Set the properties specified on the record.
        record.setProperties(properties);

        return record;
      },

      /**
        If possible, this method asks the adapter to generate an ID for
        a newly created record.

        @method _generateId
        @private
        @param {String} type
        @param {Object} properties from the new record
        @return {String} if the adapter can generate one, an ID
      */
      _generateId: function(type, properties) {
        var adapter = this.adapterFor(type);

        if (adapter && adapter.generateIdForRecord) {
          return adapter.generateIdForRecord(this, type, properties);
        }

        return null;
      },

      // .................
      // . DELETE RECORD .
      // .................

      /**
        For symmetry, a record can be deleted via the store.

        Example

        ```javascript
        var post = store.createRecord('post', {
          title: "Rails is omakase"
        });

        store.deleteRecord(post);
        ```

        @method deleteRecord
        @param {DS.Model} record
      */
      deleteRecord: function(record) {
        record.deleteRecord();
      },

      /**
        For symmetry, a record can be unloaded via the store. Only
        non-dirty records can be unloaded.

        Example

        ```javascript
        store.find('post', 1).then(function(post) {
          store.unloadRecord(post);
        });
        ```

        @method unloadRecord
        @param {DS.Model} record
      */
      unloadRecord: function(record) {
        record.unloadRecord();
      },

      // ................
      // . FIND RECORDS .
      // ................

      /**
        This is the main entry point into finding records. The first parameter to
        this method is the model's name as a string.

        ---

        To find a record by ID, pass the `id` as the second parameter:

        ```javascript
        store.find('person', 1);
        ```

        The `find` method will always return a **promise** that will be resolved
        with the record. If the record was already in the store, the promise will
        be resolved immediately. Otherwise, the store will ask the adapter's `find`
        method to find the necessary data.

        The `find` method will always resolve its promise with the same object for
        a given type and `id`.

        ---

        You can optionally `preload` specific attributes and relationships that you know of
        by passing them as the third argument to find.

        For example, if your Ember route looks like `/posts/1/comments/2` and your API route
        for the comment also looks like `/posts/1/comments/2` if you want to fetch the comment
        without fetching the post you can pass in the post to the `find` call:

        ```javascript
        store.find('comment', 2, {post: 1});
        ```

        If you have access to the post model you can also pass the model itself:

        ```javascript
        store.find('post', 1).then(function (myPostModel) {
          store.find('comment', 2, {post: myPostModel});
        });
        ```

        This way, your adapter's `find` or `buildURL` method will be able to look up the
        relationship on the record and construct the nested URL without having to first
        fetch the post.

        ---

        To find all records for a type, call `find` with no additional parameters:

        ```javascript
        store.find('person');
        ```

        This will ask the adapter's `findAll` method to find the records for the
        given type, and return a promise that will be resolved once the server
        returns the values. The promise will resolve into all records of this type
        present in the store, even if the server only returns a subset of them.

        ---

        To find a record by a query, call `find` with a hash as the second
        parameter:

        ```javascript
        store.find('person', { page: 1 });
        ```

        By passing an object `{page: 1}` as an argument to the find method, it
        delegates to the adapter's findQuery method. The adapter then makes
        a call to the server, transforming the object `{page: 1}` as parameters
        that are sent along, and will return a RecordArray when the promise
        resolves.

        Exposing queries this way seems preferable to creating an abstract query
        language for all server-side queries, and then require all adapters to
        implement them.

        The call made to the server, using a Rails backend, will look something like this:

        ```
        Started GET "/api/v1/person?page=1"
        Processing by Api::V1::PersonsController#index as HTML
        Parameters: {"page"=>"1"}
        ```

        If you do something like this:

        ```javascript
        store.find('person', {ids: [1, 2, 3]});
        ```

        The call to the server, using a Rails backend, will look something like this:

        ```
        Started GET "/api/v1/person?ids%5B%5D=1&ids%5B%5D=2&ids%5B%5D=3"
        Processing by Api::V1::PersonsController#index as HTML
        Parameters: {"ids"=>["1", "2", "3"]}
        ```

        @method find
        @param {String or subclass of DS.Model} type
        @param {Object|String|Integer|null} id
        @param {Object} preload - optional set of attributes and relationships passed in either as IDs or as actual models
        @return {Promise} promise
      */
      find: function(type, id, preload) {
        Ember.assert("You need to pass a type to the store's find method", arguments.length >= 1);
        Ember.assert("You may not pass `" + id + "` as id to the store's find method", arguments.length === 1 || !Ember.isNone(id));

        if (arguments.length === 1) {
          return this.findAll(type);
        }

        // We are passed a query instead of an id.
        if (Ember.typeOf(id) === 'object') {
          return this.findQuery(type, id);
        }

        return this.findById(type, ember$data$lib$system$store$$coerceId(id), preload);
      },

      /**
        This method returns a fresh record for a given type and id combination.

        If a record is available for the given type/id combination, then
        it will fetch this record from the store and call `reload()` on it.
        That will fire a request to server and return a promise that will
        resolve once the record has been reloaded.
        If there's no record corresponding in the store it will simply call
        `store.find`.

        Example

        ```javascript
        App.PostRoute = Ember.Route.extend({
          model: function(params) {
            return this.store.fetch('post', params.post_id);
          }
        });
        ```

        @method fetchById
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @param {Object} preload - optional set of attributes and relationships passed in either as IDs or as actual models
        @return {Promise} promise
      */
      fetchById: function(type, id, preload) {
        if (this.hasRecordForId(type, id)) {
          return this.getById(type, id).reload();
        } else {
          return this.find(type, id, preload);
        }
      },

      /**
        This method returns a fresh collection from the server, regardless of if there is already records
        in the store or not.

        @method fetchAll
        @param {String or subclass of DS.Model} type
        @return {Promise} promise
      */
      fetchAll: function(type) {
        type = this.modelFor(type);

        return this._fetchAll(type, this.all(type));
      },

      /**
        @method fetch
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @param {Object} preload - optional set of attributes and relationships passed in either as IDs or as actual models
        @return {Promise} promise
        @deprecated Use [fetchById](#method_fetchById) instead
      */
      fetch: function(type, id, preload) {
        Ember.deprecate('Using store.fetch() has been deprecated. Use store.fetchById for fetching individual records or store.fetchAll for collections');
        return this.fetchById(type, id, preload);
      },

      /**
        This method returns a record for a given type and id combination.

        @method findById
        @private
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @param {Object} preload - optional set of attributes and relationships passed in either as IDs or as actual models
        @return {Promise} promise
      */
      findById: function(typeName, id, preload) {

        var type = this.modelFor(typeName);
        var record = this.recordForId(type, id);

        return this._findByRecord(record, preload);
      },

      _findByRecord: function(record, preload) {
        var fetchedRecord;

        if (preload) {
          record._preloadData(preload);
        }

        if (ember$data$lib$system$store$$get(record, 'isEmpty')) {
          fetchedRecord = this.scheduleFetch(record);
          //TODO double check about reloading
        } else if (ember$data$lib$system$store$$get(record, 'isLoading')) {
          fetchedRecord = record._loadingPromise;
        }

        return ember$data$lib$system$promise_proxies$$promiseObject(fetchedRecord || record, "DS: Store#findByRecord " + record.typeKey + " with id: " + ember$data$lib$system$store$$get(record, 'id'));
      },

      /**
        This method makes a series of requests to the adapter's `find` method
        and returns a promise that resolves once they are all loaded.

        @private
        @method findByIds
        @param {String} type
        @param {Array} ids
        @return {Promise} promise
      */
      findByIds: function(type, ids) {
        var store = this;

        return ember$data$lib$system$promise_proxies$$promiseArray(Ember.RSVP.all(ember$data$lib$system$store$$map(ids, function(id) {
          return store.findById(type, id);
        })).then(Ember.A, null, "DS: Store#findByIds of " + type + " complete"));
      },

      /**
        This method is called by `findById` if it discovers that a particular
        type/id pair hasn't been loaded yet to kick off a request to the
        adapter.

        @method fetchRecord
        @private
        @param {DS.Model} record
        @return {Promise} promise
      */
      fetchRecord: function(record) {
        var type = record.constructor;
        var id = ember$data$lib$system$store$$get(record, 'id');
        var adapter = this.adapterFor(type);

        Ember.assert("You tried to find a record but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to find a record but your adapter (for " + type + ") does not implement 'find'", typeof adapter.find === 'function');

        var promise = ember$data$lib$system$store$$_find(adapter, this, type, id, record);
        return promise;
      },

      scheduleFetchMany: function(records) {
        return ember$data$lib$system$store$$Promise.all(ember$data$lib$system$store$$map(records, this.scheduleFetch, this));
      },

      scheduleFetch: function(record) {
        var type = record.constructor;
        if (ember$data$lib$system$store$$isNone(record)) { return null; }
        if (record._loadingPromise) { return record._loadingPromise; }

        var resolver = Ember.RSVP.defer('Fetching ' + type + 'with id: ' + record.get('id'));
        var recordResolverPair = {
          record: record,
          resolver: resolver
        };
        var promise = resolver.promise;

        record.loadingData(promise);

        if (!this._pendingFetch.get(type)) {
          this._pendingFetch.set(type, [recordResolverPair]);
        } else {
          this._pendingFetch.get(type).push(recordResolverPair);
        }
        Ember.run.scheduleOnce('afterRender', this, this.flushAllPendingFetches);

        return promise;
      },

      flushAllPendingFetches: function() {
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        this._pendingFetch.forEach(this._flushPendingFetchForType, this);
        this._pendingFetch = ember$data$lib$system$map$$Map.create();
      },

      _flushPendingFetchForType: function (recordResolverPairs, type) {
        var store = this;
        var adapter = store.adapterFor(type);
        var shouldCoalesce = !!adapter.findMany && adapter.coalesceFindRequests;
        var records = Ember.A(recordResolverPairs).mapBy('record');

        function _fetchRecord(recordResolverPair) {
          recordResolverPair.resolver.resolve(store.fetchRecord(recordResolverPair.record));
        }

        function resolveFoundRecords(records) {
          ember$data$lib$system$store$$forEach(records, function(record) {
            var pair = Ember.A(recordResolverPairs).findBy('record', record);
            if (pair) {
              var resolver = pair.resolver;
              resolver.resolve(record);
            }
          });
        }

        function makeMissingRecordsRejector(requestedRecords) {
          return function rejectMissingRecords(resolvedRecords) {
            var missingRecords = requestedRecords.without(resolvedRecords);
            rejectRecords(missingRecords);
          };
        }

        function makeRecordsRejector(records) {
          return function (error) {
            rejectRecords(records, error);
          };
        }

        function rejectRecords(records, error) {
          ember$data$lib$system$store$$forEach(records, function(record) {
            var pair = Ember.A(recordResolverPairs).findBy('record', record);
            if (pair) {
              var resolver = pair.resolver;
              resolver.reject(error);
            }
          });
        }

        if (recordResolverPairs.length === 1) {
          _fetchRecord(recordResolverPairs[0]);
        } else if (shouldCoalesce) {
          var groups = adapter.groupRecordsForFindMany(this, records);
          ember$data$lib$system$store$$forEach(groups, function (groupOfRecords) {
            var requestedRecords = Ember.A(groupOfRecords);
            var ids = requestedRecords.mapBy('id');
            if (ids.length > 1) {
              ember$data$lib$system$store$$_findMany(adapter, store, type, ids, requestedRecords).
                then(resolveFoundRecords).
                then(makeMissingRecordsRejector(requestedRecords)).
                then(null, makeRecordsRejector(requestedRecords));
            } else if (ids.length === 1) {
              var pair = Ember.A(recordResolverPairs).findBy('record', groupOfRecords[0]);
              _fetchRecord(pair);
            } else {
              Ember.assert("You cannot return an empty array from adapter's method groupRecordsForFindMany", false);
            }
          });
        } else {
          ember$data$lib$system$store$$forEach(recordResolverPairs, _fetchRecord);
        }
      },

      /**
        Get a record by a given type and ID without triggering a fetch.

        This method will synchronously return the record if it is available in the store,
        otherwise it will return `null`. A record is available if it has been fetched earlier, or
        pushed manually into the store.

        _Note: This is an synchronous method and does not return a promise._

        ```js
        var post = store.getById('post', 1);

        post.get('id'); // 1
        ```

        @method getById
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {DS.Model|null} record
      */
      getById: function(type, id) {
        if (this.hasRecordForId(type, id)) {
          return this.recordForId(type, id);
        } else {
          return null;
        }
      },

      /**
        This method is called by the record's `reload` method.

        This method calls the adapter's `find` method, which returns a promise. When
        **that** promise resolves, `reloadRecord` will resolve the promise returned
        by the record's `reload`.

        @method reloadRecord
        @private
        @param {DS.Model} record
        @return {Promise} promise
      */
      reloadRecord: function(record) {
        var type = record.constructor;
        var adapter = this.adapterFor(type);
        var id = ember$data$lib$system$store$$get(record, 'id');

        Ember.assert("You cannot reload a record without an ID", id);
        Ember.assert("You tried to reload a record but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to reload a record but your adapter does not implement `find`", typeof adapter.find === 'function');

        return this.scheduleFetch(record);
      },

      /**
        Returns true if a record for a given type and ID is already loaded.

        @method hasRecordForId
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {Boolean}
      */
      hasRecordForId: function(typeName, inputId) {
        var type = this.modelFor(typeName);
        var id = ember$data$lib$system$store$$coerceId(inputId);
        return !!this.typeMapFor(type).idToRecord[id];
      },

      /**
        Returns id record for a given type and ID. If one isn't already loaded,
        it builds a new record and leaves it in the `empty` state.

        @method recordForId
        @private
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {DS.Model} record
      */
      recordForId: function(typeName, inputId) {
        var type = this.modelFor(typeName);
        var id = ember$data$lib$system$store$$coerceId(inputId);
        var idToRecord = this.typeMapFor(type).idToRecord;
        var record = idToRecord[id];

        if (!record || !idToRecord[id]) {
          record = this.buildRecord(type, id);
        }

        return record;
      },

      /**
        @method findMany
        @private
        @param {DS.Model} owner
        @param {Array} records
        @param {String or subclass of DS.Model} type
        @param {Resolver} resolver
        @return {DS.ManyArray} records
      */
      findMany: function(records) {
        var store = this;
        return ember$data$lib$system$store$$Promise.all(ember$data$lib$system$store$$map(records, function(record) {
          return store._findByRecord(record);
        }));
      },


      /**
        If a relationship was originally populated by the adapter as a link
        (as opposed to a list of IDs), this method is called when the
        relationship is fetched.

        The link (which is usually a URL) is passed through unchanged, so the
        adapter can make whatever request it wants.

        The usual use-case is for the server to register a URL as a link, and
        then use that URL in the future to make a request for the relationship.

        @method findHasMany
        @private
        @param {DS.Model} owner
        @param {any} link
        @param {String or subclass of DS.Model} type
        @return {Promise} promise
      */
      findHasMany: function(owner, link, type) {
        var adapter = this.adapterFor(owner.constructor);

        Ember.assert("You tried to load a hasMany relationship but you have no adapter (for " + owner.constructor + ")", adapter);
        Ember.assert("You tried to load a hasMany relationship from a specified `link` in the original payload but your adapter does not implement `findHasMany`", typeof adapter.findHasMany === 'function');

        return ember$data$lib$system$store$$_findHasMany(adapter, this, owner, link, type);
      },

      /**
        @method findBelongsTo
        @private
        @param {DS.Model} owner
        @param {any} link
        @param {Relationship} relationship
        @return {Promise} promise
      */
      findBelongsTo: function(owner, link, relationship) {
        var adapter = this.adapterFor(owner.constructor);

        Ember.assert("You tried to load a belongsTo relationship but you have no adapter (for " + owner.constructor + ")", adapter);
        Ember.assert("You tried to load a belongsTo relationship from a specified `link` in the original payload but your adapter does not implement `findBelongsTo`", typeof adapter.findBelongsTo === 'function');

        return ember$data$lib$system$store$$_findBelongsTo(adapter, this, owner, link, relationship);
      },

      /**
        This method delegates a query to the adapter. This is the one place where
        adapter-level semantics are exposed to the application.

        Exposing queries this way seems preferable to creating an abstract query
        language for all server-side queries, and then require all adapters to
        implement them.

        This method returns a promise, which is resolved with a `RecordArray`
        once the server returns.

        @method findQuery
        @private
        @param {String or subclass of DS.Model} type
        @param {any} query an opaque query to be used by the adapter
        @return {Promise} promise
      */
      findQuery: function(typeName, query) {
        var type = this.modelFor(typeName);
        var array = this.recordArrayManager
          .createAdapterPopulatedRecordArray(type, query);

        var adapter = this.adapterFor(type);

        Ember.assert("You tried to load a query but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to load a query but your adapter does not implement `findQuery`", typeof adapter.findQuery === 'function');

        return ember$data$lib$system$promise_proxies$$promiseArray(ember$data$lib$system$store$$_findQuery(adapter, this, type, query, array));
      },

      /**
        This method returns an array of all records adapter can find.
        It triggers the adapter's `findAll` method to give it an opportunity to populate
        the array with records of that type.

        @method findAll
        @private
        @param {String or subclass of DS.Model} type
        @return {DS.AdapterPopulatedRecordArray}
      */
      findAll: function(typeName) {
        return this.fetchAll(typeName);
      },

      /**
        @method _fetchAll
        @private
        @param {DS.Model} type
        @param {DS.RecordArray} array
        @return {Promise} promise
      */
      _fetchAll: function(type, array) {
        var adapter = this.adapterFor(type);
        var sinceToken = this.typeMapFor(type).metadata.since;

        ember$data$lib$system$store$$set(array, 'isUpdating', true);

        Ember.assert("You tried to load all records but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to load all records but your adapter does not implement `findAll`", typeof adapter.findAll === 'function');

        return ember$data$lib$system$promise_proxies$$promiseArray(ember$data$lib$system$store$$_findAll(adapter, this, type, sinceToken));
      },

      /**
        @method didUpdateAll
        @param {DS.Model} type
      */
      didUpdateAll: function(type) {
        var findAllCache = this.typeMapFor(type).findAllCache;
        ember$data$lib$system$store$$set(findAllCache, 'isUpdating', false);
      },

      /**
        This method returns a filtered array that contains all of the
        known records for a given type in the store.

        Note that because it's just a filter, the result will contain any
        locally created records of the type, however, it will not make a
        request to the backend to retrieve additional records. If you
        would like to request all the records from the backend please use
        [store.find](#method_find).

        Also note that multiple calls to `all` for a given type will always
        return the same `RecordArray`.

        Example

        ```javascript
        var localPosts = store.all('post');
        ```

        @method all
        @param {String or subclass of DS.Model} type
        @return {DS.RecordArray}
      */
      all: function(typeName) {
        var type = this.modelFor(typeName);
        var typeMap = this.typeMapFor(type);
        var findAllCache = typeMap.findAllCache;

        if (findAllCache) {
          this.recordArrayManager.updateFilter(findAllCache, type);
          return findAllCache;
        }

        var array = this.recordArrayManager.createRecordArray(type);

        typeMap.findAllCache = array;
        return array;
      },


      /**
        This method unloads all of the known records for a given type.

        ```javascript
        store.unloadAll('post');
        ```

        @method unloadAll
        @param {String or subclass of DS.Model} type
      */
      unloadAll: function(type) {
        var modelType = this.modelFor(type);
        var typeMap = this.typeMapFor(modelType);
        var records = typeMap.records.slice();
        var record;

        for (var i = 0; i < records.length; i++) {
          record = records[i];
          record.unloadRecord();
          record.destroy(); // maybe within unloadRecord
        }

        typeMap.findAllCache = null;
      },

      /**
        Takes a type and filter function, and returns a live RecordArray that
        remains up to date as new records are loaded into the store or created
        locally.

        The filter function takes a materialized record, and returns true
        if the record should be included in the filter and false if it should
        not.

        Example

        ```javascript
        store.filter('post', function(post) {
          return post.get('unread');
        });
        ```

        The filter function is called once on all records for the type when
        it is created, and then once on each newly loaded or created record.

        If any of a record's properties change, or if it changes state, the
        filter function will be invoked again to determine whether it should
        still be in the array.

        Optionally you can pass a query, which is the equivalent of calling
        [find](#method_find) with that same query, to fetch additional records
        from the server. The results returned by the server could then appear
        in the filter if they match the filter function.

        The query itself is not used to filter records, it's only sent to your
        server for you to be able to do server-side filtering. The filter
        function will be applied on the returned results regardless.

        Example

        ```javascript
        store.filter('post', { unread: true }, function(post) {
          return post.get('unread');
        }).then(function(unreadPosts) {
          unreadPosts.get('length'); // 5
          var unreadPost = unreadPosts.objectAt(0);
          unreadPost.set('unread', false);
          unreadPosts.get('length'); // 4
        });
        ```

        @method filter
        @param {String or subclass of DS.Model} type
        @param {Object} query optional query
        @param {Function} filter
        @return {DS.PromiseArray}
      */
      filter: function(type, query, filter) {
        var promise;
        var length = arguments.length;
        var array;
        var hasQuery = length === 3;

        // allow an optional server query
        if (hasQuery) {
          promise = this.findQuery(type, query);
        } else if (arguments.length === 2) {
          filter = query;
        }

        type = this.modelFor(type);

        if (hasQuery) {
          array = this.recordArrayManager.createFilteredRecordArray(type, filter, query);
        } else {
          array = this.recordArrayManager.createFilteredRecordArray(type, filter);
        }

        promise = promise || ember$data$lib$system$store$$Promise.cast(array);

        return ember$data$lib$system$promise_proxies$$promiseArray(promise.then(function() {
          return array;
        }, null, "DS: Store#filter of " + type));
      },

      /**
        This method returns if a certain record is already loaded
        in the store. Use this function to know beforehand if a find()
        will result in a request or that it will be a cache hit.

         Example

        ```javascript
        store.recordIsLoaded('post', 1); // false
        store.find('post', 1).then(function() {
          store.recordIsLoaded('post', 1); // true
        });
        ```

        @method recordIsLoaded
        @param {String or subclass of DS.Model} type
        @param {string} id
        @return {boolean}
      */
      recordIsLoaded: function(type, id) {
        if (!this.hasRecordForId(type, id)) { return false; }
        return !ember$data$lib$system$store$$get(this.recordForId(type, id), 'isEmpty');
      },

      /**
        This method returns the metadata for a specific type.

        @method metadataFor
        @param {String or subclass of DS.Model} typeName
        @return {object}
      */
      metadataFor: function(typeName) {
        var type = this.modelFor(typeName);
        return this.typeMapFor(type).metadata;
      },

      /**
        This method sets the metadata for a specific type.

        @method setMetadataFor
        @param {String or subclass of DS.Model} typeName
        @param {Object} metadata metadata to set
        @return {object}
      */
      setMetadataFor: function(typeName, metadata) {
        var type = this.modelFor(typeName);
        Ember.merge(this.typeMapFor(type).metadata, metadata);
      },

      // ............
      // . UPDATING .
      // ............

      /**
        If the adapter updates attributes the record will notify
        the store to update its  membership in any filters.
        To avoid thrashing, this method is invoked only once per

        run loop per record.

        @method dataWasUpdated
        @private
        @param {Class} type
        @param {DS.Model} record
      */
      dataWasUpdated: function(type, record) {
        this.recordArrayManager.recordDidChange(record);
      },

      // ..............
      // . PERSISTING .
      // ..............

      /**
        This method is called by `record.save`, and gets passed a
        resolver for the promise that `record.save` returns.

        It schedules saving to happen at the end of the run loop.

        @method scheduleSave
        @private
        @param {DS.Model} record
        @param {Resolver} resolver
      */
      scheduleSave: function(record, resolver) {
        record.adapterWillCommit();
        this._pendingSave.push([record, resolver]);
        ember$data$lib$system$store$$once(this, 'flushPendingSave');
      },

      /**
        This method is called at the end of the run loop, and
        flushes any records passed into `scheduleSave`

        @method flushPendingSave
        @private
      */
      flushPendingSave: function() {
        var pending = this._pendingSave.slice();
        this._pendingSave = [];

        ember$data$lib$system$store$$forEach(pending, function(tuple) {
          var record = tuple[0];
          var resolver = tuple[1];
          var adapter = this.adapterFor(record.constructor);
          var operation;

          if (ember$data$lib$system$store$$get(record, 'currentState.stateName') === 'root.deleted.saved') {
            return resolver.resolve(record);
          } else if (ember$data$lib$system$store$$get(record, 'isNew')) {
            operation = 'createRecord';
          } else if (ember$data$lib$system$store$$get(record, 'isDeleted')) {
            operation = 'deleteRecord';
          } else {
            operation = 'updateRecord';
          }

          resolver.resolve(ember$data$lib$system$store$$_commit(adapter, this, operation, record));
        }, this);
      },

      /**
        This method is called once the promise returned by an
        adapter's `createRecord`, `updateRecord` or `deleteRecord`
        is resolved.

        If the data provides a server-generated ID, it will
        update the record and the store's indexes.

        @method didSaveRecord
        @private
        @param {DS.Model} record the in-flight record
        @param {Object} data optional data (see above)
      */
      didSaveRecord: function(record, data) {
        if (data) {
          // normalize relationship IDs into records
          this._backburner.schedule('normalizeRelationships', this, '_setupRelationships', record, record.constructor, data);
          this.updateId(record, data);
        }

        //We first make sure the primary data has been updated
        //TODO try to move notification to the user to the end of the runloop
        record.adapterDidCommit(data);
      },

      /**
        This method is called once the promise returned by an
        adapter's `createRecord`, `updateRecord` or `deleteRecord`
        is rejected with a `DS.InvalidError`.

        @method recordWasInvalid
        @private
        @param {DS.Model} record
        @param {Object} errors
      */
      recordWasInvalid: function(record, errors) {
        record.adapterDidInvalidate(errors);
      },

      /**
        This method is called once the promise returned by an
        adapter's `createRecord`, `updateRecord` or `deleteRecord`
        is rejected (with anything other than a `DS.InvalidError`).

        @method recordWasError
        @private
        @param {DS.Model} record
      */
      recordWasError: function(record) {
        record.adapterDidError();
      },

      /**
        When an adapter's `createRecord`, `updateRecord` or `deleteRecord`
        resolves with data, this method extracts the ID from the supplied
        data.

        @method updateId
        @private
        @param {DS.Model} record
        @param {Object} data
      */
      updateId: function(record, data) {
        var oldId = ember$data$lib$system$store$$get(record, 'id');
        var id = ember$data$lib$system$store$$coerceId(data.id);

        Ember.assert("An adapter cannot assign a new id to a record that already has an id. " + record + " had id: " + oldId + " and you tried to update it with " + id + ". This likely happened because your server returned data in response to a find or update that had a different id than the one you sent.", oldId === null || id === oldId);

        this.typeMapFor(record.constructor).idToRecord[id] = record;

        ember$data$lib$system$store$$set(record, 'id', id);
      },

      /**
        Returns a map of IDs to client IDs for a given type.

        @method typeMapFor
        @private
        @param {subclass of DS.Model} type
        @return {Object} typeMap
      */
      typeMapFor: function(type) {
        var typeMaps = ember$data$lib$system$store$$get(this, 'typeMaps');
        var guid = Ember.guidFor(type);
        var typeMap;

        typeMap = typeMaps[guid];

        if (typeMap) { return typeMap; }

        typeMap = {
          idToRecord: Ember.create(null),
          records: [],
          metadata: Ember.create(null),
          type: type
        };

        typeMaps[guid] = typeMap;

        return typeMap;
      },

      // ................
      // . LOADING DATA .
      // ................

      /**
        This internal method is used by `push`.

        @method _load
        @private
        @param {String or subclass of DS.Model} type
        @param {Object} data
      */
      _load: function(type, data) {
        var id = ember$data$lib$system$store$$coerceId(data.id);
        var record = this.recordForId(type, id);

        record.setupData(data);
        this.recordArrayManager.recordDidChange(record);

        return record;
      },

      /**
        Returns a model class for a particular key. Used by
        methods that take a type key (like `find`, `createRecord`,
        etc.)

        @method modelFor
        @param {String or subclass of DS.Model} key
        @return {subclass of DS.Model}
      */
      modelFor: function(key) {
        var factory;

        if (typeof key === 'string') {
          factory = this.modelFactoryFor(key);
          if (!factory) {
            throw new Ember.Error("No model was found for '" + key + "'");
          }
          factory.typeKey = factory.typeKey || this._normalizeTypeKey(key);
        } else {
          // A factory already supplied. Ensure it has a normalized key.
          factory = key;
          if (factory.typeKey) {
            factory.typeKey = this._normalizeTypeKey(factory.typeKey);
          }
        }

        factory.store = this;
        return factory;
      },

      modelFactoryFor: function(key) {
        return this.container.lookupFactory('model:' + key);
      },

      /**
        Push some data for a given type into the store.

        This method expects normalized data:

        * The ID is a key named `id` (an ID is mandatory)
        * The names of attributes are the ones you used in
          your model's `DS.attr`s.
        * Your relationships must be:
          * represented as IDs or Arrays of IDs
          * represented as model instances
          * represented as URLs, under the `links` key

        For this model:

        ```js
        App.Person = DS.Model.extend({
          firstName: DS.attr(),
          lastName: DS.attr(),

          children: DS.hasMany('person')
        });
        ```

        To represent the children as IDs:

        ```js
        {
          id: 1,
          firstName: "Tom",
          lastName: "Dale",
          children: [1, 2, 3]
        }
        ```

        To represent the children relationship as a URL:

        ```js
        {
          id: 1,
          firstName: "Tom",
          lastName: "Dale",
          links: {
            children: "/people/1/children"
          }
        }
        ```

        If you're streaming data or implementing an adapter, make sure
        that you have converted the incoming data into this form. The
        store's [normalize](#method_normalize) method is a convenience
        helper for converting a json payload into the form Ember Data
        expects.

        ```js
        store.push('person', store.normalize('person', data));
        ```

        This method can be used both to push in brand new
        records, as well as to update existing records.

        @method push
        @param {String or subclass of DS.Model} type
        @param {Object} data
        @return {DS.Model} the record that was created or
          updated.
      */
      push: function(typeName, data) {
        Ember.assert("Expected an object as `data` in a call to `push` for " + typeName + " , but was " + data, Ember.typeOf(data) === 'object');
        Ember.assert("You must include an `id` for " + typeName + " in an object passed to `push`", data.id != null && data.id !== '');

        var type = this.modelFor(typeName);
        var filter = Ember.EnumerableUtils.filter;

        // If Ember.ENV.DS_WARN_ON_UNKNOWN_KEYS is set to true and the payload
        // contains unknown keys, log a warning.
        if (Ember.ENV.DS_WARN_ON_UNKNOWN_KEYS) {
          Ember.warn("The payload for '" + type.typeKey + "' contains these unknown keys: " +
            Ember.inspect(filter(Ember.keys(data), function(key) {
              return !(key === 'id' || key === 'links' || ember$data$lib$system$store$$get(type, 'fields').has(key) || key.match(/Type$/));
            })) + ". Make sure they've been defined in your model.",
            filter(Ember.keys(data), function(key) {
              return !(key === 'id' || key === 'links' || ember$data$lib$system$store$$get(type, 'fields').has(key) || key.match(/Type$/));
            }).length === 0
          );
        }

        // Actually load the record into the store.

        this._load(type, data);

        var record = this.recordForId(type, data.id);
        var store = this;

        this._backburner.join(function() {
          store._backburner.schedule('normalizeRelationships', store, '_setupRelationships', record, type, data);
        });

        return record;
      },

      _setupRelationships: function(record, type, data) {
        // If the payload contains relationships that are specified as
        // IDs, normalizeRelationships will convert them into DS.Model instances
        // (possibly unloaded) before we push the payload into the
        // store.

        data = ember$data$lib$system$store$$normalizeRelationships(this, type, data);


        // Now that the pushed record as well as any related records
        // are in the store, create the data structures used to track
        // relationships.
        ember$data$lib$system$store$$setupRelationships(this, record, data);
      },

      /**
        Push some raw data into the store.

        This method can be used both to push in brand new
        records, as well as to update existing records. You
        can push in more than one type of object at once.
        All objects should be in the format expected by the
        serializer.

        ```js
        App.ApplicationSerializer = DS.ActiveModelSerializer;

        var pushData = {
          posts: [
            {id: 1, post_title: "Great post", comment_ids: [2]}
          ],
          comments: [
            {id: 2, comment_body: "Insightful comment"}
          ]
        }

        store.pushPayload(pushData);
        ```

        By default, the data will be deserialized using a default
        serializer (the application serializer if it exists).

        Alternatively, `pushPayload` will accept a model type which
        will determine which serializer will process the payload.
        However, the serializer itself (processing this data via
        `normalizePayload`) will not know which model it is
        deserializing.

        ```js
        App.ApplicationSerializer = DS.ActiveModelSerializer;
        App.PostSerializer = DS.JSONSerializer;
        store.pushPayload('comment', pushData); // Will use the ApplicationSerializer
        store.pushPayload('post', pushData); // Will use the PostSerializer
        ```

        @method pushPayload
        @param {String} type Optionally, a model used to determine which serializer will be used
        @param {Object} payload
      */
      pushPayload: function (type, inputPayload) {
        var serializer;
        var payload;
        if (!inputPayload) {
          payload = type;
          serializer = ember$data$lib$system$store$$defaultSerializer(this.container);
          Ember.assert("You cannot use `store#pushPayload` without a type unless your default serializer defines `pushPayload`", typeof serializer.pushPayload === 'function');
        } else {
          payload = inputPayload;
          serializer = this.serializerFor(type);
        }
        var store = this;
        ember$data$lib$system$store$$_adapterRun(this, function() {
          serializer.pushPayload(store, payload);
        });
      },

      /**
        `normalize` converts a json payload into the normalized form that
        [push](#method_push) expects.

        Example

        ```js
        socket.on('message', function(message) {
          var modelName = message.model;
          var data = message.data;
          store.push(modelName, store.normalize(modelName, data));
        });
        ```

        @method normalize
        @param {String} type The name of the model type for this payload
        @param {Object} payload
        @return {Object} The normalized payload
      */
      normalize: function (type, payload) {
        var serializer = this.serializerFor(type);
        var model = this.modelFor(type);
        return serializer.normalize(model, payload);
      },

      /**
        @method update
        @param {String} type
        @param {Object} data
        @return {DS.Model} the record that was updated.
        @deprecated Use [push](#method_push) instead
      */
      update: function(type, data) {
        Ember.deprecate('Using store.update() has been deprecated since store.push() now handles partial updates. You should use store.push() instead.');
        return this.push(type, data);
      },

      /**
        If you have an Array of normalized data to push,
        you can call `pushMany` with the Array, and it will
        call `push` repeatedly for you.

        @method pushMany
        @param {String or subclass of DS.Model} type
        @param {Array} datas
        @return {Array}
      */
      pushMany: function(type, datas) {
        var length = datas.length;
        var result = new Array(length);

        for (var i = 0; i < length; i++) {
          result[i] = this.push(type, datas[i]);
        }

        return result;
      },

      /**
        @method metaForType
        @param {String or subclass of DS.Model} typeName
        @param {Object} metadata
        @deprecated Use [setMetadataFor](#method_setMetadataFor) instead
      */
      metaForType: function(typeName, metadata) {
        Ember.deprecate('Using store.metaForType() has been deprecated. Use store.setMetadataFor() to set metadata for a specific type.');
        this.setMetadataFor(typeName, metadata);
      },

      /**
        Build a brand new record for a given type, ID, and
        initial data.

        @method buildRecord
        @private
        @param {subclass of DS.Model} type
        @param {String} id
        @param {Object} data
        @return {DS.Model} record
      */
      buildRecord: function(type, id, data) {
        var typeMap = this.typeMapFor(type);
        var idToRecord = typeMap.idToRecord;

        Ember.assert('The id ' + id + ' has already been used with another record of type ' + type.toString() + '.', !id || !idToRecord[id]);
        Ember.assert("`" + Ember.inspect(type)+ "` does not appear to be an ember-data model", (typeof type._create === 'function') );

        // lookupFactory should really return an object that creates
        // instances with the injections applied
        var record = type._create({
          id: id,
          store: this,
          container: this.container
        });

        if (data) {
          record.setupData(data);
        }

        // if we're creating an item, this process will be done
        // later, once the object has been persisted.
        if (id) {
          idToRecord[id] = record;
        }

        typeMap.records.push(record);

        return record;
      },

      //Called by the state machine to notify the store that the record is ready to be interacted with
      recordWasLoaded: function(record) {
        this.recordArrayManager.recordWasLoaded(record);
      },

      // ...............
      // . DESTRUCTION .
      // ...............

      /**
        @method dematerializeRecord
        @private
        @param {DS.Model} record
        @deprecated Use [unloadRecord](#method_unloadRecord) instead
      */
      dematerializeRecord: function(record) {
        Ember.deprecate('Using store.dematerializeRecord() has been deprecated since it was intended for private use only. You should use store.unloadRecord() instead.');
        this._dematerializeRecord(record);
      },

      /**
        When a record is destroyed, this un-indexes it and
        removes it from any record arrays so it can be GCed.

        @method _dematerializeRecord
        @private
        @param {DS.Model} record
      */
      _dematerializeRecord: function(record) {
        var type = record.constructor;
        var typeMap = this.typeMapFor(type);
        var id = ember$data$lib$system$store$$get(record, 'id');

        record.updateRecordArrays();

        if (id) {
          delete typeMap.idToRecord[id];
        }

        var loc = ember$data$lib$system$store$$indexOf(typeMap.records, record);
        typeMap.records.splice(loc, 1);
      },

      // ......................
      // . PER-TYPE ADAPTERS
      // ......................

      /**
        Returns the adapter for a given type.

        @method adapterFor
        @private
        @param {subclass of DS.Model} type
        @return DS.Adapter
      */
      adapterFor: function(type) {
        var adapter;
        var container = this.container;

        if (container) {
          adapter = container.lookup('adapter:' + type.typeKey) || container.lookup('adapter:application');
        }

        return adapter || ember$data$lib$system$store$$get(this, 'defaultAdapter');
      },

      // ..............................
      // . RECORD CHANGE NOTIFICATION .
      // ..............................

      /**
        Returns an instance of the serializer for a given type. For
        example, `serializerFor('person')` will return an instance of
        `App.PersonSerializer`.

        If no `App.PersonSerializer` is found, this method will look
        for an `App.ApplicationSerializer` (the default serializer for
        your entire application).

        If no `App.ApplicationSerializer` is found, it will fall back
        to an instance of `DS.JSONSerializer`.

        @method serializerFor
        @private
        @param {String} type the record to serialize
        @return {DS.Serializer}
      */
      serializerFor: function(type) {
        type = this.modelFor(type);
        var adapter = this.adapterFor(type);

        return ember$data$lib$system$store$$serializerFor(this.container, type.typeKey, adapter && adapter.defaultSerializer);
      },

      willDestroy: function() {
        var typeMaps = this.typeMaps;
        var keys = Ember.keys(typeMaps);

        var types = ember$data$lib$system$store$$map(keys, byType);

        this.recordArrayManager.destroy();

        ember$data$lib$system$store$$forEach(types, this.unloadAll, this);

        function byType(entry) {
          return typeMaps[entry]['type'];
        }

      },

      /**
        All typeKeys are camelCase internally. Changing this function may
        require changes to other normalization hooks (such as typeForRoot).

        @method _normalizeTypeKey
        @private
        @param {String} type
        @return {String} if the adapter can generate one, an ID
      */
      _normalizeTypeKey: function(key) {
        return ember$data$lib$system$store$$camelize(ember$inflector$lib$system$string$$singularize(key));
      }
    });


    function ember$data$lib$system$store$$normalizeRelationships(store, type, data, record) {
      type.eachRelationship(function(key, relationship) {
        var kind = relationship.kind;
        var value = data[key];
        if (kind === 'belongsTo') {
          ember$data$lib$system$store$$deserializeRecordId(store, data, key, relationship, value);
        } else if (kind === 'hasMany') {
          ember$data$lib$system$store$$deserializeRecordIds(store, data, key, relationship, value);
        }
      });

      return data;
    }

    function ember$data$lib$system$store$$deserializeRecordId(store, data, key, relationship, id) {
      if (ember$data$lib$system$store$$isNone(id) || id instanceof ember$data$lib$system$model$model$$default) {
        return;
      }
      Ember.assert("A " + relationship.parentType + " record was pushed into the store with the value of " + key + " being " + Ember.inspect(id) + ", but " + key + " is a belongsTo relationship so the value must not be an array. You should probably check your data payload or serializer.", !Ember.isArray(id));

      var type;

      if (typeof id === 'number' || typeof id === 'string') {
        type = ember$data$lib$system$store$$typeFor(relationship, key, data);
        data[key] = store.recordForId(type, id);
      } else if (typeof id === 'object') {
        // hasMany polymorphic
        Ember.assert('Ember Data expected a number or string to represent the record(s) in the `' + relationship.key + '` relationship instead it found an object. If this is a polymorphic relationship please specify a `type` key. If this is an embedded relationship please include the `DS.EmbeddedRecordsMixin` and specify the `' + relationship.key +'` property in your serializer\'s attrs object.', id.type);
        data[key] = store.recordForId(id.type, id.id);
      }
    }

    function ember$data$lib$system$store$$typeFor(relationship, key, data) {
      if (relationship.options.polymorphic) {
        return data[key + "Type"];
      } else {
        return relationship.type;
      }
    }

    function ember$data$lib$system$store$$deserializeRecordIds(store, data, key, relationship, ids) {
      if (ember$data$lib$system$store$$isNone(ids)) {
        return;
      }

      Ember.assert("A " + relationship.parentType + " record was pushed into the store with the value of " + key + " being '" + Ember.inspect(ids) + "', but " + key + " is a hasMany relationship so the value must be an array. You should probably check your data payload or serializer.", Ember.isArray(ids));
      for (var i=0, l=ids.length; i<l; i++) {
        ember$data$lib$system$store$$deserializeRecordId(store, ids, i, relationship, ids[i]);
      }
    }

    // Delegation to the adapter and promise management


    function ember$data$lib$system$store$$serializerFor(container, type, defaultSerializer) {
      return container.lookup('serializer:'+type) ||
                     container.lookup('serializer:application') ||
                     container.lookup('serializer:' + defaultSerializer) ||
                     container.lookup('serializer:-default');
    }

    function ember$data$lib$system$store$$defaultSerializer(container) {
      return container.lookup('serializer:application') ||
             container.lookup('serializer:-default');
    }

    function ember$data$lib$system$store$$serializerForAdapter(adapter, type) {
      var serializer = adapter.serializer;
      var defaultSerializer = adapter.defaultSerializer;
      var container = adapter.container;

      if (container && serializer === undefined) {
        serializer = ember$data$lib$system$store$$serializerFor(container, type.typeKey, defaultSerializer);
      }

      if (serializer === null || serializer === undefined) {
        serializer = {
          extract: function(store, type, payload) { return payload; }
        };
      }

      return serializer;
    }

    function ember$data$lib$system$store$$_objectIsAlive(object) {
      return !(ember$data$lib$system$store$$get(object, "isDestroyed") || ember$data$lib$system$store$$get(object, "isDestroying"));
    }

    function ember$data$lib$system$store$$_guard(promise, test) {
      var guarded = promise['finally'](function() {
        if (!test()) {
          guarded._subscribers.length = 0;
        }
      });

      return guarded;
    }

    function ember$data$lib$system$store$$_adapterRun(store, fn) {
      return store._backburner.run(fn);
    }

    function ember$data$lib$system$store$$_bind(fn) {
      var args = Array.prototype.slice.call(arguments, 1);

      return function() {
        return fn.apply(undefined, args);
      };
    }

    function ember$data$lib$system$store$$_find(adapter, store, type, id, record) {
      var promise = adapter.find(store, type, id, record);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#find of " + type + " with id: " + id;

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        Ember.assert("You made a request for a " + type.typeKey + " with id " + id + ", but the adapter's response did not have any data", adapterPayload);
        return ember$data$lib$system$store$$_adapterRun(store, function() {
          var payload = serializer.extract(store, type, adapterPayload, id, 'find');

          return store.push(type, payload);
        });
      }, function(error) {
        var record = store.getById(type, id);
        if (record) {
          record.notFound();
          if (ember$data$lib$system$store$$get(record, 'isEmpty')) {
            store.unloadRecord(record);
          }
        }
        throw error;
      }, "DS: Extract payload of '" + type + "'");
    }


    function ember$data$lib$system$store$$_findMany(adapter, store, type, ids, records) {
      var promise = adapter.findMany(store, type, ids, records);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#findMany of " + type;

      if (promise === undefined) {
        throw new Error('adapter.findMany returned undefined, this was very likely a mistake');
      }

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        return ember$data$lib$system$store$$_adapterRun(store, function() {
          var payload = serializer.extract(store, type, adapterPayload, null, 'findMany');

          Ember.assert("The response from a findMany must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

          return store.pushMany(type, payload);
        });
      }, null, "DS: Extract payload of " + type);
    }

    function ember$data$lib$system$store$$_findHasMany(adapter, store, record, link, relationship) {
      var promise = adapter.findHasMany(store, record, link, relationship);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, relationship.type);
      var label = "DS: Handle Adapter#findHasMany of " + record + " : " + relationship.type;

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, record));

      return promise.then(function(adapterPayload) {
        return ember$data$lib$system$store$$_adapterRun(store, function() {
          var payload = serializer.extract(store, relationship.type, adapterPayload, null, 'findHasMany');

          Ember.assert("The response from a findHasMany must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

          var records = store.pushMany(relationship.type, payload);
          return records;
        });
      }, null, "DS: Extract payload of " + record + " : hasMany " + relationship.type);
    }

    function ember$data$lib$system$store$$_findBelongsTo(adapter, store, record, link, relationship) {
      var promise = adapter.findBelongsTo(store, record, link, relationship);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, relationship.type);
      var label = "DS: Handle Adapter#findBelongsTo of " + record + " : " + relationship.type;

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, record));

      return promise.then(function(adapterPayload) {
        return ember$data$lib$system$store$$_adapterRun(store, function() {
          var payload = serializer.extract(store, relationship.type, adapterPayload, null, 'findBelongsTo');

          if (!payload) {
            return null;
          }

          var record = store.push(relationship.type, payload);
          return record;
        });
      }, null, "DS: Extract payload of " + record + " : " + relationship.type);
    }

    function ember$data$lib$system$store$$_findAll(adapter, store, type, sinceToken) {
      var promise = adapter.findAll(store, type, sinceToken);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#findAll of " + type;

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        ember$data$lib$system$store$$_adapterRun(store, function() {
          var payload = serializer.extract(store, type, adapterPayload, null, 'findAll');

          Ember.assert("The response from a findAll must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

          store.pushMany(type, payload);
        });

        store.didUpdateAll(type);
        return store.all(type);
      }, null, "DS: Extract payload of findAll " + type);
    }

    function ember$data$lib$system$store$$_findQuery(adapter, store, type, query, recordArray) {
      var promise = adapter.findQuery(store, type, query, recordArray);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#findQuery of " + type;

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        var payload;
        ember$data$lib$system$store$$_adapterRun(store, function() {
          payload = serializer.extract(store, type, adapterPayload, null, 'findQuery');

          Ember.assert("The response from a findQuery must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');
        });

        recordArray.load(payload);
        return recordArray;

      }, null, "DS: Extract payload of findQuery " + type);
    }

    function ember$data$lib$system$store$$_commit(adapter, store, operation, record) {
      var type = record.constructor;
      var promise = adapter[operation](store, type, record);
      var serializer = ember$data$lib$system$store$$serializerForAdapter(adapter, type);
      var label = "DS: Extract and notify about " + operation + " completion of " + record;

      Ember.assert("Your adapter's '" + operation + "' method must return a value, but it returned `undefined", promise !==undefined);

      promise = ember$data$lib$system$store$$Promise.cast(promise, label);
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, store));
      promise = ember$data$lib$system$store$$_guard(promise, ember$data$lib$system$store$$_bind(ember$data$lib$system$store$$_objectIsAlive, record));

      return promise.then(function(adapterPayload) {
        var payload;

        ember$data$lib$system$store$$_adapterRun(store, function() {
          if (adapterPayload) {
            payload = serializer.extract(store, type, adapterPayload, ember$data$lib$system$store$$get(record, 'id'), operation);
          } else {
            payload = adapterPayload;
          }
          store.didSaveRecord(record, payload);
        });

        return record;
      }, function(reason) {
        if (reason instanceof ember$data$lib$system$adapter$$InvalidError) {
          var errors = serializer.extractErrors(store, type, reason.errors, ember$data$lib$system$store$$get(record, 'id'));
          store.recordWasInvalid(record, errors);
          reason = new ember$data$lib$system$adapter$$InvalidError(errors);
        } else {
          store.recordWasError(record, reason);
        }

        throw reason;
      }, label);
    }

    function ember$data$lib$system$store$$setupRelationships(store, record, data) {
      var type = record.constructor;

      type.eachRelationship(function(key, descriptor) {
        var kind = descriptor.kind;
        var value = data[key];
        var relationship = record._relationships[key];

        if (data.links && data.links[key]) {
          relationship.updateLink(data.links[key]);
        }

        if (kind === 'belongsTo') {
          if (value === undefined) {
            return;
          }
          relationship.setCanonicalRecord(value);
        } else if (kind === 'hasMany' && value) {
          relationship.updateRecordsFromAdapter(value);
        }
      });
    }

    var ember$data$lib$system$store$$default = ember$data$lib$system$store$$Store;
    function ember$data$lib$initializers$store$$initializeStore(container, application) {
      Ember.deprecate('Specifying a custom Store for Ember Data on your global namespace as `App.Store` ' +
                      'has been deprecated. Please use `App.ApplicationStore` instead.', !(application && application.Store));

      container.register('store:main', container.lookupFactory('store:application') || (application && application.Store) || ember$data$lib$system$store$$default);

      // allow older names to be looked up

      var proxy = new ember$data$lib$system$container_proxy$$default(container);
      proxy.registerDeprecations([
        { deprecated: 'serializer:_default',  valid: 'serializer:-default' },
        { deprecated: 'serializer:_rest',     valid: 'serializer:-rest' },
        { deprecated: 'adapter:_rest',        valid: 'adapter:-rest' }
      ]);

      // new go forward paths
      container.register('serializer:-default', ember$data$lib$serializers$json_serializer$$default);
      container.register('serializer:-rest', ember$data$lib$serializers$rest_serializer$$default);
      container.register('adapter:-rest', ember$data$lib$adapters$rest_adapter$$default);

      // Eagerly generate the store so defaultStore is populated.
      // TODO: Do this in a finisher hook
      container.lookup('store:main');
    }
    var ember$data$lib$initializers$store$$default = ember$data$lib$initializers$store$$initializeStore;

    var ember$data$lib$transforms$base$$default = Ember.Object.extend({
      /**
        When given a deserialized value from a record attribute this
        method must return the serialized value.

        Example

        ```javascript
        serialize: function(deserialized) {
          return Ember.isEmpty(deserialized) ? null : Number(deserialized);
        }
        ```

        @method serialize
        @param {mixed} deserialized The deserialized value
        @return {mixed} The serialized value
      */
      serialize: Ember.required(),

      /**
        When given a serialize value from a JSON object this method must
        return the deserialized value for the record attribute.

        Example

        ```javascript
        deserialize: function(serialized) {
          return empty(serialized) ? null : Number(serialized);
        }
        ```

        @method deserialize
        @param {mixed} serialized The serialized value
        @return {mixed} The deserialized value
      */
      deserialize: Ember.required()
    });

    var ember$data$lib$transforms$number$$empty = Ember.isEmpty;

    function ember$data$lib$transforms$number$$isNumber(value) {
      return value === value && value !== Infinity && value !== -Infinity;
    }

    var ember$data$lib$transforms$number$$default = ember$data$lib$transforms$base$$default.extend({
      deserialize: function(serialized) {
        var transformed;

        if (ember$data$lib$transforms$number$$empty(serialized)) {
          return null;
        } else {
          transformed = Number(serialized);

          return ember$data$lib$transforms$number$$isNumber(transformed) ? transformed : null;
        }
      },

      serialize: function(deserialized) {
        var transformed;

        if (ember$data$lib$transforms$number$$empty(deserialized)) {
          return null;
        } else {
          transformed = Number(deserialized);

          return ember$data$lib$transforms$number$$isNumber(transformed) ? transformed : null;
        }
      }
    });

    // Date.prototype.toISOString shim
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    var ember$data$lib$transforms$date$$toISOString = Date.prototype.toISOString || function() {
      function pad(number) {
        if ( number < 10 ) {
          return '0' + number;
        }
        return number;
      }

      return this.getUTCFullYear() +
        '-' + pad(this.getUTCMonth() + 1) +
        '-' + pad(this.getUTCDate()) +
        'T' + pad(this.getUTCHours()) +
        ':' + pad(this.getUTCMinutes()) +
        ':' + pad(this.getUTCSeconds()) +
        '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
        'Z';
    };

    if (Ember.SHIM_ES5) {
      if (!Date.prototype.toISOString) {
        Date.prototype.toISOString = ember$data$lib$transforms$date$$toISOString;
      }
    }

    var ember$data$lib$transforms$date$$default = ember$data$lib$transforms$base$$default.extend({
      deserialize: function(serialized) {
        var type = typeof serialized;

        if (type === "string") {
          return new Date(Ember.Date.parse(serialized));
        } else if (type === "number") {
          return new Date(serialized);
        } else if (serialized === null || serialized === undefined) {
          // if the value is not present in the data,
          // return undefined, not null.
          return serialized;
        } else {
          return null;
        }
      },

      serialize: function(date) {
        if (date instanceof Date) {
          return ember$data$lib$transforms$date$$toISOString.call(date);
        } else {
          return null;
        }
      }
    });

    var ember$data$lib$transforms$string$$none = Ember.isNone;

    var ember$data$lib$transforms$string$$default = ember$data$lib$transforms$base$$default.extend({
      deserialize: function(serialized) {
        return ember$data$lib$transforms$string$$none(serialized) ? null : String(serialized);
      },
      serialize: function(deserialized) {
        return ember$data$lib$transforms$string$$none(deserialized) ? null : String(deserialized);
      }
    });

    var ember$data$lib$transforms$boolean$$default = ember$data$lib$transforms$base$$default.extend({
      deserialize: function(serialized) {
        var type = typeof serialized;

        if (type === "boolean") {
          return serialized;
        } else if (type === "string") {
          return serialized.match(/^true$|^t$|^1$/i) !== null;
        } else if (type === "number") {
          return serialized === 1;
        } else {
          return false;
        }
      },

      serialize: function(deserialized) {
        return Boolean(deserialized);
      }
    });

    function ember$data$lib$initializers$transforms$$initializeTransforms(container) {
      container.register('transform:boolean', ember$data$lib$transforms$boolean$$default);
      container.register('transform:date', ember$data$lib$transforms$date$$default);
      container.register('transform:number', ember$data$lib$transforms$number$$default);
      container.register('transform:string', ember$data$lib$transforms$string$$default);
    }
    var ember$data$lib$initializers$transforms$$default = ember$data$lib$initializers$transforms$$initializeTransforms;
    function ember$data$lib$initializers$store_injections$$initializeStoreInjections(container) {
      container.injection('controller', 'store', 'store:main');
      container.injection('route', 'store', 'store:main');
      container.injection('serializer', 'store', 'store:main');
      container.injection('data-adapter', 'store', 'store:main');
    }
    var ember$data$lib$initializers$store_injections$$default = ember$data$lib$initializers$store_injections$$initializeStoreInjections;
    var ember$data$lib$system$debug$debug_adapter$$get = Ember.get;
    var ember$data$lib$system$debug$debug_adapter$$capitalize = Ember.String.capitalize;
    var ember$data$lib$system$debug$debug_adapter$$underscore = Ember.String.underscore;

    var ember$data$lib$system$debug$debug_adapter$$default = Ember.DataAdapter.extend({
      getFilters: function() {
        return [
          { name: 'isNew', desc: 'New' },
          { name: 'isModified', desc: 'Modified' },
          { name: 'isClean', desc: 'Clean' }
        ];
      },

      detect: function(klass) {
        return klass !== ember$data$lib$system$model$model$$default && ember$data$lib$system$model$model$$default.detect(klass);
      },

      columnsForType: function(type) {
        var columns = [{
          name: 'id',
          desc: 'Id'
        }];
        var count = 0;
        var self = this;
        ember$data$lib$system$debug$debug_adapter$$get(type, 'attributes').forEach(function(meta, name) {
          if (count++ > self.attributeLimit) { return false; }
          var desc = ember$data$lib$system$debug$debug_adapter$$capitalize(ember$data$lib$system$debug$debug_adapter$$underscore(name).replace('_', ' '));
          columns.push({ name: name, desc: desc });
        });
        return columns;
      },

      getRecords: function(type) {
        return this.get('store').all(type);
      },

      getRecordColumnValues: function(record) {
        var self = this;
        var count = 0;
        var columnValues = { id: ember$data$lib$system$debug$debug_adapter$$get(record, 'id') };

        record.eachAttribute(function(key) {
          if (count++ > self.attributeLimit) {
            return false;
          }
          var value = ember$data$lib$system$debug$debug_adapter$$get(record, key);
          columnValues[key] = value;
        });
        return columnValues;
      },

      getRecordKeywords: function(record) {
        var keywords = [];
        var keys = Ember.A(['id']);
        record.eachAttribute(function(key) {
          keys.push(key);
        });
        keys.forEach(function(key) {
          keywords.push(ember$data$lib$system$debug$debug_adapter$$get(record, key));
        });
        return keywords;
      },

      getRecordFilterValues: function(record) {
        return {
          isNew: record.get('isNew'),
          isModified: record.get('isDirty') && !record.get('isNew'),
          isClean: !record.get('isDirty')
        };
      },

      getRecordColor: function(record) {
        var color = 'black';
        if (record.get('isNew')) {
          color = 'green';
        } else if (record.get('isDirty')) {
          color = 'blue';
        }
        return color;
      },

      observeRecord: function(record, recordUpdated) {
        var releaseMethods = Ember.A();
        var self = this;
        var keysToObserve = Ember.A(['id', 'isNew', 'isDirty']);

        record.eachAttribute(function(key) {
          keysToObserve.push(key);
        });

        keysToObserve.forEach(function(key) {
          var handler = function() {
            recordUpdated(self.wrapRecord(record));
          };
          Ember.addObserver(record, key, handler);
          releaseMethods.push(function() {
            Ember.removeObserver(record, key, handler);
          });
        });

        var release = function() {
          releaseMethods.forEach(function(fn) { fn(); } );
        };

        return release;
      }

    });

    function ember$data$lib$initializers$data_adapter$$initializeDebugAdapter(container) {
      container.register('data-adapter:main', ember$data$lib$system$debug$debug_adapter$$default);
    }
    var ember$data$lib$initializers$data_adapter$$default = ember$data$lib$initializers$data_adapter$$initializeDebugAdapter;
    function ember$data$lib$setup$container$$setupContainer(container, application) {
      // application is not a required argument. This ensures
      // testing setups can setup a container without booting an
      // entire ember application.

      ember$data$lib$initializers$data_adapter$$default(container, application);
      ember$data$lib$initializers$transforms$$default(container, application);
      ember$data$lib$initializers$store_injections$$default(container, application);
      ember$data$lib$initializers$store$$default(container, application);
      activemodel$adapter$lib$setup$container$$default(container, application);
    }
    var ember$data$lib$setup$container$$default = ember$data$lib$setup$container$$setupContainer;

    var ember$data$lib$ember$initializer$$K = Ember.K;

    /**
      @module ember-data
    */

    /*

      This code initializes Ember-Data onto an Ember application.

      If an Ember.js developer defines a subclass of DS.Store on their application,
      as `App.ApplicationStore` (or via a module system that resolves to `store:application`)
      this code will automatically instantiate it and make it available on the
      router.

      Additionally, after an application's controllers have been injected, they will
      each have the store made available to them.

      For example, imagine an Ember.js application with the following classes:

      App.ApplicationStore = DS.Store.extend({
        adapter: 'custom'
      });

      App.PostsController = Ember.ArrayController.extend({
        // ...
      });

      When the application is initialized, `App.ApplicationStore` will automatically be
      instantiated, and the instance of `App.PostsController` will have its `store`
      property set to that instance.

      Note that this code will only be run if the `ember-application` package is
      loaded. If Ember Data is being used in an environment other than a
      typical application (e.g., node.js where only `ember-runtime` is available),
      this code will be ignored.
    */

    Ember.onLoad('Ember.Application', function(Application) {

      Application.initializer({
        name:       "ember-data",
        initialize: ember$data$lib$setup$container$$default
      });

      // Deprecated initializers to satisfy old code that depended on them

      Application.initializer({
        name:       "store",
        after:      "ember-data",
        initialize: ember$data$lib$ember$initializer$$K
      });

      Application.initializer({
        name:       "activeModelAdapter",
        before:     "store",
        initialize: ember$data$lib$ember$initializer$$K
      });

      Application.initializer({
        name:       "transforms",
        before:     "store",
        initialize: ember$data$lib$ember$initializer$$K
      });

      Application.initializer({
        name:       "data-adapter",
        before:     "store",
        initialize: ember$data$lib$ember$initializer$$K
      });

      Application.initializer({
        name:       "injectStore",
        before:     "store",
        initialize: ember$data$lib$ember$initializer$$K
      });
    });
    /**
      @module ember-data
    */

    /**
      Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>

      © 2011 Colin Snover <http://zetafleet.com>

      Released under MIT license.

      @class Date
      @namespace Ember
      @static
    */
    Ember.Date = Ember.Date || {};

    var origParse = Date.parse;
    var numericKeys = [1, 4, 5, 6, 7, 10, 11];

    /**
      @method parse
      @param {Date} date
      @return {Number} timestamp
    */
    Ember.Date.parse = function (date) {
      var timestamp, struct;
      var minutesOffset = 0;

      // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
      // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
      // implementations could be faster
      //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
      if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
        // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
        for (var i = 0, k; (k = numericKeys[i]); ++i) {
          struct[k] = +struct[k] || 0;
        }

        // allow undefined days and months
        struct[2] = (+struct[2] || 1) - 1;
        struct[3] = +struct[3] || 1;

        if (struct[8] !== 'Z' && struct[9] !== undefined) {
          minutesOffset = struct[10] * 60 + struct[11];

          if (struct[9] === '+') {
            minutesOffset = 0 - minutesOffset;
          }
        }

        timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
      } else {
        timestamp = origParse ? origParse(date) : NaN;
      }

      return timestamp;
    };

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Date) {
      Date.parse = Ember.Date.parse;
    }

    ember$data$lib$system$model$model$$default.reopen({

      /**
        Provides info about the model for debugging purposes
        by grouping the properties into more semantic groups.

        Meant to be used by debugging tools such as the Chrome Ember Extension.

        - Groups all attributes in "Attributes" group.
        - Groups all belongsTo relationships in "Belongs To" group.
        - Groups all hasMany relationships in "Has Many" group.
        - Groups all flags in "Flags" group.
        - Flags relationship CPs as expensive properties.

        @method _debugInfo
        @for DS.Model
        @private
      */
      _debugInfo: function() {
        var attributes = ['id'];
        var relationships = { belongsTo: [], hasMany: [] };
        var expensiveProperties = [];

        this.eachAttribute(function(name, meta) {
          attributes.push(name);
        }, this);

        this.eachRelationship(function(name, relationship) {
          relationships[relationship.kind].push(name);
          expensiveProperties.push(name);
        });

        var groups = [
          {
            name: 'Attributes',
            properties: attributes,
            expand: true
          },
          {
            name: 'Belongs To',
            properties: relationships.belongsTo,
            expand: true
          },
          {
            name: 'Has Many',
            properties: relationships.hasMany,
            expand: true
          },
          {
            name: 'Flags',
            properties: ['isLoaded', 'isDirty', 'isSaving', 'isDeleted', 'isError', 'isNew', 'isValid']
          }
        ];

        return {
          propertyInfo: {
            // include all other mixins / properties (not just the grouped ones)
            includeOtherProperties: true,
            groups: groups,
            // don't pre-calculate unless cached
            expensiveProperties: expensiveProperties
          }
        };
      }
    });

    var ember$data$lib$system$debug$debug_info$$default = ember$data$lib$system$model$model$$default;
    var ember$data$lib$system$debug$$default = ember$data$lib$system$debug$debug_adapter$$default;
    var ember$data$lib$serializers$embedded_records_mixin$$get = Ember.get;
    var ember$data$lib$serializers$embedded_records_mixin$$forEach = Ember.EnumerableUtils.forEach;
    var ember$data$lib$serializers$embedded_records_mixin$$camelize = Ember.String.camelize;

    /**
      ## Using Embedded Records

      `DS.EmbeddedRecordsMixin` supports serializing embedded records.

      To set up embedded records, include the mixin when extending a serializer
      then define and configure embedded (model) relationships.

      Below is an example of a per-type serializer ('post' type).

      ```js
      App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
        attrs: {
          author: { embedded: 'always' },
          comments: { serialize: 'ids' }
        }
      });
      ```
      Note that this use of `{ embedded: 'always' }` is unrelated to
      the `{ embedded: 'always' }` that is defined as an option on `DS.attr` as part of
      defining a model while working with the ActiveModelSerializer.  Nevertheless,
      using `{ embedded: 'always' }` as an option to DS.attr is not a valid way to setup
      embedded records.

      The `attrs` option for a resource `{ embedded: 'always' }` is shorthand for:

      ```js
      {
        serialize: 'records',
        deserialize: 'records'
      }
      ```

      ### Configuring Attrs

      A resource's `attrs` option may be set to use `ids`, `records` or false for the
      `serialize`  and `deserialize` settings.

      The `attrs` property can be set on the ApplicationSerializer or a per-type
      serializer.

      In the case where embedded JSON is expected while extracting a payload (reading)
      the setting is `deserialize: 'records'`, there is no need to use `ids` when
      extracting as that is the default behavior without this mixin if you are using
      the vanilla EmbeddedRecordsMixin. Likewise, to embed JSON in the payload while
      serializing `serialize: 'records'` is the setting to use. There is an option of
      not embedding JSON in the serialized payload by using `serialize: 'ids'`. If you
      do not want the relationship sent at all, you can use `serialize: false`.


      ### EmbeddedRecordsMixin defaults
      If you do not overwrite `attrs` for a specific relationship, the `EmbeddedRecordsMixin`
      will behave in the following way:

      BelongsTo: `{ serialize: 'id', deserialize: 'id' }`
      HasMany:   `{ serialize: false, deserialize: 'ids' }`

      ### Model Relationships

      Embedded records must have a model defined to be extracted and serialized. Note that
      when defining any relationships on your model such as `belongsTo` and `hasMany`, you
      should not both specify `async:true` and also indicate through the serializer's
      `attrs` attribute that the related model should be embedded.  If a model is
      declared embedded, then do not use `async:true`.

      To successfully extract and serialize embedded records the model relationships
      must be setup correcty See the
      [defining relationships](/guides/models/defining-models/#toc_defining-relationships)
      section of the **Defining Models** guide page.

      Records without an `id` property are not considered embedded records, model
      instances must have an `id` property to be used with Ember Data.

      ### Example JSON payloads, Models and Serializers

      **When customizing a serializer it is important to grok what the customizations
      are. Please read the docs for the methods this mixin provides, in case you need
      to modify it to fit your specific needs.**

      For example review the docs for each method of this mixin:
      * [normalize](/api/data/classes/DS.EmbeddedRecordsMixin.html#method_normalize)
      * [serializeBelongsTo](/api/data/classes/DS.EmbeddedRecordsMixin.html#method_serializeBelongsTo)
      * [serializeHasMany](/api/data/classes/DS.EmbeddedRecordsMixin.html#method_serializeHasMany)

      @class EmbeddedRecordsMixin
      @namespace DS
    */
    var ember$data$lib$serializers$embedded_records_mixin$$EmbeddedRecordsMixin = Ember.Mixin.create({

      /**
        Normalize the record and recursively normalize/extract all the embedded records
        while pushing them into the store as they are encountered

        A payload with an attr configured for embedded records needs to be extracted:

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "comments": [{
              "id": "1",
              "body": "Rails is unagi"
            }, {
              "id": "2",
              "body": "Omakase O_o"
            }]
          }
        }
        ```
       @method normalize
       @param {subclass of DS.Model} type
       @param {Object} hash to be normalized
       @param {String} key the hash has been referenced by
       @return {Object} the normalized hash
      **/
      normalize: function(type, hash, prop) {
        var normalizedHash = this._super(type, hash, prop);
        return ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedRecords(this, this.store, type, normalizedHash);
      },

      keyForRelationship: function(key, type) {
        if (this.hasDeserializeRecordsOption(key)) {
          return this.keyForAttribute(key);
        } else {
          return this._super(key, type) || key;
        }
      },

      /**
        Serialize `belongsTo` relationship when it is configured as an embedded object.

        This example of an author model belongs to a post model:

        ```js
        Post = DS.Model.extend({
          title:    DS.attr('string'),
          body:     DS.attr('string'),
          author:   DS.belongsTo('author')
        });

        Author = DS.Model.extend({
          name:     DS.attr('string'),
          post:     DS.belongsTo('post')
        });
        ```

        Use a custom (type) serializer for the post model to configure embedded author

        ```js
        App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
          attrs: {
            author: {embedded: 'always'}
          }
        })
        ```

        A payload with an attribute configured for embedded records can serialize
        the records together under the root attribute's payload:

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "author": {
              "id": "2"
              "name": "dhh"
            }
          }
        }
        ```

        @method serializeBelongsTo
        @param {DS.Snapshot} snapshot
        @param {Object} json
        @param {Object} relationship
      */
      serializeBelongsTo: function(snapshot, json, relationship) {
        var attr = relationship.key;
        if (this.noSerializeOptionSpecified(attr)) {
          this._super(snapshot, json, relationship);
          return;
        }
        var includeIds = this.hasSerializeIdsOption(attr);
        var includeRecords = this.hasSerializeRecordsOption(attr);
        var embeddedSnapshot = snapshot.belongsTo(attr);
        var key;
        if (includeIds) {
          key = this.keyForRelationship(attr, relationship.kind);
          if (!embeddedSnapshot) {
            json[key] = null;
          } else {
            json[key] = embeddedSnapshot.id;
          }
        } else if (includeRecords) {
          key = this.keyForAttribute(attr);
          if (!embeddedSnapshot) {
            json[key] = null;
          } else {
            json[key] = embeddedSnapshot.record.serialize({ includeId: true });
            this.removeEmbeddedForeignKey(snapshot, embeddedSnapshot, relationship, json[key]);
          }
        }
      },

      /**
        Serialize `hasMany` relationship when it is configured as embedded objects.

        This example of a post model has many comments:

        ```js
        Post = DS.Model.extend({
          title:    DS.attr('string'),
          body:     DS.attr('string'),
          comments: DS.hasMany('comment')
        });

        Comment = DS.Model.extend({
          body:     DS.attr('string'),
          post:     DS.belongsTo('post')
        });
        ```

        Use a custom (type) serializer for the post model to configure embedded comments

        ```js
        App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
          attrs: {
            comments: {embedded: 'always'}
          }
        })
        ```

        A payload with an attribute configured for embedded records can serialize
        the records together under the root attribute's payload:

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "body": "I want this for my ORM, I want that for my template language..."
            "comments": [{
              "id": "1",
              "body": "Rails is unagi"
            }, {
              "id": "2",
              "body": "Omakase O_o"
            }]
          }
        }
        ```

        The attrs options object can use more specific instruction for extracting and
        serializing. When serializing, an option to embed `ids` or `records` can be set.
        When extracting the only option is `records`.

        So `{embedded: 'always'}` is shorthand for:
        `{serialize: 'records', deserialize: 'records'}`

        To embed the `ids` for a related object (using a hasMany relationship):

        ```js
        App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
          attrs: {
            comments: {serialize: 'ids', deserialize: 'records'}
          }
        })
        ```

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "body": "I want this for my ORM, I want that for my template language..."
            "comments": ["1", "2"]
          }
        }
        ```

        @method serializeHasMany
        @param {DS.Snapshot} snapshot
        @param {Object} json
        @param {Object} relationship
      */
      serializeHasMany: function(snapshot, json, relationship) {
        var attr = relationship.key;
        if (this.noSerializeOptionSpecified(attr)) {
          this._super(snapshot, json, relationship);
          return;
        }
        var includeIds = this.hasSerializeIdsOption(attr);
        var includeRecords = this.hasSerializeRecordsOption(attr);
        var key;
        if (includeIds) {
          key = this.keyForRelationship(attr, relationship.kind);
          json[key] = snapshot.hasMany(attr, { ids: true });
        } else if (includeRecords) {
          key = this.keyForAttribute(attr);
          json[key] = snapshot.hasMany(attr).map(function(embeddedSnapshot) {
            var embeddedJson = embeddedSnapshot.record.serialize({ includeId: true });
            this.removeEmbeddedForeignKey(snapshot, embeddedSnapshot, relationship, embeddedJson);
            return embeddedJson;
          }, this);
        }
      },

      /**
        When serializing an embedded record, modify the property (in the json payload)
        that refers to the parent record (foreign key for relationship).

        Serializing a `belongsTo` relationship removes the property that refers to the
        parent record

        Serializing a `hasMany` relationship does not remove the property that refers to
        the parent record.

        @method removeEmbeddedForeignKey
        @param {DS.Snapshot} snapshot
        @param {DS.Snapshot} embeddedSnapshot
        @param {Object} relationship
        @param {Object} json
      */
      removeEmbeddedForeignKey: function (snapshot, embeddedSnapshot, relationship, json) {
        if (relationship.kind === 'hasMany') {
          return;
        } else if (relationship.kind === 'belongsTo') {
          var parentRecord = snapshot.type.inverseFor(relationship.key);
          if (parentRecord) {
            var name = parentRecord.name;
            var embeddedSerializer = this.store.serializerFor(embeddedSnapshot.type);
            var parentKey = embeddedSerializer.keyForRelationship(name, parentRecord.kind);
            if (parentKey) {
              delete json[parentKey];
            }
          }
        }
      },

      // checks config for attrs option to embedded (always) - serialize and deserialize
      hasEmbeddedAlwaysOption: function (attr) {
        var option = this.attrsOption(attr);
        return option && option.embedded === 'always';
      },

      // checks config for attrs option to serialize ids
      hasSerializeRecordsOption: function(attr) {
        var alwaysEmbed = this.hasEmbeddedAlwaysOption(attr);
        var option = this.attrsOption(attr);
        return alwaysEmbed || (option && (option.serialize === 'records'));
      },

      // checks config for attrs option to serialize records
      hasSerializeIdsOption: function(attr) {
        var option = this.attrsOption(attr);
        return option && (option.serialize === 'ids' || option.serialize === 'id');
      },

      // checks config for attrs option to serialize records
      noSerializeOptionSpecified: function(attr) {
        var option = this.attrsOption(attr);
        return !(option && (option.serialize || option.embedded));
      },

      // checks config for attrs option to deserialize records
      // a defined option object for a resource is treated the same as
      // `deserialize: 'records'`
      hasDeserializeRecordsOption: function(attr) {
        var alwaysEmbed = this.hasEmbeddedAlwaysOption(attr);
        var option = this.attrsOption(attr);
        return alwaysEmbed || (option && option.deserialize === 'records');
      },

      attrsOption: function(attr) {
        var attrs = this.get('attrs');
        return attrs && (attrs[ember$data$lib$serializers$embedded_records_mixin$$camelize(attr)] || attrs[attr]);
      }
    });

    // chooses a relationship kind to branch which function is used to update payload
    // does not change payload if attr is not embedded
    function ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedRecords(serializer, store, type, partial) {

      type.eachRelationship(function(key, relationship) {
        if (serializer.hasDeserializeRecordsOption(key)) {
          var embeddedType = store.modelFor(relationship.type.typeKey);
          if (relationship.kind === "hasMany") {
            if (relationship.options.polymorphic) {
              ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedHasManyPolymorphic(store, key, partial);
            } else {
              ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedHasMany(store, key, embeddedType, partial);
            }
          }
          if (relationship.kind === "belongsTo") {
            if (relationship.options.polymorphic) {
              ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedBelongsToPolymorphic(store, key, partial);
            } else {
              ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedBelongsTo(store, key, embeddedType, partial);
            }
          }
        }
      });

      return partial;
    }

    // handles embedding for `hasMany` relationship
    function ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedHasMany(store, key, embeddedType, hash) {
      if (!hash[key]) {
        return hash;
      }

      var ids = [];

      var embeddedSerializer = store.serializerFor(embeddedType.typeKey);
      ember$data$lib$serializers$embedded_records_mixin$$forEach(hash[key], function(data) {
        var embeddedRecord = embeddedSerializer.normalize(embeddedType, data, null);
        store.push(embeddedType, embeddedRecord);
        ids.push(embeddedRecord.id);
      });

      hash[key] = ids;
      return hash;
    }

    function ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedHasManyPolymorphic(store, key, hash) {
      if (!hash[key]) {
        return hash;
      }

      var ids = [];

      ember$data$lib$serializers$embedded_records_mixin$$forEach(hash[key], function(data) {
        var typeKey = data.type;
        var embeddedSerializer = store.serializerFor(typeKey);
        var embeddedType = store.modelFor(typeKey);
        var primaryKey = ember$data$lib$serializers$embedded_records_mixin$$get(embeddedSerializer, 'primaryKey');

        var embeddedRecord = embeddedSerializer.normalize(embeddedType, data, null);
        store.push(embeddedType, embeddedRecord);
        ids.push({ id: embeddedRecord[primaryKey], type: typeKey });
      });

      hash[key] = ids;
      return hash;
    }

    function ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedBelongsTo(store, key, embeddedType, hash) {
      if (!hash[key]) {
        return hash;
      }

      var embeddedSerializer = store.serializerFor(embeddedType.typeKey);
      var embeddedRecord = embeddedSerializer.normalize(embeddedType, hash[key], null);
      store.push(embeddedType, embeddedRecord);

      hash[key] = embeddedRecord.id;
      //TODO Need to add a reference to the parent later so relationship works between both `belongsTo` records
      return hash;
    }

    function ember$data$lib$serializers$embedded_records_mixin$$extractEmbeddedBelongsToPolymorphic(store, key, hash) {
      if (!hash[key]) {
        return hash;
      }

      var data = hash[key];
      var typeKey = data.type;
      var embeddedSerializer = store.serializerFor(typeKey);
      var embeddedType = store.modelFor(typeKey);
      var primaryKey = ember$data$lib$serializers$embedded_records_mixin$$get(embeddedSerializer, 'primaryKey');

      var embeddedRecord = embeddedSerializer.normalize(embeddedType, data, null);
      store.push(embeddedType, embeddedRecord);

      hash[key] = embeddedRecord[primaryKey];
      hash[key + 'Type'] = typeKey;
      return hash;
    }

    var ember$data$lib$serializers$embedded_records_mixin$$default = ember$data$lib$serializers$embedded_records_mixin$$EmbeddedRecordsMixin;

    /**
      `DS.belongsTo` is used to define One-To-One and One-To-Many
      relationships on a [DS.Model](/api/data/classes/DS.Model.html).


      `DS.belongsTo` takes an optional hash as a second parameter, currently
      supported options are:

      - `async`: A boolean value used to explicitly declare this to be an async relationship.
      - `inverse`: A string used to identify the inverse property on a
        related model in a One-To-Many relationship. See [Explicit Inverses](#toc_explicit-inverses)

      #### One-To-One
      To declare a one-to-one relationship between two models, use
      `DS.belongsTo`:

      ```javascript
      App.User = DS.Model.extend({
        profile: DS.belongsTo('profile')
      });

      App.Profile = DS.Model.extend({
        user: DS.belongsTo('user')
      });
      ```

      #### One-To-Many
      To declare a one-to-many relationship between two models, use
      `DS.belongsTo` in combination with `DS.hasMany`, like this:

      ```javascript
      App.Post = DS.Model.extend({
        comments: DS.hasMany('comment')
      });

      App.Comment = DS.Model.extend({
        post: DS.belongsTo('post')
      });
      ```

      You can avoid passing a string as the first parameter. In that case Ember Data
      will infer the type from the key name.

      ```javascript
      App.Comment = DS.Model.extend({
        post: DS.belongsTo()
      });
      ```

      will lookup for a Post type.

      @namespace
      @method belongsTo
      @for DS
      @param {String} type (optional) type of the relationship
      @param {Object} options (optional) a hash of options
      @return {Ember.computed} relationship
    */
    function ember$data$lib$system$relationships$belongs_to$$belongsTo(type, options) {
      if (typeof type === 'object') {
        options = type;
        type = undefined;
      }

      Ember.assert("The first argument to DS.belongsTo must be a string representing a model type key, not an instance of " + Ember.inspect(type) + ". E.g., to define a relation to the Person model, use DS.belongsTo('person')", typeof type === 'string' || typeof type === 'undefined');

      options = options || {};

      var meta = {
        type: type,
        isRelationship: true,
        options: options,
        kind: 'belongsTo',
        key: null
      };

      return Ember.computed(function(key, value) {
        if (arguments.length>1) {
          if ( value === undefined ) {
            value = null;
          }
          if (value && value.then) {
            this._relationships[key].setRecordPromise(value);
          } else {
            this._relationships[key].setRecord(value);
          }
        }

        return this._relationships[key].getRecord();
      }).meta(meta);
    }

    /*
      These observers observe all `belongsTo` relationships on the record. See
      `relationships/ext` to see how these observers get their dependencies.
    */
    ember$data$lib$system$model$model$$default.reopen({
      notifyBelongsToChanged: function(key) {
        this.notifyPropertyChange(key);
      }
    });

    var ember$data$lib$system$relationships$belongs_to$$default = ember$data$lib$system$relationships$belongs_to$$belongsTo;

    /**
      `DS.hasMany` is used to define One-To-Many and Many-To-Many
      relationships on a [DS.Model](/api/data/classes/DS.Model.html).

      `DS.hasMany` takes an optional hash as a second parameter, currently
      supported options are:

      - `async`: A boolean value used to explicitly declare this to be an async relationship.
      - `inverse`: A string used to identify the inverse property on a related model.

      #### One-To-Many
      To declare a one-to-many relationship between two models, use
      `DS.belongsTo` in combination with `DS.hasMany`, like this:

      ```javascript
      App.Post = DS.Model.extend({
        comments: DS.hasMany('comment')
      });

      App.Comment = DS.Model.extend({
        post: DS.belongsTo('post')
      });
      ```

      #### Many-To-Many
      To declare a many-to-many relationship between two models, use
      `DS.hasMany`:

      ```javascript
      App.Post = DS.Model.extend({
        tags: DS.hasMany('tag')
      });

      App.Tag = DS.Model.extend({
        posts: DS.hasMany('post')
      });
      ```

      You can avoid passing a string as the first parameter. In that case Ember Data
      will infer the type from the singularized key name.

      ```javascript
      App.Post = DS.Model.extend({
        tags: DS.hasMany()
      });
      ```

      will lookup for a Tag type.

      #### Explicit Inverses

      Ember Data will do its best to discover which relationships map to
      one another. In the one-to-many code above, for example, Ember Data
      can figure out that changing the `comments` relationship should update
      the `post` relationship on the inverse because post is the only
      relationship to that model.

      However, sometimes you may have multiple `belongsTo`/`hasManys` for the
      same type. You can specify which property on the related model is
      the inverse using `DS.hasMany`'s `inverse` option:

      ```javascript
      var belongsTo = DS.belongsTo,
          hasMany = DS.hasMany;

      App.Comment = DS.Model.extend({
        onePost: belongsTo('post'),
        twoPost: belongsTo('post'),
        redPost: belongsTo('post'),
        bluePost: belongsTo('post')
      });

      App.Post = DS.Model.extend({
        comments: hasMany('comment', {
          inverse: 'redPost'
        })
      });
      ```

      You can also specify an inverse on a `belongsTo`, which works how
      you'd expect.

      @namespace
      @method hasMany
      @for DS
      @param {String} type (optional) type of the relationship
      @param {Object} options (optional) a hash of options
      @return {Ember.computed} relationship
    */
    function ember$data$lib$system$relationships$has_many$$hasMany(type, options) {
      if (typeof type === 'object') {
        options = type;
        type = undefined;
      }

      Ember.assert("The first argument to DS.hasMany must be a string representing a model type key, not an instance of " + Ember.inspect(type) + ". E.g., to define a relation to the Comment model, use DS.hasMany('comment')", typeof type === 'string' || typeof type === 'undefined');

      options = options || {};

      // Metadata about relationships is stored on the meta of
      // the relationship. This is used for introspection and
      // serialization. Note that `key` is populated lazily
      // the first time the CP is called.
      var meta = {
        type: type,
        isRelationship: true,
        options: options,
        kind: 'hasMany',
        key: null
      };

      return Ember.computed(function(key) {
        var relationship = this._relationships[key];
        return relationship.getRecords();
      }).meta(meta).readOnly();
    }

    ember$data$lib$system$model$model$$default.reopen({
      notifyHasManyAdded: function(key) {
        //We need to notifyPropertyChange in the adding case because we need to make sure
        //we fetch the newly added record in case it is unloaded
        //TODO(Igor): Consider whether we could do this only if the record state is unloaded

        //Goes away once hasMany is double promisified
        this.notifyPropertyChange(key);
      }
    });


    var ember$data$lib$system$relationships$has_many$$default = ember$data$lib$system$relationships$has_many$$hasMany;
    function ember$data$lib$system$relationship$meta$$typeForRelationshipMeta(store, meta) {
      var typeKey, type;

      typeKey = meta.type || meta.key;
      if (typeof typeKey === 'string') {
        if (meta.kind === 'hasMany') {
          typeKey = ember$inflector$lib$system$string$$singularize(typeKey);
        }
        type = store.modelFor(typeKey);
      } else {
        type = meta.type;
      }

      return type;
    }

    function ember$data$lib$system$relationship$meta$$relationshipFromMeta(store, meta) {
      return {
        key:  meta.key,
        kind: meta.kind,
        type: ember$data$lib$system$relationship$meta$$typeForRelationshipMeta(store, meta),
        options:    meta.options,
        parentType: meta.parentType,
        isRelationship: true
      };
    }

    var ember$data$lib$system$relationships$ext$$get = Ember.get;
    var ember$data$lib$system$relationships$ext$$filter = Ember.ArrayPolyfills.filter;

    var ember$data$lib$system$relationships$ext$$relationshipsDescriptor = Ember.computed(function() {
      if (Ember.testing === true && ember$data$lib$system$relationships$ext$$relationshipsDescriptor._cacheable === true) {
        ember$data$lib$system$relationships$ext$$relationshipsDescriptor._cacheable = false;
      }

      var map = new ember$data$lib$system$map$$MapWithDefault({
        defaultValue: function() { return []; }
      });

      // Loop through each computed property on the class
      this.eachComputedProperty(function(name, meta) {
        // If the computed property is a relationship, add
        // it to the map.
        if (meta.isRelationship) {
          meta.key = name;
          var relationshipsForType = map.get(ember$data$lib$system$relationship$meta$$typeForRelationshipMeta(this.store, meta));

          relationshipsForType.push({
            name: name,
            kind: meta.kind
          });
        }
      });

      return map;
    }).readOnly();

    var ember$data$lib$system$relationships$ext$$relatedTypesDescriptor = Ember.computed(function() {
      if (Ember.testing === true && ember$data$lib$system$relationships$ext$$relatedTypesDescriptor._cacheable === true) {
        ember$data$lib$system$relationships$ext$$relatedTypesDescriptor._cacheable = false;
      }

      var type;
      var types = Ember.A();

      // Loop through each computed property on the class,
      // and create an array of the unique types involved
      // in relationships
      this.eachComputedProperty(function(name, meta) {
        if (meta.isRelationship) {
          meta.key = name;
          type = ember$data$lib$system$relationship$meta$$typeForRelationshipMeta(this.store, meta);

          Ember.assert("You specified a hasMany (" + meta.type + ") on " + meta.parentType + " but " + meta.type + " was not found.", type);

          if (!types.contains(type)) {
            Ember.assert("Trying to sideload " + name + " on " + this.toString() + " but the type doesn't exist.", !!type);
            types.push(type);
          }
        }
      });

      return types;
    }).readOnly();

    var ember$data$lib$system$relationships$ext$$relationshipsByNameDescriptor = Ember.computed(function() {
      if (Ember.testing === true && ember$data$lib$system$relationships$ext$$relationshipsByNameDescriptor._cacheable === true) {
        ember$data$lib$system$relationships$ext$$relationshipsByNameDescriptor._cacheable = false;
      }

      var map = ember$data$lib$system$map$$Map.create();

      this.eachComputedProperty(function(name, meta) {
        if (meta.isRelationship) {
          meta.key = name;
          var relationship = ember$data$lib$system$relationship$meta$$relationshipFromMeta(this.store, meta);
          relationship.type = ember$data$lib$system$relationship$meta$$typeForRelationshipMeta(this.store, meta);
          map.set(name, relationship);
        }
      });

      return map;
    }).readOnly();

    /**
      @module ember-data
    */

    /*
      This file defines several extensions to the base `DS.Model` class that
      add support for one-to-many relationships.
    */

    /**
      @class Model
      @namespace DS
    */
    ember$data$lib$system$model$model$$default.reopen({

      /**
        This Ember.js hook allows an object to be notified when a property
        is defined.

        In this case, we use it to be notified when an Ember Data user defines a
        belongs-to relationship. In that case, we need to set up observers for
        each one, allowing us to track relationship changes and automatically
        reflect changes in the inverse has-many array.

        This hook passes the class being set up, as well as the key and value
        being defined. So, for example, when the user does this:

        ```javascript
        DS.Model.extend({
          parent: DS.belongsTo('user')
        });
        ```

        This hook would be called with "parent" as the key and the computed
        property returned by `DS.belongsTo` as the value.

        @method didDefineProperty
        @param {Object} proto
        @param {String} key
        @param {Ember.ComputedProperty} value
      */
      didDefineProperty: function(proto, key, value) {
        // Check if the value being set is a computed property.
        if (value instanceof Ember.ComputedProperty) {

          // If it is, get the metadata for the relationship. This is
          // populated by the `DS.belongsTo` helper when it is creating
          // the computed property.
          var meta = value.meta();

          meta.parentType = proto.constructor;
        }
      }
    });

    /*
      These DS.Model extensions add class methods that provide relationship
      introspection abilities about relationships.

      A note about the computed properties contained here:

      **These properties are effectively sealed once called for the first time.**
      To avoid repeatedly doing expensive iteration over a model's fields, these
      values are computed once and then cached for the remainder of the runtime of
      your application.

      If your application needs to modify a class after its initial definition
      (for example, using `reopen()` to add additional attributes), make sure you
      do it before using your model with the store, which uses these properties
      extensively.
    */

    ember$data$lib$system$model$model$$default.reopenClass({

      /**
        For a given relationship name, returns the model type of the relationship.

        For example, if you define a model like this:

       ```javascript
        App.Post = DS.Model.extend({
          comments: DS.hasMany('comment')
        });
       ```

        Calling `App.Post.typeForRelationship('comments')` will return `App.Comment`.

        @method typeForRelationship
        @static
        @param {String} name the name of the relationship
        @return {subclass of DS.Model} the type of the relationship, or undefined
      */
      typeForRelationship: function(name) {
        var relationship = ember$data$lib$system$relationships$ext$$get(this, 'relationshipsByName').get(name);
        return relationship && relationship.type;
      },

      inverseMap: Ember.computed(function() {
        return Ember.create(null);
      }),

      /**
        Find the relationship which is the inverse of the one asked for.

        For example, if you define models like this:

       ```javascript
          App.Post = DS.Model.extend({
            comments: DS.hasMany('message')
          });

          App.Message = DS.Model.extend({
            owner: DS.belongsTo('post')
          });
        ```

        App.Post.inverseFor('comments') -> {type: App.Message, name:'owner', kind:'belongsTo'}
        App.Message.inverseFor('owner') -> {type: App.Post, name:'comments', kind:'hasMany'}

        @method inverseFor
        @static
        @param {String} name the name of the relationship
        @return {Object} the inverse relationship, or null
      */
      inverseFor: function(name) {
        var inverseMap = ember$data$lib$system$relationships$ext$$get(this, 'inverseMap');
        if (inverseMap[name]) {
          return inverseMap[name];
        } else {
          var inverse = this._findInverseFor(name);
          inverseMap[name] = inverse;
          return inverse;
        }
      },

      //Calculate the inverse, ignoring the cache
      _findInverseFor: function(name) {

        var inverseType = this.typeForRelationship(name);
        if (!inverseType) {
          return null;
        }

        var propertyMeta = this.metaForProperty(name);
        //If inverse is manually specified to be null, like  `comments: DS.hasMany('message', {inverse: null})`
        var options = propertyMeta.options;
        if (options.inverse === null) { return null; }

        var inverseName, inverseKind, inverse;

        Ember.warn("Detected a reflexive relationship by the name of '" + name + "' without an inverse option. Look at http://emberjs.com/guides/models/defining-models/#toc_reflexive-relation for how to explicitly specify inverses.", options.inverse || propertyMeta.type !== propertyMeta.parentType.typeKey);

        //If inverse is specified manually, return the inverse
        if (options.inverse) {
          inverseName = options.inverse;
          inverse = Ember.get(inverseType, 'relationshipsByName').get(inverseName);

          Ember.assert("We found no inverse relationships by the name of '" + inverseName + "' on the '" + inverseType.typeKey +
            "' model. This is most likely due to a missing attribute on your model definition.", !Ember.isNone(inverse));

          inverseKind = inverse.kind;
        } else {
          //No inverse was specified manually, we need to use a heuristic to guess one
          var possibleRelationships = findPossibleInverses(this, inverseType);

          if (possibleRelationships.length === 0) { return null; }

          var filteredRelationships = ember$data$lib$system$relationships$ext$$filter.call(possibleRelationships, function(possibleRelationship) {
            var optionsForRelationship = inverseType.metaForProperty(possibleRelationship.name).options;
            return name === optionsForRelationship.inverse;
          });

          Ember.assert("You defined the '" + name + "' relationship on " + this + ", but you defined the inverse relationships of type " +
            inverseType.toString() + " multiple times. Look at http://emberjs.com/guides/models/defining-models/#toc_explicit-inverses for how to explicitly specify inverses",
            filteredRelationships.length < 2);

          if (filteredRelationships.length === 1 ) {
            possibleRelationships = filteredRelationships;
          }

          Ember.assert("You defined the '" + name + "' relationship on " + this + ", but multiple possible inverse relationships of type " +
            this + " were found on " + inverseType + ". Look at http://emberjs.com/guides/models/defining-models/#toc_explicit-inverses for how to explicitly specify inverses",
            possibleRelationships.length === 1);

          inverseName = possibleRelationships[0].name;
          inverseKind = possibleRelationships[0].kind;
        }

        function findPossibleInverses(type, inverseType, relationshipsSoFar) {
          var possibleRelationships = relationshipsSoFar || [];

          var relationshipMap = ember$data$lib$system$relationships$ext$$get(inverseType, 'relationships');
          if (!relationshipMap) { return; }

          var relationships = relationshipMap.get(type);

          relationships = ember$data$lib$system$relationships$ext$$filter.call(relationships, function(relationship) {
            var optionsForRelationship = inverseType.metaForProperty(relationship.name).options;

            if (!optionsForRelationship.inverse) {
              return true;
            }

            return name === optionsForRelationship.inverse;
          });

          if (relationships) {
            possibleRelationships.push.apply(possibleRelationships, relationships);
          }

          //Recurse to support polymorphism
          if (type.superclass) {
            findPossibleInverses(type.superclass, inverseType, possibleRelationships);
          }

          return possibleRelationships;
        }

        return {
          type: inverseType,
          name: inverseName,
          kind: inverseKind
        };
      },

      /**
        The model's relationships as a map, keyed on the type of the
        relationship. The value of each entry is an array containing a descriptor
        for each relationship with that type, describing the name of the relationship
        as well as the type.

        For example, given the following model definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),
          posts: DS.hasMany('post')
        });
        ```

        This computed property would return a map describing these
        relationships, like this:

        ```javascript
        var relationships = Ember.get(App.Blog, 'relationships');
        relationships.get(App.User);
        //=> [ { name: 'users', kind: 'hasMany' },
        //     { name: 'owner', kind: 'belongsTo' } ]
        relationships.get(App.Post);
        //=> [ { name: 'posts', kind: 'hasMany' } ]
        ```

        @property relationships
        @static
        @type Ember.Map
        @readOnly
      */

      relationships: ember$data$lib$system$relationships$ext$$relationshipsDescriptor,

      /**
        A hash containing lists of the model's relationships, grouped
        by the relationship kind. For example, given a model with this
        definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post')
        });
        ```

        This property would contain the following:

        ```javascript
        var relationshipNames = Ember.get(App.Blog, 'relationshipNames');
        relationshipNames.hasMany;
        //=> ['users', 'posts']
        relationshipNames.belongsTo;
        //=> ['owner']
        ```

        @property relationshipNames
        @static
        @type Object
        @readOnly
      */
      relationshipNames: Ember.computed(function() {
        var names = {
          hasMany: [],
          belongsTo: []
        };

        this.eachComputedProperty(function(name, meta) {
          if (meta.isRelationship) {
            names[meta.kind].push(name);
          }
        });

        return names;
      }),

      /**
        An array of types directly related to a model. Each type will be
        included once, regardless of the number of relationships it has with
        the model.

        For example, given a model with this definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post')
        });
        ```

        This property would contain the following:

        ```javascript
        var relatedTypes = Ember.get(App.Blog, 'relatedTypes');
        //=> [ App.User, App.Post ]
        ```

        @property relatedTypes
        @static
        @type Ember.Array
        @readOnly
      */
      relatedTypes: ember$data$lib$system$relationships$ext$$relatedTypesDescriptor,

      /**
        A map whose keys are the relationships of a model and whose values are
        relationship descriptors.

        For example, given a model with this
        definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post')
        });
        ```

        This property would contain the following:

        ```javascript
        var relationshipsByName = Ember.get(App.Blog, 'relationshipsByName');
        relationshipsByName.get('users');
        //=> { key: 'users', kind: 'hasMany', type: App.User }
        relationshipsByName.get('owner');
        //=> { key: 'owner', kind: 'belongsTo', type: App.User }
        ```

        @property relationshipsByName
        @static
        @type Ember.Map
        @readOnly
      */
      relationshipsByName: ember$data$lib$system$relationships$ext$$relationshipsByNameDescriptor,

      /**
        A map whose keys are the fields of the model and whose values are strings
        describing the kind of the field. A model's fields are the union of all of its
        attributes and relationships.

        For example:

        ```javascript

        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post'),

          title: DS.attr('string')
        });

        var fields = Ember.get(App.Blog, 'fields');
        fields.forEach(function(kind, field) {
          console.log(field, kind);
        });

        // prints:
        // users, hasMany
        // owner, belongsTo
        // posts, hasMany
        // title, attribute
        ```

        @property fields
        @static
        @type Ember.Map
        @readOnly
      */
      fields: Ember.computed(function() {
        var map = ember$data$lib$system$map$$Map.create();

        this.eachComputedProperty(function(name, meta) {
          if (meta.isRelationship) {
            map.set(name, meta.kind);
          } else if (meta.isAttribute) {
            map.set(name, 'attribute');
          }
        });

        return map;
      }).readOnly(),

      /**
        Given a callback, iterates over each of the relationships in the model,
        invoking the callback with the name of each relationship and its relationship
        descriptor.

        @method eachRelationship
        @static
        @param {Function} callback the callback to invoke
        @param {any} binding the value to which the callback's `this` should be bound
      */
      eachRelationship: function(callback, binding) {
        ember$data$lib$system$relationships$ext$$get(this, 'relationshipsByName').forEach(function(relationship, name) {
          callback.call(binding, name, relationship);
        });
      },

      /**
        Given a callback, iterates over each of the types related to a model,
        invoking the callback with the related type's class. Each type will be
        returned just once, regardless of how many different relationships it has
        with a model.

        @method eachRelatedType
        @static
        @param {Function} callback the callback to invoke
        @param {any} binding the value to which the callback's `this` should be bound
      */
      eachRelatedType: function(callback, binding) {
        ember$data$lib$system$relationships$ext$$get(this, 'relatedTypes').forEach(function(type) {
          callback.call(binding, type);
        });
      },

      determineRelationshipType: function(knownSide) {
        var knownKey = knownSide.key;
        var knownKind = knownSide.kind;
        var inverse = this.inverseFor(knownKey);
        var key, otherKind;

        if (!inverse) {
          return knownKind === 'belongsTo' ? 'oneToNone' : 'manyToNone';
        }

        key = inverse.name;
        otherKind = inverse.kind;

        if (otherKind === 'belongsTo') {
          return knownKind === 'belongsTo' ? 'oneToOne' : 'manyToOne';
        } else {
          return knownKind === 'belongsTo' ? 'oneToMany' : 'manyToMany';
        }
      }

    });

    ember$data$lib$system$model$model$$default.reopen({
      /**
        Given a callback, iterates over each of the relationships in the model,
        invoking the callback with the name of each relationship and its relationship
        descriptor.


        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(name, descriptor);
        ```

        - `name` the name of the current property in the iteration
        - `descriptor` the meta object that describes this relationship

        The relationship descriptor argument is an object with the following properties.

       - **key** <span class="type">String</span> the name of this relationship on the Model
       - **kind** <span class="type">String</span> "hasMany" or "belongsTo"
       - **options** <span class="type">Object</span> the original options hash passed when the relationship was declared
       - **parentType** <span class="type">DS.Model</span> the type of the Model that owns this relationship
       - **type** <span class="type">DS.Model</span> the type of the related Model

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context.

        Example

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          serialize: function(record, options) {
            var json = {};

            record.eachRelationship(function(name, descriptor) {
              if (descriptor.kind === 'hasMany') {
                var serializedHasManyName = name.toUpperCase() + '_IDS';
                json[name.toUpperCase()] = record.get(name).mapBy('id');
              }
            });

            return json;
          }
        });
        ```

        @method eachRelationship
        @param {Function} callback the callback to invoke
        @param {any} binding the value to which the callback's `this` should be bound
      */
      eachRelationship: function(callback, binding) {
        this.constructor.eachRelationship(callback, binding);
      },

      relationshipFor: function(name) {
        return ember$data$lib$system$relationships$ext$$get(this.constructor, 'relationshipsByName').get(name);
      },

      inverseFor: function(key) {
        return this.constructor.inverseFor(key);
      }

    });
    /**
      Ember Data
      @module ember-data
      @main ember-data
    */

    // support RSVP 2.x via resolve,  but prefer RSVP 3.x's Promise.cast
    Ember.RSVP.Promise.cast = Ember.RSVP.Promise.cast || Ember.RSVP.resolve;

    Ember.runInDebug(function() {
      if (Ember.VERSION.match(/1\.[0-7]\./)) {
        throw new Ember.Error("Ember Data requires at least Ember 1.8.0, but you have " +
                              Ember.VERSION +
                              ". Please upgrade your version of Ember, then upgrade Ember Data");
      }
    });

    ember$data$lib$core$$default.Store         = ember$data$lib$system$store$$Store;
    ember$data$lib$core$$default.PromiseArray  = ember$data$lib$system$promise_proxies$$PromiseArray;
    ember$data$lib$core$$default.PromiseObject = ember$data$lib$system$promise_proxies$$PromiseObject;

    ember$data$lib$core$$default.PromiseManyArray = ember$data$lib$system$promise_proxies$$PromiseManyArray;

    ember$data$lib$core$$default.Model     = ember$data$lib$system$model$model$$default;
    ember$data$lib$core$$default.RootState = ember$data$lib$system$model$states$$default;
    ember$data$lib$core$$default.attr      = ember$data$lib$system$model$attributes$$default;
    ember$data$lib$core$$default.Errors    = ember$data$lib$system$model$errors$$default;

    ember$data$lib$core$$default.Snapshot = ember$data$lib$system$snapshot$$default;

    ember$data$lib$core$$default.Adapter      = ember$data$lib$system$adapter$$Adapter;
    ember$data$lib$core$$default.InvalidError = ember$data$lib$system$adapter$$InvalidError;

    ember$data$lib$core$$default.Serializer = ember$data$lib$system$serializer$$default;

    ember$data$lib$core$$default.DebugAdapter = ember$data$lib$system$debug$$default;

    ember$data$lib$core$$default.RecordArray                 = ember$data$lib$system$record_arrays$record_array$$default;
    ember$data$lib$core$$default.FilteredRecordArray         = ember$data$lib$system$record_arrays$filtered_record_array$$default;
    ember$data$lib$core$$default.AdapterPopulatedRecordArray = ember$data$lib$system$record_arrays$adapter_populated_record_array$$default;
    ember$data$lib$core$$default.ManyArray                   = ember$data$lib$system$record_arrays$many_array$$default;

    ember$data$lib$core$$default.RecordArrayManager = ember$data$lib$system$record_array_manager$$default;

    ember$data$lib$core$$default.RESTAdapter    = ember$data$lib$adapters$rest_adapter$$default;
    ember$data$lib$core$$default.FixtureAdapter = ember$data$lib$adapters$fixture_adapter$$default;

    ember$data$lib$core$$default.RESTSerializer = ember$data$lib$serializers$rest_serializer$$default;
    ember$data$lib$core$$default.JSONSerializer = ember$data$lib$serializers$json_serializer$$default;

    ember$data$lib$core$$default.Transform       = ember$data$lib$transforms$base$$default;
    ember$data$lib$core$$default.DateTransform   = ember$data$lib$transforms$date$$default;
    ember$data$lib$core$$default.StringTransform = ember$data$lib$transforms$string$$default;
    ember$data$lib$core$$default.NumberTransform = ember$data$lib$transforms$number$$default;
    ember$data$lib$core$$default.BooleanTransform = ember$data$lib$transforms$boolean$$default;

    ember$data$lib$core$$default.ActiveModelAdapter    = activemodel$adapter$lib$system$active_model_adapter$$default;
    ember$data$lib$core$$default.ActiveModelSerializer = activemodel$adapter$lib$system$active_model_serializer$$default;
    ember$data$lib$core$$default.EmbeddedRecordsMixin  = ember$data$lib$serializers$embedded_records_mixin$$default;

    ember$data$lib$core$$default.belongsTo = ember$data$lib$system$relationships$belongs_to$$default;
    ember$data$lib$core$$default.hasMany   = ember$data$lib$system$relationships$has_many$$default;

    ember$data$lib$core$$default.Relationship  = ember$data$lib$system$relationships$state$relationship$$default;

    ember$data$lib$core$$default.ContainerProxy = ember$data$lib$system$container_proxy$$default;

    ember$data$lib$core$$default._setupContainer = ember$data$lib$setup$container$$default;

    Ember.lookup.DS = ember$data$lib$core$$default;

    var ember$data$lib$main$$default = ember$data$lib$core$$default;
}).call(this);


;/*!
 * @overview  Ember - JavaScript Application Framework
 * @copyright Copyright 2011-2015 Tilde Inc. and contributors
 *            Portions Copyright 2006-2011 Strobe Inc.
 *            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
 * @license   Licensed under MIT license
 *            See https://raw.github.com/emberjs/ember.js/master/LICENSE
 * @version   1.11.1
 */

(function() {
var enifed, requireModule, eriuqer, requirejs, Ember;
var mainContext = this;

(function() {

  Ember = this.Ember = this.Ember || {};
  if (typeof Ember === 'undefined') { Ember = {}; };
  function UNDEFINED() { }

  if (typeof Ember.__loader === 'undefined') {
    var registry = {};
    var seen = {};

    enifed = function(name, deps, callback) {
      var value = { };

      if (!callback) {
        value.deps = [];
        value.callback = deps;
      } else {
        value.deps = deps;
        value.callback = callback;
      }

        registry[name] = value;
    };

    requirejs = eriuqer = requireModule = function(name) {
      var s = seen[name];

      if (s !== undefined) { return seen[name]; }
      if (s === UNDEFINED) { return undefined;  }

      seen[name] = {};

      if (!registry[name]) {
        throw new Error('Could not find module ' + name);
      }

      var mod = registry[name];
      var deps = mod.deps;
      var callback = mod.callback;
      var reified = [];
      var exports;
      var length = deps.length;

      for (var i=0; i<length; i++) {
        if (deps[i] === 'exports') {
          reified.push(exports = {});
        } else {
          reified.push(requireModule(resolve(deps[i], name)));
        }
      }

      var value = length === 0 ? callback.call(this) : callback.apply(this, reified);

      return seen[name] = exports || (value === undefined ? UNDEFINED : value);
    };

    function resolve(child, name) {
      if (child.charAt(0) !== '.') {
        return child;
      }
      var parts = child.split('/');
      var parentBase = name.split('/').slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') {
          parentBase.pop();
        } else if (part === '.') {
          continue;
        } else {
          parentBase.push(part);
        }
      }

      return parentBase.join('/');
    }

    requirejs._eak_seen = registry;

    Ember.__loader = {
      define: enifed,
      require: eriuqer,
      registry: registry
    };
  } else {
    enifed = Ember.__loader.define;
    requirejs = eriuqer = requireModule = Ember.__loader.require;
  }
})();

enifed('ember-metal/core', ['exports'], function (exports) {

  'use strict';

  exports.K = K;

  /*globals Ember:true,ENV,EmberENV */

  /**
  @module ember
  @submodule ember-metal
  */

  /**
    All Ember methods and functions are defined inside of this namespace. You
    generally should not add new properties to this namespace as it may be
    overwritten by future versions of Ember.

    You can also use the shorthand `Em` instead of `Ember`.

    Ember-Runtime is a framework that provides core functions for Ember including
    cross-platform functions, support for property observing and objects. Its
    focus is on small size and performance. You can use this in place of or
    along-side other cross-platform libraries such as jQuery.

    The core Runtime framework is based on the jQuery API with a number of
    performance optimizations.

    @class Ember
    @static
    @version 1.11.1
  */

  if ('undefined' === typeof Ember) {
    // Create core object. Make it act like an instance of Ember.Namespace so that
    // objects assigned to it are given a sane string representation.
    Ember = {};
  }

  // Default imports, exports and lookup to the global object;
  var global = mainContext || {}; // jshint ignore:line
  Ember.imports = Ember.imports || global;
  Ember.lookup  = Ember.lookup  || global;
  var emExports   = Ember.exports = Ember.exports || global;

  // aliases needed to keep minifiers from removing the global context
  emExports.Em = emExports.Ember = Ember;

  // Make sure these are set whether Ember was already defined or not

  Ember.isNamespace = true;

  Ember.toString = function() { return "Ember"; };


  /**
    @property VERSION
    @type String
    @default '1.11.1'
    @static
  */
  Ember.VERSION = '1.11.1';

  /**
    Standard environmental variables. You can define these in a global `EmberENV`
    variable before loading Ember to control various configuration settings.

    For backwards compatibility with earlier versions of Ember the global `ENV`
    variable will be used if `EmberENV` is not defined.

    @property ENV
    @type Hash
  */

  if (Ember.ENV) {
    // do nothing if Ember.ENV is already setup
    Ember.assert('Ember.ENV should be an object.', 'object' !== typeof Ember.ENV);
  } else if ('undefined' !== typeof EmberENV) {
    Ember.ENV = EmberENV;
  } else if ('undefined' !== typeof ENV) {
    Ember.ENV = ENV;
  } else {
    Ember.ENV = {};
  }

  Ember.config = Ember.config || {};

  // We disable the RANGE API by default for performance reasons
  if ('undefined' === typeof Ember.ENV.DISABLE_RANGE_API) {
    Ember.ENV.DISABLE_RANGE_API = true;
  }

  /**
    Hash of enabled Canary features. Add to this before creating your application.

    You can also define `EmberENV.FEATURES` if you need to enable features flagged at runtime.

    @class FEATURES
    @namespace Ember
    @static
    @since 1.1.0
  */

  Ember.FEATURES = Ember.ENV.FEATURES;

  if (!Ember.FEATURES) {
    Ember.FEATURES = {"features-stripped-test":false,"ember-routing-named-substates":true,"mandatory-setter":true,"ember-htmlbars-component-generation":false,"ember-htmlbars-component-helper":true,"ember-htmlbars-inline-if-helper":true,"ember-htmlbars-attribute-syntax":true,"ember-routing-transitioning-classes":true,"new-computed-syntax":false,"ember-testing-checkbox-helpers":false,"ember-metal-stream":false,"ember-htmlbars-each-with-index":true,"ember-application-instance-initializers":false,"ember-application-initializer-context":false,"ember-router-willtransition":true,"ember-application-visit":false}; //jshint ignore:line
  }

  /**
    Test that a feature is enabled. Parsed by Ember's build tools to leave
    experimental features out of beta/stable builds.

    You can define the following configuration options:

    * `EmberENV.ENABLE_ALL_FEATURES` - force all features to be enabled.
    * `EmberENV.ENABLE_OPTIONAL_FEATURES` - enable any features that have not been explicitly
      enabled/disabled.

    @method isEnabled
    @param {String} feature
    @return {Boolean}
    @for Ember.FEATURES
    @since 1.1.0
  */

  Ember.FEATURES.isEnabled = function(feature) {
    var featureValue = Ember.FEATURES[feature];

    if (Ember.ENV.ENABLE_ALL_FEATURES) {
      return true;
    } else if (featureValue === true || featureValue === false || featureValue === undefined) {
      return featureValue;
    } else if (Ember.ENV.ENABLE_OPTIONAL_FEATURES) {
      return true;
    } else {
      return false;
    }
  };

  // ..........................................................
  // BOOTSTRAP
  //

  /**
    Determines whether Ember should enhance some built-in object prototypes to
    provide a more friendly API. If enabled, a few methods will be added to
    `Function`, `String`, and `Array`. `Object.prototype` will not be enhanced,
    which is the one that causes most trouble for people.

    In general we recommend leaving this option set to true since it rarely
    conflicts with other code. If you need to turn it off however, you can
    define an `EmberENV.EXTEND_PROTOTYPES` config to disable it.

    @property EXTEND_PROTOTYPES
    @type Boolean
    @default true
    @for Ember
  */
  Ember.EXTEND_PROTOTYPES = Ember.ENV.EXTEND_PROTOTYPES;

  if (typeof Ember.EXTEND_PROTOTYPES === 'undefined') {
    Ember.EXTEND_PROTOTYPES = true;
  }

  /**
    Determines whether Ember logs a full stack trace during deprecation warnings

    @property LOG_STACKTRACE_ON_DEPRECATION
    @type Boolean
    @default true
  */
  Ember.LOG_STACKTRACE_ON_DEPRECATION = (Ember.ENV.LOG_STACKTRACE_ON_DEPRECATION !== false);

  /**
    Determines whether Ember should add ECMAScript 5 Array shims to older browsers.

    @property SHIM_ES5
    @type Boolean
    @default Ember.EXTEND_PROTOTYPES
  */
  Ember.SHIM_ES5 = (Ember.ENV.SHIM_ES5 === false) ? false : Ember.EXTEND_PROTOTYPES;

  /**
    Determines whether Ember logs info about version of used libraries

    @property LOG_VERSION
    @type Boolean
    @default true
  */
  Ember.LOG_VERSION = (Ember.ENV.LOG_VERSION === false) ? false : true;

  /**
    Empty function. Useful for some operations. Always returns `this`.

    @method K
    @private
    @return {Object}
  */
  function K() { return this; }
  Ember.K = K;
  //TODO: ES6 GLOBAL TODO

  // Stub out the methods defined by the ember-debug package in case it's not loaded

  if ('undefined' === typeof Ember.assert) { Ember.assert = K; }
  if ('undefined' === typeof Ember.warn) { Ember.warn = K; }
  if ('undefined' === typeof Ember.debug) { Ember.debug = K; }
  if ('undefined' === typeof Ember.runInDebug) { Ember.runInDebug = K; }
  if ('undefined' === typeof Ember.deprecate) { Ember.deprecate = K; }
  if ('undefined' === typeof Ember.deprecateFunc) {
    Ember.deprecateFunc = function(_, func) { return func; };
  }

  exports['default'] = Ember;

});
enifed('ember-template-compiler', ['exports', 'ember-metal/core', 'ember-template-compiler/system/precompile', 'ember-template-compiler/system/compile', 'ember-template-compiler/system/template', 'ember-template-compiler/plugins', 'ember-template-compiler/plugins/transform-each-in-to-hash', 'ember-template-compiler/plugins/transform-with-as-to-hash', 'ember-template-compiler/compat'], function (exports, _Ember, precompile, compile, template, plugins, TransformEachInToHash, TransformWithAsToHash) {

  'use strict';

  plugins.registerPlugin('ast', TransformWithAsToHash['default']);
  plugins.registerPlugin('ast', TransformEachInToHash['default']);

  exports._Ember = _Ember['default'];
  exports.precompile = precompile['default'];
  exports.compile = compile['default'];
  exports.template = template['default'];
  exports.registerPlugin = plugins.registerPlugin;

});
enifed('ember-template-compiler/compat', ['ember-metal/core', 'ember-template-compiler/compat/precompile', 'ember-template-compiler/system/compile', 'ember-template-compiler/system/template'], function (Ember, precompile, compile, template) {

	'use strict';

	var EmberHandlebars = Ember['default'].Handlebars = Ember['default'].Handlebars || {};

	EmberHandlebars.precompile = precompile['default'];
	EmberHandlebars.compile = compile['default'];
	EmberHandlebars.template = template['default'];

});
enifed('ember-template-compiler/compat/precompile', ['exports', 'ember-template-compiler/system/compile_options'], function (exports, compileOptions) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */
  var compile, compileSpec;

  exports['default'] = function(string) {
    if ((!compile || !compileSpec) && Ember.__loader.registry['htmlbars-compiler/compiler']) {
      var Compiler = requireModule('htmlbars-compiler/compiler');

      compile = Compiler.compile;
      compileSpec = Compiler.compileSpec;
    }

    if (!compile || !compileSpec) {
      throw new Error('Cannot call `precompile` without the template compiler loaded. Please load `ember-template-compiler.js` prior to calling `precompile`.');
    }

    var asObject = arguments[1] === undefined ? true : arguments[1];
    var compileFunc = asObject ? compile : compileSpec;

    return compileFunc(string, compileOptions['default']());
  }

});
enifed('ember-template-compiler/plugins', ['exports'], function (exports) {

  'use strict';

  exports.registerPlugin = registerPlugin;

  /**
  @module ember
  @submodule ember-template-compiler
  */

  /**
   @private
   @property helpers
  */
  var plugins = {
    ast: []
  };

  /**
    Adds an AST plugin to be used by Ember.HTMLBars.compile.

    @private
    @method registerASTPlugin
  */
  function registerPlugin(type, Plugin) {
    if (!plugins[type]) {
      throw new Error('Attempting to register "' + Plugin + '" as "' + type + '" which is not a valid HTMLBars plugin type.');
    }

    plugins[type].push(Plugin);
  }

  exports['default'] = plugins;

});
enifed('ember-template-compiler/plugins/transform-each-in-to-hash', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember
  @submodule ember-htmlbars
  */


  /**
    An HTMLBars AST transformation that replaces all instances of

    ```handlebars
    {{#each item in items}}
    {{/each}}
    ```

    with

    ```handlebars
    {{#each items keyword="item"}}
    {{/each}}
    ```

    @class TransformEachInToHash
    @private
  */
  function TransformEachInToHash() {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformEachInToHash.prototype.transform = function TransformEachInToHash_transform(ast) {
    var pluginContext = this;
    var walker = new pluginContext.syntax.Walker();
    var b = pluginContext.syntax.builders;

    walker.visit(ast, function(node) {
      if (pluginContext.validate(node)) {

        if (node.program && node.program.blockParams.length) {
          throw new Error('You cannot use keyword (`{{each foo in bar}}`) and block params (`{{each bar as |foo|}}`) at the same time.');
        }

        var removedParams = node.sexpr.params.splice(0, 2);
        var keyword = removedParams[0].original;

        // TODO: This may not be necessary.
        if (!node.sexpr.hash) {
          node.sexpr.hash = b.hash();
        }

        node.sexpr.hash.pairs.push(b.pair(
          'keyword',
          b.string(keyword)
        ));
      }
    });

    return ast;
  };

  TransformEachInToHash.prototype.validate = function TransformEachInToHash_validate(node) {
    return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') &&
      node.sexpr.path.original === 'each' &&
      node.sexpr.params.length === 3 &&
      node.sexpr.params[1].type === 'PathExpression' &&
      node.sexpr.params[1].original === 'in';
  };

  exports['default'] = TransformEachInToHash;

});
enifed('ember-template-compiler/plugins/transform-with-as-to-hash', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember
  @submodule ember-htmlbars
  */

  /**
    An HTMLBars AST transformation that replaces all instances of

    ```handlebars
    {{#with foo.bar as bar}}
    {{/with}}
    ```

    with

    ```handlebars
    {{#with foo.bar as |bar|}}
    {{/with}}
    ```

    @private
    @class TransformWithAsToHash
  */
  function TransformWithAsToHash() {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformWithAsToHash.prototype.transform = function TransformWithAsToHash_transform(ast) {
    var pluginContext = this;
    var walker = new pluginContext.syntax.Walker();

    walker.visit(ast, function(node) {
      if (pluginContext.validate(node)) {

        if (node.program && node.program.blockParams.length) {
          throw new Error('You cannot use keyword (`{{with foo as bar}}`) and block params (`{{with foo as |bar|}}`) at the same time.');
        }

        var removedParams = node.sexpr.params.splice(1, 2);
        var keyword = removedParams[1].original;
        node.program.blockParams = [keyword];
      }
    });

    return ast;
  };

  TransformWithAsToHash.prototype.validate = function TransformWithAsToHash_validate(node) {
    return node.type === 'BlockStatement' &&
      node.sexpr.path.original === 'with' &&
      node.sexpr.params.length === 3 &&
      node.sexpr.params[1].type === 'PathExpression' &&
      node.sexpr.params[1].original === 'as';
  };

  exports['default'] = TransformWithAsToHash;

});
enifed('ember-template-compiler/system/compile', ['exports', 'ember-template-compiler/system/compile_options', 'ember-template-compiler/system/template'], function (exports, compileOptions, template) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */

  var compile;
  exports['default'] = function(templateString) {
    if (!compile && Ember.__loader.registry['htmlbars-compiler/compiler']) {
      compile = requireModule('htmlbars-compiler/compiler').compile;
    }

    if (!compile) {
      throw new Error('Cannot call `compile` without the template compiler loaded. Please load `ember-template-compiler.js` prior to calling `compile`.');
    }

    var templateSpec = compile(templateString, compileOptions['default']());

    return template['default'](templateSpec);
  }

});
enifed('ember-template-compiler/system/compile_options', ['exports', 'ember-metal/core', 'ember-template-compiler/plugins'], function (exports, Ember, plugins) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */

  exports['default'] = function() {
    var disableComponentGeneration = true;
    
    return {
      revision: 'Ember@1.11.1',

      disableComponentGeneration: disableComponentGeneration,

      plugins: plugins['default']
    };
  }

});
enifed('ember-template-compiler/system/precompile', ['exports', 'ember-template-compiler/system/compile_options'], function (exports, compileOptions) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */

  var compileSpec;

  /**
    Uses HTMLBars `compile` function to process a string into a compiled template string.
    The returned string must be passed through `Ember.HTMLBars.template`.

    This is not present in production builds.

    @private
    @method precompile
    @param {String} templateString This is the string to be compiled by HTMLBars.
  */
  exports['default'] = function(templateString) {
    if (!compileSpec && Ember.__loader.registry['htmlbars-compiler/compiler']) {
      compileSpec = requireModule('htmlbars-compiler/compiler').compileSpec;
    }

    if (!compileSpec) {
      throw new Error('Cannot call `compileSpec` without the template compiler loaded. Please load `ember-template-compiler.js` prior to calling `compileSpec`.');
    }

    return compileSpec(templateString, compileOptions['default']());
  }

});
enifed('ember-template-compiler/system/template', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */

  /**
    Augments the default precompiled output of an HTMLBars template with
    additional information needed by Ember.

    @private
    @method template
    @param {Function} templateSpec This is the compiled HTMLBars template spec.
  */

  exports['default'] = function(templateSpec) {
    templateSpec.isTop = true;
    templateSpec.isMethod = false;

    return templateSpec;
  }

});
enifed("htmlbars-compiler",
  ["./htmlbars-compiler/compiler","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var compile = __dependency1__.compile;
    var compileSpec = __dependency1__.compileSpec;
    var template = __dependency1__.template;

    __exports__.compile = compile;
    __exports__.compileSpec = compileSpec;
    __exports__.template = template;
  });
enifed("htmlbars-compiler/compiler",
  ["../htmlbars-syntax/parser","./template-compiler","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*jshint evil:true*/
    var preprocess = __dependency1__.preprocess;
    var TemplateCompiler = __dependency2__["default"];

    /*
     * Compile a string into a template spec string. The template spec is a string
     * representation of a template. Usually, you would use compileSpec for
     * pre-compilation of a template on the server.
     *
     * Example usage:
     *
     *     var templateSpec = compileSpec("Howdy {{name}}");
     *     // This next step is basically what plain compile does
     *     var template = new Function("return " + templateSpec)();
     *
     * @method compileSpec
     * @param {String} string An HTMLBars template string
     * @return {TemplateSpec} A template spec string
     */
    function compileSpec(string, options) {
      var ast = preprocess(string, options);
      var compiler = new TemplateCompiler(options);
      var program = compiler.compile(ast);
      return program;
    }

    __exports__.compileSpec = compileSpec;/*
     * @method template
     * @param {TemplateSpec} templateSpec A precompiled template
     * @return {Template} A template spec string
     */
    function template(templateSpec) {
      return new Function("return " + templateSpec)();
    }

    __exports__.template = template;/*
     * Compile a string into a template rendering function
     *
     * Example usage:
     *
     *     // Template is the hydration portion of the compiled template
     *     var template = compile("Howdy {{name}}");
     *
     *     // Template accepts three arguments:
     *     //
     *     //   1. A context object
     *     //   2. An env object
     *     //   3. A contextualElement (optional, document.body is the default)
     *     //
     *     // The env object *must* have at least these two properties:
     *     //
     *     //   1. `hooks` - Basic hooks for rendering a template
     *     //   2. `dom` - An instance of DOMHelper
     *     //
     *     import {hooks} from 'htmlbars-runtime';
     *     import {DOMHelper} from 'morph';
     *     var context = {name: 'whatever'},
     *         env = {hooks: hooks, dom: new DOMHelper()},
     *         contextualElement = document.body;
     *     var domFragment = template(context, env, contextualElement);
     *
     * @method compile
     * @param {String} string An HTMLBars template string
     * @param {Object} options A set of options to provide to the compiler
     * @return {Template} A function for rendering the template
     */
    function compile(string, options) {
      return template(compileSpec(string, options));
    }

    __exports__.compile = compile;
  });
enifed("htmlbars-compiler/fragment-javascript-compiler",
  ["./utils","../htmlbars-util/quoting","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var processOpcodes = __dependency1__.processOpcodes;
    var string = __dependency2__.string;

    var svgNamespace = "http://www.w3.org/2000/svg",
    // http://www.w3.org/html/wg/drafts/html/master/syntax.html#html-integration-point
        svgHTMLIntegrationPoints = {'foreignObject':true, 'desc':true, 'title':true};


    function FragmentJavaScriptCompiler() {
      this.source = [];
      this.depth = -1;
    }

    __exports__["default"] = FragmentJavaScriptCompiler;

    FragmentJavaScriptCompiler.prototype.compile = function(opcodes, options) {
      this.source.length = 0;
      this.depth = -1;
      this.indent = (options && options.indent) || "";
      this.namespaceFrameStack = [{namespace: null, depth: null}];
      this.domNamespace = null;

      this.source.push('function build(dom) {\n');
      processOpcodes(this, opcodes);
      this.source.push(this.indent+'}');

      return this.source.join('');
    };

    FragmentJavaScriptCompiler.prototype.createFragment = function() {
      var el = 'el'+(++this.depth);
      this.source.push(this.indent+'  var '+el+' = dom.createDocumentFragment();\n');
    };

    FragmentJavaScriptCompiler.prototype.createElement = function(tagName) {
      var el = 'el'+(++this.depth);
      if (tagName === 'svg') {
        this.pushNamespaceFrame({namespace: svgNamespace, depth: this.depth});
      }
      this.ensureNamespace();
      this.source.push(this.indent+'  var '+el+' = dom.createElement('+string(tagName)+');\n');
      if (svgHTMLIntegrationPoints[tagName]) {
        this.pushNamespaceFrame({namespace: null, depth: this.depth});
      }
    };

    FragmentJavaScriptCompiler.prototype.createText = function(str) {
      var el = 'el'+(++this.depth);
      this.source.push(this.indent+'  var '+el+' = dom.createTextNode('+string(str)+');\n');
    };

    FragmentJavaScriptCompiler.prototype.createComment = function(str) {
      var el = 'el'+(++this.depth);
      this.source.push(this.indent+'  var '+el+' = dom.createComment('+string(str)+');\n');
    };

    FragmentJavaScriptCompiler.prototype.returnNode = function() {
      var el = 'el'+this.depth;
      this.source.push(this.indent+'  return '+el+';\n');
    };

    FragmentJavaScriptCompiler.prototype.setAttribute = function(name, value, namespace) {
      var el = 'el'+this.depth;
      if (namespace) {
        this.source.push(this.indent+'  dom.setAttributeNS('+el+','+string(namespace)+','+string(name)+','+string(value)+');\n');
      } else {
        this.source.push(this.indent+'  dom.setAttribute('+el+','+string(name)+','+string(value)+');\n');
      }
    };

    FragmentJavaScriptCompiler.prototype.appendChild = function() {
      if (this.depth === this.getCurrentNamespaceFrame().depth) {
        this.popNamespaceFrame();
      }
      var child = 'el'+(this.depth--);
      var el = 'el'+this.depth;
      this.source.push(this.indent+'  dom.appendChild('+el+', '+child+');\n');
    };

    FragmentJavaScriptCompiler.prototype.getCurrentNamespaceFrame = function() {
      return this.namespaceFrameStack[this.namespaceFrameStack.length-1];
    };

    FragmentJavaScriptCompiler.prototype.pushNamespaceFrame = function(frame) {
      this.namespaceFrameStack.push(frame);
    };

    FragmentJavaScriptCompiler.prototype.popNamespaceFrame = function() {
      return this.namespaceFrameStack.pop();
    };

    FragmentJavaScriptCompiler.prototype.ensureNamespace = function() {
      var correctNamespace = this.getCurrentNamespaceFrame().namespace;
      if (this.domNamespace !== correctNamespace) {
        this.source.push(this.indent+'  dom.setNamespace('+(correctNamespace ? string(correctNamespace) : 'null')+');\n');
        this.domNamespace = correctNamespace;
      }
    };
  });
enifed("htmlbars-compiler/fragment-opcode-compiler",
  ["./template-visitor","./utils","../htmlbars-util","../htmlbars-util/array-utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var TemplateVisitor = __dependency1__["default"];
    var processOpcodes = __dependency2__.processOpcodes;
    var getAttrNamespace = __dependency3__.getAttrNamespace;
    var forEach = __dependency4__.forEach;

    function FragmentOpcodeCompiler() {
      this.opcodes = [];
    }

    __exports__["default"] = FragmentOpcodeCompiler;

    FragmentOpcodeCompiler.prototype.compile = function(ast) {
      var templateVisitor = new TemplateVisitor();
      templateVisitor.visit(ast);

      processOpcodes(this, templateVisitor.actions);

      return this.opcodes;
    };

    FragmentOpcodeCompiler.prototype.opcode = function(type, params) {
      this.opcodes.push([type, params]);
    };

    FragmentOpcodeCompiler.prototype.text = function(text) {
      this.opcode('createText', [text.chars]);
      this.opcode('appendChild');
    };

    FragmentOpcodeCompiler.prototype.comment = function(comment) {
      this.opcode('createComment', [comment.value]);
      this.opcode('appendChild');
    };

    FragmentOpcodeCompiler.prototype.openElement = function(element) {
      this.opcode('createElement', [element.tag]);
      forEach(element.attributes, this.attribute, this);
    };

    FragmentOpcodeCompiler.prototype.closeElement = function() {
      this.opcode('appendChild');
    };

    FragmentOpcodeCompiler.prototype.startProgram = function() {
      this.opcodes.length = 0;
      this.opcode('createFragment');
    };

    FragmentOpcodeCompiler.prototype.endProgram = function() {
      this.opcode('returnNode');
    };

    FragmentOpcodeCompiler.prototype.mustache = function() {
      this.pushMorphPlaceholderNode();
    };

    FragmentOpcodeCompiler.prototype.component = function() {
      this.pushMorphPlaceholderNode();
    };

    FragmentOpcodeCompiler.prototype.block = function() {
      this.pushMorphPlaceholderNode();
    };

    FragmentOpcodeCompiler.prototype.pushMorphPlaceholderNode = function() {
      this.opcode('createComment', [""]);
      this.opcode('appendChild');
    };

    FragmentOpcodeCompiler.prototype.attribute = function(attr) {
      if (attr.value.type === 'TextNode') {
        var namespace = getAttrNamespace(attr.name);
        this.opcode('setAttribute', [attr.name, attr.value.chars, namespace]);
      }
    };

    FragmentOpcodeCompiler.prototype.setNamespace = function(namespace) {
      this.opcode('setNamespace', [namespace]);
    };
  });
enifed("htmlbars-compiler/hydration-javascript-compiler",
  ["./utils","../htmlbars-util/quoting","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var processOpcodes = __dependency1__.processOpcodes;
    var string = __dependency2__.string;
    var array = __dependency2__.array;

    function HydrationJavaScriptCompiler() {
      this.stack = [];
      this.source = [];
      this.mustaches = [];
      this.parents = [['fragment']];
      this.parentCount = 0;
      this.morphs = [];
      this.fragmentProcessing = [];
      this.hooks = undefined;
    }

    __exports__["default"] = HydrationJavaScriptCompiler;

    var prototype = HydrationJavaScriptCompiler.prototype;

    prototype.compile = function(opcodes, options) {
      this.stack.length = 0;
      this.mustaches.length = 0;
      this.source.length = 0;
      this.parents.length = 1;
      this.parents[0] = ['fragment'];
      this.morphs.length = 0;
      this.fragmentProcessing.length = 0;
      this.parentCount = 0;
      this.indent = (options && options.indent) || "";
      this.hooks = {};
      this.hasOpenBoundary = false;
      this.hasCloseBoundary = false;

      processOpcodes(this, opcodes);

      if (this.hasOpenBoundary) {
        this.source.unshift(this.indent+"  dom.insertBoundary(fragment, 0);\n");
      }

      if (this.hasCloseBoundary) {
        this.source.unshift(this.indent+"  dom.insertBoundary(fragment, null);\n");
      }

      var i, l;
      if (this.morphs.length) {
        var morphs = "";
        for (i = 0, l = this.morphs.length; i < l; ++i) {
          var morph = this.morphs[i];
          morphs += this.indent+'  var '+morph[0]+' = '+morph[1]+';\n';
        }
        this.source.unshift(morphs);
      }

      if (this.fragmentProcessing.length) {
        var processing = "";
        for (i = 0, l = this.fragmentProcessing.length; i < l; ++i) {
          processing += this.indent+'  '+this.fragmentProcessing[i]+'\n';
        }
        this.source.unshift(processing);
      }

      return this.source.join('');
    };

    prototype.prepareArray = function(length) {
      var values = [];

      for (var i = 0; i < length; i++) {
        values.push(this.stack.pop());
      }

      this.stack.push('[' + values.join(', ') + ']');
    };

    prototype.prepareObject = function(size) {
      var pairs = [];

      for (var i = 0; i < size; i++) {
        pairs.push(this.stack.pop() + ': ' + this.stack.pop());
      }

      this.stack.push('{' + pairs.join(', ') + '}');
    };

    prototype.pushRaw = function(value) {
      this.stack.push(value);
    };

    prototype.openBoundary = function() {
      this.hasOpenBoundary = true;
    };

    prototype.closeBoundary = function() {
      this.hasCloseBoundary = true;
    };

    prototype.pushLiteral = function(value) {
      if (typeof value === 'string') {
        this.stack.push(string(value));
      } else {
        this.stack.push(value.toString());
      }
    };

    prototype.pushHook = function(name, args) {
      this.hooks[name] = true;
      this.stack.push(name + '(' + args.join(', ') + ')');
    };

    prototype.pushGetHook = function(path) {
      this.pushHook('get', [
        'env',
        'context',
        string(path)
      ]);
    };

    prototype.pushSexprHook = function() {
      this.pushHook('subexpr', [
        'env',
        'context',
        this.stack.pop(), // path
        this.stack.pop(), // params
        this.stack.pop() // hash
      ]);
    };

    prototype.pushConcatHook = function() {
      this.pushHook('concat', [
        'env',
        this.stack.pop() // parts
      ]);
    };

    prototype.printHook = function(name, args) {
      this.hooks[name] = true;
      this.source.push(this.indent + '  ' + name + '(' + args.join(', ') + ');\n');
    };

    prototype.printSetHook = function(name, index) {
      this.printHook('set', [
        'env',
        'context',
        string(name),
        'blockArguments[' + index + ']'
      ]);
    };

    prototype.printBlockHook = function(morphNum, templateId, inverseId) {
      this.printHook('block', [
        'env',
        'morph' + morphNum,
        'context',
        this.stack.pop(), // path
        this.stack.pop(), // params
        this.stack.pop(), // hash
        templateId === null ? 'null' : 'child' + templateId,
        inverseId === null ? 'null' : 'child' + inverseId
      ]);
    };

    prototype.printInlineHook = function(morphNum) {
      this.printHook('inline', [
        'env',
        'morph' + morphNum,
        'context',
        this.stack.pop(), // path
        this.stack.pop(), // params
        this.stack.pop() // hash
      ]);
    };

    prototype.printContentHook = function(morphNum) {
      this.printHook('content', [
        'env',
        'morph' + morphNum,
        'context',
        this.stack.pop() // path
      ]);
    };

    prototype.printComponentHook = function(morphNum, templateId) {
      this.printHook('component', [
        'env',
        'morph' + morphNum,
        'context',
        this.stack.pop(), // path
        this.stack.pop(), // attrs
        templateId === null ? 'null' : 'child' + templateId
      ]);
    };

    prototype.printAttributeHook = function(attrMorphNum, elementNum) {
      this.printHook('attribute', [
        'env',
        'attrMorph' + attrMorphNum,
        'element' + elementNum,
        this.stack.pop(), // name
        this.stack.pop() // value
      ]);
    };

    prototype.printElementHook = function(elementNum) {
      this.printHook('element', [
        'env',
        'element' + elementNum,
        'context',
        this.stack.pop(), // path
        this.stack.pop(), // params
        this.stack.pop() // hash
      ]);
    };

    prototype.createMorph = function(morphNum, parentPath, startIndex, endIndex, escaped) {
      var isRoot = parentPath.length === 0;
      var parent = this.getParent();

      var morphMethod = escaped ? 'createMorphAt' : 'createUnsafeMorphAt';
      var morph = "dom."+morphMethod+"("+parent+
        ","+(startIndex === null ? "-1" : startIndex)+
        ","+(endIndex === null ? "-1" : endIndex)+
        (isRoot ? ",contextualElement)" : ")");

      this.morphs.push(['morph' + morphNum, morph]);
    };

    prototype.createAttrMorph = function(attrMorphNum, elementNum, name, escaped, namespace) {
      var morphMethod = escaped ? 'createAttrMorph' : 'createUnsafeAttrMorph';
      var morph = "dom."+morphMethod+"(element"+elementNum+", '"+name+(namespace ? "', '"+namespace : '')+"')";
      this.morphs.push(['attrMorph' + attrMorphNum, morph]);
    };

    prototype.repairClonedNode = function(blankChildTextNodes, isElementChecked) {
      var parent = this.getParent(),
          processing = 'if (this.cachedFragment) { dom.repairClonedNode('+parent+','+
                       array(blankChildTextNodes)+
                       ( isElementChecked ? ',true' : '' )+
                       '); }';
      this.fragmentProcessing.push(
        processing
      );
    };

    prototype.shareElement = function(elementNum){
      var elementNodesName = "element" + elementNum;
      this.fragmentProcessing.push('var '+elementNodesName+' = '+this.getParent()+';');
      this.parents[this.parents.length-1] = [elementNodesName];
    };

    prototype.consumeParent = function(i) {
      var newParent = this.lastParent().slice();
      newParent.push(i);

      this.parents.push(newParent);
    };

    prototype.popParent = function() {
      this.parents.pop();
    };

    prototype.getParent = function() {
      var last = this.lastParent().slice();
      var frag = last.shift();

      if (!last.length) {
        return frag;
      }

      return 'dom.childAt(' + frag + ', [' + last.join(', ') + '])';
    };

    prototype.lastParent = function() {
      return this.parents[this.parents.length-1];
    };
  });
enifed("htmlbars-compiler/hydration-opcode-compiler",
  ["./template-visitor","./utils","../htmlbars-util","../htmlbars-util/array-utils","../htmlbars-syntax/utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var TemplateVisitor = __dependency1__["default"];
    var processOpcodes = __dependency2__.processOpcodes;
    var getAttrNamespace = __dependency3__.getAttrNamespace;
    var forEach = __dependency4__.forEach;
    var isHelper = __dependency5__.isHelper;

    function unwrapMustache(mustache) {
      if (isHelper(mustache.sexpr)) {
        return mustache.sexpr;
      } else {
        return mustache.sexpr.path;
      }
    }

    function detectIsElementChecked(element){
      for (var i=0, len=element.attributes.length;i<len;i++) {
        if (element.attributes[i].name === 'checked') {
          return true;
        }
      }
      return false;
    }

    function HydrationOpcodeCompiler() {
      this.opcodes = [];
      this.paths = [];
      this.templateId = 0;
      this.currentDOMChildIndex = 0;
      this.morphs = [];
      this.morphNum = 0;
      this.attrMorphNum = 0;
      this.element = null;
      this.elementNum = -1;
    }

    __exports__["default"] = HydrationOpcodeCompiler;

    HydrationOpcodeCompiler.prototype.compile = function(ast) {
      var templateVisitor = new TemplateVisitor();
      templateVisitor.visit(ast);

      processOpcodes(this, templateVisitor.actions);

      return this.opcodes;
    };

    HydrationOpcodeCompiler.prototype.accept = function(node) {
      this[node.type](node);
    };

    HydrationOpcodeCompiler.prototype.opcode = function(type) {
      var params = [].slice.call(arguments, 1);
      this.opcodes.push([type, params]);
    };

    HydrationOpcodeCompiler.prototype.startProgram = function(program, c, blankChildTextNodes) {
      this.opcodes.length = 0;
      this.paths.length = 0;
      this.morphs.length = 0;
      this.templateId = 0;
      this.currentDOMChildIndex = -1;
      this.morphNum = 0;
      this.attrMorphNum = 0;

      var blockParams = program.blockParams || [];

      for (var i = 0; i < blockParams.length; i++) {
        this.opcode('printSetHook', blockParams[i], i);
      }

      if (blankChildTextNodes.length > 0) {
        this.opcode('repairClonedNode', blankChildTextNodes);
      }
    };

    HydrationOpcodeCompiler.prototype.endProgram = function() {
      distributeMorphs(this.morphs, this.opcodes);
    };

    HydrationOpcodeCompiler.prototype.text = function() {
      ++this.currentDOMChildIndex;
    };

    HydrationOpcodeCompiler.prototype.comment = function() {
      ++this.currentDOMChildIndex;
    };

    HydrationOpcodeCompiler.prototype.openElement = function(element, pos, len, mustacheCount, blankChildTextNodes) {
      distributeMorphs(this.morphs, this.opcodes);
      ++this.currentDOMChildIndex;

      this.element = this.currentDOMChildIndex;

      this.opcode('consumeParent', this.currentDOMChildIndex);

      // If our parent reference will be used more than once, cache its reference.
      if (mustacheCount > 1) {
        this.opcode('shareElement', ++this.elementNum);
        this.element = null; // Set element to null so we don't cache it twice
      }

      var isElementChecked = detectIsElementChecked(element);
      if (blankChildTextNodes.length > 0 || isElementChecked) {
        this.opcode( 'repairClonedNode',
                     blankChildTextNodes,
                     isElementChecked );
      }

      this.paths.push(this.currentDOMChildIndex);
      this.currentDOMChildIndex = -1;

      forEach(element.attributes, this.attribute, this);
      forEach(element.modifiers, this.elementModifier, this);
    };

    HydrationOpcodeCompiler.prototype.closeElement = function() {
      distributeMorphs(this.morphs, this.opcodes);
      this.opcode('popParent');
      this.currentDOMChildIndex = this.paths.pop();
    };

    HydrationOpcodeCompiler.prototype.mustache = function(mustache, childIndex, childCount) {
      this.pushMorphPlaceholderNode(childIndex, childCount);
      
      var sexpr = mustache.sexpr;

      var morphNum = this.morphNum++;
      var start = this.currentDOMChildIndex;
      var end = this.currentDOMChildIndex;
      this.morphs.push([morphNum, this.paths.slice(), start, end, mustache.escaped]);

      if (isHelper(sexpr)) {
        prepareSexpr(this, sexpr);
        this.opcode('printInlineHook', morphNum);
      } else {
        preparePath(this, sexpr.path);
        this.opcode('printContentHook', morphNum);
      }
    };

    HydrationOpcodeCompiler.prototype.block = function(block, childIndex, childCount) {
      this.pushMorphPlaceholderNode(childIndex, childCount);

      var sexpr = block.sexpr;

      var morphNum = this.morphNum++;
      var start = this.currentDOMChildIndex;
      var end = this.currentDOMChildIndex;
      this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

      var templateId = this.templateId++;
      var inverseId = block.inverse === null ? null : this.templateId++;

      prepareSexpr(this, sexpr);
      this.opcode('printBlockHook', morphNum, templateId, inverseId);
    };

    HydrationOpcodeCompiler.prototype.component = function(component, childIndex, childCount) {
      this.pushMorphPlaceholderNode(childIndex, childCount);

      var program = component.program || {};
      var blockParams = program.blockParams || [];

      var morphNum = this.morphNum++;
      var start = this.currentDOMChildIndex;
      var end = this.currentDOMChildIndex;
      this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

      var attrs = component.attributes;
      for (var i = attrs.length - 1; i >= 0; i--) {
        var name = attrs[i].name;
        var value = attrs[i].value;

        // TODO: Introduce context specific AST nodes to avoid switching here.
        if (value.type === 'TextNode') {
          this.opcode('pushLiteral', value.chars);
        } else if (value.type === 'MustacheStatement') {
          this.accept(unwrapMustache(value));
        } else if (value.type === 'ConcatStatement') {
          prepareParams(this, value.parts);
          this.opcode('pushConcatHook');
        }

        this.opcode('pushLiteral', name);
      }

      this.opcode('prepareObject', attrs.length);
      this.opcode('pushLiteral', component.tag);
      this.opcode('printComponentHook', morphNum, this.templateId++, blockParams.length);
    };

    HydrationOpcodeCompiler.prototype.attribute = function(attr) {
      var value = attr.value;
      var escaped = true;
      var namespace = getAttrNamespace(attr.name);

      // TODO: Introduce context specific AST nodes to avoid switching here.
      if (value.type === 'TextNode') {
        return;
      } else if (value.type === 'MustacheStatement') {
        escaped = value.escaped;
        this.accept(unwrapMustache(value));
      } else if (value.type === 'ConcatStatement') {
        prepareParams(this, value.parts);
        this.opcode('pushConcatHook');
      }

      this.opcode('pushLiteral', attr.name);

      if (this.element !== null) {
        this.opcode('shareElement', ++this.elementNum);
        this.element = null;
      }

      var attrMorphNum = this.attrMorphNum++;
      this.opcode('createAttrMorph', attrMorphNum, this.elementNum, attr.name, escaped, namespace);
      this.opcode('printAttributeHook', attrMorphNum, this.elementNum);
    };

    HydrationOpcodeCompiler.prototype.elementModifier = function(modifier) {
      prepareSexpr(this, modifier.sexpr);

      // If we have a helper in a node, and this element has not been cached, cache it
      if (this.element !== null) {
        this.opcode('shareElement', ++this.elementNum);
        this.element = null; // Reset element so we don't cache it more than once
      }

      this.opcode('printElementHook', this.elementNum);
    };

    HydrationOpcodeCompiler.prototype.pushMorphPlaceholderNode = function(childIndex, childCount) {
      if (this.paths.length === 0) {
        if (childIndex === 0) {
          this.opcode('openBoundary');
        }
        if (childIndex === childCount - 1) {
          this.opcode('closeBoundary');
        }
      }
      this.comment();
    };

    HydrationOpcodeCompiler.prototype.SubExpression = function(sexpr) {
      prepareSexpr(this, sexpr);
      this.opcode('pushSexprHook');
    };

    HydrationOpcodeCompiler.prototype.PathExpression = function(path) {
      this.opcode('pushGetHook', path.original);
    };

    HydrationOpcodeCompiler.prototype.StringLiteral = function(node) {
      this.opcode('pushLiteral', node.value);
    };

    HydrationOpcodeCompiler.prototype.BooleanLiteral = function(node) {
      this.opcode('pushLiteral', node.value);
    };

    HydrationOpcodeCompiler.prototype.NumberLiteral = function(node) {
      this.opcode('pushLiteral', node.value);
    };

    function preparePath(compiler, path) {
      compiler.opcode('pushLiteral', path.original);
    }

    function prepareParams(compiler, params) {
      for (var i = params.length - 1; i >= 0; i--) {
        var param = params[i];
        compiler[param.type](param);
      }

      compiler.opcode('prepareArray', params.length);
    }

    function prepareHash(compiler, hash) {
      var pairs = hash.pairs;

      for (var i = pairs.length - 1; i >= 0; i--) {
        var key = pairs[i].key;
        var value = pairs[i].value;

        compiler[value.type](value);
        compiler.opcode('pushLiteral', key);
      }

      compiler.opcode('prepareObject', pairs.length);
    }

    function prepareSexpr(compiler, sexpr) {
      prepareHash(compiler, sexpr.hash);
      prepareParams(compiler, sexpr.params);
      preparePath(compiler, sexpr.path);
    }

    function distributeMorphs(morphs, opcodes) {
      if (morphs.length === 0) {
        return;
      }

      // Splice morphs after the most recent shareParent/consumeParent.
      var o;
      for (o = opcodes.length - 1; o >= 0; --o) {
        var opcode = opcodes[o][0];
        if (opcode === 'shareElement' || opcode === 'consumeParent'  || opcode === 'popParent') {
          break;
        }
      }

      var spliceArgs = [o + 1, 0];
      for (var i = 0; i < morphs.length; ++i) {
        spliceArgs.push(['createMorph', morphs[i].slice()]);
      }
      opcodes.splice.apply(opcodes, spliceArgs);
      morphs.length = 0;
    }
  });
enifed("htmlbars-compiler/template-compiler",
  ["./fragment-opcode-compiler","./fragment-javascript-compiler","./hydration-opcode-compiler","./hydration-javascript-compiler","./template-visitor","./utils","../htmlbars-util/quoting","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var FragmentOpcodeCompiler = __dependency1__["default"];
    var FragmentJavaScriptCompiler = __dependency2__["default"];
    var HydrationOpcodeCompiler = __dependency3__["default"];
    var HydrationJavaScriptCompiler = __dependency4__["default"];
    var TemplateVisitor = __dependency5__["default"];
    var processOpcodes = __dependency6__.processOpcodes;
    var repeat = __dependency7__.repeat;

    function TemplateCompiler(options) {
      this.options = options || {};
      this.revision = this.options.revision || "HTMLBars@v0.11.2";
      this.fragmentOpcodeCompiler = new FragmentOpcodeCompiler();
      this.fragmentCompiler = new FragmentJavaScriptCompiler();
      this.hydrationOpcodeCompiler = new HydrationOpcodeCompiler();
      this.hydrationCompiler = new HydrationJavaScriptCompiler();
      this.templates = [];
      this.childTemplates = [];
    }

    __exports__["default"] = TemplateCompiler;

    TemplateCompiler.prototype.compile = function(ast) {
      var templateVisitor = new TemplateVisitor();
      templateVisitor.visit(ast);

      processOpcodes(this, templateVisitor.actions);

      return this.templates.pop();
    };

    TemplateCompiler.prototype.startProgram = function(program, childTemplateCount, blankChildTextNodes) {
      this.fragmentOpcodeCompiler.startProgram(program, childTemplateCount, blankChildTextNodes);
      this.hydrationOpcodeCompiler.startProgram(program, childTemplateCount, blankChildTextNodes);

      this.childTemplates.length = 0;
      while(childTemplateCount--) {
        this.childTemplates.push(this.templates.pop());
      }
    };

    TemplateCompiler.prototype.getChildTemplateVars = function(indent) {
      var vars = '';
      if (this.childTemplates) {
        for (var i = 0; i < this.childTemplates.length; i++) {
          vars += indent + 'var child' + i + ' = ' + this.childTemplates[i] + ';\n';
        }
      }
      return vars;
    };

    TemplateCompiler.prototype.getHydrationHooks = function(indent, hooks) {
      var hookVars = [];
      for (var hook in hooks) {
        hookVars.push(hook + ' = hooks.' + hook);
      }

      if (hookVars.length > 0) {
        return indent + 'var hooks = env.hooks, ' + hookVars.join(', ') + ';\n';
      } else {
        return '';
      }
    };

    TemplateCompiler.prototype.endProgram = function(program, programDepth) {
      this.fragmentOpcodeCompiler.endProgram(program);
      this.hydrationOpcodeCompiler.endProgram(program);

      var indent = repeat("  ", programDepth);
      var options = {
        indent: indent + "    "
      };

      // function build(dom) { return fragment; }
      var fragmentProgram = this.fragmentCompiler.compile(
        this.fragmentOpcodeCompiler.opcodes,
        options
      );

      // function hydrate(fragment) { return mustaches; }
      var hydrationProgram = this.hydrationCompiler.compile(
        this.hydrationOpcodeCompiler.opcodes,
        options
      );

      var blockParams = program.blockParams || [];

      var templateSignature = 'context, env, contextualElement';
      if (blockParams.length > 0) {
        templateSignature += ', blockArguments';
      }

      var template =
        '(function() {\n' +
        this.getChildTemplateVars(indent + '  ') +
        indent+'  return {\n' +
        indent+'    isHTMLBars: true,\n' +
        indent+'    revision: "' + this.revision + '",\n' +
        indent+'    blockParams: ' + blockParams.length + ',\n' +
        indent+'    cachedFragment: null,\n' +
        indent+'    hasRendered: false,\n' +
        indent+'    build: ' + fragmentProgram + ',\n' +
        indent+'    render: function render(' + templateSignature + ') {\n' +
        indent+'      var dom = env.dom;\n' +
        this.getHydrationHooks(indent + '      ', this.hydrationCompiler.hooks) +
        indent+'      dom.detectNamespace(contextualElement);\n' +
        indent+'      var fragment;\n' +
        indent+'      if (env.useFragmentCache && dom.canClone) {\n' +
        indent+'        if (this.cachedFragment === null) {\n' +
        indent+'          fragment = this.build(dom);\n' +
        indent+'          if (this.hasRendered) {\n' +
        indent+'            this.cachedFragment = fragment;\n' +
        indent+'          } else {\n' +
        indent+'            this.hasRendered = true;\n' +
        indent+'          }\n' +
        indent+'        }\n' +
        indent+'        if (this.cachedFragment) {\n' +
        indent+'          fragment = dom.cloneNode(this.cachedFragment, true);\n' +
        indent+'        }\n' +
        indent+'      } else {\n' +
        indent+'        fragment = this.build(dom);\n' +
        indent+'      }\n' +
        hydrationProgram +
        indent+'      return fragment;\n' +
        indent+'    }\n' +
        indent+'  };\n' +
        indent+'}())';

      this.templates.push(template);
    };

    TemplateCompiler.prototype.openElement = function(element, i, l, r, c, b) {
      this.fragmentOpcodeCompiler.openElement(element, i, l, r, c, b);
      this.hydrationOpcodeCompiler.openElement(element, i, l, r, c, b);
    };

    TemplateCompiler.prototype.closeElement = function(element, i, l, r) {
      this.fragmentOpcodeCompiler.closeElement(element, i, l, r);
      this.hydrationOpcodeCompiler.closeElement(element, i, l, r);
    };

    TemplateCompiler.prototype.component = function(component, i, l, s) {
      this.fragmentOpcodeCompiler.component(component, i, l, s);
      this.hydrationOpcodeCompiler.component(component, i, l, s);
    };

    TemplateCompiler.prototype.block = function(block, i, l, s) {
      this.fragmentOpcodeCompiler.block(block, i, l, s);
      this.hydrationOpcodeCompiler.block(block, i, l, s);
    };

    TemplateCompiler.prototype.text = function(string, i, l, r) {
      this.fragmentOpcodeCompiler.text(string, i, l, r);
      this.hydrationOpcodeCompiler.text(string, i, l, r);
    };

    TemplateCompiler.prototype.comment = function(string, i, l, r) {
      this.fragmentOpcodeCompiler.comment(string, i, l, r);
      this.hydrationOpcodeCompiler.comment(string, i, l, r);
    };

    TemplateCompiler.prototype.mustache = function (mustache, i, l, s) {
      this.fragmentOpcodeCompiler.mustache(mustache, i, l, s);
      this.hydrationOpcodeCompiler.mustache(mustache, i, l, s);
    };

    TemplateCompiler.prototype.setNamespace = function(namespace) {
      this.fragmentOpcodeCompiler.setNamespace(namespace);
    };
  });
enifed("htmlbars-compiler/template-visitor",
  ["exports"],
  function(__exports__) {
    "use strict";
    var push = Array.prototype.push;

    function Frame() {
      this.parentNode = null;
      this.children = null;
      this.childIndex = null;
      this.childCount = null;
      this.childTemplateCount = 0;
      this.mustacheCount = 0;
      this.actions = [];
    }

    /**
     * Takes in an AST and outputs a list of actions to be consumed
     * by a compiler. For example, the template
     *
     *     foo{{bar}}<div>baz</div>
     *
     * produces the actions
     *
     *     [['startProgram', [programNode, 0]],
     *      ['text', [textNode, 0, 3]],
     *      ['mustache', [mustacheNode, 1, 3]],
     *      ['openElement', [elementNode, 2, 3, 0]],
     *      ['text', [textNode, 0, 1]],
     *      ['closeElement', [elementNode, 2, 3],
     *      ['endProgram', [programNode]]]
     *
     * This visitor walks the AST depth first and backwards. As
     * a result the bottom-most child template will appear at the
     * top of the actions list whereas the root template will appear
     * at the bottom of the list. For example,
     *
     *     <div>{{#if}}foo{{else}}bar<b></b>{{/if}}</div>
     *
     * produces the actions
     *
     *     [['startProgram', [programNode, 0]],
     *      ['text', [textNode, 0, 2, 0]],
     *      ['openElement', [elementNode, 1, 2, 0]],
     *      ['closeElement', [elementNode, 1, 2]],
     *      ['endProgram', [programNode]],
     *      ['startProgram', [programNode, 0]],
     *      ['text', [textNode, 0, 1]],
     *      ['endProgram', [programNode]],
     *      ['startProgram', [programNode, 2]],
     *      ['openElement', [elementNode, 0, 1, 1]],
     *      ['block', [blockNode, 0, 1]],
     *      ['closeElement', [elementNode, 0, 1]],
     *      ['endProgram', [programNode]]]
     *
     * The state of the traversal is maintained by a stack of frames.
     * Whenever a node with children is entered (either a ProgramNode
     * or an ElementNode) a frame is pushed onto the stack. The frame
     * contains information about the state of the traversal of that
     * node. For example,
     *
     *   - index of the current child node being visited
     *   - the number of mustaches contained within its child nodes
     *   - the list of actions generated by its child nodes
     */

    function TemplateVisitor() {
      this.frameStack = [];
      this.actions = [];
      this.programDepth = -1;
    }

    // Traversal methods

    TemplateVisitor.prototype.visit = function(node) {
      this[node.type](node);
    };

    TemplateVisitor.prototype.Program = function(program) {
      this.programDepth++;

      var parentFrame = this.getCurrentFrame();
      var programFrame = this.pushFrame();

      programFrame.parentNode = program;
      programFrame.children = program.body;
      programFrame.childCount = program.body.length;
      programFrame.blankChildTextNodes = [];
      programFrame.actions.push(['endProgram', [program, this.programDepth]]);

      for (var i = program.body.length - 1; i >= 0; i--) {
        programFrame.childIndex = i;
        this.visit(program.body[i]);
      }

      programFrame.actions.push(['startProgram', [
        program, programFrame.childTemplateCount,
        programFrame.blankChildTextNodes.reverse()
      ]]);
      this.popFrame();

      this.programDepth--;

      // Push the completed template into the global actions list
      if (parentFrame) { parentFrame.childTemplateCount++; }
      push.apply(this.actions, programFrame.actions.reverse());
    };

    TemplateVisitor.prototype.ElementNode = function(element) {
      var parentFrame = this.getCurrentFrame();
      var elementFrame = this.pushFrame();

      elementFrame.parentNode = element;
      elementFrame.children = element.children;
      elementFrame.childCount = element.children.length;
      elementFrame.mustacheCount += element.modifiers.length;
      elementFrame.blankChildTextNodes = [];

      var actionArgs = [
        element,
        parentFrame.childIndex,
        parentFrame.childCount
      ];

      elementFrame.actions.push(['closeElement', actionArgs]);

      for (var i = element.attributes.length - 1; i >= 0; i--) {
        this.visit(element.attributes[i]);
      }

      for (i = element.children.length - 1; i >= 0; i--) {
        elementFrame.childIndex = i;
        this.visit(element.children[i]);
      }

      elementFrame.actions.push(['openElement', actionArgs.concat([
        elementFrame.mustacheCount, elementFrame.blankChildTextNodes.reverse() ])]);
      this.popFrame();

      // Propagate the element's frame state to the parent frame
      if (elementFrame.mustacheCount > 0) { parentFrame.mustacheCount++; }
      parentFrame.childTemplateCount += elementFrame.childTemplateCount;
      push.apply(parentFrame.actions, elementFrame.actions);
    };

    TemplateVisitor.prototype.AttrNode = function(attr) {
      if (attr.value.type !== 'TextNode') {
        this.getCurrentFrame().mustacheCount++;
      }
    };

    TemplateVisitor.prototype.TextNode = function(text) {
      var frame = this.getCurrentFrame();
      if (text.chars === '') {
        frame.blankChildTextNodes.push(domIndexOf(frame.children, text));
      }
      frame.actions.push(['text', [text, frame.childIndex, frame.childCount]]);
    };

    TemplateVisitor.prototype.BlockStatement = function(node) {
      var frame = this.getCurrentFrame();

      frame.mustacheCount++;
      frame.actions.push(['block', [node, frame.childIndex, frame.childCount]]);

      if (node.inverse) { this.visit(node.inverse); }
      if (node.program) { this.visit(node.program); }
    };

    TemplateVisitor.prototype.ComponentNode = function(node) {
      var frame = this.getCurrentFrame();

      frame.mustacheCount++;
      frame.actions.push(['component', [node, frame.childIndex, frame.childCount]]);

      if (node.program) { this.visit(node.program); }
    };


    TemplateVisitor.prototype.PartialStatement = function(node) {
      var frame = this.getCurrentFrame();
      frame.mustacheCount++;
      frame.actions.push(['mustache', [node, frame.childIndex, frame.childCount]]);
    };

    TemplateVisitor.prototype.CommentStatement = function(text) {
      var frame = this.getCurrentFrame();
      frame.actions.push(['comment', [text, frame.childIndex, frame.childCount]]);
    };

    TemplateVisitor.prototype.MustacheStatement = function(mustache) {
      var frame = this.getCurrentFrame();
      frame.mustacheCount++;
      frame.actions.push(['mustache', [mustache, frame.childIndex, frame.childCount]]);
    };

    // Frame helpers

    TemplateVisitor.prototype.getCurrentFrame = function() {
      return this.frameStack[this.frameStack.length - 1];
    };

    TemplateVisitor.prototype.pushFrame = function() {
      var frame = new Frame();
      this.frameStack.push(frame);
      return frame;
    };

    TemplateVisitor.prototype.popFrame = function() {
      return this.frameStack.pop();
    };

    __exports__["default"] = TemplateVisitor;


    // Returns the index of `domNode` in the `nodes` array, skipping
    // over any nodes which do not represent DOM nodes.
    function domIndexOf(nodes, domNode) {
      var index = -1;

      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        if (node.type !== 'TextNode' && node.type !== 'ElementNode') {
          continue;
        } else {
          index++;
        }

        if (node === domNode) {
          return index;
        }
      }

      return -1;
    }
  });
enifed("htmlbars-compiler/utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    function processOpcodes(compiler, opcodes) {
      for (var i=0, l=opcodes.length; i<l; i++) {
        var method = opcodes[i][0];
        var params = opcodes[i][1];
        if (params) {
          compiler[method].apply(compiler, params);
        } else {
          compiler[method].call(compiler);
        }
      }
    }

    __exports__.processOpcodes = processOpcodes;
  });
enifed("htmlbars-runtime",
  ["htmlbars-runtime/hooks","htmlbars-runtime/helpers","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var hooks = __dependency1__["default"];
    var helpers = __dependency2__["default"];

    __exports__.hooks = hooks;
    __exports__.helpers = helpers;
  });
enifed("htmlbars-runtime/helpers",
  ["exports"],
  function(__exports__) {
    "use strict";
    function partial(params, hash, options, env) {
      var template = env.partials[params[0]];
      return template.render(this, env, options.morph.contextualElement);
    }

    __exports__.partial = partial;__exports__["default"] = {
      partial: partial
    };
  });
enifed("htmlbars-runtime/hooks",
  ["exports"],
  function(__exports__) {
    "use strict";
    function block(env, morph, context, path, params, hash, template, inverse) {
      var options = {
        morph: morph,
        template: template,
        inverse: inverse
      };

      var helper = lookupHelper(env, context, path);
      var value = helper.call(context, params, hash, options, env);

      morph.setContent(value);
    }

    __exports__.block = block;function inline(env, morph, context, path, params, hash) {
      var helper = lookupHelper(env, context, path);
      var value = helper.call(context, params, hash, { morph: morph }, env);

      morph.setContent(value);
    }

    __exports__.inline = inline;function content(env, morph, context, path) {
      var helper = lookupHelper(env, context, path);

      var value;
      if (helper) {
        value = helper.call(context, [], {}, { morph: morph }, env);
      } else {
        value = get(env, context, path);
      }

      morph.setContent(value);
    }

    __exports__.content = content;function element(env, domElement, context, path, params, hash) {
      var helper = lookupHelper(env, context, path);
      if (helper) {
        helper.call(context, params, hash, { element: domElement }, env);
      }
    }

    __exports__.element = element;function attribute(env, attrMorph, domElement, name, value) {
      attrMorph.setContent(value);
    }

    __exports__.attribute = attribute;function subexpr(env, context, helperName, params, hash) {
      var helper = lookupHelper(env, context, helperName);
      if (helper) {
        return helper.call(context, params, hash, {}, env);
      } else {
        return get(env, context, helperName);
      }
    }

    __exports__.subexpr = subexpr;function get(env, context, path) {
      if (path === '') {
        return context;
      }

      var keys = path.split('.');
      var value = context;
      for (var i = 0; i < keys.length; i++) {
        if (value) {
          value = value[keys[i]];
        } else {
          break;
        }
      }
      return value;
    }

    __exports__.get = get;function set(env, context, name, value) {
      context[name] = value;
    }

    __exports__.set = set;function component(env, morph, context, tagName, attrs, template) {
      var helper = lookupHelper(env, context, tagName);

      var value;
      if (helper) {
        var options = {
          morph: morph,
          template: template
        };

        value = helper.call(context, [], attrs, options, env);
      } else {
        value = componentFallback(env, morph, context, tagName, attrs, template);
      }

      morph.setContent(value);
    }

    __exports__.component = component;function concat(env, params) {
      var value = "";
      for (var i = 0, l = params.length; i < l; i++) {
        value += params[i];
      }
      return value;
    }

    __exports__.concat = concat;function componentFallback(env, morph, context, tagName, attrs, template) {
      var element = env.dom.createElement(tagName);
      for (var name in attrs) {
        element.setAttribute(name, attrs[name]);
      }
      element.appendChild(template.render(context, env, morph.contextualElement));
      return element;
    }

    function lookupHelper(env, context, helperName) {
      return env.helpers[helperName];
    }

    __exports__["default"] = {
      content: content,
      block: block,
      inline: inline,
      component: component,
      element: element,
      attribute: attribute,
      subexpr: subexpr,
      concat: concat,
      get: get,
      set: set
    };
  });
enifed("htmlbars-syntax",
  ["./htmlbars-syntax/walker","./htmlbars-syntax/builders","./htmlbars-syntax/parser","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Walker = __dependency1__["default"];
    var builders = __dependency2__["default"];
    var parse = __dependency3__.preprocess;

    __exports__.Walker = Walker;
    __exports__.builders = builders;
    __exports__.parse = parse;
  });
enifed("htmlbars-syntax/builders",
  ["exports"],
  function(__exports__) {
    "use strict";
    // Statements

    function buildMustache(sexpr, raw) {
      return {
        type: "MustacheStatement",
        sexpr: sexpr,
        escaped: !raw
      };
    }

    __exports__.buildMustache = buildMustache;function buildBlock(sexpr, program, inverse) {
      return {
        type: "BlockStatement",
        sexpr: sexpr,
        program: program || null,
        inverse: inverse || null
      };
    }

    __exports__.buildBlock = buildBlock;function buildPartial(sexpr, indent) {
      return {
        type: "PartialStatement",
        sexpr: sexpr,
        indent: indent
      };
    }

    __exports__.buildPartial = buildPartial;function buildComment(value) {
      return {
        type: "CommentStatement",
        value: value
      };
    }

    __exports__.buildComment = buildComment;function buildConcat(parts) {
      return {
        type: "ConcatStatement",
        parts: parts || []
      };
    }

    __exports__.buildConcat = buildConcat;function buildElementModifier(sexpr) {
      return {
        type: "ElementModifierStatement",
        sexpr: sexpr
      };
    }

    __exports__.buildElementModifier = buildElementModifier;// Nodes

    function buildElement(tag, attributes, modifiers, children) {
      return {
        type: "ElementNode",
        tag: tag,
        attributes: attributes || [],
        modifiers: modifiers || [],
        children: children || []
      };
    }

    __exports__.buildElement = buildElement;function buildComponent(tag, attributes, program) {
      return {
        type: "ComponentNode",
        tag: tag,
        attributes: attributes,
        program: program
      };
    }

    __exports__.buildComponent = buildComponent;function buildAttr(name, value) {
      return {
        type: "AttrNode",
        name: name,
        value: value
      };
    }

    __exports__.buildAttr = buildAttr;function buildText(chars) {
      return {
        type: "TextNode",
        chars: chars
      };
    }

    __exports__.buildText = buildText;// Expressions

    function buildSexpr(path, params, hash) {
      return {
        type: "SubExpression",
        path: path,
        params: params || [],
        hash: hash || buildHash([])
      };
    }

    __exports__.buildSexpr = buildSexpr;function buildPath(original) {
      return {
        type: "PathExpression",
        original: original,
        parts: original.split('.')
      };
    }

    __exports__.buildPath = buildPath;function buildString(value) {
      return {
        type: "StringLiteral",
        value: value,
        original: value
      };
    }

    __exports__.buildString = buildString;function buildBoolean(value) {
      return {
        type: "BooleanLiteral",
        value: value,
        original: value
      };
    }

    __exports__.buildBoolean = buildBoolean;function buildNumber(value) {
      return {
        type: "NumberLiteral",
        value: value,
        original: value
      };
    }

    __exports__.buildNumber = buildNumber;// Miscellaneous

    function buildHash(pairs) {
      return {
        type: "Hash",
        pairs: pairs || []
      };
    }

    __exports__.buildHash = buildHash;function buildPair(key, value) {
      return {
        type: "HashPair",
        key: key,
        value: value
      };
    }

    __exports__.buildPair = buildPair;function buildProgram(body, blockParams) {
      return {
        type: "Program",
        body: body || [],
        blockParams: blockParams || []
      };
    }

    __exports__.buildProgram = buildProgram;__exports__["default"] = {
      mustache: buildMustache,
      block: buildBlock,
      partial: buildPartial,
      comment: buildComment,
      element: buildElement,
      elementModifier: buildElementModifier,
      component: buildComponent,
      attr: buildAttr,
      text: buildText,
      sexpr: buildSexpr,
      path: buildPath,
      string: buildString,
      "boolean": buildBoolean,
      number: buildNumber,
      concat: buildConcat,
      hash: buildHash,
      pair: buildPair,
      program: buildProgram
    };
  });
enifed("htmlbars-syntax/handlebars/compiler/ast",
  ["../exception","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Exception = __dependency1__["default"];

    var AST = {
      Program: function(statements, blockParams, strip, locInfo) {
        this.loc = locInfo;
        this.type = 'Program';
        this.body = statements;

        this.blockParams = blockParams;
        this.strip = strip;
      },

      MustacheStatement: function(sexpr, escaped, strip, locInfo) {
        this.loc = locInfo;
        this.type = 'MustacheStatement';

        this.sexpr = sexpr;
        this.escaped = escaped;

        this.strip = strip;
      },

      BlockStatement: function(sexpr, program, inverse, openStrip, inverseStrip, closeStrip, locInfo) {
        this.loc = locInfo;

        this.type = 'BlockStatement';
        this.sexpr = sexpr;
        this.program  = program;
        this.inverse  = inverse;

        this.openStrip = openStrip;
        this.inverseStrip = inverseStrip;
        this.closeStrip = closeStrip;
      },

      PartialStatement: function(sexpr, strip, locInfo) {
        this.loc = locInfo;
        this.type = 'PartialStatement';
        this.sexpr = sexpr;
        this.indent = '';

        this.strip = strip;
      },

      ContentStatement: function(string, locInfo) {
        this.loc = locInfo;
        this.type = 'ContentStatement';
        this.original = this.value = string;
      },

      CommentStatement: function(comment, strip, locInfo) {
        this.loc = locInfo;
        this.type = 'CommentStatement';
        this.value = comment;

        this.strip = strip;
      },

      SubExpression: function(path, params, hash, locInfo) {
        this.loc = locInfo;

        this.type = 'SubExpression';
        this.path = path;
        this.params = params || [];
        this.hash = hash;
      },

      PathExpression: function(data, depth, parts, original, locInfo) {
        this.loc = locInfo;
        this.type = 'PathExpression';

        this.data = data;
        this.original = original;
        this.parts    = parts;
        this.depth    = depth;
      },

      StringLiteral: function(string, locInfo) {
        this.loc = locInfo;
        this.type = 'StringLiteral';
        this.original =
          this.value = string;
      },

      NumberLiteral: function(number, locInfo) {
        this.loc = locInfo;
        this.type = 'NumberLiteral';
        this.original =
          this.value = Number(number);
      },

      BooleanLiteral: function(bool, locInfo) {
        this.loc = locInfo;
        this.type = 'BooleanLiteral';
        this.original =
          this.value = bool === 'true';
      },

      Hash: function(pairs, locInfo) {
        this.loc = locInfo;
        this.type = 'Hash';
        this.pairs = pairs;
      },
      HashPair: function(key, value, locInfo) {
        this.loc = locInfo;
        this.type = 'HashPair';
        this.key = key;
        this.value = value;
      }
    };


    // Must be exported as an object rather than the root of the module as the jison lexer
    // most modify the object to operate properly.
    __exports__["default"] = AST;
  });
enifed("htmlbars-syntax/handlebars/compiler/base",
  ["./parser","./ast","./whitespace-control","./helpers","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var parser = __dependency1__["default"];
    var AST = __dependency2__["default"];
    var WhitespaceControl = __dependency3__["default"];
    var Helpers = __dependency4__;
    var extend = __dependency5__.extend;

    __exports__.parser = parser;

    var yy = {};
    extend(yy, Helpers, AST);

    function parse(input, options) {
      // Just return if an already-compile AST was passed in.
      if (input.type === 'Program') { return input; }

      parser.yy = yy;

      // Altering the shared object here, but this is ok as parser is a sync operation
      yy.locInfo = function(locInfo) {
        return new yy.SourceLocation(options && options.srcName, locInfo);
      };

      var strip = new WhitespaceControl();
      return strip.accept(parser.parse(input));
    }

    __exports__.parse = parse;
  });
enifed("htmlbars-syntax/handlebars/compiler/helpers",
  ["../exception","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Exception = __dependency1__["default"];

    function SourceLocation(source, locInfo) {
      this.source = source;
      this.start = {
        line: locInfo.first_line,
        column: locInfo.first_column
      };
      this.end = {
        line: locInfo.last_line,
        column: locInfo.last_column
      };
    }

    __exports__.SourceLocation = SourceLocation;function stripFlags(open, close) {
      return {
        open: open.charAt(2) === '~',
        close: close.charAt(close.length-3) === '~'
      };
    }

    __exports__.stripFlags = stripFlags;function stripComment(comment) {
      return comment.replace(/^\{\{~?\!-?-?/, '')
                    .replace(/-?-?~?\}\}$/, '');
    }

    __exports__.stripComment = stripComment;function preparePath(data, parts, locInfo) {
      /*jshint -W040 */
      locInfo = this.locInfo(locInfo);

      var original = data ? '@' : '',
          dig = [],
          depth = 0,
          depthString = '';

      for(var i=0,l=parts.length; i<l; i++) {
        var part = parts[i].part;
        original += (parts[i].separator || '') + part;

        if (part === '..' || part === '.' || part === 'this') {
          if (dig.length > 0) {
            throw new Exception('Invalid path: ' + original, {loc: locInfo});
          } else if (part === '..') {
            depth++;
            depthString += '../';
          }
        } else {
          dig.push(part);
        }
      }

      return new this.PathExpression(data, depth, dig, original, locInfo);
    }

    __exports__.preparePath = preparePath;function prepareMustache(sexpr, open, strip, locInfo) {
      /*jshint -W040 */
      // Must use charAt to support IE pre-10
      var escapeFlag = open.charAt(3) || open.charAt(2),
          escaped = escapeFlag !== '{' && escapeFlag !== '&';

      return new this.MustacheStatement(sexpr, escaped, strip, this.locInfo(locInfo));
    }

    __exports__.prepareMustache = prepareMustache;function prepareRawBlock(openRawBlock, content, close, locInfo) {
      /*jshint -W040 */
      if (openRawBlock.sexpr.path.original !== close) {
        var errorNode = {loc: openRawBlock.sexpr.loc};

        throw new Exception(openRawBlock.sexpr.path.original + " doesn't match " + close, errorNode);
      }

      locInfo = this.locInfo(locInfo);
      var program = new this.Program([content], null, {}, locInfo);

      return new this.BlockStatement(
          openRawBlock.sexpr, program, undefined,
          {}, {}, {},
          locInfo);
    }

    __exports__.prepareRawBlock = prepareRawBlock;function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
      /*jshint -W040 */
      // When we are chaining inverse calls, we will not have a close path
      if (close && close.path && openBlock.sexpr.path.original !== close.path.original) {
        var errorNode = {loc: openBlock.sexpr.loc};

        throw new Exception(openBlock.sexpr.path.original + ' doesn\'t match ' + close.path.original, errorNode);
      }

      program.blockParams = openBlock.blockParams;

      var inverse,
          inverseStrip;

      if (inverseAndProgram) {
        if (inverseAndProgram.chain) {
          inverseAndProgram.program.body[0].closeStrip = close.strip || close.openStrip;
        }

        inverseStrip = inverseAndProgram.strip;
        inverse = inverseAndProgram.program;
      }

      if (inverted) {
        inverted = inverse;
        inverse = program;
        program = inverted;
      }

      return new this.BlockStatement(
          openBlock.sexpr, program, inverse,
          openBlock.strip, inverseStrip, close && (close.strip || close.openStrip),
          this.locInfo(locInfo));
    }

    __exports__.prepareBlock = prepareBlock;
  });
enifed("htmlbars-syntax/handlebars/compiler/parser",
  ["exports"],
  function(__exports__) {
    "use strict";
    /* jshint ignore:start */
    /* istanbul ignore next */
    /* Jison generated parser */
    var handlebars = (function(){
    var parser = {trace: function trace() { },
    yy: {},
    symbols_: {"error":2,"root":3,"program":4,"EOF":5,"program_repetition0":6,"statement":7,"mustache":8,"block":9,"rawBlock":10,"partial":11,"content":12,"COMMENT":13,"CONTENT":14,"openRawBlock":15,"END_RAW_BLOCK":16,"OPEN_RAW_BLOCK":17,"sexpr":18,"CLOSE_RAW_BLOCK":19,"openBlock":20,"block_option0":21,"closeBlock":22,"openInverse":23,"block_option1":24,"OPEN_BLOCK":25,"openBlock_option0":26,"CLOSE":27,"OPEN_INVERSE":28,"openInverse_option0":29,"openInverseChain":30,"OPEN_INVERSE_CHAIN":31,"openInverseChain_option0":32,"inverseAndProgram":33,"INVERSE":34,"inverseChain":35,"inverseChain_option0":36,"OPEN_ENDBLOCK":37,"path":38,"OPEN":39,"OPEN_UNESCAPED":40,"CLOSE_UNESCAPED":41,"OPEN_PARTIAL":42,"helperName":43,"sexpr_repetition0":44,"sexpr_option0":45,"dataName":46,"param":47,"STRING":48,"NUMBER":49,"BOOLEAN":50,"OPEN_SEXPR":51,"CLOSE_SEXPR":52,"hash":53,"hash_repetition_plus0":54,"hashSegment":55,"ID":56,"EQUALS":57,"blockParams":58,"OPEN_BLOCK_PARAMS":59,"blockParams_repetition_plus0":60,"CLOSE_BLOCK_PARAMS":61,"DATA":62,"pathSegments":63,"SEP":64,"$accept":0,"$end":1},
    terminals_: {2:"error",5:"EOF",13:"COMMENT",14:"CONTENT",16:"END_RAW_BLOCK",17:"OPEN_RAW_BLOCK",19:"CLOSE_RAW_BLOCK",25:"OPEN_BLOCK",27:"CLOSE",28:"OPEN_INVERSE",31:"OPEN_INVERSE_CHAIN",34:"INVERSE",37:"OPEN_ENDBLOCK",39:"OPEN",40:"OPEN_UNESCAPED",41:"CLOSE_UNESCAPED",42:"OPEN_PARTIAL",48:"STRING",49:"NUMBER",50:"BOOLEAN",51:"OPEN_SEXPR",52:"CLOSE_SEXPR",56:"ID",57:"EQUALS",59:"OPEN_BLOCK_PARAMS",61:"CLOSE_BLOCK_PARAMS",62:"DATA",64:"SEP"},
    productions_: [0,[3,2],[4,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[12,1],[10,3],[15,3],[9,4],[9,4],[20,4],[23,4],[30,4],[33,2],[35,3],[35,1],[22,3],[8,3],[8,3],[11,3],[18,3],[18,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,3],[53,1],[55,3],[58,3],[43,1],[43,1],[43,1],[46,2],[38,1],[63,3],[63,1],[6,0],[6,2],[21,0],[21,1],[24,0],[24,1],[26,0],[26,1],[29,0],[29,1],[32,0],[32,1],[36,0],[36,1],[44,0],[44,2],[45,0],[45,1],[54,1],[54,2],[60,1],[60,2]],
    performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

    var $0 = $$.length - 1;
    switch (yystate) {
    case 1: return $$[$0-1]; 
    break;
    case 2:this.$ = new yy.Program($$[$0], null, {}, yy.locInfo(this._$));
    break;
    case 3:this.$ = $$[$0];
    break;
    case 4:this.$ = $$[$0];
    break;
    case 5:this.$ = $$[$0];
    break;
    case 6:this.$ = $$[$0];
    break;
    case 7:this.$ = $$[$0];
    break;
    case 8:this.$ = new yy.CommentStatement(yy.stripComment($$[$0]), yy.stripFlags($$[$0], $$[$0]), yy.locInfo(this._$));
    break;
    case 9:this.$ = new yy.ContentStatement($$[$0], yy.locInfo(this._$));
    break;
    case 10:this.$ = yy.prepareRawBlock($$[$0-2], $$[$0-1], $$[$0], this._$);
    break;
    case 11:this.$ = { sexpr: $$[$0-1] };
    break;
    case 12:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], false, this._$);
    break;
    case 13:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], true, this._$);
    break;
    case 14:this.$ = { sexpr: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-3], $$[$0]) };
    break;
    case 15:this.$ = { sexpr: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-3], $$[$0]) };
    break;
    case 16:this.$ = { sexpr: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-3], $$[$0]) };
    break;
    case 17:this.$ = { strip: yy.stripFlags($$[$0-1], $$[$0-1]), program: $$[$0] };
    break;
    case 18:
        var inverse = yy.prepareBlock($$[$0-2], $$[$0-1], $$[$0], $$[$0], false, this._$),
            program = new yy.Program([inverse], null, {}, yy.locInfo(this._$));
        program.chained = true;

        this.$ = { strip: $$[$0-2].strip, program: program, chain: true };
      
    break;
    case 19:this.$ = $$[$0];
    break;
    case 20:this.$ = {path: $$[$0-1], strip: yy.stripFlags($$[$0-2], $$[$0])};
    break;
    case 21:this.$ = yy.prepareMustache($$[$0-1], $$[$0-2], yy.stripFlags($$[$0-2], $$[$0]), this._$);
    break;
    case 22:this.$ = yy.prepareMustache($$[$0-1], $$[$0-2], yy.stripFlags($$[$0-2], $$[$0]), this._$);
    break;
    case 23:this.$ = new yy.PartialStatement($$[$0-1], yy.stripFlags($$[$0-2], $$[$0]), yy.locInfo(this._$));
    break;
    case 24:this.$ = new yy.SubExpression($$[$0-2], $$[$0-1], $$[$0], yy.locInfo(this._$));
    break;
    case 25:this.$ = new yy.SubExpression($$[$0], null, null, yy.locInfo(this._$));
    break;
    case 26:this.$ = $$[$0];
    break;
    case 27:this.$ = new yy.StringLiteral($$[$0], yy.locInfo(this._$));
    break;
    case 28:this.$ = new yy.NumberLiteral($$[$0], yy.locInfo(this._$));
    break;
    case 29:this.$ = new yy.BooleanLiteral($$[$0], yy.locInfo(this._$));
    break;
    case 30:this.$ = $$[$0];
    break;
    case 31:this.$ = $$[$0-1];
    break;
    case 32:this.$ = new yy.Hash($$[$0], yy.locInfo(this._$));
    break;
    case 33:this.$ = new yy.HashPair($$[$0-2], $$[$0], yy.locInfo(this._$));
    break;
    case 34:this.$ = $$[$0-1];
    break;
    case 35:this.$ = $$[$0];
    break;
    case 36:this.$ = new yy.StringLiteral($$[$0], yy.locInfo(this._$)), yy.locInfo(this._$);
    break;
    case 37:this.$ = new yy.NumberLiteral($$[$0], yy.locInfo(this._$));
    break;
    case 38:this.$ = yy.preparePath(true, $$[$0], this._$);
    break;
    case 39:this.$ = yy.preparePath(false, $$[$0], this._$);
    break;
    case 40: $$[$0-2].push({part: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
    break;
    case 41:this.$ = [{part: $$[$0]}];
    break;
    case 42:this.$ = [];
    break;
    case 43:$$[$0-1].push($$[$0]);
    break;
    case 56:this.$ = [];
    break;
    case 57:$$[$0-1].push($$[$0]);
    break;
    case 60:this.$ = [$$[$0]];
    break;
    case 61:$$[$0-1].push($$[$0]);
    break;
    case 62:this.$ = [$$[$0]];
    break;
    case 63:$$[$0-1].push($$[$0]);
    break;
    }
    },
    table: [{3:1,4:2,5:[2,42],6:3,13:[2,42],14:[2,42],17:[2,42],25:[2,42],28:[2,42],39:[2,42],40:[2,42],42:[2,42]},{1:[3]},{5:[1,4]},{5:[2,2],7:5,8:6,9:7,10:8,11:9,12:10,13:[1,11],14:[1,18],15:16,17:[1,21],20:14,23:15,25:[1,19],28:[1,20],31:[2,2],34:[2,2],37:[2,2],39:[1,12],40:[1,13],42:[1,17]},{1:[2,1]},{5:[2,43],13:[2,43],14:[2,43],17:[2,43],25:[2,43],28:[2,43],31:[2,43],34:[2,43],37:[2,43],39:[2,43],40:[2,43],42:[2,43]},{5:[2,3],13:[2,3],14:[2,3],17:[2,3],25:[2,3],28:[2,3],31:[2,3],34:[2,3],37:[2,3],39:[2,3],40:[2,3],42:[2,3]},{5:[2,4],13:[2,4],14:[2,4],17:[2,4],25:[2,4],28:[2,4],31:[2,4],34:[2,4],37:[2,4],39:[2,4],40:[2,4],42:[2,4]},{5:[2,5],13:[2,5],14:[2,5],17:[2,5],25:[2,5],28:[2,5],31:[2,5],34:[2,5],37:[2,5],39:[2,5],40:[2,5],42:[2,5]},{5:[2,6],13:[2,6],14:[2,6],17:[2,6],25:[2,6],28:[2,6],31:[2,6],34:[2,6],37:[2,6],39:[2,6],40:[2,6],42:[2,6]},{5:[2,7],13:[2,7],14:[2,7],17:[2,7],25:[2,7],28:[2,7],31:[2,7],34:[2,7],37:[2,7],39:[2,7],40:[2,7],42:[2,7]},{5:[2,8],13:[2,8],14:[2,8],17:[2,8],25:[2,8],28:[2,8],31:[2,8],34:[2,8],37:[2,8],39:[2,8],40:[2,8],42:[2,8]},{18:22,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{18:31,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{4:32,6:3,13:[2,42],14:[2,42],17:[2,42],25:[2,42],28:[2,42],31:[2,42],34:[2,42],37:[2,42],39:[2,42],40:[2,42],42:[2,42]},{4:33,6:3,13:[2,42],14:[2,42],17:[2,42],25:[2,42],28:[2,42],34:[2,42],37:[2,42],39:[2,42],40:[2,42],42:[2,42]},{12:34,14:[1,18]},{18:35,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{5:[2,9],13:[2,9],14:[2,9],16:[2,9],17:[2,9],25:[2,9],28:[2,9],31:[2,9],34:[2,9],37:[2,9],39:[2,9],40:[2,9],42:[2,9]},{18:36,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{18:37,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{18:38,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{27:[1,39]},{19:[2,56],27:[2,56],41:[2,56],44:40,48:[2,56],49:[2,56],50:[2,56],51:[2,56],52:[2,56],56:[2,56],59:[2,56],62:[2,56]},{19:[2,25],27:[2,25],41:[2,25],52:[2,25],59:[2,25]},{19:[2,35],27:[2,35],41:[2,35],48:[2,35],49:[2,35],50:[2,35],51:[2,35],52:[2,35],56:[2,35],59:[2,35],62:[2,35]},{19:[2,36],27:[2,36],41:[2,36],48:[2,36],49:[2,36],50:[2,36],51:[2,36],52:[2,36],56:[2,36],59:[2,36],62:[2,36]},{19:[2,37],27:[2,37],41:[2,37],48:[2,37],49:[2,37],50:[2,37],51:[2,37],52:[2,37],56:[2,37],59:[2,37],62:[2,37]},{56:[1,30],63:41},{19:[2,39],27:[2,39],41:[2,39],48:[2,39],49:[2,39],50:[2,39],51:[2,39],52:[2,39],56:[2,39],59:[2,39],62:[2,39],64:[1,42]},{19:[2,41],27:[2,41],41:[2,41],48:[2,41],49:[2,41],50:[2,41],51:[2,41],52:[2,41],56:[2,41],59:[2,41],62:[2,41],64:[2,41]},{41:[1,43]},{21:44,30:46,31:[1,48],33:47,34:[1,49],35:45,37:[2,44]},{24:50,33:51,34:[1,49],37:[2,46]},{16:[1,52]},{27:[1,53]},{26:54,27:[2,48],58:55,59:[1,56]},{27:[2,50],29:57,58:58,59:[1,56]},{19:[1,59]},{5:[2,21],13:[2,21],14:[2,21],17:[2,21],25:[2,21],28:[2,21],31:[2,21],34:[2,21],37:[2,21],39:[2,21],40:[2,21],42:[2,21]},{19:[2,58],27:[2,58],38:63,41:[2,58],45:60,46:67,47:61,48:[1,64],49:[1,65],50:[1,66],51:[1,68],52:[2,58],53:62,54:69,55:70,56:[1,71],59:[2,58],62:[1,28],63:29},{19:[2,38],27:[2,38],41:[2,38],48:[2,38],49:[2,38],50:[2,38],51:[2,38],52:[2,38],56:[2,38],59:[2,38],62:[2,38],64:[1,42]},{56:[1,72]},{5:[2,22],13:[2,22],14:[2,22],17:[2,22],25:[2,22],28:[2,22],31:[2,22],34:[2,22],37:[2,22],39:[2,22],40:[2,22],42:[2,22]},{22:73,37:[1,74]},{37:[2,45]},{4:75,6:3,13:[2,42],14:[2,42],17:[2,42],25:[2,42],28:[2,42],31:[2,42],34:[2,42],37:[2,42],39:[2,42],40:[2,42],42:[2,42]},{37:[2,19]},{18:76,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{4:77,6:3,13:[2,42],14:[2,42],17:[2,42],25:[2,42],28:[2,42],37:[2,42],39:[2,42],40:[2,42],42:[2,42]},{22:78,37:[1,74]},{37:[2,47]},{5:[2,10],13:[2,10],14:[2,10],17:[2,10],25:[2,10],28:[2,10],31:[2,10],34:[2,10],37:[2,10],39:[2,10],40:[2,10],42:[2,10]},{5:[2,23],13:[2,23],14:[2,23],17:[2,23],25:[2,23],28:[2,23],31:[2,23],34:[2,23],37:[2,23],39:[2,23],40:[2,23],42:[2,23]},{27:[1,79]},{27:[2,49]},{56:[1,81],60:80},{27:[1,82]},{27:[2,51]},{14:[2,11]},{19:[2,24],27:[2,24],41:[2,24],52:[2,24],59:[2,24]},{19:[2,57],27:[2,57],41:[2,57],48:[2,57],49:[2,57],50:[2,57],51:[2,57],52:[2,57],56:[2,57],59:[2,57],62:[2,57]},{19:[2,59],27:[2,59],41:[2,59],52:[2,59],59:[2,59]},{19:[2,26],27:[2,26],41:[2,26],48:[2,26],49:[2,26],50:[2,26],51:[2,26],52:[2,26],56:[2,26],59:[2,26],62:[2,26]},{19:[2,27],27:[2,27],41:[2,27],48:[2,27],49:[2,27],50:[2,27],51:[2,27],52:[2,27],56:[2,27],59:[2,27],62:[2,27]},{19:[2,28],27:[2,28],41:[2,28],48:[2,28],49:[2,28],50:[2,28],51:[2,28],52:[2,28],56:[2,28],59:[2,28],62:[2,28]},{19:[2,29],27:[2,29],41:[2,29],48:[2,29],49:[2,29],50:[2,29],51:[2,29],52:[2,29],56:[2,29],59:[2,29],62:[2,29]},{19:[2,30],27:[2,30],41:[2,30],48:[2,30],49:[2,30],50:[2,30],51:[2,30],52:[2,30],56:[2,30],59:[2,30],62:[2,30]},{18:83,38:25,43:23,46:24,48:[1,26],49:[1,27],56:[1,30],62:[1,28],63:29},{19:[2,32],27:[2,32],41:[2,32],52:[2,32],55:84,56:[1,85],59:[2,32]},{19:[2,60],27:[2,60],41:[2,60],52:[2,60],56:[2,60],59:[2,60]},{19:[2,41],27:[2,41],41:[2,41],48:[2,41],49:[2,41],50:[2,41],51:[2,41],52:[2,41],56:[2,41],57:[1,86],59:[2,41],62:[2,41],64:[2,41]},{19:[2,40],27:[2,40],41:[2,40],48:[2,40],49:[2,40],50:[2,40],51:[2,40],52:[2,40],56:[2,40],59:[2,40],62:[2,40],64:[2,40]},{5:[2,12],13:[2,12],14:[2,12],17:[2,12],25:[2,12],28:[2,12],31:[2,12],34:[2,12],37:[2,12],39:[2,12],40:[2,12],42:[2,12]},{38:87,56:[1,30],63:29},{30:46,31:[1,48],33:47,34:[1,49],35:89,36:88,37:[2,54]},{27:[2,52],32:90,58:91,59:[1,56]},{37:[2,17]},{5:[2,13],13:[2,13],14:[2,13],17:[2,13],25:[2,13],28:[2,13],31:[2,13],34:[2,13],37:[2,13],39:[2,13],40:[2,13],42:[2,13]},{13:[2,14],14:[2,14],17:[2,14],25:[2,14],28:[2,14],31:[2,14],34:[2,14],37:[2,14],39:[2,14],40:[2,14],42:[2,14]},{56:[1,93],61:[1,92]},{56:[2,62],61:[2,62]},{13:[2,15],14:[2,15],17:[2,15],25:[2,15],28:[2,15],34:[2,15],37:[2,15],39:[2,15],40:[2,15],42:[2,15]},{52:[1,94]},{19:[2,61],27:[2,61],41:[2,61],52:[2,61],56:[2,61],59:[2,61]},{57:[1,86]},{38:63,46:67,47:95,48:[1,64],49:[1,65],50:[1,66],51:[1,68],56:[1,30],62:[1,28],63:29},{27:[1,96]},{37:[2,18]},{37:[2,55]},{27:[1,97]},{27:[2,53]},{27:[2,34]},{56:[2,63],61:[2,63]},{19:[2,31],27:[2,31],41:[2,31],48:[2,31],49:[2,31],50:[2,31],51:[2,31],52:[2,31],56:[2,31],59:[2,31],62:[2,31]},{19:[2,33],27:[2,33],41:[2,33],52:[2,33],56:[2,33],59:[2,33]},{5:[2,20],13:[2,20],14:[2,20],17:[2,20],25:[2,20],28:[2,20],31:[2,20],34:[2,20],37:[2,20],39:[2,20],40:[2,20],42:[2,20]},{13:[2,16],14:[2,16],17:[2,16],25:[2,16],28:[2,16],31:[2,16],34:[2,16],37:[2,16],39:[2,16],40:[2,16],42:[2,16]}],
    defaultActions: {4:[2,1],45:[2,45],47:[2,19],51:[2,47],55:[2,49],58:[2,51],59:[2,11],77:[2,17],88:[2,18],89:[2,55],91:[2,53],92:[2,34]},
    parseError: function parseError(str, hash) {
        throw new Error(str);
    },
    parse: function parse(input) {
        var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
        this.lexer.setInput(input);
        this.lexer.yy = this.yy;
        this.yy.lexer = this.lexer;
        this.yy.parser = this;
        if (typeof this.lexer.yylloc == "undefined")
            this.lexer.yylloc = {};
        var yyloc = this.lexer.yylloc;
        lstack.push(yyloc);
        var ranges = this.lexer.options && this.lexer.options.ranges;
        if (typeof this.yy.parseError === "function")
            this.parseError = this.yy.parseError;
        function popStack(n) {
            stack.length = stack.length - 2 * n;
            vstack.length = vstack.length - n;
            lstack.length = lstack.length - n;
        }
        function lex() {
            var token;
            token = self.lexer.lex() || 1;
            if (typeof token !== "number") {
                token = self.symbols_[token] || token;
            }
            return token;
        }
        var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
        while (true) {
            state = stack[stack.length - 1];
            if (this.defaultActions[state]) {
                action = this.defaultActions[state];
            } else {
                if (symbol === null || typeof symbol == "undefined") {
                    symbol = lex();
                }
                action = table[state] && table[state][symbol];
            }
            if (typeof action === "undefined" || !action.length || !action[0]) {
                var errStr = "";
                if (!recovering) {
                    expected = [];
                    for (p in table[state])
                        if (this.terminals_[p] && p > 2) {
                            expected.push("'" + this.terminals_[p] + "'");
                        }
                    if (this.lexer.showPosition) {
                        errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                    } else {
                        errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                    }
                    this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
                }
            }
            if (action[0] instanceof Array && action.length > 1) {
                throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
            }
            switch (action[0]) {
            case 1:
                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]);
                symbol = null;
                if (!preErrorSymbol) {
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else {
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;
            case 2:
                len = this.productions_[action[1]][1];
                yyval.$ = vstack[vstack.length - len];
                yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
                if (ranges) {
                    yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                }
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                if (typeof r !== "undefined") {
                    return r;
                }
                if (len) {
                    stack = stack.slice(0, -1 * len * 2);
                    vstack = vstack.slice(0, -1 * len);
                    lstack = lstack.slice(0, -1 * len);
                }
                stack.push(this.productions_[action[1]][0]);
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                stack.push(newState);
                break;
            case 3:
                return true;
            }
        }
        return true;
    }
    };
    /* Jison generated lexer */
    var lexer = (function(){
    var lexer = ({EOF:1,
    parseError:function parseError(str, hash) {
            if (this.yy.parser) {
                this.yy.parser.parseError(str, hash);
            } else {
                throw new Error(str);
            }
        },
    setInput:function (input) {
            this._input = input;
            this._more = this._less = this.done = false;
            this.yylineno = this.yyleng = 0;
            this.yytext = this.matched = this.match = '';
            this.conditionStack = ['INITIAL'];
            this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
            if (this.options.ranges) this.yylloc.range = [0,0];
            this.offset = 0;
            return this;
        },
    input:function () {
            var ch = this._input[0];
            this.yytext += ch;
            this.yyleng++;
            this.offset++;
            this.match += ch;
            this.matched += ch;
            var lines = ch.match(/(?:\r\n?|\n).*/g);
            if (lines) {
                this.yylineno++;
                this.yylloc.last_line++;
            } else {
                this.yylloc.last_column++;
            }
            if (this.options.ranges) this.yylloc.range[1]++;

            this._input = this._input.slice(1);
            return ch;
        },
    unput:function (ch) {
            var len = ch.length;
            var lines = ch.split(/(?:\r\n?|\n)/g);

            this._input = ch + this._input;
            this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
            //this.yyleng -= len;
            this.offset -= len;
            var oldLines = this.match.split(/(?:\r\n?|\n)/g);
            this.match = this.match.substr(0, this.match.length-1);
            this.matched = this.matched.substr(0, this.matched.length-1);

            if (lines.length-1) this.yylineno -= lines.length-1;
            var r = this.yylloc.range;

            this.yylloc = {first_line: this.yylloc.first_line,
              last_line: this.yylineno+1,
              first_column: this.yylloc.first_column,
              last_column: lines ?
                  (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
                  this.yylloc.first_column - len
              };

            if (this.options.ranges) {
                this.yylloc.range = [r[0], r[0] + this.yyleng - len];
            }
            return this;
        },
    more:function () {
            this._more = true;
            return this;
        },
    less:function (n) {
            this.unput(this.match.slice(n));
        },
    pastInput:function () {
            var past = this.matched.substr(0, this.matched.length - this.match.length);
            return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
        },
    upcomingInput:function () {
            var next = this.match;
            if (next.length < 20) {
                next += this._input.substr(0, 20-next.length);
            }
            return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
        },
    showPosition:function () {
            var pre = this.pastInput();
            var c = new Array(pre.length + 1).join("-");
            return pre + this.upcomingInput() + "\n" + c+"^";
        },
    next:function () {
            if (this.done) {
                return this.EOF;
            }
            if (!this._input) this.done = true;

            var token,
                match,
                tempMatch,
                index,
                col,
                lines;
            if (!this._more) {
                this.yytext = '';
                this.match = '';
            }
            var rules = this._currentRules();
            for (var i=0;i < rules.length; i++) {
                tempMatch = this._input.match(this.rules[rules[i]]);
                if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                    match = tempMatch;
                    index = i;
                    if (!this.options.flex) break;
                }
            }
            if (match) {
                lines = match[0].match(/(?:\r\n?|\n).*/g);
                if (lines) this.yylineno += lines.length;
                this.yylloc = {first_line: this.yylloc.last_line,
                               last_line: this.yylineno+1,
                               first_column: this.yylloc.last_column,
                               last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                if (this.options.ranges) {
                    this.yylloc.range = [this.offset, this.offset += this.yyleng];
                }
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
                if (this.done && this._input) this.done = false;
                if (token) return token;
                else return;
            }
            if (this._input === "") {
                return this.EOF;
            } else {
                return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                        {text: "", token: null, line: this.yylineno});
            }
        },
    lex:function lex() {
            var r = this.next();
            if (typeof r !== 'undefined') {
                return r;
            } else {
                return this.lex();
            }
        },
    begin:function begin(condition) {
            this.conditionStack.push(condition);
        },
    popState:function popState() {
            return this.conditionStack.pop();
        },
    _currentRules:function _currentRules() {
            return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
        },
    topState:function () {
            return this.conditionStack[this.conditionStack.length-2];
        },
    pushState:function begin(condition) {
            this.begin(condition);
        }});
    lexer.options = {};
    lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {


    function strip(start, end) {
      return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng-end);
    }


    var YYSTATE=YY_START
    switch($avoiding_name_collisions) {
    case 0:
                                       if(yy_.yytext.slice(-2) === "\\\\") {
                                         strip(0,1);
                                         this.begin("mu");
                                       } else if(yy_.yytext.slice(-1) === "\\") {
                                         strip(0,1);
                                         this.begin("emu");
                                       } else {
                                         this.begin("mu");
                                       }
                                       if(yy_.yytext) return 14;
                                     
    break;
    case 1:return 14;
    break;
    case 2:
                                       this.popState();
                                       return 14;
                                     
    break;
    case 3:
                                      yy_.yytext = yy_.yytext.substr(5, yy_.yyleng-9);
                                      this.popState();
                                      return 16;
                                     
    break;
    case 4: return 14; 
    break;
    case 5:
      this.popState();
      return 13;

    break;
    case 6:return 51;
    break;
    case 7:return 52;
    break;
    case 8: return 17; 
    break;
    case 9:
                                      this.popState();
                                      this.begin('raw');
                                      return 19;
                                     
    break;
    case 10:return 42;
    break;
    case 11:return 25;
    break;
    case 12:return 37;
    break;
    case 13:this.popState(); return 34;
    break;
    case 14:this.popState(); return 34;
    break;
    case 15:return 28;
    break;
    case 16:return 31;
    break;
    case 17:return 40;
    break;
    case 18:return 39;
    break;
    case 19:
      this.unput(yy_.yytext);
      this.popState();
      this.begin('com');

    break;
    case 20:
      this.popState();
      return 13;

    break;
    case 21:return 39;
    break;
    case 22:return 57;
    break;
    case 23:return 56;
    break;
    case 24:return 56;
    break;
    case 25:return 64;
    break;
    case 26:// ignore whitespace
    break;
    case 27:this.popState(); return 41;
    break;
    case 28:this.popState(); return 27;
    break;
    case 29:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 48;
    break;
    case 30:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 48;
    break;
    case 31:return 62;
    break;
    case 32:return 50;
    break;
    case 33:return 50;
    break;
    case 34:return 49;
    break;
    case 35:return 59;
    break;
    case 36:return 61;
    break;
    case 37:return 56;
    break;
    case 38:yy_.yytext = strip(1,2); return 56;
    break;
    case 39:return 'INVALID';
    break;
    case 40:return 5;
    break;
    }
    };
    lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/,/^(?:[^\x00]*?(?=(\{\{\{\{\/)))/,/^(?:[\s\S]*?--(~)?\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{\{\{)/,/^(?:\}\}\}\})/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^\s*(~)?\}\})/,/^(?:\{\{(~)?\s*else\s*(~)?\}\})/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{(~)?!--)/,/^(?:\{\{(~)?![\s\S]*?\}\})/,/^(?:\{\{(~)?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)|])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/,/^(?:as\s+\|)/,/^(?:\|)/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/,/^(?:\[[^\]]*\])/,/^(?:.)/,/^(?:$)/];
    lexer.conditions = {"mu":{"rules":[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[5],"inclusive":false},"raw":{"rules":[3,4],"inclusive":false},"INITIAL":{"rules":[0,1,40],"inclusive":true}};
    return lexer;})()
    parser.lexer = lexer;
    function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
    return new Parser;
    })();__exports__["default"] = handlebars;
    /* jshint ignore:end */
  });
enifed("htmlbars-syntax/handlebars/compiler/visitor",
  ["exports"],
  function(__exports__) {
    "use strict";
    function Visitor() {}

    Visitor.prototype = {
      constructor: Visitor,

      accept: function(object) {
        return object && this[object.type](object);
      },

      Program: function(program) {
        var body = program.body,
            i, l;

        for(i=0, l=body.length; i<l; i++) {
          this.accept(body[i]);
        }
      },

      MustacheStatement: function(mustache) {
        this.accept(mustache.sexpr);
      },

      BlockStatement: function(block) {
        this.accept(block.sexpr);
        this.accept(block.program);
        this.accept(block.inverse);
      },

      PartialStatement: function(partial) {
        this.accept(partial.partialName);
        this.accept(partial.context);
        this.accept(partial.hash);
      },

      ContentStatement: function(content) {},
      CommentStatement: function(comment) {},

      SubExpression: function(sexpr) {
        var params = sexpr.params, paramStrings = [], hash;

        this.accept(sexpr.path);
        for(var i=0, l=params.length; i<l; i++) {
          this.accept(params[i]);
        }
        this.accept(sexpr.hash);
      },

      PathExpression: function(path) {},

      StringLiteral: function(string) {},
      NumberLiteral: function(number) {},
      BooleanLiteral: function(bool) {},

      Hash: function(hash) {
        var pairs = hash.pairs;

        for(var i=0, l=pairs.length; i<l; i++) {
          this.accept(pairs[i]);
        }
      },
      HashPair: function(pair) {
        this.accept(pair.value);
      }
    };

    __exports__["default"] = Visitor;
  });
enifed("htmlbars-syntax/handlebars/compiler/whitespace-control",
  ["./visitor","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Visitor = __dependency1__["default"];

    function WhitespaceControl() {
    }
    WhitespaceControl.prototype = new Visitor();

    WhitespaceControl.prototype.Program = function(program) {
      var isRoot = !this.isRootSeen;
      this.isRootSeen = true;

      var body = program.body;
      for (var i = 0, l = body.length; i < l; i++) {
        var current = body[i],
            strip = this.accept(current);

        if (!strip) {
          continue;
        }

        var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot),
            _isNextWhitespace = isNextWhitespace(body, i, isRoot),

            openStandalone = strip.openStandalone && _isPrevWhitespace,
            closeStandalone = strip.closeStandalone && _isNextWhitespace,
            inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;

        if (strip.close) {
          omitRight(body, i, true);
        }
        if (strip.open) {
          omitLeft(body, i, true);
        }

        if (inlineStandalone) {
          omitRight(body, i);

          if (omitLeft(body, i)) {
            // If we are on a standalone node, save the indent info for partials
            if (current.type === 'PartialStatement') {
              // Pull out the whitespace from the final line
              current.indent = (/([ \t]+$)/).exec(body[i-1].original)[1];
            }
          }
        }
        if (openStandalone) {
          omitRight((current.program || current.inverse).body);

          // Strip out the previous content node if it's whitespace only
          omitLeft(body, i);
        }
        if (closeStandalone) {
          // Always strip the next node
          omitRight(body, i);

          omitLeft((current.inverse || current.program).body);
        }
      }

      return program;
    };
    WhitespaceControl.prototype.BlockStatement = function(block) {
      this.accept(block.program);
      this.accept(block.inverse);

      // Find the inverse program that is involed with whitespace stripping.
      var program = block.program || block.inverse,
          inverse = block.program && block.inverse,
          firstInverse = inverse,
          lastInverse = inverse;

      if (inverse && inverse.chained) {
        firstInverse = inverse.body[0].program;

        // Walk the inverse chain to find the last inverse that is actually in the chain.
        while (lastInverse.chained) {
          lastInverse = lastInverse.body[lastInverse.body.length-1].program;
        }
      }

      var strip = {
        open: block.openStrip.open,
        close: block.closeStrip.close,

        // Determine the standalone candiacy. Basically flag our content as being possibly standalone
        // so our parent can determine if we actually are standalone
        openStandalone: isNextWhitespace(program.body),
        closeStandalone: isPrevWhitespace((firstInverse || program).body)
      };

      if (block.openStrip.close) {
        omitRight(program.body, null, true);
      }

      if (inverse) {
        var inverseStrip = block.inverseStrip;

        if (inverseStrip.open) {
          omitLeft(program.body, null, true);
        }

        if (inverseStrip.close) {
          omitRight(firstInverse.body, null, true);
        }
        if (block.closeStrip.open) {
          omitLeft(lastInverse.body, null, true);
        }

        // Find standalone else statments
        if (isPrevWhitespace(program.body)
            && isNextWhitespace(firstInverse.body)) {

          omitLeft(program.body);
          omitRight(firstInverse.body);
        }
      } else {
        if (block.closeStrip.open) {
          omitLeft(program.body, null, true);
        }
      }

      return strip;
    };

    WhitespaceControl.prototype.MustacheStatement = function(mustache) {
      return mustache.strip;
    };

    WhitespaceControl.prototype.PartialStatement = 
        WhitespaceControl.prototype.CommentStatement = function(node) {
      var strip = node.strip || {};
      return {
        inlineStandalone: true,
        open: strip.open,
        close: strip.close
      };
    };


    function isPrevWhitespace(body, i, isRoot) {
      if (i === undefined) {
        i = body.length;
      }

      // Nodes that end with newlines are considered whitespace (but are special
      // cased for strip operations)
      var prev = body[i-1],
          sibling = body[i-2];
      if (!prev) {
        return isRoot;
      }

      if (prev.type === 'ContentStatement') {
        return (sibling || !isRoot ? (/\r?\n\s*?$/) : (/(^|\r?\n)\s*?$/)).test(prev.original);
      }
    }
    function isNextWhitespace(body, i, isRoot) {
      if (i === undefined) {
        i = -1;
      }

      var next = body[i+1],
          sibling = body[i+2];
      if (!next) {
        return isRoot;
      }

      if (next.type === 'ContentStatement') {
        return (sibling || !isRoot ? (/^\s*?\r?\n/) : (/^\s*?(\r?\n|$)/)).test(next.original);
      }
    }

    // Marks the node to the right of the position as omitted.
    // I.e. {{foo}}' ' will mark the ' ' node as omitted.
    //
    // If i is undefined, then the first child will be marked as such.
    //
    // If mulitple is truthy then all whitespace will be stripped out until non-whitespace
    // content is met.
    function omitRight(body, i, multiple) {
      var current = body[i == null ? 0 : i + 1];
      if (!current || current.type !== 'ContentStatement' || (!multiple && current.rightStripped)) {
        return;
      }

      var original = current.value;
      current.value = current.value.replace(multiple ? (/^\s+/) : (/^[ \t]*\r?\n?/), '');
      current.rightStripped = current.value !== original;
    }

    // Marks the node to the left of the position as omitted.
    // I.e. ' '{{foo}} will mark the ' ' node as omitted.
    //
    // If i is undefined then the last child will be marked as such.
    //
    // If mulitple is truthy then all whitespace will be stripped out until non-whitespace
    // content is met.
    function omitLeft(body, i, multiple) {
      var current = body[i == null ? body.length - 1 : i - 1];
      if (!current || current.type !== 'ContentStatement' || (!multiple && current.leftStripped)) {
        return;
      }

      // We omit the last node if it's whitespace only and not preceeded by a non-content node.
      var original = current.value;
      current.value = current.value.replace(multiple ? (/\s+$/) : (/[ \t]+$/), '');
      current.leftStripped = current.value !== original;
      return current.leftStripped;
    }

    __exports__["default"] = WhitespaceControl;
  });
enifed("htmlbars-syntax/handlebars/exception",
  ["exports"],
  function(__exports__) {
    "use strict";

    var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

    function Exception(message, node) {
      var loc = node && node.loc,
          line,
          column;
      if (loc) {
        line = loc.start.line;
        column = loc.start.column;

        message += ' - ' + line + ':' + column;
      }

      var tmp = Error.prototype.constructor.call(this, message);

      // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
      for (var idx = 0; idx < errorProps.length; idx++) {
        this[errorProps[idx]] = tmp[errorProps[idx]];
      }

      if (loc) {
        this.lineNumber = line;
        this.column = column;
      }
    }

    Exception.prototype = new Error();

    __exports__["default"] = Exception;
  });
enifed("htmlbars-syntax/handlebars/safe-string",
  ["exports"],
  function(__exports__) {
    "use strict";
    // Build out our basic SafeString type
    function SafeString(string) {
      this.string = string;
    }

    SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
      return "" + this.string;
    };

    __exports__["default"] = SafeString;
  });
enifed("htmlbars-syntax/handlebars/utils",
  ["./safe-string","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*jshint -W004 */
    var SafeString = __dependency1__["default"];

    var escape = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;"
    };

    var badChars = /[&<>"'`]/g;
    var possible = /[&<>"'`]/;

    function escapeChar(chr) {
      return escape[chr];
    }

    function extend(obj /* , ...source */) {
      for (var i = 1; i < arguments.length; i++) {
        for (var key in arguments[i]) {
          if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
            obj[key] = arguments[i][key];
          }
        }
      }

      return obj;
    }

    __exports__.extend = extend;var toString = Object.prototype.toString;
    __exports__.toString = toString;
    // Sourced from lodash
    // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
    var isFunction = function(value) {
      return typeof value === 'function';
    };
    // fallback for older versions of Chrome and Safari
    /* istanbul ignore next */
    if (isFunction(/x/)) {
      isFunction = function(value) {
        return typeof value === 'function' && toString.call(value) === '[object Function]';
      };
    }
    var isFunction;
    __exports__.isFunction = isFunction;
    /* istanbul ignore next */
    var isArray = Array.isArray || function(value) {
      return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
    };
    __exports__.isArray = isArray;

    function escapeExpression(string) {
      // don't escape SafeStrings, since they're already safe
      if (string && string.toHTML) {
        return string.toHTML();
      } else if (string == null) {
        return "";
      } else if (!string) {
        return string + '';
      }

      // Force a string conversion as this will be done by the append regardless and
      // the regex test will do this transparently behind the scenes, causing issues if
      // an object's to string has escaped characters in it.
      string = "" + string;

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    }

    __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
      if (!value && value !== 0) {
        return true;
      } else if (isArray(value) && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }

    __exports__.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
      return (contextPath ? contextPath + '.' : '') + id;
    }

    __exports__.appendContextPath = appendContextPath;
  });
enifed("htmlbars-syntax/node-handlers",
  ["./builders","../htmlbars-util/array-utils","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var buildProgram = __dependency1__.buildProgram;
    var buildBlock = __dependency1__.buildBlock;
    var buildHash = __dependency1__.buildHash;
    var forEach = __dependency2__.forEach;
    var appendChild = __dependency3__.appendChild;

    var nodeHandlers = {

      Program: function(program) {
        var body = [];
        var node = buildProgram(body, program.blockParams);
        var i, l = program.body.length;

        this.elementStack.push(node);

        if (l === 0) { return this.elementStack.pop(); }

        for (i = 0; i < l; i++) {
          this.acceptNode(program.body[i]);
        }

        this.acceptToken(this.tokenizer.tokenizeEOF());

        // Ensure that that the element stack is balanced properly.
        var poppedNode = this.elementStack.pop();
        if (poppedNode !== node) {
          throw new Error("Unclosed element `" + poppedNode.tag + "` (on line " + poppedNode.loc.start.line + ").");
        }

        return node;
      },

      BlockStatement: function(block) {
        delete block.inverseStrip;
        delete block.openString;
        delete block.closeStrip;

        if (this.tokenizer.state === 'comment') {
          this.tokenizer.addChar('{{' + this.sourceForMustache(block) + '}}');
          return;
        }

        switchToHandlebars(this);
        this.acceptToken(block);

        var sexpr = this.acceptNode(block.sexpr);
        var program = block.program ? this.acceptNode(block.program) : null;
        var inverse = block.inverse ? this.acceptNode(block.inverse) : null;

        var node = buildBlock(sexpr, program, inverse);
        var parentProgram = this.currentElement();
        appendChild(parentProgram, node);
      },

      MustacheStatement: function(mustache) {
        delete mustache.strip;

        if (this.tokenizer.state === 'comment') {
          this.tokenizer.addChar('{{' + this.sourceForMustache(mustache) + '}}');
          return;
        }

        this.acceptNode(mustache.sexpr);
        switchToHandlebars(this);
        this.acceptToken(mustache);

        return mustache;
      },

      ContentStatement: function(content) {
        var changeLines = 0;
        if (content.rightStripped) {
          changeLines = leadingNewlineDifference(content.original, content.value);
        }

        this.tokenizer.line = this.tokenizer.line + changeLines;

        var tokens = this.tokenizer.tokenizePart(content.value);

        return forEach(tokens, this.acceptToken, this);
      },

      CommentStatement: function(comment) {
        return comment;
      },

      PartialStatement: function(partial) {
        appendChild(this.currentElement(), partial);
        return partial;
      },

      SubExpression: function(sexpr) {
        delete sexpr.isHelper;

        this.acceptNode(sexpr.path);

        if (sexpr.params) {
          for (var i = 0; i < sexpr.params.length; i++) {
            this.acceptNode(sexpr.params[i]);
          }
        } else {
          sexpr.params = [];
        }

        if (sexpr.hash) {
          this.acceptNode(sexpr.hash);
        } else {
          sexpr.hash = buildHash();
        }

        return sexpr;
      },

      PathExpression: function(path) {
        delete path.data;
        delete path.depth;

        return path;
      },

      Hash: function(hash) {
        for (var i = 0; i < hash.pairs.length; i++) {
          this.acceptNode(hash.pairs[i].value);
        }

        return hash;
      },

      StringLiteral: function() {},
      BooleanLiteral: function() {},
      NumberLiteral: function() {}
    };

    function switchToHandlebars(processor) {
      var token = processor.tokenizer.token;

      if (token && token.type === 'Chars') {
        processor.acceptToken(token);
        processor.tokenizer.token = null;
      }
    }

    function leadingNewlineDifference(original, value) {
      if (value === '') {
        // if it is empty, just return the count of newlines
        // in original
        return original.split("\n").length - 1;
      }

      // otherwise, return the number of newlines prior to
      // `value`
      var difference = original.split(value)[0];
      var lines = difference.split(/\n/);

      return lines.length - 1;
    }

    __exports__["default"] = nodeHandlers;
  });
enifed("htmlbars-syntax/parser",
  ["./handlebars/compiler/base","./tokenizer","../simple-html-tokenizer/entity-parser","../simple-html-tokenizer/char-refs/full","./node-handlers","./token-handlers","../htmlbars-syntax","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var parse = __dependency1__.parse;
    var Tokenizer = __dependency2__.Tokenizer;
    var EntityParser = __dependency3__["default"];
    var fullCharRefs = __dependency4__["default"];
    var nodeHandlers = __dependency5__["default"];
    var tokenHandlers = __dependency6__["default"];

    // this should be:
    // `import * from "../htmlbars-syntax";
    //
    // But this version of the transpiler does not support it properly
    var syntax = __dependency7__;

    var splitLines;
    // IE8 throws away blank pieces when splitting strings with a regex
    // So we split using a string instead as appropriate
    if ("foo\n\nbar".split(/\n/).length === 2) {
      splitLines = function(str) {
         var clean = str.replace(/\r\n?/g, '\n');
         return clean.split('\n');
      };
    } else {
      splitLines = function(str) {
        return str.split(/(?:\r\n?|\n)/g);
      };
    }

    function preprocess(html, options) {
      var ast = (typeof html === 'object') ? html : parse(html);
      var combined = new HTMLProcessor(html, options).acceptNode(ast);

      if (options && options.plugins && options.plugins.ast) {
        for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
          var plugin = new options.plugins.ast[i]();

          plugin.syntax = syntax;

          combined = plugin.transform(combined);
        }
      }

      return combined;
    }

    __exports__.preprocess = preprocess;function HTMLProcessor(source, options) {
      this.options = options || {};
      this.elementStack = [];
      this.tokenizer = new Tokenizer('', new EntityParser(fullCharRefs));
      this.nodeHandlers = nodeHandlers;
      this.tokenHandlers = tokenHandlers;

      if (typeof source === 'string') {
        this.source = splitLines(source);
      }
    }

    HTMLProcessor.prototype.acceptNode = function(node) {
      return this.nodeHandlers[node.type].call(this, node);
    };

    HTMLProcessor.prototype.acceptToken = function(token) {
      if (token) {
        return this.tokenHandlers[token.type].call(this, token);
      }
    };

    HTMLProcessor.prototype.currentElement = function() {
      return this.elementStack[this.elementStack.length - 1];
    };

    HTMLProcessor.prototype.sourceForMustache = function(mustache) {
      var firstLine = mustache.loc.start.line - 1;
      var lastLine = mustache.loc.end.line - 1;
      var currentLine = firstLine - 1;
      var firstColumn = mustache.loc.start.column + 2;
      var lastColumn = mustache.loc.end.column - 2;
      var string = [];
      var line;

      if (!this.source) {
        return '{{' + mustache.path.id.original + '}}';
      }

      while (currentLine < lastLine) {
        currentLine++;
        line = this.source[currentLine];

        if (currentLine === firstLine) {
          if (firstLine === lastLine) {
            string.push(line.slice(firstColumn, lastColumn));
          } else {
            string.push(line.slice(firstColumn));
          }
        } else if (currentLine === lastLine) {
          string.push(line.slice(0, lastColumn));
        } else {
          string.push(line);
        }
      }

      return string.join('\n');
    };
  });
enifed("htmlbars-syntax/token-handlers",
  ["../htmlbars-util/array-utils","./builders","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var forEach = __dependency1__.forEach;
    var buildProgram = __dependency2__.buildProgram;
    var buildComponent = __dependency2__.buildComponent;
    var buildElement = __dependency2__.buildElement;
    var buildComment = __dependency2__.buildComment;
    var buildText = __dependency2__.buildText;
    var appendChild = __dependency3__.appendChild;
    var parseComponentBlockParams = __dependency3__.parseComponentBlockParams;

    // The HTML elements in this list are speced by
    // http://www.w3.org/TR/html-markup/syntax.html#syntax-elements,
    // and will be forced to close regardless of if they have a
    // self-closing /> at the end.
    var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
    var voidMap = {};

    forEach(voidTagNames.split(" "), function(tagName) {
      voidMap[tagName] = true;
    });

    // Except for `mustache`, all tokens are only allowed outside of
    // a start or end tag.
    var tokenHandlers = {
      Comment: function(token) {
        var current = this.currentElement();
        var comment = buildComment(token.chars);
        appendChild(current, comment);
      },

      Chars: function(token) {
        var current = this.currentElement();
        var text = buildText(token.chars);
        appendChild(current, text);
      },

      StartTag: function(tag) {
        var element = buildElement(tag.tagName, tag.attributes, tag.modifiers || [], []);
        element.loc = {
          start: { line: tag.firstLine, column: tag.firstColumn},
          end: { line: null, column: null}
        };

        this.elementStack.push(element);
        if (voidMap.hasOwnProperty(tag.tagName) || tag.selfClosing) {
          tokenHandlers.EndTag.call(this, tag);
        }
      },

      BlockStatement: function(/*block*/) {
        if (this.tokenizer.state === 'comment') {
          return;
        } else if (this.tokenizer.state !== 'data') {
          throw new Error("A block may only be used inside an HTML element or another block.");
        }
      },

      MustacheStatement: function(mustache) {
        var tokenizer = this.tokenizer;

        switch(tokenizer.state) {
          // Tag helpers
          case "tagName":
            tokenizer.addElementModifier(mustache);
            tokenizer.state = "beforeAttributeName";
            return;
          case "beforeAttributeName":
            tokenizer.addElementModifier(mustache);
            return;
          case "attributeName":
          case "afterAttributeName":
            tokenizer.finalizeAttributeValue();
            tokenizer.addElementModifier(mustache);
            tokenizer.state = "beforeAttributeName";
            return;
          case "afterAttributeValueQuoted":
            tokenizer.addElementModifier(mustache);
            tokenizer.state = "beforeAttributeName";
            return;

          // Attribute values
          case "beforeAttributeValue":
            tokenizer.markAttributeQuoted(false);
            tokenizer.addToAttributeValue(mustache);
            tokenizer.state = 'attributeValueUnquoted';
            return;
          case "attributeValueDoubleQuoted":
          case "attributeValueSingleQuoted":
          case "attributeValueUnquoted":
            tokenizer.addToAttributeValue(mustache);
            return;

          // TODO: Only append child when the tokenizer state makes
          // sense to do so, otherwise throw an error.
          default:
            appendChild(this.currentElement(), mustache);
        }
      },

      EndTag: function(tag) {
        var element = this.elementStack.pop();
        var parent = this.currentElement();
        var disableComponentGeneration = this.options.disableComponentGeneration === true;

        validateEndTag(tag, element);

        if (disableComponentGeneration || element.tag.indexOf("-") === -1) {
          appendChild(parent, element);
        } else {
          var program = buildProgram(element.children);
          parseComponentBlockParams(element, program);
          var component = buildComponent(element.tag, element.attributes, program);
          appendChild(parent, component);
        }

      }

    };

    function validateEndTag(tag, element) {
      var error;

      if (voidMap[tag.tagName] && element.tag === undefined) {
        // For void elements, we check element.tag is undefined because endTag is called by the startTag token handler in
        // the normal case, so checking only voidMap[tag.tagName] would lead to an error being thrown on the opening tag.
        error = "Invalid end tag " + formatEndTagInfo(tag) + " (void elements cannot have end tags).";
      } else if (element.tag === undefined) {
        error = "Closing tag " + formatEndTagInfo(tag) + " without an open tag.";
      } else if (element.tag !== tag.tagName) {
        error = "Closing tag " + formatEndTagInfo(tag) + " did not match last open tag `" + element.tag + "` (on line " +
                element.loc.start.line + ").";
      }

      if (error) { throw new Error(error); }
    }

    function formatEndTagInfo(tag) {
      return "`" + tag.tagName + "` (on line " + tag.lastLine + ")";
    }

    __exports__["default"] = tokenHandlers;
  });
enifed("htmlbars-syntax/tokenizer",
  ["../simple-html-tokenizer","./utils","../htmlbars-util/array-utils","./builders","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Tokenizer = __dependency1__.Tokenizer;
    var isHelper = __dependency2__.isHelper;
    var map = __dependency3__.map;
    var builders = __dependency4__["default"];

    Tokenizer.prototype.createAttribute = function(char) {
      if (this.token.type === 'EndTag') {
        throw new Error('Invalid end tag: closing tag must not have attributes, in ' + formatTokenInfo(this) + '.');
      }
      this.currentAttribute = builders.attr(char.toLowerCase(), [], null);
      this.token.attributes.push(this.currentAttribute);
      this.state = 'attributeName';
    };

    Tokenizer.prototype.markAttributeQuoted = function(value) {
      this.currentAttribute.quoted = value;
    };

    Tokenizer.prototype.addToAttributeName = function(char) {
      this.currentAttribute.name += char;
    };

    Tokenizer.prototype.addToAttributeValue = function(char) {
      var value = this.currentAttribute.value;

      if (!this.currentAttribute.quoted && char === '/') {
        throw new Error("A space is required between an unquoted attribute value and `/`, in " + formatTokenInfo(this) +
                        '.');
      }
      if (!this.currentAttribute.quoted && value.length > 0 &&
          (char.type === 'MustacheStatement' || value[0].type === 'MustacheStatement')) {
        throw new Error("Unquoted attribute value must be a single string or mustache (on line " + this.line + ")");
      }

      if (typeof char === 'object') {
        if (char.type === 'MustacheStatement') {
          value.push(char);
        } else {
          throw new Error("Unsupported node in attribute value: " + char.type);
        }
      } else {
        if (value.length > 0 && value[value.length - 1].type === 'TextNode') {
          value[value.length - 1].chars += char;
        } else {
          value.push(builders.text(char));
        }
      }
    };

    Tokenizer.prototype.finalizeAttributeValue = function() {
      if (this.currentAttribute) {
        this.currentAttribute.value = prepareAttributeValue(this.currentAttribute);
        delete this.currentAttribute.quoted;
        delete this.currentAttribute;
      }
    };

    Tokenizer.prototype.addElementModifier = function(mustache) {
      if (!this.token.modifiers) {
        this.token.modifiers = [];
      }

      var modifier = builders.elementModifier(mustache.sexpr);
      this.token.modifiers.push(modifier);
    };

    function prepareAttributeValue(attr) {
      var parts = attr.value;
      var length = parts.length;

      if (length === 0) {
        return builders.text('');
      } else if (length === 1 && parts[0].type === "TextNode") {
        return parts[0];
      } else if (!attr.quoted) {
        return parts[0];
      } else {
        return builders.concat(map(parts, prepareConcatPart));
      }
    }

    function prepareConcatPart(node) {
      switch (node.type) {
        case 'TextNode': return builders.string(node.chars);
        case 'MustacheStatement': return unwrapMustache(node);
        default:
          throw new Error("Unsupported node in quoted attribute value: " + node.type);
      }
    }

    function formatTokenInfo(tokenizer) {
      return '`' + tokenizer.token.tagName + '` (on line ' + tokenizer.line + ')';
    }

    function unwrapMustache(mustache) {
      if (isHelper(mustache.sexpr)) {
        return mustache.sexpr;
      } else {
        return mustache.sexpr.path;
      }
    }

    __exports__.unwrapMustache = unwrapMustache;__exports__.Tokenizer = Tokenizer;
  });
enifed("htmlbars-syntax/utils",
  ["../htmlbars-util/array-utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var indexOfArray = __dependency1__.indexOfArray;
    // Regex to validate the identifier for block parameters. 
    // Based on the ID validation regex in Handlebars.

    var ID_INVERSE_PATTERN = /[!"#%-,\.\/;->@\[-\^`\{-~]/;

    // Checks the component's attributes to see if it uses block params.
    // If it does, registers the block params with the program and
    // removes the corresponding attributes from the element.

    function parseComponentBlockParams(element, program) {
      var l = element.attributes.length;
      var attrNames = [];

      for (var i = 0; i < l; i++) {
        attrNames.push(element.attributes[i].name);
      }

      var asIndex = indexOfArray(attrNames, 'as');

      if (asIndex !== -1 && l > asIndex && attrNames[asIndex + 1].charAt(0) === '|') {
        // Some basic validation, since we're doing the parsing ourselves
        var paramsString = attrNames.slice(asIndex).join(' ');
        if (paramsString.charAt(paramsString.length - 1) !== '|' || paramsString.match(/\|/g).length !== 2) {
          throw new Error('Invalid block parameters syntax: \'' + paramsString + '\'');
        }

        var params = [];
        for (i = asIndex + 1; i < l; i++) {
          var param = attrNames[i].replace(/\|/g, '');
          if (param !== '') {
            if (ID_INVERSE_PATTERN.test(param)) {
              throw new Error('Invalid identifier for block parameters: \'' + param + '\' in \'' + paramsString + '\'');
            }
            params.push(param);
          }
        }

        if (params.length === 0) {
          throw new Error('Cannot use zero block parameters: \'' + paramsString + '\'');
        }

        element.attributes = element.attributes.slice(0, asIndex);
        program.blockParams = params;
      }
    }

    __exports__.parseComponentBlockParams = parseComponentBlockParams;function childrenFor(node) {
      if (node.type === 'Program') {
        return node.body;
      }
      if (node.type === 'ElementNode') {
        return node.children;
      }
    }

    __exports__.childrenFor = childrenFor;function appendChild(parent, node) {
      childrenFor(parent).push(node);
    }

    __exports__.appendChild = appendChild;function isHelper(sexpr) {
      return (sexpr.params && sexpr.params.length > 0) ||
        (sexpr.hash && sexpr.hash.pairs.length > 0);
    }

    __exports__.isHelper = isHelper;
  });
enifed("htmlbars-syntax/walker",
  ["exports"],
  function(__exports__) {
    "use strict";
    function Walker(order) {
      this.order = order;
      this.stack = [];
    }

    __exports__["default"] = Walker;

    Walker.prototype.visit = function(node, callback) {
      if (!node) {
        return;
      }

      this.stack.push(node);

      if (this.order === 'post') {
        this.children(node, callback);
        callback(node, this);
      } else {
        callback(node, this);
        this.children(node, callback);
      }

      this.stack.pop();
    };

    var visitors = {
      Program: function(walker, node, callback) {
        for (var i = 0; i < node.body.length; i++) {
          walker.visit(node.body[i], callback);
        }
      },

      ElementNode: function(walker, node, callback) {
        for (var i = 0; i < node.children.length; i++) {
          walker.visit(node.children[i], callback);
        }
      },

      BlockStatement: function(walker, node, callback) {
        walker.visit(node.program, callback);
        walker.visit(node.inverse, callback);
      },

      ComponentNode: function(walker, node, callback) {
        walker.visit(node.program, callback);
      }
    };

    Walker.prototype.children = function(node, callback) {
      var visitor = visitors[node.type];
      if (visitor) {
        visitor(this, node, callback);
      }
    };
  });
enifed("htmlbars-test-helpers",
  ["exports"],
  function(__exports__) {
    "use strict";
    function equalInnerHTML(fragment, html) {
      var actualHTML = normalizeInnerHTML(fragment.innerHTML);
      QUnit.push(actualHTML === html, actualHTML, html);
    }

    __exports__.equalInnerHTML = equalInnerHTML;function equalHTML(node, html) {
      var fragment;
      if (!node.nodeType && node.length) {
        fragment = document.createDocumentFragment();
        while (node[0]) {
          fragment.appendChild(node[0]);
        }
      } else {
        fragment = node;
      }

      var div = document.createElement("div");
      div.appendChild(fragment.cloneNode(true));

      equalInnerHTML(div, html);
    }

    __exports__.equalHTML = equalHTML;// detect weird IE8 html strings
    var ie8InnerHTMLTestElement = document.createElement('div');
    ie8InnerHTMLTestElement.setAttribute('id', 'womp');
    var ie8InnerHTML = (ie8InnerHTMLTestElement.outerHTML.indexOf('id=womp') > -1);

    // detect side-effects of cloning svg elements in IE9-11
    var ieSVGInnerHTML = (function () {
      if (!document.createElementNS) {
        return false;
      }
      var div = document.createElement('div');
      var node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      div.appendChild(node);
      var clone = div.cloneNode(true);
      return clone.innerHTML === '<svg xmlns="http://www.w3.org/2000/svg" />';
    })();

    function normalizeInnerHTML(actualHTML) {
      if (ie8InnerHTML) {
        // drop newlines in IE8
        actualHTML = actualHTML.replace(/\r\n/gm, '');
        // downcase ALLCAPS tags in IE8
        actualHTML = actualHTML.replace(/<\/?[A-Z\-]+/gi, function(tag){
          return tag.toLowerCase();
        });
        // quote ids in IE8
        actualHTML = actualHTML.replace(/id=([^ >]+)/gi, function(match, id){
          return 'id="'+id+'"';
        });
        // IE8 adds ':' to some tags
        // <keygen> becomes <:keygen>
        actualHTML = actualHTML.replace(/<(\/?):([^ >]+)/gi, function(match, slash, tag){
          return '<'+slash+tag;
        });

        // Normalize the style attribute
        actualHTML = actualHTML.replace(/style="(.+?)"/gi, function(match, val){
          return 'style="'+val.toLowerCase()+';"';
        });

      }
      if (ieSVGInnerHTML) {
        // Replace `<svg xmlns="http://www.w3.org/2000/svg" height="50%" />` with `<svg height="50%"></svg>`, etc.
        // drop namespace attribute
        actualHTML = actualHTML.replace(/ xmlns="[^"]+"/, '');
        // replace self-closing elements
        actualHTML = actualHTML.replace(/<([^ >]+) [^\/>]*\/>/gi, function(tag, tagName) {
          return tag.slice(0, tag.length - 3) + '></' + tagName + '>';
        });
      }

      return actualHTML;
    }

    __exports__.normalizeInnerHTML = normalizeInnerHTML;// detect weird IE8 checked element string
    var checkedInput = document.createElement('input');
    checkedInput.setAttribute('checked', 'checked');
    var checkedInputString = checkedInput.outerHTML;
    function isCheckedInputHTML(element) {
      equal(element.outerHTML, checkedInputString);
    }

    __exports__.isCheckedInputHTML = isCheckedInputHTML;// check which property has the node's text content
    var textProperty = document.createElement('div').textContent === undefined ? 'innerText' : 'textContent';
    function getTextContent(el) {
      // textNode
      if (el.nodeType === 3) {
        return el.nodeValue;
      } else {
        return el[textProperty];
      }
    }

    __exports__.getTextContent = getTextContent;// IE8 does not have Object.create, so use a polyfill if needed.
    // Polyfill based on Mozilla's (MDN)
    function createObject(obj) {
      if (typeof Object.create === 'function') {
        return Object.create(obj);
      } else {
        var Temp = function() {};
        Temp.prototype = obj;
        return new Temp();
      }
    }
    __exports__.createObject = createObject;
  });
enifed("htmlbars-util",
  ["./htmlbars-util/safe-string","./htmlbars-util/handlebars/utils","./htmlbars-util/namespaces","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var SafeString = __dependency1__["default"];
    var escapeExpression = __dependency2__.escapeExpression;
    var getAttrNamespace = __dependency3__.getAttrNamespace;

    __exports__.SafeString = SafeString;
    __exports__.escapeExpression = escapeExpression;
    __exports__.getAttrNamespace = getAttrNamespace;
  });
enifed("htmlbars-util/array-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    function forEach(array, callback, binding) {
      var i, l;
      if (binding === undefined) {
        for (i = 0, l = array.length; i < l; i++) {
          callback(array[i], i, array);
        }
      } else {
        for (i = 0, l = array.length; i < l; i++) {
          callback.call(binding, array[i], i, array);
        }
      }
    }

    __exports__.forEach = forEach;function map(array, callback) {
      var output = [];
      var i, l;

      for (i = 0, l = array.length; i < l; i++) {
        output.push(callback(array[i], i, array));
      }

      return output;
    }

    __exports__.map = map;var getIdx;
    if (Array.prototype.indexOf) {
      getIdx = function(array, obj, from){
        return array.indexOf(obj, from);
      };
    } else {
      getIdx = function(array, obj, from) {
        if (from === undefined || from === null) {
          from = 0;
        } else if (from < 0) {
          from = Math.max(0, array.length + from);
        }
        for (var i = from, l= array.length; i < l; i++) {
          if (array[i] === obj) {
            return i;
          }
        }
        return -1;
      };
    }

    var indexOfArray = getIdx;
    __exports__.indexOfArray = indexOfArray;
  });
enifed("htmlbars-util/handlebars/safe-string",
  ["exports"],
  function(__exports__) {
    "use strict";
    // Build out our basic SafeString type
    function SafeString(string) {
      this.string = string;
    }

    SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
      return "" + this.string;
    };

    __exports__["default"] = SafeString;
  });
enifed("htmlbars-util/handlebars/utils",
  ["./safe-string","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*jshint -W004 */
    var SafeString = __dependency1__["default"];

    var escape = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;"
    };

    var badChars = /[&<>"'`]/g;
    var possible = /[&<>"'`]/;

    function escapeChar(chr) {
      return escape[chr];
    }

    function extend(obj /* , ...source */) {
      for (var i = 1; i < arguments.length; i++) {
        for (var key in arguments[i]) {
          if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
            obj[key] = arguments[i][key];
          }
        }
      }

      return obj;
    }

    __exports__.extend = extend;var toString = Object.prototype.toString;
    __exports__.toString = toString;
    // Sourced from lodash
    // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
    var isFunction = function(value) {
      return typeof value === 'function';
    };
    // fallback for older versions of Chrome and Safari
    /* istanbul ignore next */
    if (isFunction(/x/)) {
      isFunction = function(value) {
        return typeof value === 'function' && toString.call(value) === '[object Function]';
      };
    }
    var isFunction;
    __exports__.isFunction = isFunction;
    /* istanbul ignore next */
    var isArray = Array.isArray || function(value) {
      return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
    };
    __exports__.isArray = isArray;

    function escapeExpression(string) {
      // don't escape SafeStrings, since they're already safe
      if (string && string.toHTML) {
        return string.toHTML();
      } else if (string == null) {
        return "";
      } else if (!string) {
        return string + '';
      }

      // Force a string conversion as this will be done by the append regardless and
      // the regex test will do this transparently behind the scenes, causing issues if
      // an object's to string has escaped characters in it.
      string = "" + string;

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    }

    __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
      if (!value && value !== 0) {
        return true;
      } else if (isArray(value) && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }

    __exports__.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
      return (contextPath ? contextPath + '.' : '') + id;
    }

    __exports__.appendContextPath = appendContextPath;
  });
enifed("htmlbars-util/namespaces",
  ["exports"],
  function(__exports__) {
    "use strict";
    // ref http://dev.w3.org/html5/spec-LC/namespaces.html
    var defaultNamespaces = {
      html: 'http://www.w3.org/1999/xhtml',
      mathml: 'http://www.w3.org/1998/Math/MathML',
      svg: 'http://www.w3.org/2000/svg',
      xlink: 'http://www.w3.org/1999/xlink',
      xml: 'http://www.w3.org/XML/1998/namespace'
    };

    function getAttrNamespace(attrName) {
      var namespace;

      var colonIndex = attrName.indexOf(':');
      if (colonIndex !== -1) {
        var prefix = attrName.slice(0, colonIndex);
        namespace = defaultNamespaces[prefix];
      }

      return namespace || null;
    }

    __exports__.getAttrNamespace = getAttrNamespace;
  });
enifed("htmlbars-util/object-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    function merge(options, defaults) {
      for (var prop in defaults) {
        if (options.hasOwnProperty(prop)) { continue; }
        options[prop] = defaults[prop];
      }
      return options;
    }

    __exports__.merge = merge;
  });
enifed("htmlbars-util/quoting",
  ["exports"],
  function(__exports__) {
    "use strict";
    function escapeString(str) {
      str = str.replace(/\\/g, "\\\\");
      str = str.replace(/"/g, '\\"');
      str = str.replace(/\n/g, "\\n");
      return str;
    }

    __exports__.escapeString = escapeString;

    function string(str) {
      return '"' + escapeString(str) + '"';
    }

    __exports__.string = string;

    function array(a) {
      return "[" + a + "]";
    }

    __exports__.array = array;

    function hash(pairs) {
      return "{" + pairs.join(", ") + "}";
    }

    __exports__.hash = hash;function repeat(chars, times) {
      var str = "";
      while (times--) {
        str += chars;
      }
      return str;
    }

    __exports__.repeat = repeat;
  });
enifed("htmlbars-util/safe-string",
  ["./handlebars/safe-string","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SafeString = __dependency1__["default"];

    __exports__["default"] = SafeString;
  });
enifed("simple-html-tokenizer",
  ["./simple-html-tokenizer/tokenizer","./simple-html-tokenizer/tokenize","./simple-html-tokenizer/generator","./simple-html-tokenizer/generate","./simple-html-tokenizer/tokens","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    /*jshint boss:true*/
    var Tokenizer = __dependency1__["default"];
    var tokenize = __dependency2__["default"];
    var Generator = __dependency3__["default"];
    var generate = __dependency4__["default"];
    var StartTag = __dependency5__.StartTag;
    var EndTag = __dependency5__.EndTag;
    var Chars = __dependency5__.Chars;
    var Comment = __dependency5__.Comment;

    __exports__.Tokenizer = Tokenizer;
    __exports__.tokenize = tokenize;
    __exports__.Generator = Generator;
    __exports__.generate = generate;
    __exports__.StartTag = StartTag;
    __exports__.EndTag = EndTag;
    __exports__.Chars = Chars;
    __exports__.Comment = Comment;
  });
enifed("simple-html-tokenizer/char-refs/full",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = {
      AElig: [198],
      AMP: [38],
      Aacute: [193],
      Abreve: [258],
      Acirc: [194],
      Acy: [1040],
      Afr: [120068],
      Agrave: [192],
      Alpha: [913],
      Amacr: [256],
      And: [10835],
      Aogon: [260],
      Aopf: [120120],
      ApplyFunction: [8289],
      Aring: [197],
      Ascr: [119964],
      Assign: [8788],
      Atilde: [195],
      Auml: [196],
      Backslash: [8726],
      Barv: [10983],
      Barwed: [8966],
      Bcy: [1041],
      Because: [8757],
      Bernoullis: [8492],
      Beta: [914],
      Bfr: [120069],
      Bopf: [120121],
      Breve: [728],
      Bscr: [8492],
      Bumpeq: [8782],
      CHcy: [1063],
      COPY: [169],
      Cacute: [262],
      Cap: [8914],
      CapitalDifferentialD: [8517],
      Cayleys: [8493],
      Ccaron: [268],
      Ccedil: [199],
      Ccirc: [264],
      Cconint: [8752],
      Cdot: [266],
      Cedilla: [184],
      CenterDot: [183],
      Cfr: [8493],
      Chi: [935],
      CircleDot: [8857],
      CircleMinus: [8854],
      CirclePlus: [8853],
      CircleTimes: [8855],
      ClockwiseContourIntegral: [8754],
      CloseCurlyDoubleQuote: [8221],
      CloseCurlyQuote: [8217],
      Colon: [8759],
      Colone: [10868],
      Congruent: [8801],
      Conint: [8751],
      ContourIntegral: [8750],
      Copf: [8450],
      Coproduct: [8720],
      CounterClockwiseContourIntegral: [8755],
      Cross: [10799],
      Cscr: [119966],
      Cup: [8915],
      CupCap: [8781],
      DD: [8517],
      DDotrahd: [10513],
      DJcy: [1026],
      DScy: [1029],
      DZcy: [1039],
      Dagger: [8225],
      Darr: [8609],
      Dashv: [10980],
      Dcaron: [270],
      Dcy: [1044],
      Del: [8711],
      Delta: [916],
      Dfr: [120071],
      DiacriticalAcute: [180],
      DiacriticalDot: [729],
      DiacriticalDoubleAcute: [733],
      DiacriticalGrave: [96],
      DiacriticalTilde: [732],
      Diamond: [8900],
      DifferentialD: [8518],
      Dopf: [120123],
      Dot: [168],
      DotDot: [8412],
      DotEqual: [8784],
      DoubleContourIntegral: [8751],
      DoubleDot: [168],
      DoubleDownArrow: [8659],
      DoubleLeftArrow: [8656],
      DoubleLeftRightArrow: [8660],
      DoubleLeftTee: [10980],
      DoubleLongLeftArrow: [10232],
      DoubleLongLeftRightArrow: [10234],
      DoubleLongRightArrow: [10233],
      DoubleRightArrow: [8658],
      DoubleRightTee: [8872],
      DoubleUpArrow: [8657],
      DoubleUpDownArrow: [8661],
      DoubleVerticalBar: [8741],
      DownArrow: [8595],
      DownArrowBar: [10515],
      DownArrowUpArrow: [8693],
      DownBreve: [785],
      DownLeftRightVector: [10576],
      DownLeftTeeVector: [10590],
      DownLeftVector: [8637],
      DownLeftVectorBar: [10582],
      DownRightTeeVector: [10591],
      DownRightVector: [8641],
      DownRightVectorBar: [10583],
      DownTee: [8868],
      DownTeeArrow: [8615],
      Downarrow: [8659],
      Dscr: [119967],
      Dstrok: [272],
      ENG: [330],
      ETH: [208],
      Eacute: [201],
      Ecaron: [282],
      Ecirc: [202],
      Ecy: [1069],
      Edot: [278],
      Efr: [120072],
      Egrave: [200],
      Element: [8712],
      Emacr: [274],
      EmptySmallSquare: [9723],
      EmptyVerySmallSquare: [9643],
      Eogon: [280],
      Eopf: [120124],
      Epsilon: [917],
      Equal: [10869],
      EqualTilde: [8770],
      Equilibrium: [8652],
      Escr: [8496],
      Esim: [10867],
      Eta: [919],
      Euml: [203],
      Exists: [8707],
      ExponentialE: [8519],
      Fcy: [1060],
      Ffr: [120073],
      FilledSmallSquare: [9724],
      FilledVerySmallSquare: [9642],
      Fopf: [120125],
      ForAll: [8704],
      Fouriertrf: [8497],
      Fscr: [8497],
      GJcy: [1027],
      GT: [62],
      Gamma: [915],
      Gammad: [988],
      Gbreve: [286],
      Gcedil: [290],
      Gcirc: [284],
      Gcy: [1043],
      Gdot: [288],
      Gfr: [120074],
      Gg: [8921],
      Gopf: [120126],
      GreaterEqual: [8805],
      GreaterEqualLess: [8923],
      GreaterFullEqual: [8807],
      GreaterGreater: [10914],
      GreaterLess: [8823],
      GreaterSlantEqual: [10878],
      GreaterTilde: [8819],
      Gscr: [119970],
      Gt: [8811],
      HARDcy: [1066],
      Hacek: [711],
      Hat: [94],
      Hcirc: [292],
      Hfr: [8460],
      HilbertSpace: [8459],
      Hopf: [8461],
      HorizontalLine: [9472],
      Hscr: [8459],
      Hstrok: [294],
      HumpDownHump: [8782],
      HumpEqual: [8783],
      IEcy: [1045],
      IJlig: [306],
      IOcy: [1025],
      Iacute: [205],
      Icirc: [206],
      Icy: [1048],
      Idot: [304],
      Ifr: [8465],
      Igrave: [204],
      Im: [8465],
      Imacr: [298],
      ImaginaryI: [8520],
      Implies: [8658],
      Int: [8748],
      Integral: [8747],
      Intersection: [8898],
      InvisibleComma: [8291],
      InvisibleTimes: [8290],
      Iogon: [302],
      Iopf: [120128],
      Iota: [921],
      Iscr: [8464],
      Itilde: [296],
      Iukcy: [1030],
      Iuml: [207],
      Jcirc: [308],
      Jcy: [1049],
      Jfr: [120077],
      Jopf: [120129],
      Jscr: [119973],
      Jsercy: [1032],
      Jukcy: [1028],
      KHcy: [1061],
      KJcy: [1036],
      Kappa: [922],
      Kcedil: [310],
      Kcy: [1050],
      Kfr: [120078],
      Kopf: [120130],
      Kscr: [119974],
      LJcy: [1033],
      LT: [60],
      Lacute: [313],
      Lambda: [923],
      Lang: [10218],
      Laplacetrf: [8466],
      Larr: [8606],
      Lcaron: [317],
      Lcedil: [315],
      Lcy: [1051],
      LeftAngleBracket: [10216],
      LeftArrow: [8592],
      LeftArrowBar: [8676],
      LeftArrowRightArrow: [8646],
      LeftCeiling: [8968],
      LeftDoubleBracket: [10214],
      LeftDownTeeVector: [10593],
      LeftDownVector: [8643],
      LeftDownVectorBar: [10585],
      LeftFloor: [8970],
      LeftRightArrow: [8596],
      LeftRightVector: [10574],
      LeftTee: [8867],
      LeftTeeArrow: [8612],
      LeftTeeVector: [10586],
      LeftTriangle: [8882],
      LeftTriangleBar: [10703],
      LeftTriangleEqual: [8884],
      LeftUpDownVector: [10577],
      LeftUpTeeVector: [10592],
      LeftUpVector: [8639],
      LeftUpVectorBar: [10584],
      LeftVector: [8636],
      LeftVectorBar: [10578],
      Leftarrow: [8656],
      Leftrightarrow: [8660],
      LessEqualGreater: [8922],
      LessFullEqual: [8806],
      LessGreater: [8822],
      LessLess: [10913],
      LessSlantEqual: [10877],
      LessTilde: [8818],
      Lfr: [120079],
      Ll: [8920],
      Lleftarrow: [8666],
      Lmidot: [319],
      LongLeftArrow: [10229],
      LongLeftRightArrow: [10231],
      LongRightArrow: [10230],
      Longleftarrow: [10232],
      Longleftrightarrow: [10234],
      Longrightarrow: [10233],
      Lopf: [120131],
      LowerLeftArrow: [8601],
      LowerRightArrow: [8600],
      Lscr: [8466],
      Lsh: [8624],
      Lstrok: [321],
      Lt: [8810],
      Map: [10501],
      Mcy: [1052],
      MediumSpace: [8287],
      Mellintrf: [8499],
      Mfr: [120080],
      MinusPlus: [8723],
      Mopf: [120132],
      Mscr: [8499],
      Mu: [924],
      NJcy: [1034],
      Nacute: [323],
      Ncaron: [327],
      Ncedil: [325],
      Ncy: [1053],
      NegativeMediumSpace: [8203],
      NegativeThickSpace: [8203],
      NegativeThinSpace: [8203],
      NegativeVeryThinSpace: [8203],
      NestedGreaterGreater: [8811],
      NestedLessLess: [8810],
      NewLine: [10],
      Nfr: [120081],
      NoBreak: [8288],
      NonBreakingSpace: [160],
      Nopf: [8469],
      Not: [10988],
      NotCongruent: [8802],
      NotCupCap: [8813],
      NotDoubleVerticalBar: [8742],
      NotElement: [8713],
      NotEqual: [8800],
      NotEqualTilde: [8770, 824],
      NotExists: [8708],
      NotGreater: [8815],
      NotGreaterEqual: [8817],
      NotGreaterFullEqual: [8807, 824],
      NotGreaterGreater: [8811, 824],
      NotGreaterLess: [8825],
      NotGreaterSlantEqual: [10878, 824],
      NotGreaterTilde: [8821],
      NotHumpDownHump: [8782, 824],
      NotHumpEqual: [8783, 824],
      NotLeftTriangle: [8938],
      NotLeftTriangleBar: [10703, 824],
      NotLeftTriangleEqual: [8940],
      NotLess: [8814],
      NotLessEqual: [8816],
      NotLessGreater: [8824],
      NotLessLess: [8810, 824],
      NotLessSlantEqual: [10877, 824],
      NotLessTilde: [8820],
      NotNestedGreaterGreater: [10914, 824],
      NotNestedLessLess: [10913, 824],
      NotPrecedes: [8832],
      NotPrecedesEqual: [10927, 824],
      NotPrecedesSlantEqual: [8928],
      NotReverseElement: [8716],
      NotRightTriangle: [8939],
      NotRightTriangleBar: [10704, 824],
      NotRightTriangleEqual: [8941],
      NotSquareSubset: [8847, 824],
      NotSquareSubsetEqual: [8930],
      NotSquareSuperset: [8848, 824],
      NotSquareSupersetEqual: [8931],
      NotSubset: [8834, 8402],
      NotSubsetEqual: [8840],
      NotSucceeds: [8833],
      NotSucceedsEqual: [10928, 824],
      NotSucceedsSlantEqual: [8929],
      NotSucceedsTilde: [8831, 824],
      NotSuperset: [8835, 8402],
      NotSupersetEqual: [8841],
      NotTilde: [8769],
      NotTildeEqual: [8772],
      NotTildeFullEqual: [8775],
      NotTildeTilde: [8777],
      NotVerticalBar: [8740],
      Nscr: [119977],
      Ntilde: [209],
      Nu: [925],
      OElig: [338],
      Oacute: [211],
      Ocirc: [212],
      Ocy: [1054],
      Odblac: [336],
      Ofr: [120082],
      Ograve: [210],
      Omacr: [332],
      Omega: [937],
      Omicron: [927],
      Oopf: [120134],
      OpenCurlyDoubleQuote: [8220],
      OpenCurlyQuote: [8216],
      Or: [10836],
      Oscr: [119978],
      Oslash: [216],
      Otilde: [213],
      Otimes: [10807],
      Ouml: [214],
      OverBar: [8254],
      OverBrace: [9182],
      OverBracket: [9140],
      OverParenthesis: [9180],
      PartialD: [8706],
      Pcy: [1055],
      Pfr: [120083],
      Phi: [934],
      Pi: [928],
      PlusMinus: [177],
      Poincareplane: [8460],
      Popf: [8473],
      Pr: [10939],
      Precedes: [8826],
      PrecedesEqual: [10927],
      PrecedesSlantEqual: [8828],
      PrecedesTilde: [8830],
      Prime: [8243],
      Product: [8719],
      Proportion: [8759],
      Proportional: [8733],
      Pscr: [119979],
      Psi: [936],
      QUOT: [34],
      Qfr: [120084],
      Qopf: [8474],
      Qscr: [119980],
      RBarr: [10512],
      REG: [174],
      Racute: [340],
      Rang: [10219],
      Rarr: [8608],
      Rarrtl: [10518],
      Rcaron: [344],
      Rcedil: [342],
      Rcy: [1056],
      Re: [8476],
      ReverseElement: [8715],
      ReverseEquilibrium: [8651],
      ReverseUpEquilibrium: [10607],
      Rfr: [8476],
      Rho: [929],
      RightAngleBracket: [10217],
      RightArrow: [8594],
      RightArrowBar: [8677],
      RightArrowLeftArrow: [8644],
      RightCeiling: [8969],
      RightDoubleBracket: [10215],
      RightDownTeeVector: [10589],
      RightDownVector: [8642],
      RightDownVectorBar: [10581],
      RightFloor: [8971],
      RightTee: [8866],
      RightTeeArrow: [8614],
      RightTeeVector: [10587],
      RightTriangle: [8883],
      RightTriangleBar: [10704],
      RightTriangleEqual: [8885],
      RightUpDownVector: [10575],
      RightUpTeeVector: [10588],
      RightUpVector: [8638],
      RightUpVectorBar: [10580],
      RightVector: [8640],
      RightVectorBar: [10579],
      Rightarrow: [8658],
      Ropf: [8477],
      RoundImplies: [10608],
      Rrightarrow: [8667],
      Rscr: [8475],
      Rsh: [8625],
      RuleDelayed: [10740],
      SHCHcy: [1065],
      SHcy: [1064],
      SOFTcy: [1068],
      Sacute: [346],
      Sc: [10940],
      Scaron: [352],
      Scedil: [350],
      Scirc: [348],
      Scy: [1057],
      Sfr: [120086],
      ShortDownArrow: [8595],
      ShortLeftArrow: [8592],
      ShortRightArrow: [8594],
      ShortUpArrow: [8593],
      Sigma: [931],
      SmallCircle: [8728],
      Sopf: [120138],
      Sqrt: [8730],
      Square: [9633],
      SquareIntersection: [8851],
      SquareSubset: [8847],
      SquareSubsetEqual: [8849],
      SquareSuperset: [8848],
      SquareSupersetEqual: [8850],
      SquareUnion: [8852],
      Sscr: [119982],
      Star: [8902],
      Sub: [8912],
      Subset: [8912],
      SubsetEqual: [8838],
      Succeeds: [8827],
      SucceedsEqual: [10928],
      SucceedsSlantEqual: [8829],
      SucceedsTilde: [8831],
      SuchThat: [8715],
      Sum: [8721],
      Sup: [8913],
      Superset: [8835],
      SupersetEqual: [8839],
      Supset: [8913],
      THORN: [222],
      TRADE: [8482],
      TSHcy: [1035],
      TScy: [1062],
      Tab: [9],
      Tau: [932],
      Tcaron: [356],
      Tcedil: [354],
      Tcy: [1058],
      Tfr: [120087],
      Therefore: [8756],
      Theta: [920],
      ThickSpace: [8287, 8202],
      ThinSpace: [8201],
      Tilde: [8764],
      TildeEqual: [8771],
      TildeFullEqual: [8773],
      TildeTilde: [8776],
      Topf: [120139],
      TripleDot: [8411],
      Tscr: [119983],
      Tstrok: [358],
      Uacute: [218],
      Uarr: [8607],
      Uarrocir: [10569],
      Ubrcy: [1038],
      Ubreve: [364],
      Ucirc: [219],
      Ucy: [1059],
      Udblac: [368],
      Ufr: [120088],
      Ugrave: [217],
      Umacr: [362],
      UnderBar: [95],
      UnderBrace: [9183],
      UnderBracket: [9141],
      UnderParenthesis: [9181],
      Union: [8899],
      UnionPlus: [8846],
      Uogon: [370],
      Uopf: [120140],
      UpArrow: [8593],
      UpArrowBar: [10514],
      UpArrowDownArrow: [8645],
      UpDownArrow: [8597],
      UpEquilibrium: [10606],
      UpTee: [8869],
      UpTeeArrow: [8613],
      Uparrow: [8657],
      Updownarrow: [8661],
      UpperLeftArrow: [8598],
      UpperRightArrow: [8599],
      Upsi: [978],
      Upsilon: [933],
      Uring: [366],
      Uscr: [119984],
      Utilde: [360],
      Uuml: [220],
      VDash: [8875],
      Vbar: [10987],
      Vcy: [1042],
      Vdash: [8873],
      Vdashl: [10982],
      Vee: [8897],
      Verbar: [8214],
      Vert: [8214],
      VerticalBar: [8739],
      VerticalLine: [124],
      VerticalSeparator: [10072],
      VerticalTilde: [8768],
      VeryThinSpace: [8202],
      Vfr: [120089],
      Vopf: [120141],
      Vscr: [119985],
      Vvdash: [8874],
      Wcirc: [372],
      Wedge: [8896],
      Wfr: [120090],
      Wopf: [120142],
      Wscr: [119986],
      Xfr: [120091],
      Xi: [926],
      Xopf: [120143],
      Xscr: [119987],
      YAcy: [1071],
      YIcy: [1031],
      YUcy: [1070],
      Yacute: [221],
      Ycirc: [374],
      Ycy: [1067],
      Yfr: [120092],
      Yopf: [120144],
      Yscr: [119988],
      Yuml: [376],
      ZHcy: [1046],
      Zacute: [377],
      Zcaron: [381],
      Zcy: [1047],
      Zdot: [379],
      ZeroWidthSpace: [8203],
      Zeta: [918],
      Zfr: [8488],
      Zopf: [8484],
      Zscr: [119989],
      aacute: [225],
      abreve: [259],
      ac: [8766],
      acE: [8766, 819],
      acd: [8767],
      acirc: [226],
      acute: [180],
      acy: [1072],
      aelig: [230],
      af: [8289],
      afr: [120094],
      agrave: [224],
      alefsym: [8501],
      aleph: [8501],
      alpha: [945],
      amacr: [257],
      amalg: [10815],
      amp: [38],
      and: [8743],
      andand: [10837],
      andd: [10844],
      andslope: [10840],
      andv: [10842],
      ang: [8736],
      ange: [10660],
      angle: [8736],
      angmsd: [8737],
      angmsdaa: [10664],
      angmsdab: [10665],
      angmsdac: [10666],
      angmsdad: [10667],
      angmsdae: [10668],
      angmsdaf: [10669],
      angmsdag: [10670],
      angmsdah: [10671],
      angrt: [8735],
      angrtvb: [8894],
      angrtvbd: [10653],
      angsph: [8738],
      angst: [197],
      angzarr: [9084],
      aogon: [261],
      aopf: [120146],
      ap: [8776],
      apE: [10864],
      apacir: [10863],
      ape: [8778],
      apid: [8779],
      apos: [39],
      approx: [8776],
      approxeq: [8778],
      aring: [229],
      ascr: [119990],
      ast: [42],
      asymp: [8776],
      asympeq: [8781],
      atilde: [227],
      auml: [228],
      awconint: [8755],
      awint: [10769],
      bNot: [10989],
      backcong: [8780],
      backepsilon: [1014],
      backprime: [8245],
      backsim: [8765],
      backsimeq: [8909],
      barvee: [8893],
      barwed: [8965],
      barwedge: [8965],
      bbrk: [9141],
      bbrktbrk: [9142],
      bcong: [8780],
      bcy: [1073],
      bdquo: [8222],
      becaus: [8757],
      because: [8757],
      bemptyv: [10672],
      bepsi: [1014],
      bernou: [8492],
      beta: [946],
      beth: [8502],
      between: [8812],
      bfr: [120095],
      bigcap: [8898],
      bigcirc: [9711],
      bigcup: [8899],
      bigodot: [10752],
      bigoplus: [10753],
      bigotimes: [10754],
      bigsqcup: [10758],
      bigstar: [9733],
      bigtriangledown: [9661],
      bigtriangleup: [9651],
      biguplus: [10756],
      bigvee: [8897],
      bigwedge: [8896],
      bkarow: [10509],
      blacklozenge: [10731],
      blacksquare: [9642],
      blacktriangle: [9652],
      blacktriangledown: [9662],
      blacktriangleleft: [9666],
      blacktriangleright: [9656],
      blank: [9251],
      blk12: [9618],
      blk14: [9617],
      blk34: [9619],
      block: [9608],
      bne: [61, 8421],
      bnequiv: [8801, 8421],
      bnot: [8976],
      bopf: [120147],
      bot: [8869],
      bottom: [8869],
      bowtie: [8904],
      boxDL: [9559],
      boxDR: [9556],
      boxDl: [9558],
      boxDr: [9555],
      boxH: [9552],
      boxHD: [9574],
      boxHU: [9577],
      boxHd: [9572],
      boxHu: [9575],
      boxUL: [9565],
      boxUR: [9562],
      boxUl: [9564],
      boxUr: [9561],
      boxV: [9553],
      boxVH: [9580],
      boxVL: [9571],
      boxVR: [9568],
      boxVh: [9579],
      boxVl: [9570],
      boxVr: [9567],
      boxbox: [10697],
      boxdL: [9557],
      boxdR: [9554],
      boxdl: [9488],
      boxdr: [9484],
      boxh: [9472],
      boxhD: [9573],
      boxhU: [9576],
      boxhd: [9516],
      boxhu: [9524],
      boxminus: [8863],
      boxplus: [8862],
      boxtimes: [8864],
      boxuL: [9563],
      boxuR: [9560],
      boxul: [9496],
      boxur: [9492],
      boxv: [9474],
      boxvH: [9578],
      boxvL: [9569],
      boxvR: [9566],
      boxvh: [9532],
      boxvl: [9508],
      boxvr: [9500],
      bprime: [8245],
      breve: [728],
      brvbar: [166],
      bscr: [119991],
      bsemi: [8271],
      bsim: [8765],
      bsime: [8909],
      bsol: [92],
      bsolb: [10693],
      bsolhsub: [10184],
      bull: [8226],
      bullet: [8226],
      bump: [8782],
      bumpE: [10926],
      bumpe: [8783],
      bumpeq: [8783],
      cacute: [263],
      cap: [8745],
      capand: [10820],
      capbrcup: [10825],
      capcap: [10827],
      capcup: [10823],
      capdot: [10816],
      caps: [8745, 65024],
      caret: [8257],
      caron: [711],
      ccaps: [10829],
      ccaron: [269],
      ccedil: [231],
      ccirc: [265],
      ccups: [10828],
      ccupssm: [10832],
      cdot: [267],
      cedil: [184],
      cemptyv: [10674],
      cent: [162],
      centerdot: [183],
      cfr: [120096],
      chcy: [1095],
      check: [10003],
      checkmark: [10003],
      chi: [967],
      cir: [9675],
      cirE: [10691],
      circ: [710],
      circeq: [8791],
      circlearrowleft: [8634],
      circlearrowright: [8635],
      circledR: [174],
      circledS: [9416],
      circledast: [8859],
      circledcirc: [8858],
      circleddash: [8861],
      cire: [8791],
      cirfnint: [10768],
      cirmid: [10991],
      cirscir: [10690],
      clubs: [9827],
      clubsuit: [9827],
      colon: [58],
      colone: [8788],
      coloneq: [8788],
      comma: [44],
      commat: [64],
      comp: [8705],
      compfn: [8728],
      complement: [8705],
      complexes: [8450],
      cong: [8773],
      congdot: [10861],
      conint: [8750],
      copf: [120148],
      coprod: [8720],
      copy: [169],
      copysr: [8471],
      crarr: [8629],
      cross: [10007],
      cscr: [119992],
      csub: [10959],
      csube: [10961],
      csup: [10960],
      csupe: [10962],
      ctdot: [8943],
      cudarrl: [10552],
      cudarrr: [10549],
      cuepr: [8926],
      cuesc: [8927],
      cularr: [8630],
      cularrp: [10557],
      cup: [8746],
      cupbrcap: [10824],
      cupcap: [10822],
      cupcup: [10826],
      cupdot: [8845],
      cupor: [10821],
      cups: [8746, 65024],
      curarr: [8631],
      curarrm: [10556],
      curlyeqprec: [8926],
      curlyeqsucc: [8927],
      curlyvee: [8910],
      curlywedge: [8911],
      curren: [164],
      curvearrowleft: [8630],
      curvearrowright: [8631],
      cuvee: [8910],
      cuwed: [8911],
      cwconint: [8754],
      cwint: [8753],
      cylcty: [9005],
      dArr: [8659],
      dHar: [10597],
      dagger: [8224],
      daleth: [8504],
      darr: [8595],
      dash: [8208],
      dashv: [8867],
      dbkarow: [10511],
      dblac: [733],
      dcaron: [271],
      dcy: [1076],
      dd: [8518],
      ddagger: [8225],
      ddarr: [8650],
      ddotseq: [10871],
      deg: [176],
      delta: [948],
      demptyv: [10673],
      dfisht: [10623],
      dfr: [120097],
      dharl: [8643],
      dharr: [8642],
      diam: [8900],
      diamond: [8900],
      diamondsuit: [9830],
      diams: [9830],
      die: [168],
      digamma: [989],
      disin: [8946],
      div: [247],
      divide: [247],
      divideontimes: [8903],
      divonx: [8903],
      djcy: [1106],
      dlcorn: [8990],
      dlcrop: [8973],
      dollar: [36],
      dopf: [120149],
      dot: [729],
      doteq: [8784],
      doteqdot: [8785],
      dotminus: [8760],
      dotplus: [8724],
      dotsquare: [8865],
      doublebarwedge: [8966],
      downarrow: [8595],
      downdownarrows: [8650],
      downharpoonleft: [8643],
      downharpoonright: [8642],
      drbkarow: [10512],
      drcorn: [8991],
      drcrop: [8972],
      dscr: [119993],
      dscy: [1109],
      dsol: [10742],
      dstrok: [273],
      dtdot: [8945],
      dtri: [9663],
      dtrif: [9662],
      duarr: [8693],
      duhar: [10607],
      dwangle: [10662],
      dzcy: [1119],
      dzigrarr: [10239],
      eDDot: [10871],
      eDot: [8785],
      eacute: [233],
      easter: [10862],
      ecaron: [283],
      ecir: [8790],
      ecirc: [234],
      ecolon: [8789],
      ecy: [1101],
      edot: [279],
      ee: [8519],
      efDot: [8786],
      efr: [120098],
      eg: [10906],
      egrave: [232],
      egs: [10902],
      egsdot: [10904],
      el: [10905],
      elinters: [9191],
      ell: [8467],
      els: [10901],
      elsdot: [10903],
      emacr: [275],
      empty: [8709],
      emptyset: [8709],
      emptyv: [8709],
      emsp: [8195],
      emsp13: [8196],
      emsp14: [8197],
      eng: [331],
      ensp: [8194],
      eogon: [281],
      eopf: [120150],
      epar: [8917],
      eparsl: [10723],
      eplus: [10865],
      epsi: [949],
      epsilon: [949],
      epsiv: [1013],
      eqcirc: [8790],
      eqcolon: [8789],
      eqsim: [8770],
      eqslantgtr: [10902],
      eqslantless: [10901],
      equals: [61],
      equest: [8799],
      equiv: [8801],
      equivDD: [10872],
      eqvparsl: [10725],
      erDot: [8787],
      erarr: [10609],
      escr: [8495],
      esdot: [8784],
      esim: [8770],
      eta: [951],
      eth: [240],
      euml: [235],
      euro: [8364],
      excl: [33],
      exist: [8707],
      expectation: [8496],
      exponentiale: [8519],
      fallingdotseq: [8786],
      fcy: [1092],
      female: [9792],
      ffilig: [64259],
      fflig: [64256],
      ffllig: [64260],
      ffr: [120099],
      filig: [64257],
      fjlig: [102, 106],
      flat: [9837],
      fllig: [64258],
      fltns: [9649],
      fnof: [402],
      fopf: [120151],
      forall: [8704],
      fork: [8916],
      forkv: [10969],
      fpartint: [10765],
      frac12: [189],
      frac13: [8531],
      frac14: [188],
      frac15: [8533],
      frac16: [8537],
      frac18: [8539],
      frac23: [8532],
      frac25: [8534],
      frac34: [190],
      frac35: [8535],
      frac38: [8540],
      frac45: [8536],
      frac56: [8538],
      frac58: [8541],
      frac78: [8542],
      frasl: [8260],
      frown: [8994],
      fscr: [119995],
      gE: [8807],
      gEl: [10892],
      gacute: [501],
      gamma: [947],
      gammad: [989],
      gap: [10886],
      gbreve: [287],
      gcirc: [285],
      gcy: [1075],
      gdot: [289],
      ge: [8805],
      gel: [8923],
      geq: [8805],
      geqq: [8807],
      geqslant: [10878],
      ges: [10878],
      gescc: [10921],
      gesdot: [10880],
      gesdoto: [10882],
      gesdotol: [10884],
      gesl: [8923, 65024],
      gesles: [10900],
      gfr: [120100],
      gg: [8811],
      ggg: [8921],
      gimel: [8503],
      gjcy: [1107],
      gl: [8823],
      glE: [10898],
      gla: [10917],
      glj: [10916],
      gnE: [8809],
      gnap: [10890],
      gnapprox: [10890],
      gne: [10888],
      gneq: [10888],
      gneqq: [8809],
      gnsim: [8935],
      gopf: [120152],
      grave: [96],
      gscr: [8458],
      gsim: [8819],
      gsime: [10894],
      gsiml: [10896],
      gt: [62],
      gtcc: [10919],
      gtcir: [10874],
      gtdot: [8919],
      gtlPar: [10645],
      gtquest: [10876],
      gtrapprox: [10886],
      gtrarr: [10616],
      gtrdot: [8919],
      gtreqless: [8923],
      gtreqqless: [10892],
      gtrless: [8823],
      gtrsim: [8819],
      gvertneqq: [8809, 65024],
      gvnE: [8809, 65024],
      hArr: [8660],
      hairsp: [8202],
      half: [189],
      hamilt: [8459],
      hardcy: [1098],
      harr: [8596],
      harrcir: [10568],
      harrw: [8621],
      hbar: [8463],
      hcirc: [293],
      hearts: [9829],
      heartsuit: [9829],
      hellip: [8230],
      hercon: [8889],
      hfr: [120101],
      hksearow: [10533],
      hkswarow: [10534],
      hoarr: [8703],
      homtht: [8763],
      hookleftarrow: [8617],
      hookrightarrow: [8618],
      hopf: [120153],
      horbar: [8213],
      hscr: [119997],
      hslash: [8463],
      hstrok: [295],
      hybull: [8259],
      hyphen: [8208],
      iacute: [237],
      ic: [8291],
      icirc: [238],
      icy: [1080],
      iecy: [1077],
      iexcl: [161],
      iff: [8660],
      ifr: [120102],
      igrave: [236],
      ii: [8520],
      iiiint: [10764],
      iiint: [8749],
      iinfin: [10716],
      iiota: [8489],
      ijlig: [307],
      imacr: [299],
      image: [8465],
      imagline: [8464],
      imagpart: [8465],
      imath: [305],
      imof: [8887],
      imped: [437],
      "in": [8712],
      incare: [8453],
      infin: [8734],
      infintie: [10717],
      inodot: [305],
      "int": [8747],
      intcal: [8890],
      integers: [8484],
      intercal: [8890],
      intlarhk: [10775],
      intprod: [10812],
      iocy: [1105],
      iogon: [303],
      iopf: [120154],
      iota: [953],
      iprod: [10812],
      iquest: [191],
      iscr: [119998],
      isin: [8712],
      isinE: [8953],
      isindot: [8949],
      isins: [8948],
      isinsv: [8947],
      isinv: [8712],
      it: [8290],
      itilde: [297],
      iukcy: [1110],
      iuml: [239],
      jcirc: [309],
      jcy: [1081],
      jfr: [120103],
      jmath: [567],
      jopf: [120155],
      jscr: [119999],
      jsercy: [1112],
      jukcy: [1108],
      kappa: [954],
      kappav: [1008],
      kcedil: [311],
      kcy: [1082],
      kfr: [120104],
      kgreen: [312],
      khcy: [1093],
      kjcy: [1116],
      kopf: [120156],
      kscr: [120000],
      lAarr: [8666],
      lArr: [8656],
      lAtail: [10523],
      lBarr: [10510],
      lE: [8806],
      lEg: [10891],
      lHar: [10594],
      lacute: [314],
      laemptyv: [10676],
      lagran: [8466],
      lambda: [955],
      lang: [10216],
      langd: [10641],
      langle: [10216],
      lap: [10885],
      laquo: [171],
      larr: [8592],
      larrb: [8676],
      larrbfs: [10527],
      larrfs: [10525],
      larrhk: [8617],
      larrlp: [8619],
      larrpl: [10553],
      larrsim: [10611],
      larrtl: [8610],
      lat: [10923],
      latail: [10521],
      late: [10925],
      lates: [10925, 65024],
      lbarr: [10508],
      lbbrk: [10098],
      lbrace: [123],
      lbrack: [91],
      lbrke: [10635],
      lbrksld: [10639],
      lbrkslu: [10637],
      lcaron: [318],
      lcedil: [316],
      lceil: [8968],
      lcub: [123],
      lcy: [1083],
      ldca: [10550],
      ldquo: [8220],
      ldquor: [8222],
      ldrdhar: [10599],
      ldrushar: [10571],
      ldsh: [8626],
      le: [8804],
      leftarrow: [8592],
      leftarrowtail: [8610],
      leftharpoondown: [8637],
      leftharpoonup: [8636],
      leftleftarrows: [8647],
      leftrightarrow: [8596],
      leftrightarrows: [8646],
      leftrightharpoons: [8651],
      leftrightsquigarrow: [8621],
      leftthreetimes: [8907],
      leg: [8922],
      leq: [8804],
      leqq: [8806],
      leqslant: [10877],
      les: [10877],
      lescc: [10920],
      lesdot: [10879],
      lesdoto: [10881],
      lesdotor: [10883],
      lesg: [8922, 65024],
      lesges: [10899],
      lessapprox: [10885],
      lessdot: [8918],
      lesseqgtr: [8922],
      lesseqqgtr: [10891],
      lessgtr: [8822],
      lesssim: [8818],
      lfisht: [10620],
      lfloor: [8970],
      lfr: [120105],
      lg: [8822],
      lgE: [10897],
      lhard: [8637],
      lharu: [8636],
      lharul: [10602],
      lhblk: [9604],
      ljcy: [1113],
      ll: [8810],
      llarr: [8647],
      llcorner: [8990],
      llhard: [10603],
      lltri: [9722],
      lmidot: [320],
      lmoust: [9136],
      lmoustache: [9136],
      lnE: [8808],
      lnap: [10889],
      lnapprox: [10889],
      lne: [10887],
      lneq: [10887],
      lneqq: [8808],
      lnsim: [8934],
      loang: [10220],
      loarr: [8701],
      lobrk: [10214],
      longleftarrow: [10229],
      longleftrightarrow: [10231],
      longmapsto: [10236],
      longrightarrow: [10230],
      looparrowleft: [8619],
      looparrowright: [8620],
      lopar: [10629],
      lopf: [120157],
      loplus: [10797],
      lotimes: [10804],
      lowast: [8727],
      lowbar: [95],
      loz: [9674],
      lozenge: [9674],
      lozf: [10731],
      lpar: [40],
      lparlt: [10643],
      lrarr: [8646],
      lrcorner: [8991],
      lrhar: [8651],
      lrhard: [10605],
      lrm: [8206],
      lrtri: [8895],
      lsaquo: [8249],
      lscr: [120001],
      lsh: [8624],
      lsim: [8818],
      lsime: [10893],
      lsimg: [10895],
      lsqb: [91],
      lsquo: [8216],
      lsquor: [8218],
      lstrok: [322],
      lt: [60],
      ltcc: [10918],
      ltcir: [10873],
      ltdot: [8918],
      lthree: [8907],
      ltimes: [8905],
      ltlarr: [10614],
      ltquest: [10875],
      ltrPar: [10646],
      ltri: [9667],
      ltrie: [8884],
      ltrif: [9666],
      lurdshar: [10570],
      luruhar: [10598],
      lvertneqq: [8808, 65024],
      lvnE: [8808, 65024],
      mDDot: [8762],
      macr: [175],
      male: [9794],
      malt: [10016],
      maltese: [10016],
      map: [8614],
      mapsto: [8614],
      mapstodown: [8615],
      mapstoleft: [8612],
      mapstoup: [8613],
      marker: [9646],
      mcomma: [10793],
      mcy: [1084],
      mdash: [8212],
      measuredangle: [8737],
      mfr: [120106],
      mho: [8487],
      micro: [181],
      mid: [8739],
      midast: [42],
      midcir: [10992],
      middot: [183],
      minus: [8722],
      minusb: [8863],
      minusd: [8760],
      minusdu: [10794],
      mlcp: [10971],
      mldr: [8230],
      mnplus: [8723],
      models: [8871],
      mopf: [120158],
      mp: [8723],
      mscr: [120002],
      mstpos: [8766],
      mu: [956],
      multimap: [8888],
      mumap: [8888],
      nGg: [8921, 824],
      nGt: [8811, 8402],
      nGtv: [8811, 824],
      nLeftarrow: [8653],
      nLeftrightarrow: [8654],
      nLl: [8920, 824],
      nLt: [8810, 8402],
      nLtv: [8810, 824],
      nRightarrow: [8655],
      nVDash: [8879],
      nVdash: [8878],
      nabla: [8711],
      nacute: [324],
      nang: [8736, 8402],
      nap: [8777],
      napE: [10864, 824],
      napid: [8779, 824],
      napos: [329],
      napprox: [8777],
      natur: [9838],
      natural: [9838],
      naturals: [8469],
      nbsp: [160],
      nbump: [8782, 824],
      nbumpe: [8783, 824],
      ncap: [10819],
      ncaron: [328],
      ncedil: [326],
      ncong: [8775],
      ncongdot: [10861, 824],
      ncup: [10818],
      ncy: [1085],
      ndash: [8211],
      ne: [8800],
      neArr: [8663],
      nearhk: [10532],
      nearr: [8599],
      nearrow: [8599],
      nedot: [8784, 824],
      nequiv: [8802],
      nesear: [10536],
      nesim: [8770, 824],
      nexist: [8708],
      nexists: [8708],
      nfr: [120107],
      ngE: [8807, 824],
      nge: [8817],
      ngeq: [8817],
      ngeqq: [8807, 824],
      ngeqslant: [10878, 824],
      nges: [10878, 824],
      ngsim: [8821],
      ngt: [8815],
      ngtr: [8815],
      nhArr: [8654],
      nharr: [8622],
      nhpar: [10994],
      ni: [8715],
      nis: [8956],
      nisd: [8954],
      niv: [8715],
      njcy: [1114],
      nlArr: [8653],
      nlE: [8806, 824],
      nlarr: [8602],
      nldr: [8229],
      nle: [8816],
      nleftarrow: [8602],
      nleftrightarrow: [8622],
      nleq: [8816],
      nleqq: [8806, 824],
      nleqslant: [10877, 824],
      nles: [10877, 824],
      nless: [8814],
      nlsim: [8820],
      nlt: [8814],
      nltri: [8938],
      nltrie: [8940],
      nmid: [8740],
      nopf: [120159],
      not: [172],
      notin: [8713],
      notinE: [8953, 824],
      notindot: [8949, 824],
      notinva: [8713],
      notinvb: [8951],
      notinvc: [8950],
      notni: [8716],
      notniva: [8716],
      notnivb: [8958],
      notnivc: [8957],
      npar: [8742],
      nparallel: [8742],
      nparsl: [11005, 8421],
      npart: [8706, 824],
      npolint: [10772],
      npr: [8832],
      nprcue: [8928],
      npre: [10927, 824],
      nprec: [8832],
      npreceq: [10927, 824],
      nrArr: [8655],
      nrarr: [8603],
      nrarrc: [10547, 824],
      nrarrw: [8605, 824],
      nrightarrow: [8603],
      nrtri: [8939],
      nrtrie: [8941],
      nsc: [8833],
      nsccue: [8929],
      nsce: [10928, 824],
      nscr: [120003],
      nshortmid: [8740],
      nshortparallel: [8742],
      nsim: [8769],
      nsime: [8772],
      nsimeq: [8772],
      nsmid: [8740],
      nspar: [8742],
      nsqsube: [8930],
      nsqsupe: [8931],
      nsub: [8836],
      nsubE: [10949, 824],
      nsube: [8840],
      nsubset: [8834, 8402],
      nsubseteq: [8840],
      nsubseteqq: [10949, 824],
      nsucc: [8833],
      nsucceq: [10928, 824],
      nsup: [8837],
      nsupE: [10950, 824],
      nsupe: [8841],
      nsupset: [8835, 8402],
      nsupseteq: [8841],
      nsupseteqq: [10950, 824],
      ntgl: [8825],
      ntilde: [241],
      ntlg: [8824],
      ntriangleleft: [8938],
      ntrianglelefteq: [8940],
      ntriangleright: [8939],
      ntrianglerighteq: [8941],
      nu: [957],
      num: [35],
      numero: [8470],
      numsp: [8199],
      nvDash: [8877],
      nvHarr: [10500],
      nvap: [8781, 8402],
      nvdash: [8876],
      nvge: [8805, 8402],
      nvgt: [62, 8402],
      nvinfin: [10718],
      nvlArr: [10498],
      nvle: [8804, 8402],
      nvlt: [60, 8402],
      nvltrie: [8884, 8402],
      nvrArr: [10499],
      nvrtrie: [8885, 8402],
      nvsim: [8764, 8402],
      nwArr: [8662],
      nwarhk: [10531],
      nwarr: [8598],
      nwarrow: [8598],
      nwnear: [10535],
      oS: [9416],
      oacute: [243],
      oast: [8859],
      ocir: [8858],
      ocirc: [244],
      ocy: [1086],
      odash: [8861],
      odblac: [337],
      odiv: [10808],
      odot: [8857],
      odsold: [10684],
      oelig: [339],
      ofcir: [10687],
      ofr: [120108],
      ogon: [731],
      ograve: [242],
      ogt: [10689],
      ohbar: [10677],
      ohm: [937],
      oint: [8750],
      olarr: [8634],
      olcir: [10686],
      olcross: [10683],
      oline: [8254],
      olt: [10688],
      omacr: [333],
      omega: [969],
      omicron: [959],
      omid: [10678],
      ominus: [8854],
      oopf: [120160],
      opar: [10679],
      operp: [10681],
      oplus: [8853],
      or: [8744],
      orarr: [8635],
      ord: [10845],
      order: [8500],
      orderof: [8500],
      ordf: [170],
      ordm: [186],
      origof: [8886],
      oror: [10838],
      orslope: [10839],
      orv: [10843],
      oscr: [8500],
      oslash: [248],
      osol: [8856],
      otilde: [245],
      otimes: [8855],
      otimesas: [10806],
      ouml: [246],
      ovbar: [9021],
      par: [8741],
      para: [182],
      parallel: [8741],
      parsim: [10995],
      parsl: [11005],
      part: [8706],
      pcy: [1087],
      percnt: [37],
      period: [46],
      permil: [8240],
      perp: [8869],
      pertenk: [8241],
      pfr: [120109],
      phi: [966],
      phiv: [981],
      phmmat: [8499],
      phone: [9742],
      pi: [960],
      pitchfork: [8916],
      piv: [982],
      planck: [8463],
      planckh: [8462],
      plankv: [8463],
      plus: [43],
      plusacir: [10787],
      plusb: [8862],
      pluscir: [10786],
      plusdo: [8724],
      plusdu: [10789],
      pluse: [10866],
      plusmn: [177],
      plussim: [10790],
      plustwo: [10791],
      pm: [177],
      pointint: [10773],
      popf: [120161],
      pound: [163],
      pr: [8826],
      prE: [10931],
      prap: [10935],
      prcue: [8828],
      pre: [10927],
      prec: [8826],
      precapprox: [10935],
      preccurlyeq: [8828],
      preceq: [10927],
      precnapprox: [10937],
      precneqq: [10933],
      precnsim: [8936],
      precsim: [8830],
      prime: [8242],
      primes: [8473],
      prnE: [10933],
      prnap: [10937],
      prnsim: [8936],
      prod: [8719],
      profalar: [9006],
      profline: [8978],
      profsurf: [8979],
      prop: [8733],
      propto: [8733],
      prsim: [8830],
      prurel: [8880],
      pscr: [120005],
      psi: [968],
      puncsp: [8200],
      qfr: [120110],
      qint: [10764],
      qopf: [120162],
      qprime: [8279],
      qscr: [120006],
      quaternions: [8461],
      quatint: [10774],
      quest: [63],
      questeq: [8799],
      quot: [34],
      rAarr: [8667],
      rArr: [8658],
      rAtail: [10524],
      rBarr: [10511],
      rHar: [10596],
      race: [8765, 817],
      racute: [341],
      radic: [8730],
      raemptyv: [10675],
      rang: [10217],
      rangd: [10642],
      range: [10661],
      rangle: [10217],
      raquo: [187],
      rarr: [8594],
      rarrap: [10613],
      rarrb: [8677],
      rarrbfs: [10528],
      rarrc: [10547],
      rarrfs: [10526],
      rarrhk: [8618],
      rarrlp: [8620],
      rarrpl: [10565],
      rarrsim: [10612],
      rarrtl: [8611],
      rarrw: [8605],
      ratail: [10522],
      ratio: [8758],
      rationals: [8474],
      rbarr: [10509],
      rbbrk: [10099],
      rbrace: [125],
      rbrack: [93],
      rbrke: [10636],
      rbrksld: [10638],
      rbrkslu: [10640],
      rcaron: [345],
      rcedil: [343],
      rceil: [8969],
      rcub: [125],
      rcy: [1088],
      rdca: [10551],
      rdldhar: [10601],
      rdquo: [8221],
      rdquor: [8221],
      rdsh: [8627],
      real: [8476],
      realine: [8475],
      realpart: [8476],
      reals: [8477],
      rect: [9645],
      reg: [174],
      rfisht: [10621],
      rfloor: [8971],
      rfr: [120111],
      rhard: [8641],
      rharu: [8640],
      rharul: [10604],
      rho: [961],
      rhov: [1009],
      rightarrow: [8594],
      rightarrowtail: [8611],
      rightharpoondown: [8641],
      rightharpoonup: [8640],
      rightleftarrows: [8644],
      rightleftharpoons: [8652],
      rightrightarrows: [8649],
      rightsquigarrow: [8605],
      rightthreetimes: [8908],
      ring: [730],
      risingdotseq: [8787],
      rlarr: [8644],
      rlhar: [8652],
      rlm: [8207],
      rmoust: [9137],
      rmoustache: [9137],
      rnmid: [10990],
      roang: [10221],
      roarr: [8702],
      robrk: [10215],
      ropar: [10630],
      ropf: [120163],
      roplus: [10798],
      rotimes: [10805],
      rpar: [41],
      rpargt: [10644],
      rppolint: [10770],
      rrarr: [8649],
      rsaquo: [8250],
      rscr: [120007],
      rsh: [8625],
      rsqb: [93],
      rsquo: [8217],
      rsquor: [8217],
      rthree: [8908],
      rtimes: [8906],
      rtri: [9657],
      rtrie: [8885],
      rtrif: [9656],
      rtriltri: [10702],
      ruluhar: [10600],
      rx: [8478],
      sacute: [347],
      sbquo: [8218],
      sc: [8827],
      scE: [10932],
      scap: [10936],
      scaron: [353],
      sccue: [8829],
      sce: [10928],
      scedil: [351],
      scirc: [349],
      scnE: [10934],
      scnap: [10938],
      scnsim: [8937],
      scpolint: [10771],
      scsim: [8831],
      scy: [1089],
      sdot: [8901],
      sdotb: [8865],
      sdote: [10854],
      seArr: [8664],
      searhk: [10533],
      searr: [8600],
      searrow: [8600],
      sect: [167],
      semi: [59],
      seswar: [10537],
      setminus: [8726],
      setmn: [8726],
      sext: [10038],
      sfr: [120112],
      sfrown: [8994],
      sharp: [9839],
      shchcy: [1097],
      shcy: [1096],
      shortmid: [8739],
      shortparallel: [8741],
      shy: [173],
      sigma: [963],
      sigmaf: [962],
      sigmav: [962],
      sim: [8764],
      simdot: [10858],
      sime: [8771],
      simeq: [8771],
      simg: [10910],
      simgE: [10912],
      siml: [10909],
      simlE: [10911],
      simne: [8774],
      simplus: [10788],
      simrarr: [10610],
      slarr: [8592],
      smallsetminus: [8726],
      smashp: [10803],
      smeparsl: [10724],
      smid: [8739],
      smile: [8995],
      smt: [10922],
      smte: [10924],
      smtes: [10924, 65024],
      softcy: [1100],
      sol: [47],
      solb: [10692],
      solbar: [9023],
      sopf: [120164],
      spades: [9824],
      spadesuit: [9824],
      spar: [8741],
      sqcap: [8851],
      sqcaps: [8851, 65024],
      sqcup: [8852],
      sqcups: [8852, 65024],
      sqsub: [8847],
      sqsube: [8849],
      sqsubset: [8847],
      sqsubseteq: [8849],
      sqsup: [8848],
      sqsupe: [8850],
      sqsupset: [8848],
      sqsupseteq: [8850],
      squ: [9633],
      square: [9633],
      squarf: [9642],
      squf: [9642],
      srarr: [8594],
      sscr: [120008],
      ssetmn: [8726],
      ssmile: [8995],
      sstarf: [8902],
      star: [9734],
      starf: [9733],
      straightepsilon: [1013],
      straightphi: [981],
      strns: [175],
      sub: [8834],
      subE: [10949],
      subdot: [10941],
      sube: [8838],
      subedot: [10947],
      submult: [10945],
      subnE: [10955],
      subne: [8842],
      subplus: [10943],
      subrarr: [10617],
      subset: [8834],
      subseteq: [8838],
      subseteqq: [10949],
      subsetneq: [8842],
      subsetneqq: [10955],
      subsim: [10951],
      subsub: [10965],
      subsup: [10963],
      succ: [8827],
      succapprox: [10936],
      succcurlyeq: [8829],
      succeq: [10928],
      succnapprox: [10938],
      succneqq: [10934],
      succnsim: [8937],
      succsim: [8831],
      sum: [8721],
      sung: [9834],
      sup: [8835],
      sup1: [185],
      sup2: [178],
      sup3: [179],
      supE: [10950],
      supdot: [10942],
      supdsub: [10968],
      supe: [8839],
      supedot: [10948],
      suphsol: [10185],
      suphsub: [10967],
      suplarr: [10619],
      supmult: [10946],
      supnE: [10956],
      supne: [8843],
      supplus: [10944],
      supset: [8835],
      supseteq: [8839],
      supseteqq: [10950],
      supsetneq: [8843],
      supsetneqq: [10956],
      supsim: [10952],
      supsub: [10964],
      supsup: [10966],
      swArr: [8665],
      swarhk: [10534],
      swarr: [8601],
      swarrow: [8601],
      swnwar: [10538],
      szlig: [223],
      target: [8982],
      tau: [964],
      tbrk: [9140],
      tcaron: [357],
      tcedil: [355],
      tcy: [1090],
      tdot: [8411],
      telrec: [8981],
      tfr: [120113],
      there4: [8756],
      therefore: [8756],
      theta: [952],
      thetasym: [977],
      thetav: [977],
      thickapprox: [8776],
      thicksim: [8764],
      thinsp: [8201],
      thkap: [8776],
      thksim: [8764],
      thorn: [254],
      tilde: [732],
      times: [215],
      timesb: [8864],
      timesbar: [10801],
      timesd: [10800],
      tint: [8749],
      toea: [10536],
      top: [8868],
      topbot: [9014],
      topcir: [10993],
      topf: [120165],
      topfork: [10970],
      tosa: [10537],
      tprime: [8244],
      trade: [8482],
      triangle: [9653],
      triangledown: [9663],
      triangleleft: [9667],
      trianglelefteq: [8884],
      triangleq: [8796],
      triangleright: [9657],
      trianglerighteq: [8885],
      tridot: [9708],
      trie: [8796],
      triminus: [10810],
      triplus: [10809],
      trisb: [10701],
      tritime: [10811],
      trpezium: [9186],
      tscr: [120009],
      tscy: [1094],
      tshcy: [1115],
      tstrok: [359],
      twixt: [8812],
      twoheadleftarrow: [8606],
      twoheadrightarrow: [8608],
      uArr: [8657],
      uHar: [10595],
      uacute: [250],
      uarr: [8593],
      ubrcy: [1118],
      ubreve: [365],
      ucirc: [251],
      ucy: [1091],
      udarr: [8645],
      udblac: [369],
      udhar: [10606],
      ufisht: [10622],
      ufr: [120114],
      ugrave: [249],
      uharl: [8639],
      uharr: [8638],
      uhblk: [9600],
      ulcorn: [8988],
      ulcorner: [8988],
      ulcrop: [8975],
      ultri: [9720],
      umacr: [363],
      uml: [168],
      uogon: [371],
      uopf: [120166],
      uparrow: [8593],
      updownarrow: [8597],
      upharpoonleft: [8639],
      upharpoonright: [8638],
      uplus: [8846],
      upsi: [965],
      upsih: [978],
      upsilon: [965],
      upuparrows: [8648],
      urcorn: [8989],
      urcorner: [8989],
      urcrop: [8974],
      uring: [367],
      urtri: [9721],
      uscr: [120010],
      utdot: [8944],
      utilde: [361],
      utri: [9653],
      utrif: [9652],
      uuarr: [8648],
      uuml: [252],
      uwangle: [10663],
      vArr: [8661],
      vBar: [10984],
      vBarv: [10985],
      vDash: [8872],
      vangrt: [10652],
      varepsilon: [1013],
      varkappa: [1008],
      varnothing: [8709],
      varphi: [981],
      varpi: [982],
      varpropto: [8733],
      varr: [8597],
      varrho: [1009],
      varsigma: [962],
      varsubsetneq: [8842, 65024],
      varsubsetneqq: [10955, 65024],
      varsupsetneq: [8843, 65024],
      varsupsetneqq: [10956, 65024],
      vartheta: [977],
      vartriangleleft: [8882],
      vartriangleright: [8883],
      vcy: [1074],
      vdash: [8866],
      vee: [8744],
      veebar: [8891],
      veeeq: [8794],
      vellip: [8942],
      verbar: [124],
      vert: [124],
      vfr: [120115],
      vltri: [8882],
      vnsub: [8834, 8402],
      vnsup: [8835, 8402],
      vopf: [120167],
      vprop: [8733],
      vrtri: [8883],
      vscr: [120011],
      vsubnE: [10955, 65024],
      vsubne: [8842, 65024],
      vsupnE: [10956, 65024],
      vsupne: [8843, 65024],
      vzigzag: [10650],
      wcirc: [373],
      wedbar: [10847],
      wedge: [8743],
      wedgeq: [8793],
      weierp: [8472],
      wfr: [120116],
      wopf: [120168],
      wp: [8472],
      wr: [8768],
      wreath: [8768],
      wscr: [120012],
      xcap: [8898],
      xcirc: [9711],
      xcup: [8899],
      xdtri: [9661],
      xfr: [120117],
      xhArr: [10234],
      xharr: [10231],
      xi: [958],
      xlArr: [10232],
      xlarr: [10229],
      xmap: [10236],
      xnis: [8955],
      xodot: [10752],
      xopf: [120169],
      xoplus: [10753],
      xotime: [10754],
      xrArr: [10233],
      xrarr: [10230],
      xscr: [120013],
      xsqcup: [10758],
      xuplus: [10756],
      xutri: [9651],
      xvee: [8897],
      xwedge: [8896],
      yacute: [253],
      yacy: [1103],
      ycirc: [375],
      ycy: [1099],
      yen: [165],
      yfr: [120118],
      yicy: [1111],
      yopf: [120170],
      yscr: [120014],
      yucy: [1102],
      yuml: [255],
      zacute: [378],
      zcaron: [382],
      zcy: [1079],
      zdot: [380],
      zeetrf: [8488],
      zeta: [950],
      zfr: [120119],
      zhcy: [1078],
      zigrarr: [8669],
      zopf: [120171],
      zscr: [120015],
      zwj: [8205],
      zwnj: [8204]
    };
  });
enifed("simple-html-tokenizer/char-refs/min",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = {
      quot: [34],
      amp: [38],
      apos: [39],
      lt: [60],
      gt: [62]
    };
  });
enifed("simple-html-tokenizer/entity-parser",
  ["exports"],
  function(__exports__) {
    "use strict";
    function EntityParser(namedCodepoints) {
      this.namedCodepoints = namedCodepoints;
    }

    EntityParser.prototype.parse = function (tokenizer) {
      var input = tokenizer.input.slice(tokenizer["char"]);
      var matches = input.match(/^#(?:x|X)([0-9A-Fa-f]+);/);
      if (matches) {
        tokenizer["char"] += matches[0].length;
        return String.fromCharCode(parseInt(matches[1], 16));
      }
      matches = input.match(/^#([0-9]+);/);
      if (matches) {
        tokenizer["char"] += matches[0].length;
        return String.fromCharCode(parseInt(matches[1], 10));
      }
      matches = input.match(/^([A-Za-z]+);/);
      if (matches) {
        var codepoints = this.namedCodepoints[matches[1]];
        if (codepoints) {
          tokenizer["char"] += matches[0].length;
          for (var i = 0, buffer = ''; i < codepoints.length; i++) {
            buffer += String.fromCharCode(codepoints[i]);
          }
          return buffer;
        }
      }
    };

    __exports__["default"] = EntityParser;
  });
enifed("simple-html-tokenizer/generate",
  ["./generator","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Generator = __dependency1__["default"];

    __exports__["default"] = function generate(tokens) {
      var generator = new Generator();
      return generator.generate(tokens);
    }
  });
enifed("simple-html-tokenizer/generator",
  ["exports"],
  function(__exports__) {
    "use strict";
    var escape =  (function () {
      var test = /[&<>"'`]/;
      var replace = /[&<>"'`]/g;
      var map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      function escapeChar(char) {
        return map["char"];
      }
      return function escape(string) {
        if(!test.test(string)) {
          return string;
        }
        return string.replace(replace, escapeChar);
      };
    }());

    function Generator() {
      this.escape = escape;
    }

    Generator.prototype = {
      generate: function (tokens) {
        var buffer = '';
        var token;
        for (var i=0; i<tokens.length; i++) {
          token = tokens[i];
          buffer += this[token.type](token);
        }
        return buffer;
      },

      escape: function (text) {
        var unsafeCharsMap = this.unsafeCharsMap;
        return text.replace(this.unsafeChars, function (char) {
          return unsafeCharsMap["char"] || char;
        });
      },

      StartTag: function (token) {
        var out = "<";
        out += token.tagName;

        if (token.attributes.length) {
          out += " " + this.Attributes(token.attributes);
        }

        out += ">";

        return out;
      },

      EndTag: function (token) {
        return "</" + token.tagName + ">";
      },

      Chars: function (token) {
        return this.escape(token.chars);
      },

      Comment: function (token) {
        return "<!--" + token.chars + "-->";
      },

      Attributes: function (attributes) {
        var out = [], attribute;

        for (var i=0, l=attributes.length; i<l; i++) {
          attribute = attributes[i];

          out.push(this.Attribute(attribute[0], attribute[1]));
        }

        return out.join(" ");
      },

      Attribute: function (name, value) {
        var attrString = name;

        if (value) {
          value = this.escape(value);
          attrString += "=\"" + value + "\"";
        }

        return attrString;
      }
    };

    __exports__["default"] = Generator;
  });
enifed("simple-html-tokenizer/tokenize",
  ["./tokenizer","./entity-parser","./char-refs/full","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Tokenizer = __dependency1__["default"];
    var EntityParser = __dependency2__["default"];
    var namedCodepoints = __dependency3__["default"];

    __exports__["default"] = function tokenize(input) {
      var tokenizer = new Tokenizer(input, new EntityParser(namedCodepoints));
      return tokenizer.tokenize();
    }
  });
enifed("simple-html-tokenizer/tokenizer",
  ["./utils","./tokens","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var preprocessInput = __dependency1__.preprocessInput;
    var isAlpha = __dependency1__.isAlpha;
    var isSpace = __dependency1__.isSpace;
    var StartTag = __dependency2__.StartTag;
    var EndTag = __dependency2__.EndTag;
    var Chars = __dependency2__.Chars;
    var Comment = __dependency2__.Comment;

    function Tokenizer(input, entityParser) {
      this.input = preprocessInput(input);
      this.entityParser = entityParser;
      this["char"] = 0;
      this.line = 1;
      this.column = 0;

      this.state = 'data';
      this.token = null;
    }

    Tokenizer.prototype = {
      tokenize: function() {
        var tokens = [], token;

        while (true) {
          token = this.lex();
          if (token === 'EOF') { break; }
          if (token) { tokens.push(token); }
        }

        if (this.token) {
          tokens.push(this.token);
        }

        return tokens;
      },

      tokenizePart: function(string) {
        this.input += preprocessInput(string);
        var tokens = [], token;

        while (this["char"] < this.input.length) {
          token = this.lex();
          if (token) { tokens.push(token); }
        }

        this.tokens = (this.tokens || []).concat(tokens);
        return tokens;
      },

      tokenizeEOF: function() {
        var token = this.token;
        if (token) {
          this.token = null;
          return token;
        }
      },

      createTag: function(Type, char) {
        var lastToken = this.token;
        this.token = new Type(char);
        this.state = 'tagName';
        return lastToken;
      },

      addToTagName: function(char) {
        this.token.tagName += char;
      },

      selfClosing: function() {
        this.token.selfClosing = true;
      },

      createAttribute: function(char) {
        this._currentAttribute = [char.toLowerCase(), "", null];
        this.token.attributes.push(this._currentAttribute);
        this.state = 'attributeName';
      },

      addToAttributeName: function(char) {
        this._currentAttribute[0] += char;
      },

      markAttributeQuoted: function(value) {
        this._currentAttribute[2] = value;
      },

      finalizeAttributeValue: function() {
        if (this._currentAttribute) {
          if (this._currentAttribute[2] === null) {
            this._currentAttribute[2] = false;
          }
          this._currentAttribute = undefined;
        }
      },

      addToAttributeValue: function(char) {
        this._currentAttribute[1] = this._currentAttribute[1] || "";
        this._currentAttribute[1] += char;
      },

      createComment: function() {
        var lastToken = this.token;
        this.token = new Comment();
        this.state = 'commentStart';
        return lastToken;
      },

      addToComment: function(char) {
        this.addChar(char);
      },

      addChar: function(char) {
        this.token.chars += char;
      },

      finalizeToken: function() {
        if (this.token.type === 'StartTag') {
          this.finalizeAttributeValue();
        }
        return this.token;
      },

      emitData: function() {
        this.addLocInfo(this.line, this.column - 1);
        var lastToken = this.token;
        this.token = null;
        this.state = 'tagOpen';
        return lastToken;
      },

      emitToken: function() {
        this.addLocInfo();
        var lastToken = this.finalizeToken();
        this.token = null;
        this.state = 'data';
        return lastToken;
      },

      addData: function(char) {
        if (this.token === null) {
          this.token = new Chars();
          this.markFirst();
        }

        this.addChar(char);
      },

      markFirst: function(line, column) {
        this.firstLine = (line === 0) ? 0 : (line || this.line);
        this.firstColumn = (column === 0) ? 0 : (column || this.column);
      },

      addLocInfo: function(line, column) {
        if (!this.token) {
          return;
        }
        this.token.firstLine = this.firstLine;
        this.token.firstColumn = this.firstColumn;
        this.token.lastLine = (line === 0) ? 0 : (line || this.line);
        this.token.lastColumn = (column === 0) ? 0 : (column || this.column);
      },

      consumeCharRef: function() {
        return this.entityParser.parse(this);
      },

      lex: function() {
        var char = this.input.charAt(this["char"]++);

        if (char) {
          if (char === "\n") {
            this.line++;
            this.column = 0;
          } else {
            this.column++;
          }
          return this.states[this.state].call(this, char);
        } else {
          this.addLocInfo(this.line, this.column);
          return 'EOF';
        }
      },

      states: {
        data: function(char) {
          if (char === "<") {
            var chars = this.emitData();
            this.markFirst();
            return chars;
          } else if (char === "&") {
            this.addData(this.consumeCharRef() || "&");
          } else {
            this.addData(char);
          }
        },

        tagOpen: function(char) {
          if (char === "!") {
            this.state = 'markupDeclaration';
          } else if (char === "/") {
            this.state = 'endTagOpen';
          } else if (isAlpha(char)) {
            return this.createTag(StartTag, char.toLowerCase());
          }
        },

        markupDeclaration: function(char) {
          if (char === "-" && this.input.charAt(this["char"]) === "-") {
            this["char"]++;
            this.createComment();
          }
        },

        commentStart: function(char) {
          if (char === "-") {
            this.state = 'commentStartDash';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.addToComment(char);
            this.state = 'comment';
          }
        },

        commentStartDash: function(char) {
          if (char === "-") {
            this.state = 'commentEnd';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.addToComment("-");
            this.state = 'comment';
          }
        },

        comment: function(char) {
          if (char === "-") {
            this.state = 'commentEndDash';
          } else {
            this.addToComment(char);
          }
        },

        commentEndDash: function(char) {
          if (char === "-") {
            this.state = 'commentEnd';
          } else {
            this.addToComment("-" + char);
            this.state = 'comment';
          }
        },

        commentEnd: function(char) {
          if (char === ">") {
            return this.emitToken();
          } else {
            this.addToComment("--" + char);
            this.state = 'comment';
          }
        },

        tagName: function(char) {
          if (isSpace(char)) {
            this.state = 'beforeAttributeName';
          } else if (char === "/") {
            this.state = 'selfClosingStartTag';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.addToTagName(char);
          }
        },

        beforeAttributeName: function(char) {
          if (isSpace(char)) {
            return;
          } else if (char === "/") {
            this.state = 'selfClosingStartTag';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.createAttribute(char);
          }
        },

        attributeName: function(char) {
          if (isSpace(char)) {
            this.state = 'afterAttributeName';
          } else if (char === "/") {
            this.state = 'selfClosingStartTag';
          } else if (char === "=") {
            this.state = 'beforeAttributeValue';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.addToAttributeName(char);
          }
        },

        afterAttributeName: function(char) {
          if (isSpace(char)) {
            return;
          } else if (char === "/") {
            this.state = 'selfClosingStartTag';
          } else if (char === "=") {
            this.state = 'beforeAttributeValue';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.finalizeAttributeValue();
            this.createAttribute(char);
          }
        },

        beforeAttributeValue: function(char) {
          if (isSpace(char)) {
            return;
          } else if (char === '"') {
            this.state = 'attributeValueDoubleQuoted';
            this.markAttributeQuoted(true);
          } else if (char === "'") {
            this.state = 'attributeValueSingleQuoted';
            this.markAttributeQuoted(true);
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.state = 'attributeValueUnquoted';
            this.markAttributeQuoted(false);
            this.addToAttributeValue(char);
          }
        },

        attributeValueDoubleQuoted: function(char) {
          if (char === '"') {
            this.finalizeAttributeValue();
            this.state = 'afterAttributeValueQuoted';
          } else if (char === "&") {
            this.addToAttributeValue(this.consumeCharRef('"') || "&");
          } else {
            this.addToAttributeValue(char);
          }
        },

        attributeValueSingleQuoted: function(char) {
          if (char === "'") {
            this.finalizeAttributeValue();
            this.state = 'afterAttributeValueQuoted';
          } else if (char === "&") {
            this.addToAttributeValue(this.consumeCharRef("'") || "&");
          } else {
            this.addToAttributeValue(char);
          }
        },

        attributeValueUnquoted: function(char) {
          if (isSpace(char)) {
            this.finalizeAttributeValue();
            this.state = 'beforeAttributeName';
          } else if (char === "&") {
            this.addToAttributeValue(this.consumeCharRef(">") || "&");
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this.addToAttributeValue(char);
          }
        },

        afterAttributeValueQuoted: function(char) {
          if (isSpace(char)) {
            this.state = 'beforeAttributeName';
          } else if (char === "/") {
            this.state = 'selfClosingStartTag';
          } else if (char === ">") {
            return this.emitToken();
          } else {
            this["char"]--;
            this.state = 'beforeAttributeName';
          }
        },

        selfClosingStartTag: function(char) {
          if (char === ">") {
            this.selfClosing();
            return this.emitToken();
          } else {
            this["char"]--;
            this.state = 'beforeAttributeName';
          }
        },

        endTagOpen: function(char) {
          if (isAlpha(char)) {
            this.createTag(EndTag, char.toLowerCase());
          }
        }
      }
    };

    __exports__["default"] = Tokenizer;
  });
enifed("simple-html-tokenizer/tokens",
  ["exports"],
  function(__exports__) {
    "use strict";
    function StartTag(tagName, attributes, selfClosing) {
      this.type = 'StartTag';
      this.tagName = tagName || '';
      this.attributes = attributes || [];
      this.selfClosing = selfClosing === true;
    }

    __exports__.StartTag = StartTag;function EndTag(tagName) {
      this.type = 'EndTag';
      this.tagName = tagName || '';
    }

    __exports__.EndTag = EndTag;function Chars(chars) {
      this.type = 'Chars';
      this.chars = chars || "";
    }

    __exports__.Chars = Chars;function Comment(chars) {
      this.type = 'Comment';
      this.chars = chars || '';
    }

    __exports__.Comment = Comment;
  });
enifed("simple-html-tokenizer/utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    function isSpace(char) {
      return (/[\t\n\f ]/).test(char);
    }

    __exports__.isSpace = isSpace;function isAlpha(char) {
      return (/[A-Za-z]/).test(char);
    }

    __exports__.isAlpha = isAlpha;function preprocessInput(input) {
      return input.replace(/\r\n?/g, "\n");
    }

    __exports__.preprocessInput = preprocessInput;
  });
requireModule("ember-template-compiler");

})();
;
if (typeof exports === "object") {
  module.exports = Ember.__loader.require("ember-template-compiler");
 }
;/*
 * Scroller
 * http://github.com/zynga/scroller
 *
 * Copyright 2011, Zynga Inc.
 * Licensed under the MIT License.
 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 */

/**
 * Generic animation class with support for dropped frames both optional easing and duration.
 *
 * Optional duration is useful when the lifetime is defined by another condition than time
 * e.g. speed of an animating object, etc.
 *
 * Dropped frame logic allows to keep using the same updater logic independent from the actual
 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
 * based on the pure time difference.
 */
(function(global) {
	var time = Date.now || function() {
		return +new Date();
	};
	var desiredFrames = 60;
	var millisecondsPerSecond = 1000;
	var running = {};
	var counter = 1;

	// Create namespaces
	if (!global.core) {
		global.core = { effect : {} };

	} else if (!core.effect) {
		core.effect = {};
	}

	core.effect.Animate = {

		/**
		 * A requestAnimationFrame wrapper / polyfill.
		 *
		 * @param callback {Function} The callback to be invoked before the next repaint.
		 * @param root {HTMLElement} The root element for the repaint
		 */
		requestAnimationFrame: (function() {

			// Check for request animation Frame support
			var requestFrame = global.requestAnimationFrame || global.webkitRequestAnimationFrame || global.mozRequestAnimationFrame || global.oRequestAnimationFrame;
			var isNative = !!requestFrame;

			if (requestFrame && !/requestAnimationFrame\(\)\s*\{\s*\[native code\]\s*\}/i.test(requestFrame.toString())) {
				isNative = false;
			}

			if (isNative) {
				return function(callback, root) {
					requestFrame(callback, root)
				};
			}

			var TARGET_FPS = 60;
			var requests = {};
			var requestCount = 0;
			var rafHandle = 1;
			var intervalHandle = null;
			var lastActive = +new Date();

			return function(callback, root) {
				var callbackHandle = rafHandle++;

				// Store callback
				requests[callbackHandle] = callback;
				requestCount++;

				// Create timeout at first request
				if (intervalHandle === null) {

					intervalHandle = setInterval(function() {

						var time = +new Date();
						var currentRequests = requests;

						// Reset data structure before executing callbacks
						requests = {};
						requestCount = 0;

						for(var key in currentRequests) {
							if (currentRequests.hasOwnProperty(key)) {
								currentRequests[key](time);
								lastActive = time;
							}
						}

						// Disable the timeout when nothing happens for a certain
						// period of time
						if (time - lastActive > 2500) {
							clearInterval(intervalHandle);
							intervalHandle = null;
						}

					}, 1000 / TARGET_FPS);
				}

				return callbackHandle;
			};

		})(),


		/**
		 * Stops the given animation.
		 *
		 * @param id {Integer} Unique animation ID
		 * @return {Boolean} Whether the animation was stopped (aka, was running before)
		 */
		stop: function(id) {
			var cleared = running[id] != null;
			if (cleared) {
				running[id] = null;
			}

			return cleared;
		},


		/**
		 * Whether the given animation is still running.
		 *
		 * @param id {Integer} Unique animation ID
		 * @return {Boolean} Whether the animation is still running
		 */
		isRunning: function(id) {
			return running[id] != null;
		},


		/**
		 * Start the animation.
		 *
		 * @param stepCallback {Function} Pointer to function which is executed on every step.
		 *   Signature of the method should be `function(percent, now, virtual) { return continueWithAnimation; }`
		 * @param verifyCallback {Function} Executed before every animation step.
		 *   Signature of the method should be `function() { return continueWithAnimation; }`
		 * @param completedCallback {Function}
		 *   Signature of the method should be `function(droppedFrames, finishedAnimation) {}`
		 * @param duration {Integer} Milliseconds to run the animation
		 * @param easingMethod {Function} Pointer to easing function
		 *   Signature of the method should be `function(percent) { return modifiedValue; }`
		 * @param root {Element ? document.body} Render root, when available. Used for internal
		 *   usage of requestAnimationFrame.
		 * @return {Integer} Identifier of animation. Can be used to stop it any time.
		 */
		start: function(stepCallback, verifyCallback, completedCallback, duration, easingMethod, root) {

			var start = time();
			var lastFrame = start;
			var percent = 0;
			var dropCounter = 0;
			var id = counter++;

			if (!root) {
				root = document.body;
			}

			// Compacting running db automatically every few new animations
			if (id % 20 === 0) {
				var newRunning = {};
				for (var usedId in running) {
					newRunning[usedId] = true;
				}
				running = newRunning;
			}

			// This is the internal step method which is called every few milliseconds
			var step = function(virtual) {

				// Normalize virtual value
				var render = virtual !== true;

				// Get current time
				var now = time();

				// Verification is executed before next animation step
				if (!running[id] || (verifyCallback && !verifyCallback(id))) {

					running[id] = null;
					completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false);
					return;

				}

				// For the current rendering to apply let's update omitted steps in memory.
				// This is important to bring internal state variables up-to-date with progress in time.
				if (render) {

					var droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
					for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
						step(true);
						dropCounter++;
					}

				}

				// Compute percent value
				if (duration) {
					percent = (now - start) / duration;
					if (percent > 1) {
						percent = 1;
					}
				}

				// Execute step callback, then...
				var value = easingMethod ? easingMethod(percent) : percent;
				if ((stepCallback(value, now, render) === false || percent === 1) && render) {
					running[id] = null;
					completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, percent === 1 || duration == null);
				} else if (render) {
					lastFrame = now;
					core.effect.Animate.requestAnimationFrame(step, root);
				}
			};

			// Mark as running
			running[id] = true;

			// Init first step
			core.effect.Animate.requestAnimationFrame(step, root);

			// Return unique animation ID
			return id;
		}
	};
})(this);


;/*
 * Scroller
 * http://github.com/zynga/scroller
 *
 * Copyright 2011, Zynga Inc.
 * Licensed under the MIT License.
 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 */

var Scroller;

(function() {
	var NOOP = function(){};

	/**
	 * A pure logic 'component' for 'virtual' scrolling/zooming.
	 */
	Scroller = function(callback, options) {

		this.__callback = callback;

		this.options = {

			/** Enable scrolling on x-axis */
			scrollingX: true,

			/** Enable scrolling on y-axis */
			scrollingY: true,

			/** Enable animations for deceleration, snap back, zooming and scrolling */
			animating: true,

			/** duration for animations triggered by scrollTo/zoomTo */
			animationDuration: 250,

			/** Enable bouncing (content can be slowly moved outside and jumps back after releasing) */
			bouncing: true,

			/** Enable locking to the main axis if user moves only slightly on one of them at start */
			locking: true,

			/** Enable pagination mode (switching between full page content panes) */
			paging: false,

			/** Enable snapping of content to a configured pixel grid */
			snapping: false,

			/** Enable zooming of content via API, fingers and mouse wheel */
			zooming: false,

			/** Minimum zoom level */
			minZoom: 0.5,

			/** Maximum zoom level */
			maxZoom: 3,

			/** Multiply or decrease scrolling speed **/
			speedMultiplier: 1,

			/** Callback that is fired on the later of touch end or deceleration end,
				provided that another scrolling action has not begun. Used to know
				when to fade out a scrollbar. */
			scrollingComplete: NOOP,
			
			/** This configures the amount of change applied to deceleration when reaching boundaries  **/
            penetrationDeceleration : 0.03,

            /** This configures the amount of change applied to acceleration when reaching boundaries  **/
            penetrationAcceleration : 0.08

		};

		for (var key in options) {
			this.options[key] = options[key];
		}

	};


	// Easing Equations (c) 2003 Robert Penner, all rights reserved.
	// Open source under the BSD License.

	/**
	 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
	**/
	var easeOutCubic = function(pos) {
		return (Math.pow((pos - 1), 3) + 1);
	};

	/**
	 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
	**/
	var easeInOutCubic = function(pos) {
		if ((pos /= 0.5) < 1) {
			return 0.5 * Math.pow(pos, 3);
		}

		return 0.5 * (Math.pow((pos - 2), 3) + 2);
	};


	var members = {

		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: STATUS
		---------------------------------------------------------------------------
		*/

		/** {Boolean} Whether only a single finger is used in touch handling */
		__isSingleTouch: false,

		/** {Boolean} Whether a touch event sequence is in progress */
		__isTracking: false,

		/** {Boolean} Whether a deceleration animation went to completion. */
		__didDecelerationComplete: false,

		/**
		 * {Boolean} Whether a gesture zoom/rotate event is in progress. Activates when
		 * a gesturestart event happens. This has higher priority than dragging.
		 */
		__isGesturing: false,

		/**
		 * {Boolean} Whether the user has moved by such a distance that we have enabled
		 * dragging mode. Hint: It's only enabled after some pixels of movement to
		 * not interrupt with clicks etc.
		 */
		__isDragging: false,

		/**
		 * {Boolean} Not touching and dragging anymore, and smoothly animating the
		 * touch sequence using deceleration.
		 */
		__isDecelerating: false,

		/**
		 * {Boolean} Smoothly animating the currently configured change
		 */
		__isAnimating: false,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: DIMENSIONS
		---------------------------------------------------------------------------
		*/

		/** {Integer} Available outer left position (from document perspective) */
		__clientLeft: 0,

		/** {Integer} Available outer top position (from document perspective) */
		__clientTop: 0,

		/** {Integer} Available outer width */
		__clientWidth: 0,

		/** {Integer} Available outer height */
		__clientHeight: 0,

		/** {Integer} Outer width of content */
		__contentWidth: 0,

		/** {Integer} Outer height of content */
		__contentHeight: 0,

		/** {Integer} Snapping width for content */
		__snapWidth: 100,

		/** {Integer} Snapping height for content */
		__snapHeight: 100,

		/** {Integer} Height to assign to refresh area */
		__refreshHeight: null,

		/** {Boolean} Whether the refresh process is enabled when the event is released now */
		__refreshActive: false,

		/** {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release */
		__refreshActivate: null,

		/** {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled */
		__refreshDeactivate: null,

		/** {Function} Callback to execute to start the actual refresh. Call {@link #refreshFinish} when done */
		__refreshStart: null,

		/** {Number} Zoom level */
		__zoomLevel: 1,

		/** {Number} Scroll position on x-axis */
		__scrollLeft: 0,

		/** {Number} Scroll position on y-axis */
		__scrollTop: 0,

		/** {Integer} Maximum allowed scroll position on x-axis */
		__maxScrollLeft: 0,

		/** {Integer} Maximum allowed scroll position on y-axis */
		__maxScrollTop: 0,

		/* {Number} Scheduled left position (final position when animating) */
		__scheduledLeft: 0,

		/* {Number} Scheduled top position (final position when animating) */
		__scheduledTop: 0,

		/* {Number} Scheduled zoom level (final scale when animating) */
		__scheduledZoom: 0,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: LAST POSITIONS
		---------------------------------------------------------------------------
		*/

		/** {Number} Left position of finger at start */
		__lastTouchLeft: null,

		/** {Number} Top position of finger at start */
		__lastTouchTop: null,

		/** {Date} Timestamp of last move of finger. Used to limit tracking range for deceleration speed. */
		__lastTouchMove: null,

		/** {Array} List of positions, uses three indexes for each state: left, top, timestamp */
		__positions: null,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: DECELERATION SUPPORT
		---------------------------------------------------------------------------
		*/

		/** {Integer} Minimum left scroll position during deceleration */
		__minDecelerationScrollLeft: null,

		/** {Integer} Minimum top scroll position during deceleration */
		__minDecelerationScrollTop: null,

		/** {Integer} Maximum left scroll position during deceleration */
		__maxDecelerationScrollLeft: null,

		/** {Integer} Maximum top scroll position during deceleration */
		__maxDecelerationScrollTop: null,

		/** {Number} Current factor to modify horizontal scroll position with on every step */
		__decelerationVelocityX: null,

		/** {Number} Current factor to modify vertical scroll position with on every step */
		__decelerationVelocityY: null,



		/*
		---------------------------------------------------------------------------
			PUBLIC API
		---------------------------------------------------------------------------
		*/

		/**
		 * Configures the dimensions of the client (outer) and content (inner) elements.
		 * Requires the available space for the outer element and the outer size of the inner element.
		 * All values which are falsy (null or zero etc.) are ignored and the old value is kept.
		 *
		 * @param clientWidth {Integer ? null} Inner width of outer element
		 * @param clientHeight {Integer ? null} Inner height of outer element
		 * @param contentWidth {Integer ? null} Outer width of inner element
		 * @param contentHeight {Integer ? null} Outer height of inner element
		 */
		setDimensions: function(clientWidth, clientHeight, contentWidth, contentHeight) {

			var self = this;

			// Only update values which are defined
			if (clientWidth === +clientWidth) {
				self.__clientWidth = clientWidth;
			}

			if (clientHeight === +clientHeight) {
				self.__clientHeight = clientHeight;
			}

			if (contentWidth === +contentWidth) {
				self.__contentWidth = contentWidth;
			}

			if (contentHeight === +contentHeight) {
				self.__contentHeight = contentHeight;
			}

			// Refresh maximums
			self.__computeScrollMax();

			// Refresh scroll position
			self.scrollTo(self.__scrollLeft, self.__scrollTop, true);

		},


		/**
		 * Sets the client coordinates in relation to the document.
		 *
		 * @param left {Integer ? 0} Left position of outer element
		 * @param top {Integer ? 0} Top position of outer element
		 */
		setPosition: function(left, top) {

			var self = this;

			self.__clientLeft = left || 0;
			self.__clientTop = top || 0;

		},


		/**
		 * Configures the snapping (when snapping is active)
		 *
		 * @param width {Integer} Snapping width
		 * @param height {Integer} Snapping height
		 */
		setSnapSize: function(width, height) {

			var self = this;

			self.__snapWidth = width;
			self.__snapHeight = height;

		},


		/**
		 * Activates pull-to-refresh. A special zone on the top of the list to start a list refresh whenever
		 * the user event is released during visibility of this zone. This was introduced by some apps on iOS like
		 * the official Twitter client.
		 *
		 * @param height {Integer} Height of pull-to-refresh zone on top of rendered list
		 * @param activateCallback {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release.
		 * @param deactivateCallback {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled.
		 * @param startCallback {Function} Callback to execute to start the real async refresh action. Call {@link #finishPullToRefresh} after finish of refresh.
		 */
		activatePullToRefresh: function(height, activateCallback, deactivateCallback, startCallback) {

			var self = this;

			self.__refreshHeight = height;
			self.__refreshActivate = activateCallback;
			self.__refreshDeactivate = deactivateCallback;
			self.__refreshStart = startCallback;

		},


		/**
		 * Signalizes that pull-to-refresh is finished.
		 */
		finishPullToRefresh: function() {

			var self = this;

			self.__refreshActive = false;
			if (self.__refreshDeactivate) {
				self.__refreshDeactivate();
			}

			self.scrollTo(self.__scrollLeft, self.__scrollTop, true);

		},


		/**
		 * Returns the scroll position and zooming values
		 *
		 * @return {Map} `left` and `top` scroll position and `zoom` level
		 */
		getValues: function() {

			var self = this;

			return {
				left: self.__scrollLeft,
				top: self.__scrollTop,
				zoom: self.__zoomLevel
			};

		},


		/**
		 * Returns the maximum scroll values
		 *
		 * @return {Map} `left` and `top` maximum scroll values
		 */
		getScrollMax: function() {

			var self = this;

			return {
				left: self.__maxScrollLeft,
				top: self.__maxScrollTop
			};

		},


		/**
		 * Zooms to the given level. Supports optional animation. Zooms
		 * the center when no coordinates are given.
		 *
		 * @param level {Number} Level to zoom to
		 * @param animate {Boolean ? false} Whether to use animation
		 * @param originLeft {Number ? null} Zoom in at given left coordinate
		 * @param originTop {Number ? null} Zoom in at given top coordinate
		 */
		zoomTo: function(level, animate, originLeft, originTop) {

			var self = this;

			if (!self.options.zooming) {
				throw new Error("Zooming is not enabled!");
			}

			// Stop deceleration
			if (self.__isDecelerating) {
				core.effect.Animate.stop(self.__isDecelerating);
				self.__isDecelerating = false;
			}

			var oldLevel = self.__zoomLevel;

			// Normalize input origin to center of viewport if not defined
			if (originLeft == null) {
				originLeft = self.__clientWidth / 2;
			}

			if (originTop == null) {
				originTop = self.__clientHeight / 2;
			}

			// Limit level according to configuration
			level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

			// Recompute maximum values while temporary tweaking maximum scroll ranges
			self.__computeScrollMax(level);

			// Recompute left and top coordinates based on new zoom level
			var left = ((originLeft + self.__scrollLeft) * level / oldLevel) - originLeft;
			var top = ((originTop + self.__scrollTop) * level / oldLevel) - originTop;

			// Limit x-axis
			if (left > self.__maxScrollLeft) {
				left = self.__maxScrollLeft;
			} else if (left < 0) {
				left = 0;
			}

			// Limit y-axis
			if (top > self.__maxScrollTop) {
				top = self.__maxScrollTop;
			} else if (top < 0) {
				top = 0;
			}

			// Push values out
			self.__publish(left, top, level, animate);

		},


		/**
		 * Zooms the content by the given factor.
		 *
		 * @param factor {Number} Zoom by given factor
		 * @param animate {Boolean ? false} Whether to use animation
		 * @param originLeft {Number ? 0} Zoom in at given left coordinate
		 * @param originTop {Number ? 0} Zoom in at given top coordinate
		 */
		zoomBy: function(factor, animate, originLeft, originTop) {

			var self = this;

			self.zoomTo(self.__zoomLevel * factor, animate, originLeft, originTop);

		},


		/**
		 * Scrolls to the given position. Respect limitations and snapping automatically.
		 *
		 * @param left {Number?null} Horizontal scroll position, keeps current if value is <code>null</code>
		 * @param top {Number?null} Vertical scroll position, keeps current if value is <code>null</code>
		 * @param animate {Boolean?false} Whether the scrolling should happen using an animation
		 * @param zoom {Number?null} Zoom level to go to
		 */
		scrollTo: function(left, top, animate, zoom) {

			var self = this;

			// Stop deceleration
			if (self.__isDecelerating) {
				core.effect.Animate.stop(self.__isDecelerating);
				self.__isDecelerating = false;
			}

			// Correct coordinates based on new zoom level
			if (zoom != null && zoom !== self.__zoomLevel) {

				if (!self.options.zooming) {
					throw new Error("Zooming is not enabled!");
				}

				left *= zoom;
				top *= zoom;

				// Recompute maximum values while temporary tweaking maximum scroll ranges
				self.__computeScrollMax(zoom);

			} else {

				// Keep zoom when not defined
				zoom = self.__zoomLevel;

			}

			if (!self.options.scrollingX) {

				left = self.__scrollLeft;

			} else {

				if (self.options.paging) {
					left = Math.round(left / self.__clientWidth) * self.__clientWidth;
				} else if (self.options.snapping) {
					left = Math.round(left / self.__snapWidth) * self.__snapWidth;
				}

			}

			if (!self.options.scrollingY) {

				top = self.__scrollTop;

			} else {

				if (self.options.paging) {
					top = Math.round(top / self.__clientHeight) * self.__clientHeight;
				} else if (self.options.snapping) {
					top = Math.round(top / self.__snapHeight) * self.__snapHeight;
				}

			}

			// Limit for allowed ranges
			left = Math.max(Math.min(self.__maxScrollLeft, left), 0);
			top = Math.max(Math.min(self.__maxScrollTop, top), 0);

			// Don't animate when no change detected, still call publish to make sure
			// that rendered position is really in-sync with internal data
			if (left === self.__scrollLeft && top === self.__scrollTop) {
				animate = false;
			}

			// Publish new values
			self.__publish(left, top, zoom, animate);

		},


		/**
		 * Scroll by the given offset
		 *
		 * @param left {Number ? 0} Scroll x-axis by given offset
		 * @param top {Number ? 0} Scroll x-axis by given offset
		 * @param animate {Boolean ? false} Whether to animate the given change
		 */
		scrollBy: function(left, top, animate) {

			var self = this;

			var startLeft = self.__isAnimating ? self.__scheduledLeft : self.__scrollLeft;
			var startTop = self.__isAnimating ? self.__scheduledTop : self.__scrollTop;

			self.scrollTo(startLeft + (left || 0), startTop + (top || 0), animate);

		},



		/*
		---------------------------------------------------------------------------
			EVENT CALLBACKS
		---------------------------------------------------------------------------
		*/

		/**
		 * Mouse wheel handler for zooming support
		 */
		doMouseZoom: function(wheelDelta, timeStamp, pageX, pageY) {

			var self = this;
			var change = wheelDelta > 0 ? 0.97 : 1.03;

			return self.zoomTo(self.__zoomLevel * change, false, pageX - self.__clientLeft, pageY - self.__clientTop);

		},


		/**
		 * Touch start handler for scrolling support
		 */
		doTouchStart: function(touches, timeStamp) {

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (timeStamp instanceof Date) {
				timeStamp = timeStamp.valueOf();
			}
			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Reset interruptedAnimation flag
			self.__interruptedAnimation = true;

			// Stop deceleration
			if (self.__isDecelerating) {
				core.effect.Animate.stop(self.__isDecelerating);
				self.__isDecelerating = false;
				self.__interruptedAnimation = true;
			}

			// Stop animation
			if (self.__isAnimating) {
				core.effect.Animate.stop(self.__isAnimating);
				self.__isAnimating = false;
				self.__interruptedAnimation = true;
			}

			// Use center point when dealing with two fingers
			var currentTouchLeft, currentTouchTop;
			var isSingleTouch = touches.length === 1;
			if (isSingleTouch) {
				currentTouchLeft = touches[0].pageX;
				currentTouchTop = touches[0].pageY;
			} else {
				currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
				currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
			}

			// Store initial positions
			self.__initialTouchLeft = currentTouchLeft;
			self.__initialTouchTop = currentTouchTop;

			// Store current zoom level
			self.__zoomLevelStart = self.__zoomLevel;

			// Store initial touch positions
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;

			// Store initial move time stamp
			self.__lastTouchMove = timeStamp;

			// Reset initial scale
			self.__lastScale = 1;

			// Reset locking flags
			self.__enableScrollX = !isSingleTouch && self.options.scrollingX;
			self.__enableScrollY = !isSingleTouch && self.options.scrollingY;

			// Reset tracking flag
			self.__isTracking = true;

			// Reset deceleration complete flag
			self.__didDecelerationComplete = false;

			// Dragging starts directly with two fingers, otherwise lazy with an offset
			self.__isDragging = !isSingleTouch;

			// Some features are disabled in multi touch scenarios
			self.__isSingleTouch = isSingleTouch;

			// Clearing data structure
			self.__positions = [];

		},


		/**
		 * Touch move handler for scrolling support
		 */
		doTouchMove: function(touches, timeStamp, scale) {

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (timeStamp instanceof Date) {
				timeStamp = timeStamp.valueOf();
			}
			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Ignore event when tracking is not enabled (event might be outside of element)
			if (!self.__isTracking) {
				return;
			}


			var currentTouchLeft, currentTouchTop;

			// Compute move based around of center of fingers
			if (touches.length === 2) {
				currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
				currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
			} else {
				currentTouchLeft = touches[0].pageX;
				currentTouchTop = touches[0].pageY;
			}

			var positions = self.__positions;

			// Are we already is dragging mode?
			if (self.__isDragging) {

				// Compute move distance
				var moveX = currentTouchLeft - self.__lastTouchLeft;
				var moveY = currentTouchTop - self.__lastTouchTop;

				// Read previous scroll position and zooming
				var scrollLeft = self.__scrollLeft;
				var scrollTop = self.__scrollTop;
				var level = self.__zoomLevel;

				// Work with scaling
				if (scale != null && self.options.zooming) {

					var oldLevel = level;

					// Recompute level based on previous scale and new scale
					level = level / self.__lastScale * scale;

					// Limit level according to configuration
					level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

					// Only do further compution when change happened
					if (oldLevel !== level) {

						// Compute relative event position to container
						var currentTouchLeftRel = currentTouchLeft - self.__clientLeft;
						var currentTouchTopRel = currentTouchTop - self.__clientTop;

						// Recompute left and top coordinates based on new zoom level
						scrollLeft = ((currentTouchLeftRel + scrollLeft) * level / oldLevel) - currentTouchLeftRel;
						scrollTop = ((currentTouchTopRel + scrollTop) * level / oldLevel) - currentTouchTopRel;

						// Recompute max scroll values
						self.__computeScrollMax(level);

					}
				}

				if (self.__enableScrollX) {

					scrollLeft -= moveX * this.options.speedMultiplier;
					var maxScrollLeft = self.__maxScrollLeft;

					if (scrollLeft > maxScrollLeft || scrollLeft < 0) {

						// Slow down on the edges
						if (self.options.bouncing) {

							scrollLeft += (moveX / 2  * this.options.speedMultiplier);

						} else if (scrollLeft > maxScrollLeft) {

							scrollLeft = maxScrollLeft;

						} else {

							scrollLeft = 0;

						}
					}
				}

				// Compute new vertical scroll position
				if (self.__enableScrollY) {

					scrollTop -= moveY * this.options.speedMultiplier;
					var maxScrollTop = self.__maxScrollTop;

					if (scrollTop > maxScrollTop || scrollTop < 0) {

						// Slow down on the edges
						if (self.options.bouncing) {

							scrollTop += (moveY / 2 * this.options.speedMultiplier);

							// Support pull-to-refresh (only when only y is scrollable)
							if (!self.__enableScrollX && self.__refreshHeight != null) {

								if (!self.__refreshActive && scrollTop <= -self.__refreshHeight) {

									self.__refreshActive = true;
									if (self.__refreshActivate) {
										self.__refreshActivate();
									}

								} else if (self.__refreshActive && scrollTop > -self.__refreshHeight) {

									self.__refreshActive = false;
									if (self.__refreshDeactivate) {
										self.__refreshDeactivate();
									}

								}
							}

						} else if (scrollTop > maxScrollTop) {

							scrollTop = maxScrollTop;

						} else {

							scrollTop = 0;

						}
					}
				}

				// Keep list from growing infinitely (holding min 10, max 20 measure points)
				if (positions.length > 60) {
					positions.splice(0, 30);
				}

				// Track scroll movement for decleration
				positions.push(scrollLeft, scrollTop, timeStamp);

				// Sync scroll position
				self.__publish(scrollLeft, scrollTop, level);

			// Otherwise figure out whether we are switching into dragging mode now.
			} else {

				var minimumTrackingForScroll = self.options.locking ? 3 : 0;
				var minimumTrackingForDrag = 5;

				var distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft);
				var distanceY = Math.abs(currentTouchTop - self.__initialTouchTop);

				self.__enableScrollX = self.options.scrollingX && distanceX >= minimumTrackingForScroll;
				self.__enableScrollY = self.options.scrollingY && distanceY >= minimumTrackingForScroll;

				positions.push(self.__scrollLeft, self.__scrollTop, timeStamp);

				self.__isDragging = (self.__enableScrollX || self.__enableScrollY) && (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag);
				if (self.__isDragging) {
					self.__interruptedAnimation = false;
				}

			}

			// Update last touch positions and time stamp for next event
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;
			self.__lastTouchMove = timeStamp;
			self.__lastScale = scale;

		},


		/**
		 * Touch end handler for scrolling support
		 */
		doTouchEnd: function(timeStamp) {

			if (timeStamp instanceof Date) {
				timeStamp = timeStamp.valueOf();
			}
			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Ignore event when tracking is not enabled (no touchstart event on element)
			// This is required as this listener ('touchmove') sits on the document and not on the element itself.
			if (!self.__isTracking) {
				return;
			}

			// Not touching anymore (when two finger hit the screen there are two touch end events)
			self.__isTracking = false;

			// Be sure to reset the dragging flag now. Here we also detect whether
			// the finger has moved fast enough to switch into a deceleration animation.
			if (self.__isDragging) {

				// Reset dragging flag
				self.__isDragging = false;

				// Start deceleration
				// Verify that the last move detected was in some relevant time frame
				if (self.__isSingleTouch && self.options.animating && (timeStamp - self.__lastTouchMove) <= 100) {

					// Then figure out what the scroll position was about 100ms ago
					var positions = self.__positions;
					var endPos = positions.length - 1;
					var startPos = endPos;

					// Move pointer to position measured 100ms ago
					for (var i = endPos; i > 0 && positions[i] > (self.__lastTouchMove - 100); i -= 3) {
						startPos = i;
					}

					// If start and stop position is identical in a 100ms timeframe,
					// we cannot compute any useful deceleration.
					if (startPos !== endPos) {

						// Compute relative movement between these two points
						var timeOffset = positions[endPos] - positions[startPos];
						var movedLeft = self.__scrollLeft - positions[startPos - 2];
						var movedTop = self.__scrollTop - positions[startPos - 1];

						// Based on 50ms compute the movement to apply for each render step
						self.__decelerationVelocityX = movedLeft / timeOffset * (1000 / 60);
						self.__decelerationVelocityY = movedTop / timeOffset * (1000 / 60);

						// How much velocity is required to start the deceleration
						var minVelocityToStartDeceleration = self.options.paging || self.options.snapping ? 4 : 1;

						// Verify that we have enough velocity to start deceleration
						if (Math.abs(self.__decelerationVelocityX) > minVelocityToStartDeceleration || Math.abs(self.__decelerationVelocityY) > minVelocityToStartDeceleration) {

							// Deactivate pull-to-refresh when decelerating
							if (!self.__refreshActive) {
								self.__startDeceleration(timeStamp);
							}
						}
					} else {
						self.options.scrollingComplete();
					}
				} else if ((timeStamp - self.__lastTouchMove) > 100) {
					self.options.scrollingComplete();
	 			}
			}

			// If this was a slower move it is per default non decelerated, but this
			// still means that we want snap back to the bounds which is done here.
			// This is placed outside the condition above to improve edge case stability
			// e.g. touchend fired without enabled dragging. This should normally do not
			// have modified the scroll positions or even showed the scrollbars though.
			if (!self.__isDecelerating) {

				if (self.__refreshActive && self.__refreshStart) {

					// Use publish instead of scrollTo to allow scrolling to out of boundary position
					// We don't need to normalize scrollLeft, zoomLevel, etc. here because we only y-scrolling when pull-to-refresh is enabled
					self.__publish(self.__scrollLeft, -self.__refreshHeight, self.__zoomLevel, true);

					if (self.__refreshStart) {
						self.__refreshStart();
					}

				} else {

					if (self.__interruptedAnimation || self.__isDragging) {
						self.options.scrollingComplete();
					}
					self.scrollTo(self.__scrollLeft, self.__scrollTop, true, self.__zoomLevel);

					// Directly signalize deactivation (nothing todo on refresh?)
					if (self.__refreshActive) {

						self.__refreshActive = false;
						if (self.__refreshDeactivate) {
							self.__refreshDeactivate();
						}

					}
				}
			}

			// Fully cleanup list
			self.__positions.length = 0;

		},



		/*
		---------------------------------------------------------------------------
			PRIVATE API
		---------------------------------------------------------------------------
		*/

		/**
		 * Applies the scroll position to the content element
		 *
		 * @param left {Number} Left scroll position
		 * @param top {Number} Top scroll position
		 * @param animate {Boolean?false} Whether animation should be used to move to the new coordinates
		 */
		__publish: function(left, top, zoom, animate) {

			var self = this;

			// Remember whether we had an animation, then we try to continue based on the current "drive" of the animation
			var wasAnimating = self.__isAnimating;
			if (wasAnimating) {
				core.effect.Animate.stop(wasAnimating);
				self.__isAnimating = false;
			}

			if (animate && self.options.animating) {

				// Keep scheduled positions for scrollBy/zoomBy functionality
				self.__scheduledLeft = left;
				self.__scheduledTop = top;
				self.__scheduledZoom = zoom;

				var oldLeft = self.__scrollLeft;
				var oldTop = self.__scrollTop;
				var oldZoom = self.__zoomLevel;

				var diffLeft = left - oldLeft;
				var diffTop = top - oldTop;
				var diffZoom = zoom - oldZoom;

				var step = function(percent, now, render) {

					if (render) {

						self.__scrollLeft = oldLeft + (diffLeft * percent);
						self.__scrollTop = oldTop + (diffTop * percent);
						self.__zoomLevel = oldZoom + (diffZoom * percent);

						// Push values out
						if (self.__callback) {
							self.__callback(self.__scrollLeft, self.__scrollTop, self.__zoomLevel);
						}

					}
				};

				var verify = function(id) {
					return self.__isAnimating === id;
				};

				var completed = function(renderedFramesPerSecond, animationId, wasFinished) {
					if (animationId === self.__isAnimating) {
						self.__isAnimating = false;
					}
					if (self.__didDecelerationComplete || wasFinished) {
						self.options.scrollingComplete();
					}

					if (self.options.zooming) {
						self.__computeScrollMax();
					}
				};

				// When continuing based on previous animation we choose an ease-out animation instead of ease-in-out
				self.__isAnimating = core.effect.Animate.start(step, verify, completed, self.options.animationDuration, wasAnimating ? easeOutCubic : easeInOutCubic);

			} else {

				self.__scheduledLeft = self.__scrollLeft = left;
				self.__scheduledTop = self.__scrollTop = top;
				self.__scheduledZoom = self.__zoomLevel = zoom;

				// Push values out
				if (self.__callback) {
					self.__callback(left, top, zoom);
				}

				// Fix max scroll ranges
				if (self.options.zooming) {
					self.__computeScrollMax();
				}
			}
		},


		/**
		 * Recomputes scroll minimum values based on client dimensions and content dimensions.
		 */
		__computeScrollMax: function(zoomLevel) {

			var self = this;

			if (zoomLevel == null) {
				zoomLevel = self.__zoomLevel;
			}

			self.__maxScrollLeft = Math.max((self.__contentWidth * zoomLevel) - self.__clientWidth, 0);
			self.__maxScrollTop = Math.max((self.__contentHeight * zoomLevel) - self.__clientHeight, 0);

		},



		/*
		---------------------------------------------------------------------------
			ANIMATION (DECELERATION) SUPPORT
		---------------------------------------------------------------------------
		*/

		/**
		 * Called when a touch sequence end and the speed of the finger was high enough
		 * to switch into deceleration mode.
		 */
		__startDeceleration: function(timeStamp) {

			var self = this;

			if (self.options.paging) {

				var scrollLeft = Math.max(Math.min(self.__scrollLeft, self.__maxScrollLeft), 0);
				var scrollTop = Math.max(Math.min(self.__scrollTop, self.__maxScrollTop), 0);
				var clientWidth = self.__clientWidth;
				var clientHeight = self.__clientHeight;

				// We limit deceleration not to the min/max values of the allowed range, but to the size of the visible client area.
				// Each page should have exactly the size of the client area.
				self.__minDecelerationScrollLeft = Math.floor(scrollLeft / clientWidth) * clientWidth;
				self.__minDecelerationScrollTop = Math.floor(scrollTop / clientHeight) * clientHeight;
				self.__maxDecelerationScrollLeft = Math.ceil(scrollLeft / clientWidth) * clientWidth;
				self.__maxDecelerationScrollTop = Math.ceil(scrollTop / clientHeight) * clientHeight;

			} else {

				self.__minDecelerationScrollLeft = 0;
				self.__minDecelerationScrollTop = 0;
				self.__maxDecelerationScrollLeft = self.__maxScrollLeft;
				self.__maxDecelerationScrollTop = self.__maxScrollTop;

			}

			// Wrap class method
			var step = function(percent, now, render) {
				self.__stepThroughDeceleration(render);
			};

			// How much velocity is required to keep the deceleration running
			var minVelocityToKeepDecelerating = self.options.snapping ? 4 : 0.1;

			// Detect whether it's still worth to continue animating steps
			// If we are already slow enough to not being user perceivable anymore, we stop the whole process here.
			var verify = function() {
				var shouldContinue = Math.abs(self.__decelerationVelocityX) >= minVelocityToKeepDecelerating || Math.abs(self.__decelerationVelocityY) >= minVelocityToKeepDecelerating;
				if (!shouldContinue) {
					self.__didDecelerationComplete = true;
				}
				return shouldContinue;
			};

			var completed = function(renderedFramesPerSecond, animationId, wasFinished) {
				self.__isDecelerating = false;
				if (self.__didDecelerationComplete) {
					self.options.scrollingComplete();
				}

				// Animate to grid when snapping is active, otherwise just fix out-of-boundary positions
				self.scrollTo(self.__scrollLeft, self.__scrollTop, self.options.snapping);
			};

			// Start animation and switch on flag
			self.__isDecelerating = core.effect.Animate.start(step, verify, completed);

		},


		/**
		 * Called on every step of the animation
		 *
		 * @param inMemory {Boolean?false} Whether to not render the current step, but keep it in memory only. Used internally only!
		 */
		__stepThroughDeceleration: function(render) {

			var self = this;


			//
			// COMPUTE NEXT SCROLL POSITION
			//

			// Add deceleration to scroll position
			var scrollLeft = self.__scrollLeft + self.__decelerationVelocityX;
			var scrollTop = self.__scrollTop + self.__decelerationVelocityY;


			//
			// HARD LIMIT SCROLL POSITION FOR NON BOUNCING MODE
			//

			if (!self.options.bouncing) {

				var scrollLeftFixed = Math.max(Math.min(self.__maxDecelerationScrollLeft, scrollLeft), self.__minDecelerationScrollLeft);
				if (scrollLeftFixed !== scrollLeft) {
					scrollLeft = scrollLeftFixed;
					self.__decelerationVelocityX = 0;
				}

				var scrollTopFixed = Math.max(Math.min(self.__maxDecelerationScrollTop, scrollTop), self.__minDecelerationScrollTop);
				if (scrollTopFixed !== scrollTop) {
					scrollTop = scrollTopFixed;
					self.__decelerationVelocityY = 0;
				}

			}


			//
			// UPDATE SCROLL POSITION
			//

			if (render) {

				self.__publish(scrollLeft, scrollTop, self.__zoomLevel);

			} else {

				self.__scrollLeft = scrollLeft;
				self.__scrollTop = scrollTop;

			}


			//
			// SLOW DOWN
			//

			// Slow down velocity on every iteration
			if (!self.options.paging) {

				// This is the factor applied to every iteration of the animation
				// to slow down the process. This should emulate natural behavior where
				// objects slow down when the initiator of the movement is removed
				var frictionFactor = 0.95;

				self.__decelerationVelocityX *= frictionFactor;
				self.__decelerationVelocityY *= frictionFactor;

			}


			//
			// BOUNCING SUPPORT
			//

			if (self.options.bouncing) {

				var scrollOutsideX = 0;
				var scrollOutsideY = 0;

				// This configures the amount of change applied to deceleration/acceleration when reaching boundaries
				var penetrationDeceleration = self.options.penetrationDeceleration; 
				var penetrationAcceleration = self.options.penetrationAcceleration; 

				// Check limits
				if (scrollLeft < self.__minDecelerationScrollLeft) {
					scrollOutsideX = self.__minDecelerationScrollLeft - scrollLeft;
				} else if (scrollLeft > self.__maxDecelerationScrollLeft) {
					scrollOutsideX = self.__maxDecelerationScrollLeft - scrollLeft;
				}

				if (scrollTop < self.__minDecelerationScrollTop) {
					scrollOutsideY = self.__minDecelerationScrollTop - scrollTop;
				} else if (scrollTop > self.__maxDecelerationScrollTop) {
					scrollOutsideY = self.__maxDecelerationScrollTop - scrollTop;
				}

				// Slow down until slow enough, then flip back to snap position
				if (scrollOutsideX !== 0) {
					if (scrollOutsideX * self.__decelerationVelocityX <= 0) {
						self.__decelerationVelocityX += scrollOutsideX * penetrationDeceleration;
					} else {
						self.__decelerationVelocityX = scrollOutsideX * penetrationAcceleration;
					}
				}

				if (scrollOutsideY !== 0) {
					if (scrollOutsideY * self.__decelerationVelocityY <= 0) {
						self.__decelerationVelocityY += scrollOutsideY * penetrationDeceleration;
					} else {
						self.__decelerationVelocityY = scrollOutsideY * penetrationAcceleration;
					}
				}
			}
		}
	};

	// Copy over members to prototype
	for (var key in members) {
		Scroller.prototype[key] = members[key];
	}

})();

;define('ember-test-helpers', ['exports', 'ember', 'ember-test-helpers/isolated-container', 'ember-test-helpers/test-module', 'ember-test-helpers/test-module-for-component', 'ember-test-helpers/test-module-for-model', 'ember-test-helpers/test-module-for-integration', 'ember-test-helpers/test-context', 'ember-test-helpers/test-resolver'], function (exports, Ember, isolatedContainer, TestModule, TestModuleForComponent, TestModuleForModel, TestModuleForIntegration, test_context, test_resolver) {

  'use strict';

  Ember['default'].testing = true;

  exports.isolatedContainer = isolatedContainer['default'];
  exports.TestModule = TestModule['default'];
  exports.TestModuleForComponent = TestModuleForComponent['default'];
  exports.TestModuleForModel = TestModuleForModel['default'];
  exports.TestModuleForIntegration = TestModuleForIntegration['default'];
  exports.getContext = test_context.getContext;
  exports.setContext = test_context.setContext;
  exports.setResolver = test_resolver.setResolver;

});
define('ember-test-helpers/isolated-container', ['exports', './test-resolver', 'ember'], function (exports, test_resolver, Ember) {

  'use strict';

  function exposeRegistryMethodsWithoutDeprecations(container) {
    var methods = [
      'register',
      'unregister',
      'resolve',
      'normalize',
      'typeInjection',
      'injection',
      'factoryInjection',
      'factoryTypeInjection',
      'has',
      'options',
      'optionsForType'
    ];

    function exposeRegistryMethod(container, method) {
      container[method] = function() {
        return container._registry[method].apply(container._registry, arguments);
      };
    }

    for (var i = 0, l = methods.length; i < l; i++) {
      exposeRegistryMethod(container, methods[i]);
    }
  }

  function isolatedContainer(fullNames) {
    var resolver = test_resolver.getResolver();
    var container;

    var normalize = function(fullName) {
      return resolver.normalize(fullName);
    };

    if (Ember['default'].Registry) {
      var registry = new Ember['default'].Registry();
      registry.normalizeFullName = normalize;

      container = registry.container();
      exposeRegistryMethodsWithoutDeprecations(container);

    } else {
      container = new Ember['default'].Container();

      //normalizeFullName only exists since Ember 1.9
      if (Ember['default'].typeOf(container.normalizeFullName) === 'function') {
        container.normalizeFullName = normalize;
      } else {
        container.normalize = normalize;
      }
    }

    container.optionsForType('component', { singleton: false });
    container.optionsForType('view', { singleton: false });
    container.optionsForType('template', { instantiate: false });
    container.optionsForType('helper', { instantiate: false });
    container.register('component-lookup:main', Ember['default'].ComponentLookup);
    container.register('controller:basic', Ember['default'].Controller, { instantiate: false });
    container.register('controller:object', Ember['default'].ObjectController, { instantiate: false });
    container.register('controller:array', Ember['default'].ArrayController, { instantiate: false });
    container.register('view:default', Ember['default']._MetamorphView);
    container.register('view:toplevel', Ember['default'].View.extend());
    container.register('view:select', Ember['default'].Select);
    container.register('route:basic', Ember['default'].Route, { instantiate: false });

    for (var i = fullNames.length; i > 0; i--) {
      var fullName = fullNames[i - 1];
      var normalizedFullName = resolver.normalize(fullName);
      container.register(fullName, resolver.resolve(normalizedFullName));
    }
    return container;
  }
  exports['default'] = isolatedContainer;

});
define('ember-test-helpers/test-context', ['exports'], function (exports) {

  'use strict';

  exports.setContext = setContext;
  exports.getContext = getContext;

  var __test_context__;

  function setContext(context) {
    __test_context__ = context;
  }

  function getContext() {
    return __test_context__;
  }

});
define('ember-test-helpers/test-module-for-component', ['exports', './test-module', 'ember', './test-resolver'], function (exports, TestModule, Ember, test_resolver) {

  'use strict';

  exports['default'] = TestModule['default'].extend({
    init: function(componentName, description, callbacks) {
      this.componentName = componentName;

      this._super.call(this, 'component:' + componentName, description, callbacks);

      this.setupSteps.push(this.setupComponent);
    },

    setupComponent: function() {
      var _this = this;
      var resolver = test_resolver.getResolver();
      var container = this.container;
      var context = this.context;

      var layoutName = 'template:components/' + this.componentName;

      var layout = resolver.resolve(layoutName);

      if (layout) {
        container.register(layoutName, layout);
        container.injection(this.subjectName, 'layout', layoutName);
      }

      context.dispatcher = Ember['default'].EventDispatcher.create();
      context.dispatcher.setup({}, '#ember-testing');

      this.callbacks.render = function() {
        var containerView = Ember['default'].ContainerView.create({container: container});
        var view = Ember['default'].run(function(){
          var subject = context.subject();
          containerView.pushObject(subject);
          containerView.appendTo('#ember-testing');
          return subject;
        });

        _this.teardownSteps.unshift(function() {
          Ember['default'].run(function() {
            Ember['default'].tryInvoke(containerView, 'destroy');
          });
        });

        return view.$();
      };

      this.callbacks.append = function() {
        Ember['default'].deprecate('this.append() is deprecated. Please use this.render() instead.');
        return this.callbacks.render();
      };

      context.$ = function() {
        var $view = this.render();
        var subject = this.subject();

        if (arguments.length){
          return subject.$.apply(subject, arguments);
        } else {
          return $view;
        }
      };
    }
  });

});
define('ember-test-helpers/test-module-for-integration', ['exports', 'ember', './test-module', './test-resolver', './test-context'], function (exports, Ember, TestModule, test_resolver, test_context) {

  'use strict';

  exports['default'] = TestModule['default'].extend({

    isIntegration: true,

    init: function(name, description, callbacks) {
      this._super.call(this, name, description, callbacks);
      this.setupSteps.push(this.setupIntegrationHelpers);
      this.teardownSteps.push(this.teardownView);
    },

    setupIntegrationHelpers: function() {
      var self = this;
      var context = this.context;
      context.dispatcher = Ember['default'].EventDispatcher.create();
      context.dispatcher.setup({}, '#ember-testing');
      this.actionHooks = {};

      context.render = function(template) {
        if (Ember['default'].isArray(template)) {
          template = template.join('');
        }
        if (typeof template === 'string') {
          template = Ember['default'].Handlebars.compile(template);
        }
        self.view = Ember['default'].View.create({
          context: context,
          controller: self,
          template: template,
          container: self.container
        });
        Ember['default'].run(function() {
          self.view.appendTo('#ember-testing');
        });
      };

      context.$ = function() {
        return self.view.$.apply(self.view, arguments);
      };

      context.set = function(key, value) {
        Ember['default'].run(function() {
          Ember['default'].set(context, key, value);
        });
      };

      context.get = function(key) {
        return Ember['default'].get(context, key);
      };

      context.on = function(actionName, handler) {
        self.actionHooks[actionName] = handler;
      };

    },

    setupContext: function() {

      test_context.setContext({
        container:  this.container,
        factory: function() {},
        dispatcher: null
      });

      this.context = test_context.getContext();
    },

    send: function(actionName) {
      var hook = this.actionHooks[actionName];
      if (!hook) {
        throw new Error("integration testing template received unexpected action " + actionName);
      }
      hook.apply(this, Array.prototype.slice.call(arguments, 1));
    },

    teardownView: function() {
      var view = this.view;
      if (view) {
        Ember['default'].run(function() {
          view.destroy();
        });
      }
    }

  });

});
define('ember-test-helpers/test-module-for-model', ['exports', './test-module', 'ember'], function (exports, TestModule, Ember) {

  'use strict';

  exports['default'] = TestModule['default'].extend({
    init: function(modelName, description, callbacks) {
      this.modelName = modelName;

      this._super.call(this, 'model:' + modelName, description, callbacks);

      this.setupSteps.push(this.setupModel);
    },

    setupModel: function() {
      var container = this.container;
      var defaultSubject = this.defaultSubject;
      var callbacks = this.callbacks;
      var modelName = this.modelName;

      if (DS._setupContainer) {
        DS._setupContainer(container);
      } else {
        container.register('store:main', DS.Store);
      }

      var adapterFactory = container.lookupFactory('adapter:application');
      if (!adapterFactory) {
        container.register('adapter:application', DS.FixtureAdapter);
      }

      callbacks.store = function(){
        return container.lookup('store:main');
      };

      if (callbacks.subject === defaultSubject) {
        callbacks.subject = function(options) {
          return Ember['default'].run(function() {
            return container.lookup('store:main').createRecord(modelName, options);
          });
        };
      }
    }
  });

});
define('ember-test-helpers/test-module', ['exports', 'ember', './isolated-container', './test-context', 'klassy', './test-resolver'], function (exports, Ember, isolatedContainer, test_context, klassy, test_resolver) {

  'use strict';

  exports['default'] = klassy.Klass.extend({
    init: function(subjectName, description, callbacks) {
      // Allow `description` to be omitted, in which case it should
      // default to `subjectName`
      if (!callbacks && typeof description === 'object') {
        callbacks = description;
        description = subjectName;
      }

      this.subjectName = subjectName;
      this.description = description || subjectName;
      this.name = description || subjectName;
      this.callbacks = callbacks || {};

      if (this.callbacks.integration) {
        this.isIntegration = callbacks.integration;      
        delete callbacks.integration;
      }

      this.initSubject();
      this.initNeeds();
      this.initSetupSteps();
      this.initTeardownSteps();
    },

    initSubject: function() {
      this.callbacks.subject = this.callbacks.subject || this.defaultSubject;
    },

    initNeeds: function() {
      this.needs = [this.subjectName];
      if (this.callbacks.needs) {
        this.needs = this.needs.concat(this.callbacks.needs)
        delete this.callbacks.needs;
      }
    },

    initSetupSteps: function() {
      this.setupSteps = [];
      this.contextualizedSetupSteps = [];

      if (this.callbacks.beforeSetup) {
        this.setupSteps.push( this.callbacks.beforeSetup );
        delete this.callbacks.beforeSetup;
      }

      this.setupSteps.push(this.setupContainer);
      this.setupSteps.push(this.setupContext);
      this.setupSteps.push(this.setupTestElements);

      if (this.callbacks.setup) {
        this.contextualizedSetupSteps.push( this.callbacks.setup );
        delete this.callbacks.setup;
      }
    },

    initTeardownSteps: function() {
      this.teardownSteps = [];
      this.contextualizedTeardownSteps = [];

      if (this.callbacks.teardown) {
        this.contextualizedTeardownSteps.push( this.callbacks.teardown );
        delete this.callbacks.teardown;
      }

      this.teardownSteps.push(this.teardownSubject);
      this.teardownSteps.push(this.teardownContainer);
      this.teardownSteps.push(this.teardownContext);
      this.teardownSteps.push(this.teardownTestElements);

      if (this.callbacks.afterTeardown) {
        this.teardownSteps.push( this.callbacks.afterTeardown );
        delete this.callbacks.afterTeardown;
      }
    },

    setup: function() {
      this.invokeSteps(this.setupSteps);
      this.contextualizeCallbacks();
      this.invokeSteps(this.contextualizedSetupSteps, this.context);
    },

    teardown: function() {
      this.invokeSteps(this.contextualizedTeardownSteps, this.context);
      this.invokeSteps(this.teardownSteps);
      this.cache = null;
    },

    invokeSteps: function(steps, _context) {
      var context = _context;
      if (!context) {
        context = this;
      }

      for (var i = 0, l = steps.length; i < l; i++) {
        steps[i].call(context);
      }
    },

    setupContainer: function() {
      if (this.isIntegration) {
        this._setupIntegratedContainer();
      } else {
        this._setupIsolatedContainer();
      }
    },

    setupContext: function() {
      var subjectName = this.subjectName;
      var container = this.container;

      var factory = function() {
        return container.lookupFactory(subjectName);
      };

      test_context.setContext({
        container:  this.container,
        factory:    factory,
        dispatcher: null
      });

      this.context = test_context.getContext();
    },

    setupTestElements: function() {
      if (Ember['default'].$('#ember-testing').length === 0) {
        Ember['default'].$('<div id="ember-testing"/>').appendTo(document.body);
      }
    },

    teardownSubject: function() {
      var subject = this.cache.subject;

      if (subject) {
        Ember['default'].run(function() {
          Ember['default'].tryInvoke(subject, 'destroy');
        });
      }
    },

    teardownContainer: function() {
      var container = this.container;
      Ember['default'].run(function() {
        container.destroy();
      });
    },

    teardownContext: function() {
      var context = this.context;
      if (context.dispatcher) {
        Ember['default'].run(function() {
          context.dispatcher.destroy();
        });
      }
    },

    teardownTestElements: function() {
      Ember['default'].$('#ember-testing').empty();
      Ember['default'].View.views = {};
    },

    defaultSubject: function(options, factory) {
      return factory.create(options);
    },

    // allow arbitrary named factories, like rspec let
    contextualizeCallbacks: function() {
      var _this     = this;
      var callbacks = this.callbacks;
      var context   = this.context;
      var factory   = context.factory;

      this.cache = this.cache || {};

      var keys = Ember['default'].keys(callbacks);

      for (var i = 0, l = keys.length; i < l; i++) {
        (function(key) {

          context[key] = function(options) {
            if (_this.cache[key]) { return _this.cache[key]; }

            var result = callbacks[key].call(_this, options, factory());

            _this.cache[key] = result;

            return result;
          };

        })(keys[i]);
      }
    },


    _setupIsolatedContainer: function() {
      this.container = isolatedContainer['default'](this.needs);
    },

    _setupIntegratedContainer: function() {
      var resolver = test_resolver.getResolver();
      var namespace = Ember['default'].Object.create({
        Resolver: { create: function() { return resolver; } }
      });

      if (Ember['default'].Application.buildRegistry) {
        var registry;
        registry = Ember['default'].Application.buildRegistry(namespace);
        registry.register('component-lookup:main', Ember['default'].ComponentLookup);
        this.registry = registry;
        this.container = registry.container();
      } else {
        this.container = Ember['default'].Application.buildContainer(namespace);
        this.container.register('component-lookup:main', Ember['default'].ComponentLookup);
      }
    }

  });

});
define('ember-test-helpers/test-resolver', ['exports'], function (exports) {

  'use strict';

  exports.setResolver = setResolver;
  exports.getResolver = getResolver;

  var __resolver__;

  function setResolver(resolver) {
    __resolver__ = resolver;
  }

  function getResolver() {
    if (__resolver__ == null) throw new Error('you must set a resolver with `testResolver.set(resolver)`');
    return __resolver__;
  }

});
define('klassy', ['exports'], function (exports) {

  'use strict';

  /**
   Extend a class with the properties and methods of one or more other classes.

   When a method is replaced with another method, it will be wrapped in a
   function that makes the replaced method accessible via `this._super`.

   @method extendClass
   @param {Object} destination The class to merge into
   @param {Object} source One or more source classes
   */
  var extendClass = function(destination) {
    var sources = Array.prototype.slice.call(arguments, 1);
    var source;

    for (var i = 0, l = sources.length; i < l; i++) {
      source = sources[i];

      for (var p in source) {
        if (source.hasOwnProperty(p) &&
          destination[p] &&
          typeof destination[p] === 'function' &&
          typeof source[p] === 'function') {

          /* jshint loopfunc:true */
          destination[p] =
            (function(destinationFn, sourceFn) {
              var wrapper = function() {
                var prevSuper = this._super;
                this._super = destinationFn;

                var ret = sourceFn.apply(this, arguments);

                this._super = prevSuper;

                return ret;
              };
              wrapper.wrappedFunction = sourceFn;
              return wrapper;
            })(destination[p], source[p]);

        } else {
          destination[p] = source[p];
        }
      }
    }
  };

  // `subclassing` is a state flag used by `defineClass` to track when a class is
  // being subclassed. It allows constructors to avoid calling `init`, which can
  // be expensive and cause undesirable side effects.
  var subclassing = false;

  /**
   Define a new class with the properties and methods of one or more other classes.

   The new class can be based on a `SuperClass`, which will be inserted into its
   prototype chain.

   Furthermore, one or more mixins (object that contain properties and/or methods)
   may be specified, which will be applied in order. When a method is replaced
   with another method, it will be wrapped in a function that makes the previous
   method accessible via `this._super`.

   @method defineClass
   @param {Object} SuperClass A base class to extend. If `mixins` are to be included
   without a `SuperClass`, pass `null` for SuperClass.
   @param {Object} mixins One or more objects that contain properties and methods
   to apply to the new class.
   */
  var defineClass = function(SuperClass) {
    var Klass = function() {
      if (!subclassing && this.init) {
        this.init.apply(this, arguments);
      }
    };

    if (SuperClass) {
      subclassing = true;
      Klass.prototype = new SuperClass();
      subclassing = false;
    }

    if (arguments.length > 1) {
      var extendArgs = Array.prototype.slice.call(arguments, 1);
      extendArgs.unshift(Klass.prototype);
      extendClass.apply(Klass.prototype, extendArgs);
    }

    Klass.constructor = Klass;

    Klass.extend = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift(Klass);
      return defineClass.apply(Klass, args);
    };

    return Klass;
  };

  /**
   A base class that can be extended.

   @example

   ```javascript
   var CelestialObject = Klass.extend({
     init: function(name) {
       this._super();
       this.name = name;
       this.isCelestialObject = true;
     },
     greeting: function() {
       return 'Hello from ' + this.name;
     }
   });

   var Planet = CelestialObject.extend({
     init: function(name) {
       this._super.apply(this, arguments);
       this.isPlanet = true;
     },
     greeting: function() {
       return this._super() + '!';
     },
   });

   var earth = new Planet('Earth');

   console.log(earth instanceof Klass);           // true
   console.log(earth instanceof CelestialObject); // true
   console.log(earth instanceof Planet);          // true

   console.log(earth.isCelestialObject);          // true
   console.log(earth.isPlanet);                   // true

   console.log(earth.greeting());                 // 'Hello from Earth!'
   ```

   @class Klass
   */
  var Klass = defineClass(null, {
    init: function() {}
  });

  exports.Klass = Klass;
  exports.defineClass = defineClass;
  exports.extendClass = extendClass;

});
;define('klassy', ['exports'], function (exports) {

  'use strict';

  /**
   Extend a class with the properties and methods of one or more other classes.

   When a method is replaced with another method, it will be wrapped in a
   function that makes the replaced method accessible via `this._super`.

   @method extendClass
   @param {Object} destination The class to merge into
   @param {Object} source One or more source classes
   */
  var extendClass = function(destination) {
    var sources = Array.prototype.slice.call(arguments, 1);
    var source;

    for (var i = 0, l = sources.length; i < l; i++) {
      source = sources[i];

      for (var p in source) {
        if (source.hasOwnProperty(p) &&
          destination[p] &&
          typeof destination[p] === 'function' &&
          typeof source[p] === 'function') {

          /* jshint loopfunc:true */
          destination[p] =
            (function(destinationFn, sourceFn) {
              var wrapper = function() {
                var prevSuper = this._super;
                this._super = destinationFn;

                var ret = sourceFn.apply(this, arguments);

                this._super = prevSuper;

                return ret;
              };
              wrapper.wrappedFunction = sourceFn;
              return wrapper;
            })(destination[p], source[p]);

        } else {
          destination[p] = source[p];
        }
      }
    }
  };

  // `subclassing` is a state flag used by `defineClass` to track when a class is
  // being subclassed. It allows constructors to avoid calling `init`, which can
  // be expensive and cause undesirable side effects.
  var subclassing = false;

  /**
   Define a new class with the properties and methods of one or more other classes.

   The new class can be based on a `SuperClass`, which will be inserted into its
   prototype chain.

   Furthermore, one or more mixins (object that contain properties and/or methods)
   may be specified, which will be applied in order. When a method is replaced
   with another method, it will be wrapped in a function that makes the previous
   method accessible via `this._super`.

   @method defineClass
   @param {Object} SuperClass A base class to extend. If `mixins` are to be included
   without a `SuperClass`, pass `null` for SuperClass.
   @param {Object} mixins One or more objects that contain properties and methods
   to apply to the new class.
   */
  var defineClass = function(SuperClass) {
    var Klass = function() {
      if (!subclassing && this.init) {
        this.init.apply(this, arguments);
      }
    };

    if (SuperClass) {
      subclassing = true;
      Klass.prototype = new SuperClass();
      subclassing = false;
    }

    if (arguments.length > 1) {
      var extendArgs = Array.prototype.slice.call(arguments, 1);
      extendArgs.unshift(Klass.prototype);
      extendClass.apply(Klass.prototype, extendArgs);
    }

    Klass.constructor = Klass;

    Klass.extend = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift(Klass);
      return defineClass.apply(Klass, args);
    };

    return Klass;
  };

  /**
   A base class that can be extended.

   @example

   ```javascript
   var CelestialObject = Klass.extend({
     init: function(name) {
       this._super();
       this.name = name;
       this.isCelestialObject = true;
     },
     greeting: function() {
       return 'Hello from ' + this.name;
     }
   });

   var Planet = CelestialObject.extend({
     init: function(name) {
       this._super.apply(this, arguments);
       this.isPlanet = true;
     },
     greeting: function() {
       return this._super() + '!';
     },
   });

   var earth = new Planet('Earth');

   console.log(earth instanceof Klass);           // true
   console.log(earth instanceof CelestialObject); // true
   console.log(earth instanceof Planet);          // true

   console.log(earth.isCelestialObject);          // true
   console.log(earth.isPlanet);                   // true

   console.log(earth.greeting());                 // 'Hello from Earth!'
   ```

   @class Klass
   */
  var Klass = defineClass(null, {
    init: function() {}
  });

  exports.Klass = Klass;
  exports.defineClass = defineClass;
  exports.extendClass = extendClass;

});
define('qunit-module', ['exports', 'qunit'], function (exports, qunit) {

  'use strict';

  exports.createModule = createModule;

  function normalizeCallbacks(callbacks) {
    if (typeof callbacks !== 'object') { return; }
    if (!callbacks) { return; }

    if (callbacks.beforeEach) {
      callbacks.setup = callbacks.beforeEach;
      delete callbacks.beforeEach;
    }

    if (callbacks.afterEach) {
      callbacks.teardown = callbacks.afterEach;
      delete callbacks.afterEach;
    }
  }

  function createModule(Constructor, name, description, callbacks) {
    normalizeCallbacks(callbacks || description);

    var module = new Constructor(name, description, callbacks);

    qunit.module(module.name, {
      setup: function() {
        module.setup();
      },
      teardown: function() {
        module.teardown();
      }
    });
  }

});
;define("ember-list-view", ["ember-list-view/index","exports"], function(__index__, __exports__) {
  "use strict";
  Object.keys(__index__).forEach(function(key){
    __exports__[key] = __index__[key];
  });
});

define('ember-list-view/helper', ['exports', 'ember', 'ember-list-view/list-view', 'ember-list-view/virtual-list-view', 'ember-list-view/register-helper'], function (exports, Ember, EmberListView, EmberVirtualListView, registerHelper) {

  'use strict';

  exports.registerListViewHelpers = registerListViewHelpers;

  var EmberVirtualList = createHelper(EmberVirtualListView['default']);
  var EmberList = createHelper(EmberListView['default']);

  function registerListViewHelpers() {
    registerHelper['default']('ember-list', EmberList);
    registerHelper['default']('ember-virtual-list', EmberVirtualList);
  }

  function createHelper(view) {
    if (Ember['default'].HTMLBars) {
      return {
        isHelper: true,
        isHTMLBars: true,
        helperFunction: function listViewHTMLBarsHelper(params, hash, options, env) {
          hash.content = hash.items;
          delete hash.items;

          for (var prop in hash) {
            if (/-/.test(prop)) {
              var camelized = Ember['default'].String.camelize(prop);
              hash[camelized] = hash[prop];
              delete hash[prop];
            }
          }

          /*jshint validthis:true */
          return env.helpers.collection.helperFunction.call(this, [view], hash, options, env);
        }
      };
    }
    return function handlebarsHelperFactory(options) {
      return createHandlebarsHelper.call(this, view, options);
    };
  }

  function createHandlebarsHelper(view, options) {
    var hash = options.hash;
    var types = options.hashTypes;

    hash.content = hash.items;
    delete hash.items;

    types.content = types.items;
    delete types.items;

    if (!hash.content) {
      hash.content = 'this';
      types.content = 'ID';
    }

    for (var prop in hash) {
      if (/-/.test(prop)) {
        var camelized = Ember['default'].String.camelize(prop);
        hash[camelized] = hash[prop];
        types[camelized] = types[prop];
        delete hash[prop];
        delete types[prop];
      }
    }

    /*jshint validthis:true */
    return Ember['default'].Handlebars.helpers.collection.call(this, view, options);
  }

  exports.EmberVirtualList = EmberVirtualList;
  exports.EmberList = EmberList;

});
define('ember-list-view/index', ['exports', 'ember-list-view/list-view'], function (exports, ListView) {

	'use strict';

	exports['default'] = ListView['default'];

});
define('ember-list-view/list-item-view-mixin', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  function samePosition(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  function positionElement() {
    var element, position, _position;

    Ember['default'].instrument('view.updateContext.positionElement', this, function() {
      element = this.element;
      position = this.position;
      _position = this._position;

      if (!position || !element) {
        return;
      }

      // // TODO: avoid needing this by avoiding unnecessary
      // // calls to this method in the first place
      if (samePosition(position, _position)) {
        return;
      }

      Ember['default'].run.schedule('render', this, this._parentView.applyTransform, this, position.x, position.y);
      this._position = position;
    }, this);
  }

  exports['default'] = Ember['default'].Mixin.create({
    classNames: ['ember-list-item-view'],
    style: Ember['default'].String.htmlSafe(''),
    attributeBindings: ['style'],
    _position: null,
    _positionElement: positionElement,

    positionElementWhenInserted: Ember['default'].on('init', function(){
      this.one('didInsertElement', positionElement);
    }),

    updatePosition: function(position) {
      this.position = position;
      this._positionElement();
    }
  });

});
define('ember-list-view/list-item-view', ['exports', 'ember', 'ember-list-view/list-item-view-mixin'], function (exports, Ember, ListItemViewMixin) {

  'use strict';

  var get = Ember['default'].get, set = Ember['default'].set;

  /**
    The `Ember.ListItemView` view class renders a
    [div](https://developer.mozilla.org/en/HTML/Element/div) HTML element
    with `ember-list-item-view` class. It allows you to specify a custom item
    handlebars template for `Ember.ListView`.

    Example:

    ```handlebars
    <script type="text/x-handlebars" data-template-name="row_item">
      {{name}}
    </script>
    ```

    ```javascript
    App.ListView = Ember.ListView.extend({
      height: 500,
      rowHeight: 20,
      itemViewClass: Ember.ListItemView.extend({templateName: "row_item"})
    });
    ```

    @extends Ember.View
    @class ListItemView
    @namespace Ember
  */
  exports['default'] = Ember['default'].View.extend(ListItemViewMixin['default'], {
    updateContext: function(newContext) {
      var context = get(this, 'context');

      Ember['default'].instrument('view.updateContext.render', this, function() {
        if (context !== newContext) {
          set(this, 'context', newContext);
          if (newContext && newContext.isController) {
            set(this, 'controller', newContext);
          }
        }
      }, this);
    },

    rerender: function () {
      if (this.isDestroying || this.isDestroyed) {
        return;
      }

      return this._super.apply(this, arguments);
    },

    _contextDidChange: Ember['default'].observer(function () {
      Ember['default'].run.once(this, this.rerender);
    }, 'context', 'controller')
  });

});
define('ember-list-view/list-view-helper', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var el    = document.body || document.createElement('div');
  var style = el.style;
  var set   = Ember['default'].set;

  function getElementStyle (prop) {
    var uppercaseProp = prop.charAt(0).toUpperCase() + prop.slice(1);

    var props = [
      prop,
      'webkit' + prop,
      'webkit' + uppercaseProp,
      'Moz'    + uppercaseProp,
      'moz'    + uppercaseProp,
      'ms'     + uppercaseProp,
      'ms'     + prop
    ];

    for (var i=0; i < props.length; i++) {
      var property = props[i];

      if (property in style) {
        return property;
      }
    }

    return null;
  }

  function getCSSStyle (attr) {
    var styleName = getElementStyle(attr);
    var prefix    = styleName.toLowerCase().replace(attr, '');

    var dic = {
      webkit: '-webkit-' + attr,
      moz:    '-moz-' + attr,
      ms:     '-ms-' + attr
    };

    if (prefix && dic[prefix]) {
      return dic[prefix];
    }

    return styleName;
  }

  var styleAttributeName = getElementStyle('transform');
  var transformProp      = getCSSStyle('transform');
  var perspectiveProp    = getElementStyle('perspective');
  var supports2D         = !!transformProp;
  var supports3D         = !!perspectiveProp;

  function setStyle (optionalStyleString) {
    return function (obj, x, y) {
      var isElement = obj instanceof Element;

      if (optionalStyleString && (supports2D || supports3D)) {
        var style = Ember['default'].String.fmt(optionalStyleString, x, y);

        if (isElement) {
          obj.style[styleAttributeName] = Ember['default'].String.htmlSafe(style);
        } else {
          set(obj, 'style', Ember['default'].String.htmlSafe(transformProp + ': ' + style));
        }
      } else {
        if (isElement) {
          obj.style.top = y;
          obj.style.left = x;
        }
      }
    };
  }

  exports['default'] = {
    transformProp: transformProp,
    applyTransform: (function () {
      if (supports3D) {
        return setStyle('translate3d(%@px, %@px, 0)');
      } else if (supports2D) {
        return setStyle('translate(%@px, %@px)');
      }

      return setStyle();
    })(),
    apply3DTransform: (function () {
      if (supports3D) {
        return setStyle('translate3d(%@px, %@px, 0)');
      } else if (supports2D) {
        return setStyle('translate(%@px, %@px)');
      }

      return setStyle();
    })()
  };

});
define('ember-list-view/list-view-mixin', ['exports', 'ember', 'ember-list-view/reusable-list-item-view'], function (exports, Ember, ReusableListItemView) {

  'use strict';

  // TODO: remove unused: false
  /* jshint unused: false*/
  var get     = Ember['default'].get;
  var set     = Ember['default'].set;
  var min     = Math.min;
  var max     = Math.max;
  var floor   = Math.floor;
  var ceil    = Math.ceil;
  var forEach = Ember['default'].ArrayPolyfills.forEach;

  function addContentArrayObserver() {
    var content = get(this, 'content');
    if (content) {
      content.addArrayObserver(this);
    }
  }

  function removeAndDestroy(object) {
    this.removeObject(object);
    object.destroy();
  }

  function syncChildViews() {
    Ember['default'].run.once(this, '_syncChildViews');
  }

  function sortByContentIndex (viewOne, viewTwo) {
    return get(viewOne, 'contentIndex') - get(viewTwo, 'contentIndex');
  }

  function removeEmptyView() {
    var emptyView = get(this, 'emptyView');
    if (emptyView && emptyView instanceof Ember['default'].View) {
      emptyView.removeFromParent();
      if (this.totalHeightDidChange !== undefined) {
          this.totalHeightDidChange();
      }
    }
  }

  function addEmptyView() {
    var emptyView = get(this, 'emptyView');

    if (!emptyView) {
      return;
    }

    if ('string' === typeof emptyView) {
      emptyView = get(emptyView) || emptyView;
    }

    emptyView = this.createChildView(emptyView);
    set(this, 'emptyView', emptyView);

    if (Ember['default'].CoreView.detect(emptyView)) {
      this._createdEmptyView = emptyView;
    }

    this.unshiftObject(emptyView);
  }

  function enableProfilingOutput() {
    function before(name, time/*, payload*/) {
      console.time(name);
    }

    function after (name, time/*, payload*/) {
      console.timeEnd(name);
    }

    if (Ember['default'].ENABLE_PROFILING) {
      Ember['default'].subscribe('view._scrollContentTo', {
        before: before,
        after: after
      });
      Ember['default'].subscribe('view.updateContext', {
        before: before,
        after: after
      });
    }
  }

  /**
    @class Ember.ListViewMixin
    @namespace Ember
  */
  exports['default'] = Ember['default'].Mixin.create({
    itemViewClass: ReusableListItemView['default'],
    emptyViewClass: Ember['default'].View,
    classNames: ['ember-list-view'],
    attributeBindings: ['style'],
    classNameBindings: ['_isGrid:ember-list-view-grid:ember-list-view-list'],
    scrollTop: 0,
    bottomPadding: 0, // TODO: maybe this can go away
    _lastEndingIndex: 0,
    paddingCount: 1,
    _cachedPos: 0,

    _isGrid: Ember['default'].computed.gt('columnCount', 1).readOnly(),

    /**
      @private

      Setup a mixin.
      - adding observer to content array
      - creating child views based on height and length of the content array

      @method init
    */
    init: function() {
      this._super();
      this._cachedHeights = [0];
      this.on('didInsertElement', this._syncListContainerWidth);
      this.columnCountDidChange();
      this._syncChildViews();
      this._addContentArrayObserver();
    },

    _addContentArrayObserver: Ember['default'].observer(function () {
      var content    = get(this, 'content');
      var oldContent = get(this, 'oldContent');

      if (oldContent === content) { return; }

      addContentArrayObserver.call(this);
      set(this, 'oldContent', content);
    }, 'content'),

    /**
      Called on your view when it should push strings of HTML into a
      `Ember.RenderBuffer`.

      Adds a [div](https://developer.mozilla.org/en-US/docs/HTML/Element/div)
      with a required `ember-list-container` class.

      @method render
      @param {Ember.RenderBuffer} buffer The render buffer
    */
    render: function (buffer) {
      var element          = buffer.element();
      var dom              = buffer.dom;
      var container        = dom.createElement('div');
      container.className  = 'ember-list-container';
      element.appendChild(container);

      this._childViewsMorph = dom.appendMorph(container, container, null);

      return container;
    },

    createChildViewsMorph: function (element) {
      this._childViewsMorph = this._renderer._dom.createMorph(element.lastChild, element.lastChild, null);
      return element;
    },

    willInsertElement: function() {
      if (!this.get('height') || !this.get('rowHeight')) {
        throw new Error('A ListView must be created with a height and a rowHeight.');
      }
      this._super();
    },

    /**
      @private

      Sets inline styles of the view:
      - height
      - width
      - position
      - overflow
      - -webkit-overflow
      - overflow-scrolling

      Called while attributes binding.

      @property {Ember.ComputedProperty} style
    */
    style: Ember['default'].computed('height', 'width', function() {
      var height, width, style, css;

      height = get(this, 'height');
      width = get(this, 'width');
      css = get(this, 'css');

      style = '';

      if (height) {
        style += 'height:' + height + 'px;';
      }

      if (width)  {
        style += 'width:' + width  + 'px;';
      }

      for ( var rule in css ) {
        if (css.hasOwnProperty(rule)) {
          style += rule + ':' + css[rule] + ';';
        }
      }

      return Ember['default'].String.htmlSafe(style);
    }),

    /**
      @private

      Performs visual scrolling. Is overridden in Ember.ListView.

      @method scrollTo
    */
    scrollTo: function(y) {
      throw new Error('must override to perform the visual scroll and effectively delegate to _scrollContentTo');
    },

    /**
      @private

      Internal method used to force scroll position

      @method scrollTo
    */
    _scrollTo: Ember['default'].K,

    /**
      @private
      @method _scrollContentTo
    */
    _scrollContentTo: function(y) {
      var startingIndex, endingIndex,
          contentIndex, visibleEndingIndex, maxContentIndex,
          contentIndexEnd, contentLength, scrollTop, content;

      scrollTop = max(0, y);

      if (this.scrollTop === scrollTop) {
        return;
      }

      // allow a visual overscroll, but don't scroll the content. As we are doing needless
      // recycyling, and adding unexpected nodes to the DOM.
      var maxScrollTop = max(0, get(this, 'totalHeight') - get(this, 'height'));
      scrollTop = min(scrollTop, maxScrollTop);

      content = get(this, 'content');
      contentLength = get(content, 'length');
      startingIndex = this._startingIndex(contentLength);

      Ember['default'].instrument('view._scrollContentTo', {
        scrollTop: scrollTop,
        content: content,
        startingIndex: startingIndex,
        endingIndex: min(max(contentLength - 1, 0), startingIndex + this._numChildViewsForViewport())
      }, function () {
        this.scrollTop = scrollTop;

        maxContentIndex = max(contentLength - 1, 0);

        startingIndex = this._startingIndex();
        visibleEndingIndex = startingIndex + this._numChildViewsForViewport();

        endingIndex = min(maxContentIndex, visibleEndingIndex);

        if (startingIndex === this._lastStartingIndex &&
            endingIndex === this._lastEndingIndex) {

          this.trigger('scrollYChanged', y);
          return;
        } else {

          Ember['default'].run(this, function() {
            this._reuseChildren();

            this._lastStartingIndex = startingIndex;
            this._lastEndingIndex = endingIndex;
            this.trigger('scrollYChanged', y);
          });
        }
      }, this);

    },

    /**
      @private

      Computes the height for a `Ember.ListView` scrollable container div.
      You must specify `rowHeight` parameter for the height to be computed properly.

      @property {Ember.ComputedProperty} totalHeight
    */
    totalHeight: Ember['default'].computed('content.length',
                                'rowHeight',
                                'columnCount',
                                'bottomPadding', function() {
      if (typeof this.heightForIndex === 'function') {
        return this._totalHeightWithHeightForIndex();
      } else {
        return this._totalHeightWithStaticRowHeight();
     }
    }),

    _doRowHeightDidChange: function() {
      this._cachedHeights = [0];
      this._cachedPos = 0;
      this._syncChildViews();
    },

    _rowHeightDidChange: Ember['default'].observer('rowHeight', function() {
      Ember['default'].run.once(this, this._doRowHeightDidChange);
    }),

    _totalHeightWithHeightForIndex: function() {
      var length = this.get('content.length');
      return this._cachedHeightLookup(length);
    },

    _totalHeightWithStaticRowHeight: function() {
      var contentLength, rowHeight, columnCount, bottomPadding;

      contentLength = get(this, 'content.length');
      rowHeight = get(this, 'rowHeight');
      columnCount = get(this, 'columnCount');
      bottomPadding = get(this, 'bottomPadding');

      return ((ceil(contentLength / columnCount)) * rowHeight) + bottomPadding;
    },

    /**
      @private
      @method _prepareChildForReuse
    */
    _prepareChildForReuse: function(childView) {
      childView.prepareForReuse();
    },

    createChildView: function (_view) {
      return this._super(_view, this._itemViewProps || {});
    },

    /**
      @private
      @method _reuseChildForContentIndex
    */
    _reuseChildForContentIndex: function(childView, contentIndex) {
      var content, context, newContext, childsCurrentContentIndex, position, enableProfiling, oldChildView;

      var contentViewClass = this.itemViewForIndex(contentIndex);

      if (childView.constructor !== contentViewClass) {
        // rather then associative arrays, lets move childView + contentEntry maping to a Map
        var i = this._childViews.indexOf(childView);
        childView.destroy();
        childView = this.createChildView(contentViewClass);
        this.insertAt(i, childView);
      }

      content         = get(this, 'content');
      enableProfiling = get(this, 'enableProfiling');
      position        = this.positionForIndex(contentIndex);
      childView.updatePosition(position);

      set(childView, 'contentIndex', contentIndex);

      if (enableProfiling) {
        Ember['default'].instrument('view._reuseChildForContentIndex', position, function() {

        }, this);
      }

      newContext = content.objectAt(contentIndex);
      childView.updateContext(newContext);
    },

    /**
      @private
      @method positionForIndex
    */
    positionForIndex: function(index) {
      if (typeof this.heightForIndex !== 'function') {
        return this._singleHeightPosForIndex(index);
      }
      else {
        return this._multiHeightPosForIndex(index);
      }
    },

    _singleHeightPosForIndex: function(index) {
      var elementWidth, width, columnCount, rowHeight, y, x;

      elementWidth = get(this, 'elementWidth') || 1;
      width = get(this, 'width') || 1;
      columnCount = get(this, 'columnCount');
      rowHeight = get(this, 'rowHeight');

      y = (rowHeight * floor(index/columnCount));
      x = (index % columnCount) * elementWidth;

      return {
        y: y,
        x: x
      };
    },

    // 0 maps to 0, 1 maps to heightForIndex(i)
    _multiHeightPosForIndex: function(index) {
      var elementWidth, width, columnCount, rowHeight, y, x;

      elementWidth = get(this, 'elementWidth') || 1;
      width = get(this, 'width') || 1;
      columnCount = get(this, 'columnCount');

      x = (index % columnCount) * elementWidth;
      y = this._cachedHeightLookup(index);

      return {
        x: x,
        y: y
      };
    },

    _cachedHeightLookup: function(index) {
      for (var i = this._cachedPos; i < index; i++) {
        this._cachedHeights[i + 1] = this._cachedHeights[i] + this.heightForIndex(i);
      }
      this._cachedPos = i;
      return this._cachedHeights[index];
    },

    /**
      @private
      @method _childViewCount
    */
    _childViewCount: function() {
      var contentLength, childViewCountForHeight;

      contentLength = get(this, 'content.length');
      childViewCountForHeight = this._numChildViewsForViewport();

      return min(contentLength, childViewCountForHeight);
    },

    /**
      @private

      Returns a number of columns in the Ember.ListView (for grid layout).

      If you want to have a multi column layout, you need to specify both
      `width` and `elementWidth`.

      If no `elementWidth` is specified, it returns `1`. Otherwise, it will
      try to fit as many columns as possible for a given `width`.

      @property {Ember.ComputedProperty} columnCount
    */
    columnCount: Ember['default'].computed('width', 'elementWidth', function() {
      var elementWidth, width, count;

      elementWidth = get(this, 'elementWidth');
      width = get(this, 'width');

      if (elementWidth && width > elementWidth) {
        count = floor(width / elementWidth);
      } else {
        count = 1;
      }

      return count;
    }),

    /**
      @private

      Fires every time column count is changed.

      @event columnCountDidChange
    */
    columnCountDidChange: Ember['default'].observer(function() {
      var ratio, currentScrollTop, proposedScrollTop, maxScrollTop,
          scrollTop, lastColumnCount, newColumnCount, element;

      lastColumnCount = this._lastColumnCount;

      currentScrollTop = this.scrollTop;
      newColumnCount = get(this, 'columnCount');
      maxScrollTop = get(this, 'maxScrollTop');
      element = this.element;

      this._lastColumnCount = newColumnCount;

      if (lastColumnCount) {
        ratio = (lastColumnCount / newColumnCount);
        proposedScrollTop = currentScrollTop * ratio;
        scrollTop = min(maxScrollTop, proposedScrollTop);

        this._scrollTo(scrollTop);
        this.scrollTop = scrollTop;
      }

      if (arguments.length > 0) {
        // invoked by observer
        Ember['default'].run.schedule('afterRender', this, this._syncListContainerWidth);
      }
    }, 'columnCount'),

    /**
      @private

      Computes max possible scrollTop value given the visible viewport
      and scrollable container div height.

      @property {Ember.ComputedProperty} maxScrollTop
    */
    maxScrollTop: Ember['default'].computed('height', 'totalHeight', function(){
      var totalHeight, viewportHeight;

      totalHeight = get(this, 'totalHeight');
      viewportHeight = get(this, 'height');

      return max(0, totalHeight - viewportHeight);
    }),

    /**
      @private

      Determines whether the emptyView is the current childView.

      @method _isChildEmptyView
    */
    _isChildEmptyView: function() {
      var emptyView = get(this, 'emptyView');

      return emptyView && emptyView instanceof Ember['default'].View &&
             this._childViews.length === 1 && this._childViews.indexOf(emptyView) === 0;
    },

    /**
      @private

      Computes the number of views that would fit in the viewport area.
      You must specify `height` and `rowHeight` parameters for the number of
      views to be computed properly.

      @method _numChildViewsForViewport
    */
    _numChildViewsForViewport: function() {

      if (this.heightForIndex) {
        return this._numChildViewsForViewportWithMultiHeight();
      } else {
        return this._numChildViewsForViewportWithoutMultiHeight();
      }
    },

    _numChildViewsForViewportWithoutMultiHeight:  function() {
      var height, rowHeight, paddingCount, columnCount;

      height = get(this, 'height');
      rowHeight = get(this, 'rowHeight');
      paddingCount = get(this, 'paddingCount');
      columnCount = get(this, 'columnCount');

      return (ceil(height / rowHeight) * columnCount) + (paddingCount * columnCount);
    },

    _numChildViewsForViewportWithMultiHeight:  function() {
      var rowHeight, paddingCount, columnCount;
      var scrollTop = this.scrollTop;
      var viewportHeight = this.get('height');
      var length = this.get('content.length');
      var heightfromTop = 0;
      var padding = get(this, 'paddingCount');

      var startingIndex = this._calculatedStartingIndex();
      var currentHeight = 0;

      var offsetHeight = this._cachedHeightLookup(startingIndex);
      for (var i = 0; i < length; i++) {
        if (this._cachedHeightLookup(startingIndex + i + 1) - offsetHeight > viewportHeight) {
          break;
        }
      }

      return i + padding + 1;
    },


    /**
      @private

      Computes the starting index of the item views array.
      Takes `scrollTop` property of the element into account.

      Is used in `_syncChildViews`.

      @method _startingIndex
    */
    _startingIndex: function(_contentLength) {
      var scrollTop, rowHeight, columnCount, calculatedStartingIndex,
          contentLength;

      if (_contentLength === undefined) {
        contentLength = get(this, 'content.length');
      } else {
        contentLength = _contentLength;
      }

      scrollTop = this.scrollTop;
      rowHeight = get(this, 'rowHeight');
      columnCount = get(this, 'columnCount');

      if (this.heightForIndex) {
        calculatedStartingIndex = this._calculatedStartingIndex();
      } else {
        calculatedStartingIndex = floor(scrollTop / rowHeight) * columnCount;
      }

      var viewsNeededForViewport = this._numChildViewsForViewport();
      var paddingCount = (1 * columnCount);
      var largestStartingIndex = max(contentLength - viewsNeededForViewport, 0);

      return min(calculatedStartingIndex, largestStartingIndex);
    },

    _calculatedStartingIndex: function() {
      var rowHeight, paddingCount, columnCount;
      var scrollTop = this.scrollTop;
      var viewportHeight = this.get('height');
      var length = this.get('content.length');
      var heightfromTop = 0;
      var padding = get(this, 'paddingCount');

      for (var i = 0; i < length; i++) {
        if (this._cachedHeightLookup(i + 1) >= scrollTop) {
          break;
        }
      }

      return i;
    },

    /**
      @private
      @event contentWillChange
    */
    contentWillChange: Ember['default'].observer(function() {
      var content  = get(this, 'content');
      if (!content) { return; }

      var oldContent = get(this, 'oldContent');
      if (oldContent === content) { return; }

      content.removeArrayObserver(this);
      set(this, 'oldContent', content);
    }, 'content'),

    /**),
      @private
      @event contentDidChange
    */
    contentDidChange: Ember['default'].observer(function() {
      addContentArrayObserver.call(this);
      syncChildViews.call(this);
    }, 'content'),

    /**
      @private
      @property {Function} needsSyncChildViews
    */
    needsSyncChildViews: Ember['default'].observer(syncChildViews, 'height', 'width', 'columnCount'),

    /**
      @private

      Returns a new item view. Takes `contentIndex` to set the context
      of the returned view properly.

      @param {Number} contentIndex item index in the content array
      @method _addItemView
    */
    _addItemView: function (contentIndex) {
      var itemViewClass, childView;

      itemViewClass = this.itemViewForIndex(contentIndex);
      childView = this.createChildView(itemViewClass);
      this.pushObject(childView);
    },

    /**
      @public

      Returns a view class for the provided contentIndex. If the view is
      different then the one currently present it will remove the existing view
      and replace it with an instance of the class provided

      @param {Number} contentIndex item index in the content array
      @method _addItemView
      @returns {Ember.View} ember view class for this index
    */
    itemViewForIndex: function(contentIndex) {
      return get(this, 'itemViewClass');
    },

    /**
      @public

      Returns a view class for the provided contentIndex. If the view is
      different then the one currently present it will remove the existing view
      and replace it with an instance of the class provided

      @param {Number} contentIndex item index in the content array
      @method _addItemView
      @returns {Ember.View} ember view class for this index
    */
    heightForIndex: null,

    /**
      @private

      Intelligently manages the number of childviews.

      @method _syncChildViews
     **/
    _syncChildViews: function () {
      var childViews, childViewCount,
          numberOfChildViews, numberOfChildViewsNeeded,
          contentIndex, startingIndex, endingIndex,
          contentLength, emptyView, count, delta;

      if (this.isDestroyed || this.isDestroying) {
        return;
      }

      contentLength = get(this, 'content.length');
      emptyView = get(this, 'emptyView');

      childViewCount = this._childViewCount();
      childViews = this.positionOrderedChildViews();

      if (this._isChildEmptyView()) {
        removeEmptyView.call(this);
      }

      startingIndex = this._startingIndex();
      endingIndex = startingIndex + childViewCount;

      numberOfChildViewsNeeded = childViewCount;
      numberOfChildViews = childViews.length;

      delta = numberOfChildViewsNeeded - numberOfChildViews;

      if (delta === 0) {
        // no change
      } else if (delta > 0) {
        // more views are needed
        contentIndex = this._lastEndingIndex;

        for (count = 0; count < delta; count++, contentIndex++) {
          this._addItemView(contentIndex);
        }
      } else {
        // less views are needed
        forEach.call(
          childViews.splice(numberOfChildViewsNeeded, numberOfChildViews),
          removeAndDestroy,
          this
        );
      }

      this._reuseChildren();

      this._lastStartingIndex = startingIndex;
      this._lastEndingIndex   = this._lastEndingIndex + delta;

      if (contentLength === 0 || contentLength === undefined) {
        addEmptyView.call(this);
      }
    },

    /**
      @private

      Applies an inline width style to the list container.

      @method _syncListContainerWidth
     **/
    _syncListContainerWidth: function() {
      var elementWidth, columnCount, containerWidth, element;

      elementWidth = get(this, 'elementWidth');
      columnCount = get(this, 'columnCount');
      containerWidth = elementWidth * columnCount;
      element = this.$('.ember-list-container');

      if (containerWidth && element) {
        element.css('width', containerWidth);
      }
    },

    /**
      @private
      @method _reuseChildren
    */
    _reuseChildren: function(){
      var contentLength, childViews, childViewsLength,
          startingIndex, endingIndex, childView, attrs,
          contentIndex, visibleEndingIndex, maxContentIndex,
          contentIndexEnd, scrollTop;

      scrollTop          = this.scrollTop;
      contentLength      = get(this, 'content.length');
      maxContentIndex    = max(contentLength - 1, 0);
      childViews         = this.getReusableChildViews();
      childViewsLength   =  childViews.length;

      startingIndex      = this._startingIndex();
      visibleEndingIndex = startingIndex + this._numChildViewsForViewport();

      endingIndex        = min(maxContentIndex, visibleEndingIndex);

      contentIndexEnd    = min(visibleEndingIndex, startingIndex + childViewsLength);

      for (contentIndex = startingIndex; contentIndex < contentIndexEnd; contentIndex++) {
        childView = childViews[contentIndex % childViewsLength];
        this._reuseChildForContentIndex(childView, contentIndex);
      }
    },

    /**
      @private
      @method getReusableChildViews
    */
    getReusableChildViews: function() {
      return this._childViews;
    },

    /**
      @private
      @method positionOrderedChildViews
    */
    positionOrderedChildViews: function() {
      return this.getReusableChildViews().sort(sortByContentIndex);
    },

    arrayWillChange: Ember['default'].K,

    /**
      @private
      @event arrayDidChange
    */
    // TODO: refactor
    arrayDidChange: function(content, start, removedCount, addedCount) {
      var index, contentIndex, state;

      if (this._isChildEmptyView()) {
        removeEmptyView.call(this);
      }

      // Support old and new Ember versions
      state = this._state || this.state;

      if (state === 'inDOM') {
        // ignore if all changes are out of the visible change
        if (start >= this._lastStartingIndex || start < this._lastEndingIndex) {
          index = 0;
          // ignore all changes not in the visible range
          // this can re-position many, rather then causing a cascade of re-renders
          forEach.call(
            this.positionOrderedChildViews(),
            function(childView) {
              contentIndex = this._lastStartingIndex + index;
              this._reuseChildForContentIndex(childView, contentIndex);
              index++;
            },
            this
          );
        }

        syncChildViews.call(this);
      }
    },

    destroy: function () {
      if (!this._super()) {
        return;
      }

      if (this._createdEmptyView) {
        this._createdEmptyView.destroy();
      }

      return this;
    }
  });

});
define('ember-list-view/list-view', ['exports', 'ember', 'ember-list-view/list-view-helper', 'ember-list-view/list-view-mixin'], function (exports, Ember, ListViewHelper, ListViewMixin) {

  'use strict';

  var get = Ember['default'].get;

  /**
    The `Ember.ListView` view class renders a
    [div](https://developer.mozilla.org/en/HTML/Element/div) HTML element,
    with `ember-list-view` class.

    The context of each item element within the `Ember.ListView` are populated
    from the objects in the `ListView`'s `content` property.

    ### `content` as an Array of Objects

    The simplest version of an `Ember.ListView` takes an array of object as its
    `content` property. The object will be used as the `context` each item element
    inside the rendered `div`.

    Example:

    ```javascript
    App.ContributorsRoute = Ember.Route.extend({
      model: function () {
        return [
          { name: 'Stefan Penner' },
          { name: 'Alex Navasardyan' },
          { name: 'Ray Cohen'}
        ];
      }
    });
    ```

    ```handlebars
    {{#ember-list items=contributors height=500 rowHeight=50}}
      {{name}}
    {{/ember-list}}
    ```

    Would result in the following HTML:

    ```html
     <div id="ember181" class="ember-view ember-list-view" style="height:500px;width:500px;position:relative;overflow:scroll;-webkit-overflow-scrolling:touch;overflow-scrolling:touch;">
      <div class="ember-list-container">
        <div id="ember186" class="ember-view ember-list-item-view" style="transform: translate(0px, 0px)">
          Stefan Penner
        </div>
        <div id="ember187" class="ember-view ember-list-item-view" style="transform: translate(0px, 50px">
          Alex Navasardyan
        </div>
        <div id="ember188" class="ember-view ember-list-item-view" style="transform: translate(0px, 100px)">
          Ray Cohen
        </div>
      </div>
    </div>
    ```

    By default `Ember.ListView` provides support for `height`,
    `rowHeight`, `width`, `elementWidth`, `scrollTop` parameters.

    Note, that `height` and `rowHeight` are required parameters.

    ```handlebars
    {{#ember-list items=this height=500 rowHeight=50}}
      {{name}}
    {{/ember-list}}
    ```

    If you would like to have multiple columns in your view layout, you can
    set `width` and `elementWidth` parameters respectively.

    ```handlebars
    {{#ember-list items=this height=500 rowHeight=50 width=500 elementWidth=80}}
      {{name}}
    {{/ember-list}}
    ```

    ### Extending `Ember.ListView`

    Example:

    ```handlebars
    {{view 'list-view' content=content}}

    <script type="text/x-handlebars" data-template-name="row_item">
      {{name}}
    </script>
    ```

    ```javascript
    App.ListView = Ember.ListView.extend({
      height: 500,
      width: 500,
      elementWidth: 80,
      rowHeight: 20,
      itemViewClass: Ember.ListItemView.extend({templateName: "row_item"})
    });
    ```

    @extends Ember.ContainerView
    @class ListView
    @namespace Ember
  */
  exports['default'] = Ember['default'].ContainerView.extend(ListViewMixin['default'], {
    css: {
      position: 'relative',
      overflow: 'auto',
      '-webkit-overflow-scrolling': 'touch',
      'overflow-scrolling': 'touch'
    },

    applyTransform: ListViewHelper['default'].applyTransform,

    _scrollTo: function(scrollTop) {
      var element = this.element;

      if (element) { element.scrollTop = scrollTop; }
    },

    didInsertElement: function() {
      var that = this;

      this._updateScrollableHeight();

      this._scroll = function(e) { that.scroll(e); };

      Ember['default'].$(this.element).on('scroll', this._scroll);
    },

    willDestroyElement: function() {
      Ember['default'].$(this.element).off('scroll', this._scroll);
    },

    scroll: function(e) {
      this.scrollTo(e.target.scrollTop);
    },

    scrollTo: function(y) {
      this._scrollTo(y);
      this._scrollContentTo(y);
    },

    totalHeightDidChange: Ember['default'].observer(function () {
      Ember['default'].run.scheduleOnce('afterRender', this, this._updateScrollableHeight);
    }, 'totalHeight'),

    _updateScrollableHeight: function () {
      var height, state;

      // Support old and new Ember versions
      state = this._state || this.state;

      if (state === 'inDOM') {
        // if the list is currently displaying the emptyView, remove the height
        if (this._isChildEmptyView()) {
            height = '';
        } else {
            height = get(this, 'totalHeight');
        }

        this.$('.ember-list-container').css({
          height: height
        });
      }
    }
  });

});
define('ember-list-view/register-helper', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  function registerHelperIteration1(name, helperFunction) {
    //earlier versions of ember with htmlbars used this
    Ember['default'].HTMLBars.helpers[name] = helperFunction;
  }

  function registerHelperIteration2(name, helperFunction) {
    //registerHelper has been made private as _registerHelper
    //this is kept here if anyone is using it
    Ember['default'].HTMLBars.registerHelper(name, helperFunction);
  }

  function registerHelperIteration3(name, helperFunction) {
    //latest versin of ember uses this
    Ember['default'].HTMLBars._registerHelper(name, helperFunction);
  }

  function registerHelper(name, helperFunction) {
    if (Ember['default'].HTMLBars) {
      if (Ember['default'].HTMLBars._registerHelper) {
        if (Ember['default'].HTMLBars.helpers) {
          registerHelperIteration1(name, helperFunction);
        } else {
          registerHelperIteration3(name, helperFunction);
        }
      } else if (Ember['default'].HTMLBars.registerHelper) {
        registerHelperIteration2(name, helperFunction);
      }
    } else if (Ember['default'].Handlebars) {
      Ember['default'].Handlebars.helper(name, helperFunction);
    }
  }
  exports['default'] = registerHelper;

});
define('ember-list-view/reusable-list-item-view', ['exports', 'ember', 'ember-list-view/list-item-view-mixin'], function (exports, Ember, ListItemViewMixin) {

  'use strict';

  var get = Ember['default'].get, set = Ember['default'].set;

  exports['default'] = Ember['default'].View.extend(ListItemViewMixin['default'], {
    prepareForReuse: Ember['default'].K,

    init: function () {
      this._super();
      var context = Ember['default'].ObjectProxy.create();
      this.set('context', context);
      this._proxyContext = context;
    },

    isVisible: Ember['default'].computed('context.content', function () {
      return !!this.get('context.content');
    }),

    updateContext: function (newContext) {
      var context = get(this._proxyContext, 'content');

      // Support old and new Ember versions
      var state = this._state || this.state;

      if (context !== newContext) {
        if (state === 'inDOM') {
          this.prepareForReuse(newContext);
        }

        set(this._proxyContext, 'content', newContext);

        if (newContext && newContext.isController) {
          set(this, 'controller', newContext);
        }
      }
    }
  });

});
define('ember-list-view/virtual-list-scroller-events', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var fieldRegex = /input|textarea|select/i,
    hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch,
    handleStart, handleMove, handleEnd, handleCancel,
    startEvent, moveEvent, endEvent, cancelEvent;
  if (hasTouch) {
    startEvent = 'touchstart';
    handleStart = function (e) {
      var touch = e.touches[0],
        target = touch && touch.target;
      // avoid e.preventDefault() on fields
      if (target && fieldRegex.test(target.tagName)) {
        return;
      }
      bindWindow(this.scrollerEventHandlers);
      this.willBeginScroll(e.touches, e.timeStamp);
      e.preventDefault();
    };
    moveEvent = 'touchmove';
    handleMove = function (e) {
      this.continueScroll(e.touches, e.timeStamp);
    };
    endEvent = 'touchend';
    handleEnd = function (e) {
      // if we didn't end up scrolling we need to
      // synthesize click since we did e.preventDefault()
      // on touchstart
      if (!this._isScrolling) {
        synthesizeClick(e);
      }
      unbindWindow(this.scrollerEventHandlers);
      this.endScroll(e.timeStamp);
    };
    cancelEvent = 'touchcancel';
    handleCancel = function (e) {
      unbindWindow(this.scrollerEventHandlers);
      this.endScroll(e.timeStamp);
    };
  } else {
    startEvent = 'mousedown';
    handleStart = function (e) {
      if (e.which !== 1) {
        return;
      }
      var target = e.target;
      // avoid e.preventDefault() on fields
      if (target && fieldRegex.test(target.tagName)) {
        return;
      }
      bindWindow(this.scrollerEventHandlers);
      this.willBeginScroll([e], e.timeStamp);
      e.preventDefault();
    };
    moveEvent = 'mousemove';
    handleMove = function (e) {
      this.continueScroll([e], e.timeStamp);
    };
    endEvent = 'mouseup';
    handleEnd = function (e) {
      unbindWindow(this.scrollerEventHandlers);
      this.endScroll(e.timeStamp);
    };
    cancelEvent = 'mouseout';
    handleCancel = function (e) {
      if (e.relatedTarget) {
        return;
      }
      unbindWindow(this.scrollerEventHandlers);
      this.endScroll(e.timeStamp);
    };
  }

  function handleWheel(e) {
    this.mouseWheel(e);
    e.preventDefault();
  }

  function bindElement(el, handlers) {
    el.addEventListener(startEvent, handlers.start, false);
    el.addEventListener('mousewheel', handlers.wheel, false);
  }

  function unbindElement(el, handlers) {
    el.removeEventListener(startEvent, handlers.start, false);
    el.removeEventListener('mousewheel', handlers.wheel, false);
  }

  function bindWindow(handlers) {
    window.addEventListener(moveEvent, handlers.move, true);
    window.addEventListener(endEvent, handlers.end, true);
    window.addEventListener(cancelEvent, handlers.cancel, true);
  }

  function unbindWindow(handlers) {
    window.removeEventListener(moveEvent, handlers.move, true);
    window.removeEventListener(endEvent, handlers.end, true);
    window.removeEventListener(cancelEvent, handlers.cancel, true);
  }

  exports['default'] = Ember['default'].Mixin.create({
    init: function() {
      this.on('didInsertElement', this, 'bindScrollerEvents');
      this.on('willDestroyElement', this, 'unbindScrollerEvents');
      this.scrollerEventHandlers = {
        start: bind(this, handleStart),
        move: bind(this, handleMove),
        end: bind(this, handleEnd),
        cancel: bind(this, handleCancel),
        wheel: bind(this, handleWheel)
      };
      return this._super();
    },
    scrollElement: Ember['default'].computed.oneWay('element').readOnly(),
    bindScrollerEvents: function() {
      var el = this.get('scrollElement'),
        handlers = this.scrollerEventHandlers;
      bindElement(el, handlers);
    },
    unbindScrollerEvents: function() {
      var el = this.get('scrollElement'),
        handlers = this.scrollerEventHandlers;
      unbindElement(el, handlers);
      unbindWindow(handlers);
    }
  });

  function bind(view, handler) {
    return function (evt) {
      handler.call(view, evt);
    };
  }

  function synthesizeClick(e) {
    var point = e.changedTouches[0],
      target = point.target,
      ev;
    if (target && !fieldRegex.test(target.tagName)) {
      ev = document.createEvent('MouseEvents');
      ev.initMouseEvent('click', true, true, e.view, 1, point.screenX, point.screenY, point.clientX, point.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);
      return target.dispatchEvent(ev);
    }
  }

});
define('ember-list-view/virtual-list-view', ['exports', 'ember', 'ember-list-view/list-view-mixin', 'ember-list-view/list-view-helper', 'ember-list-view/virtual-list-scroller-events'], function (exports, Ember, ListViewMixin, ListViewHelper, VirtualListScrollerEvents) {

  'use strict';

  /*
    global Scroller
  */
  var get = Ember['default'].get;

  function updateScrollerDimensions(target) {
    var width, height, totalHeight;

    target = target || this; // jshint ignore:line

    width = get(target, 'width');
    height = get(target, 'height');
    totalHeight = get(target, 'totalHeight'); // jshint ignore:line

    target.scroller.setDimensions(width, height, width, totalHeight);
    target.trigger('scrollerDimensionsDidChange');
  }

  /**
    VirtualListView

    @class VirtualListView
    @namespace Ember
  */
  exports['default'] = Ember['default'].ContainerView.extend(ListViewMixin['default'], VirtualListScrollerEvents['default'], {
    _isScrolling: false,
    _mouseWheel: null,
    css: {
      position: 'relative',
      overflow: 'hidden'
    },

    init: function(){
      this._super();
      this.setupScroller();
      this.setupPullToRefresh();
    },
    _scrollerTop: 0,
    applyTransform: ListViewHelper['default'].apply3DTransform,

    setupScroller: function(){
      var view = this;

      /* global Scroller */
      view.scroller = new Scroller(function(left, top/*, zoom*/) {
        // Support old and new Ember versions
        var state = view._state || view.state;

        if (state !== 'inDOM') {
          return;
        }

        if (view.listContainerElement) {
          view._scrollerTop = top;
          view._scrollContentTo(top);
          view.applyTransform(view.listContainerElement, 0, -top);
        }
      }, {
        scrollingX: false,
        scrollingComplete: function(){
          view.trigger('scrollingDidComplete');
        }
      });

      view.trigger('didInitializeScroller');
      updateScrollerDimensions(view);
    },
    setupPullToRefresh: function() {
      if (!this.pullToRefreshViewClass) {
        return;
      }

      this._insertPullToRefreshView();
      this._activateScrollerPullToRefresh();
    },
    _insertPullToRefreshView: function(){
      this.pullToRefreshView = this.createChildView(this.pullToRefreshViewClass);
      this.insertAt(0, this.pullToRefreshView);

      var view = this;

      this.pullToRefreshView.on('didInsertElement', function() {
        Ember['default'].run.scheduleOnce('afterRender', this, function(){
          view.applyTransform(this.element, 0, -1 * view.pullToRefreshViewHeight);
        });
      });
    },
    _activateScrollerPullToRefresh: function(){
      var view = this;
      function activatePullToRefresh(){
        view.pullToRefreshView.set('active', true);
        view.trigger('activatePullToRefresh');
      }
      function deactivatePullToRefresh() {
        view.pullToRefreshView.set('active', false);
        view.trigger('deactivatePullToRefresh');
      }
      function startPullToRefresh() {
        Ember['default'].run(function(){
          view.pullToRefreshView.set('refreshing', true);

          function finishRefresh(){
            if (view && !view.get('isDestroyed') && !view.get('isDestroying')) {
              view.scroller.finishPullToRefresh();
              view.pullToRefreshView.set('refreshing', false);
            }
          }
          view.startRefresh(finishRefresh);
        });
      }
      this.scroller.activatePullToRefresh(
        this.pullToRefreshViewHeight,
        activatePullToRefresh,
        deactivatePullToRefresh,
        startPullToRefresh
      );
    },

    getReusableChildViews: function(){
      var views = this._super.apply(this, arguments);
      var firstView = views[0];

      if (firstView && firstView === this.pullToRefreshView) {
        return views.slice(1);
      } else {
        return views;
      }
    },

    scrollerDimensionsNeedToChange: Ember['default'].observer(function() {
      Ember['default'].run.once(this, updateScrollerDimensions);
    }, 'width', 'height', 'totalHeight'),

    didInsertElement: function() {
      this.listContainerElement = this.$('> .ember-list-container')[0];
    },

    willBeginScroll: function(touches, timeStamp) {
      this._isScrolling = false;
      this.trigger('scrollingDidStart');

      this.scroller.doTouchStart(touches, timeStamp);
    },

    continueScroll: function(touches, timeStamp) {
      var startingScrollTop, endingScrollTop, event;

      if (this._isScrolling) {
        this.scroller.doTouchMove(touches, timeStamp);
      } else {
        startingScrollTop = this._scrollerTop;

        this.scroller.doTouchMove(touches, timeStamp);

        endingScrollTop = this._scrollerTop;

        if (startingScrollTop !== endingScrollTop) {
          event = Ember['default'].$.Event("scrollerstart");
          Ember['default'].$(touches[0].target).trigger(event);

          this._isScrolling = true;
        }
      }
    },

    endScroll: function(timeStamp) {
      this.scroller.doTouchEnd(timeStamp);
    },

    // api
    scrollTo: function(y, animate) {
      if (animate === undefined) {
        animate = true;
      }

      this.scroller.scrollTo(0, y, animate, 1);
    },

    // events
    mouseWheel: function(e){
      var inverted, delta, candidatePosition;

      inverted = e.webkitDirectionInvertedFromDevice;
      delta = e.wheelDeltaY * (inverted ? 0.8 : -0.8);
      candidatePosition = this.scroller.__scrollTop + delta;

      if ((candidatePosition >= 0) && (candidatePosition <= this.scroller.__maxScrollTop)) {
        this.scroller.scrollBy(0, delta, true);
        e.stopPropagation();
      }

      return false;
    }
  });

});
;/* jshint ignore:start */



/* jshint ignore:end */
//# sourceMappingURL=vendor.map