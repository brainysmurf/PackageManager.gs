(function(global,name,Package,helpers){var ref=function wrapper(args){var wrapped=function(){return Package.apply(global.Import&&Import.module?Import._import(name):global[name],arguments)};for(i in args){wrapped[i]=args[i]}return wrapped}(helpers);if(global.Import&&Import.module){Import.register(name,ref)}else{Object.defineProperty(global,name,{value:ref});global.Import=global.Import||function(lib){return global[lib]};Import.module=false}})(this,

'AppsScriptsRequests',

function AppsScriptsRequests_ (_config) {
  _config = _config || {};
  _config.scriptId = _config.scriptId || null;
  if (_config.scriptId === 'me') _config.scriptId = ScriptApp.getScriptId();
  var self, req, requests, ensureAppsscriptsFile;
  self = this;
  req = Import('Requests');
  requests = function (met) {
    /* TODO: cache these */
    return req({
      oauth: 'me',
      discovery: {
        name: 'script',
        version: 'v1',
        category: 'projects',
        method: met,
      },
    });
  };
  keepAppsscriptsFile = function (resources) {
    resources = resources || {};
    resources.files = resources.files || [];
    var hash;
    hash = self.utils.filesListToHash(resources.files);
    if (!hash.appsscript) {
      var data = content().json();
      var files = self.utils.filesListToHash(data.files);
      hash['appsscript'] = files.appsscript;
    }
    resources.files = self.utils.hashToFilesList(hash);
    return resources;
  };
  var requiresScriptId = function () {
    if (!_config.scriptId) throw Error("scriptId is not defined");
  };
  
  var create =  function (title, options) {
    options = options || {};
    options.body = options.body || {};
    options.body.title = title || "New Unnamed Project";
    return requests('create').post({/*empty*/}, options);
  };
  var new_ = function (title, options) {
    var resp, target;
    resp = create(title /* don't pass options */);
    _config.scriptId = resp.json().scriptId;
    return update(options);
  };
  var update = function (options, keepAppsscriptsJson) {
    requiresScriptId();
    keepAppsscriptsJson = keepAppsscriptsJson || true;
    options = options || {};
    if (!options.body || !options.body.files) throw Error("No body.files key in update call");
    if (keepAppsscriptsJson) {
      options.body = keepAppsscriptsFile(options.body);
    }
    return requests('updateContent').put({scriptId: _config.scriptId}, options);
  };
  var content = function (options) {
    requiresScriptId();
    return requests('getContent').get({scriptId: _config.scriptId}, options);
  };
  var metadata = function (options) {
    requiresScriptId();
    return requests('get').get({scriptId: _config.scriptId}, options);
  };
  
  return {
    create: create,
    new_: new_,
    update: update,
    content: content,
    metadata: metadata
  };
  
},

{ /* extensions */

  utils: {
  
    filesListToHash: function (files) {
      return files.reduce(function (acc, item) {
        acc[item.name] = item;
        return acc;
      }, {});
    },
    
    hashToFilesList: function (hash) {
      return Object.keys(hash).reduce(function (acc, key) {
        acc.push(hash[key]);
        return acc;
      }, []);
    }
  }
}

);
