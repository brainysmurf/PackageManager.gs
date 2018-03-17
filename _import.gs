(function Package_ (global) {
  global.Import = function (lib, options) {
    options = options || {};
    options.namespace = options.namespace || false;
    options.base = options.base || false;
    if (options.namespace) {
      var p = global, g = global, last;
      options.namespace.split('.').forEach(function (namespace) {
        g[namespace] = g[namespace] || {};
        p = g
        g = g[namespace]; 
        last = namespace;
      });
      p[last] = global.Import._import(lib);
    }
    if (options.base) {
      if (options.base === 'global') options.base = global;
      options.attr = options.attr || lib;
      options.base[options.attr] = global.Import._import(lib);
    }
    return global.Import._import(lib);
  };
  global.Import.register = function (uniqueId, func) {
    global.Import[uniqueId] = func;
  };
  global.Import._import = function (uniqueId) {
    return global.Import[uniqueId];
  };
  global.Import.module = true;
})(this);
