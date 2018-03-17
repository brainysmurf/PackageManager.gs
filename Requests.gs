(function(global,name,Package,helpers){var ref=function wrapper(args){var wrapped=function(){return Package.apply(global.Import&&Import.module?Import._import(name):global[name],arguments)};for(i in args){wrapped[i]=args[i]}return wrapped}(helpers);if(global.Import&&Import.module){Import.register(name,ref)}else{Object.defineProperty(global,name,{value:ref});global.Import=global.Import||function(lib){return global[lib]};Import.module=false}})(this,

"Requests",

function RequestsPackage_ (config) {
  var self = this, discovery, discoverUrl;
  
  discovery = function (name, version) {
    return self().get('https://www.googleapis.com/discovery/v1/apis/' + name + '/' + version + '/rest');
  };
    
  discoverUrl = function (name, version, category, method) {
    var data;
    data = discovery(name, version).json();
    return data.baseUrl + data.resources[category].methods[method].path;
  };

  config = config || {};
  config.baseUrl = config.baseUrl || "";
  config.body = config.body || {};
  config.headers = config.headers || null;
  config.query = config.query || {};  
  config.oauth = config.oauth || false;
  config.basicAuth = config.basicAuth || false;
  config.discovery = config.discovery || null;
  
  if (config.discovery && config.discovery.name && config.discovery.version && config.discovery.category && config.discovery.method) {
    config.baseUrl = discoverUrl(config.discovery.name, config.discovery.version, config.discovery.category, config.discovery.method);
  }
  
  if (config.oauth) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = "Bearer " + (config.oauth === 'me' ? ScriptApp.getOAuthToken() : config.oauth);
  }
  
  if (config.basicAuth) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = "Basic " + config.basicAuth;
  }
  
  var Response = function (_resp) {
  
    return {
    
      json: function () {
        try {
          return JSON.parse(this.text());
        } catch (err) {
          throw Error("Response did not return a parsable json object");
        }
      },
      
      text: function () {
        return _resp.getContentText();
      },
      
      statusCode: function () {
        return _resp.getResponseCode();
      },

      ok: _resp.getResponseCode() == 200,
      
      getAllHeaders: function () {
        return _resp.getAllHeaders();
      },

      /*
        Return true if encounted rate limit
      */
      hitRateLimit: function () {
        if (this.statusCode() === 429) {
          var headers = this.getAllHeaders();
          var header_reset_at = headers['x-ratelimit-reset'];
          header_reset_at = header_reset_at.replace(" UTC", "+0000").replace(" ", "T");
          var reset_at = new Date(header_reset_at).getTime();
          var utf_now = new Date().getTime();
          var milliseconds = reset_at - utf_now + 10;
          if (milliseconds > 0) {
            Logger.log("Sleeping for " + (milliseconds/1000).toString() + " seconds.");
            Utilities.sleep(milliseconds);
          } 
          return true;
        }
        return false;
      },
      
      /*
      
      */
      paged: function (rootKey) {
        if (typeof rootKey === 'undefined') throw Error('Specify path');
        var json;
        json = this.json();
        if (!json.meta || !json.meta.total_pages) {
          throw Error("Paged called with incomplete or missing meta property")
        } else {
          var page, batch, req, rawRequest;
          batch = new BatchRequests();
          page = 2;
          while (json.meta.total_pages >= page) {
            req = this.request;
            req.setQuery('page', page);
            rawRequest = req.toRequestObject();
            batch.add( rawRequest );
            page++;
          }
          return batch.fetchAll().zip(rootKey, json);
        }
      },
      
      /*
      */
      paged: function (rootKey) {
        if (typeof rootKey === 'undefined') throw Error('Specify path');
        var json;
        json = this.json();
        var page, batch, req, rawRequest;
        batch = new BatchRequests();
        page = 2;
        while (json.meta.total_pages >= page) {
          req = this.request;
          req.setQuery('page', page);
          rawRequest = req.toRequestObject();
          batch.add( rawRequest );
          page++;
        }
        return batch.fetchAll().zip(rootKey, json);
      },
      
      iterPaging: function (rootKey, next, query) {
        next = next || 'nextPageToken';
        query = query || 'pageToken';
        if (typeof rootKey === 'undefined') throw Error('Specify root key');
        var json;
        json = this.json();
        var token, collection = [], req, result, j;
        Array.prototype.push.apply(collection, json[rootKey]);
        token = json[next];
        while (token) {
          req = this.request;
          req.setQuery(query, token); 
          result = req.fetch();
          if (!result.ok) {
            // "If the token is rejected for any reason, it should be discarded, and pagination should be restarted from the first page of results."
            req.clearQuery();
            result = req.fetch();
            if (!result.ok) {
              throw Error("Unable to reach " + req.getUrl() + " status code: " + req.statusCode());
            }
          }
          j = result.json();
          Array.prototype.push.apply(collection, j[rootKey]);
          token = j[next];
        }
        return collection;
      },
      
    }
  };
  
  var BatchResponses = function (_responses) {
    _responses = _responses || [];
    return {
      zip: function (rootKey, options) {
        var json;
        options = options || {};
        json = options.initialValue || [];
        options.everyObj = options.everyObj || {};

        _responses.forEach(function (resp) {
          var j, req, match;
          j = resp.json();
          req = resp.request;
          if ((j[rootKey] || {length: 0}).length > 0) {
            j[rootKey].forEach(function (o) {
              for (var key in options.everyObj) {
                if (options.everyObj[key] instanceof RegExp) {
                  match = req.getUrl().match(options.everyObj[key]);
                  o[key] = parseInt(match[1]);  // FIXME: Need to be able to define a callback function to process
                } else {
                  o[key] = options.everyObj[key];
                }
              }
            });
            Array.prototype.push.apply(json, j[rootKey]);
          }
        });
        return json;
      },      
    
      getResponses: function () {
        return _responses;
      }
    }
  };

  var BatchRequests = function(_list) {
    _list = _list || [];
    return {
    
      fetchAll: function (expandForPages) {
        expandForPages = expandForPages || false;
        var responses, expandedRequests;
        expandedRequests = new BatchRequests();
        responses = UrlFetchApp.fetchAll(_list).reduce(function (acc, response, index) {
          var resp, origRequest ,url;
          origRequest = _list[index];
          resp = new Response(response);
          url = origRequest.url;
          delete origRequest.url;
          resp.request = new Request(url, origRequest);

          if (resp.hitRateLimit()) {
            var request, r;
            r = resp.request;
            resp = resp.request.fetch();
            resp.request = r;
          }
          acc.push(resp);
          if (expandForPages && (function (r, er) {
            var json, page, req, rawRequest;
            json = r.json();
            page = 2;
            while ((json.meta || {total_page: -1}).total_pages >= page) {
              req = r.request;
              req.setQuery('page', page);
              rawRequest = req.toRequestObject();
              er.add( rawRequest );
              page++;
            }
          })(resp, expandedRequests));
          return acc;
        }, []);
        
        if (expandForPages && (function (resps) {
          var newResponses;
          if (expandedRequests.length === 0) return;  // no need to continue
          newResponses = expandedRequests.fetchAll(false);
          Array.prototype.push.apply(resps, newResponses.getResponses());
        })(responses));
        
        return new BatchResponses(responses);
      },
      
      add: function (item) {
        _list.push(item);
      },
      
      length: function (item) {
        return _list.length;
      }
    };
  };

  /**
   * Represents a request. 
   *
   * @constructor
   * @param {object} [_options={}] - Options object
  */
  var Request = function (_options) {
    _options = _options || {};
    _options.url = _options.url || config.baseUrl;
    if (typeof _options.url === 'object' && config.baseUrl) {
      _options.url = self.format(config.baseUrl, _options.url);
    }
    _options.body = _options.body || {};
    _options.headers = _options.headers || null;
    _options.query = _options.query || {};

    return {
    
      /*
        Prepares the params parameter of UrlFetchApp.fetch and returns 
        custom response object
      */
      build: function () {
        var params = {}, resp, reply;

        params.muteHttpExceptions = true;
        params.method = _options.method.toLowerCase();
        if (_options.headers || config.headers) {
          params.headers = self.utils.merge(_options.headers, config.headers);
        }

        if ( ['put', 'post'].indexOf(params.method) !== -1 ) {
          params.payload = self.utils.merge(_options.body, config.body);
          params.payload = JSON.stringify(params.payload);
          params.contentType = 'application/json';
        }

        reply = UrlFetchApp.fetch(this.getUrl(), params);
        resp = new Response(reply);
        resp.request = this;
        return resp;
      },

      /*
        Fetches external resource, handling any API rate limitations
      */
      fetch: function () {
        var resp;
        resp = this.build();
        if (resp.hitRateLimit()) {
          resp = this.build();
        }
        return resp;
      },

      getUrl: function () {
        var obj = self.utils.merge(_options.query, config.query);
        if (_options.url.indexOf('?') !== -1) _options.url = _options.url.slice(0, _options.url.indexOf('?'));
        if (Object.keys(obj).length == 0) return _options.url;
        var ret = _options.url + "?" + Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&');
        return ret;
      },
      
      setQuery: function (key, value) {
        _options.query[key] = value;
      },
      
      clearQuery: function () {
        _options.query = {};
      },
            
      toRequestObject: function () {
        return self.utils.merge({url: this.getUrl()}, _fetchParams);
      }
    };
  };

  return {
    
    batchGet: function (urlTemplate, items, path, options) {
      var requests, batchRequests;
      requests = items.reduce(function (acc, item) {
        var url, req, reqObj;
        if (typeof item[item.length-1] === 'object') {
          options = self.utils.merge(item[item.length-1], options);
          delete item[item.length-1];
        }
        item.splice(0, 0, urlTemplate);
        url = Utilities.formatString.apply(Utilities.formatString, item);
        req = new Request(url, {method: 'get'}, options);
        reqObj = req.toRequestObject();
        acc.push(reqObj);
        return acc;
      }, []);
      return new BatchRequests(requests).fetchAll(true);
    },
    
    get: function (url, options) {
      options = options || {};
      options.url = url;
      options.method = 'get';
      return new Request(options).fetch();
    },

    post: function (url, options) {
      options = options || {};
      options.url = url;
      options.method = 'post';
      return new Request(options).fetch();
    },
    put: function (url, options) {
      options = options || {};
      options.url = url;
      options.method = 'put';
      return new Request(options).fetch();
    },
    delete_: function (url, options) {
      options = options || {};
      options.url = url;
      options.method = 'delete';
      return new Request(options).fetch();
    },
    head: function (url, options) {
      options = options || {};
      options.url = url;
      options.method = 'head';
      return new Request(options).fetch();
    },
    options: function (url, options) {
      options = options || {};
      options.url = url;
      options.method = 'options';
      return new Request(url, options).fetch();
    },
  };
},

{ /* helpers */
  
  /*
    http://www.{name}.com, {name: 'hey'} => http://www.hey.com
  */
  format: function (template /*, obj */) {
    //  ValueError :: String -> Error
    var ValueError = function(message) {
      var err = new Error(message);
      err.name = 'ValueError';
      return err;
    };
  
    //  defaultTo :: a,a? -> a
    var defaultTo = function(x, y) {
      return y == null ? x : y;
    };
    
    var lookup = function(obj, path) {
      if (!/^\d+$/.test(path[0])) {
        path = ['0'].concat(path);
      }
      for (var idx = 0; idx < path.length; idx += 1) {
        var key = path[idx];
        obj = typeof obj[key] === 'function' ? obj[key]() : obj[key];
      }
      return obj;
    };
  
    var args = Array.prototype.slice.call(arguments, 1);
    var idx = 0;
    var state = 'UNDEFINED';
    
    return template.replace(
      /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g,
      function(match, literal, key, xf) {
        if (literal != null) {
          return literal;
        }
        if (key.length > 0) {
          if (state === 'IMPLICIT') {
            throw ValueError('cannot switch from ' +
                             'implicit to explicit numbering');
          }
          state = 'EXPLICIT';
        } else {
          if (state === 'EXPLICIT') {
            throw ValueError('cannot switch from ' +
                             'explicit to implicit numbering');
          }
          state = 'IMPLICIT';
          key = String(idx);
          idx += 1;
        }
        var value = defaultTo('', lookup(args, key.split('.')));
        
        if (xf == null) {
          return value;
        } else if (Object.prototype.hasOwnProperty.call(transformers, xf)) {
          return transformers[xf](value);
        } else {
          throw ValueError('no transformer named "' + xf + '"');
        }
      }
    );
  },
  
  utils: {

    /*
      Merge keys from target into source
    */
    merge: function (source, target) {
      if (!source) { // TypeError if undefined or null
        return target;
      }
        
      var to = Object(source);
        
      if (target != null) { // Skip over if undefined or null
        for (var key in target) {
          if (Object.prototype.hasOwnProperty.call(target, key)) {
            to[key] = target[key];
          }
        }
      }
      
      return to;
    },
    
    /*
      Dotize: https://github.com/vardars/dotize/blob/master/src/dotize.js
      Flatten an object that contains nested objects into an object with just one layer,
      with keys in dotted notation.
    */
    dotize: function(obj, prefix) {
      var newObj = {};
      
      if ((!obj || typeof obj != "object") && !Array.isArray(obj)) {
        if (prefix) {
          newObj[prefix] = obj;
          return newObj;
        } else {
          return obj;
        }
      }
      
      function isNumber(f) {
        return !isNaN(parseInt(f));
      }
      
      function isEmptyObj(obj) {
        for (var prop in obj) {
          if (Object.hasOwnProperty.call(obj, prop))
            return false;
        }
      }
      
      function getFieldName(field, prefix, isRoot, isArrayItem, isArray) {
        if (isArray)
          return (prefix ? prefix : "") + (isNumber(field) ? "[" + field + "]" : (isRoot ? "" : ".") + field);
        else if (isArrayItem)
          return (prefix ? prefix : "") + "[" + field + "]";
        else
          return (prefix ? prefix + "." : "") + field;
      }
      
      return function recurse(o, p, isRoot) {
        var isArrayItem = Array.isArray(o);
        for (var f in o) {
          var currentProp = o[f];
          if (currentProp && typeof currentProp === "object") {
            if (Array.isArray(currentProp)) {
              newObj = recurse(currentProp, getFieldName(f, p, isRoot, false, true), isArrayItem); // array
            } else {
              if (isArrayItem && isEmptyObj(currentProp) == false) {
                newObj = recurse(currentProp, getFieldName(f, p, isRoot, true)); // array item object
              } else if (isEmptyObj(currentProp) == false) {
                newObj = recurse(currentProp, getFieldName(f, p, isRoot)); // object
              } else {
                //
              }
            }
          } else {
            if (isArrayItem || isNumber(f)) {
              newObj[getFieldName(f, p, isRoot, true)] = currentProp; // array item primitive
            } else {
              newObj[getFieldName(f, p, isRoot)] = currentProp; // primitive
            }
          }
        }
        
        return newObj;
      }(obj, prefix, true);
    },
    
    
    /*
    Flatten list into of rows with objects into list, first row being headers
    */
    flatten: function (rows, options) {
      options = options || {};
      options.pathDelimiter = options.pathDelimiter || '.';
      var headers;
      rows = rows.map(function (row) {
        return self.utils.dotize(row);
      });
      headers = rows.reduce(function (everyHeader, row) {
        var prop;
        for (prop in row) {
          everyHeader.push( prop );
        }
        return everyHeader;
      }, []);
      
      var mappedHeaders, finalHeaders;
      mappedHeaders = headers.map(function (el, i) {
        return { 
          index: i, 
          value: el === 'id' ? '' : el.toLowerCase()
        }
      });
      mappedHeaders.sort(function (a, b) {
        if (a.value > b.value) return 1;
        if (a.value < b.value) return -1;
        return 0;
      });
      finalHeaders = mappedHeaders.map(function (el) {
        return headers[el.index];
      }).filter(function (value, index, me) {
        return me.indexOf(value) === index;
      });
      
      return rows.reduce(function (acc, obj) {
        var row, value;
        row = [];
        for (var h=0; h < finalHeaders.length; h++) {
          value = obj[finalHeaders[h]];
          if (typeof value === 'undefined') value = "";
          row.push(value);
        }
        acc.push(row);
        return acc;
      }, [finalHeaders]);
      
    }
    
  },
}

);
