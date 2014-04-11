
/**
 * Module dependencies
 */

var Path = require('path');
var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var fs = require('fs');

exports['package.json'] =
exports['node'] = function(opts){
  return Lookup({
    root: opts.root,
    name: 'node',
    file: 'package.json',
    onProcess: function(){ parseJson.call(this) }
  });
};

exports['component.json'] =
exports['component'] = function(opts){
  return Lookup({
    root: opts.root,
    name: 'component',
    file: 'component.json',
    onProcess: function(){ parseJson.call(this) }
  });
};

exports['Makefile'] =
exports['makefile'] =
exports['make'] = function(opts){
  return Lookup({
    root: opts.root,
    name: 'make',
    file: 'Makefile',
    onProcess: function(){
      var self = this;
      self.raw
        .replace(/(\n$|^\n)/g, '')
        .split('\n')
        .map(function(d){return /(\w+) *\??= * (.+)/.exec(d) })
        .filter(function(d){return d })
        .map(function(d){
          var key = d[1];
          var val = d[2];
          var m = /\$\((.+)\)/.exec(val);
          if (m) val = val.replace(m[0], self.variables[m[1]]);
          self.variables[key] = val;
        });
      self.emit('normalize');
      // console.log('...processed, now normalizing...');
    }
  });
}

function Lookup(options){
  if (!(this instanceof Lookup))
    return new Lookup(options);

  options = options || {};

  this.name = options.name;
  this.file = options.file;
  this.root = options.root || process.cwd();
  this.path = Path.resolve(this.root, options.file);
  this.context = options.context || {};

  this.variables =
  this.processed = {};

  var val;
  var key;
  var normkey;
  for (key in options) {
    if (key.slice(0, 2) !== 'on') continue;
    normkey = key.slice(2).toLowerCase();
    this.on(normkey, options[key].bind(this));
  }

  this.initialize();
}

inherits(Lookup, Emitter);

Lookup.prototype.initialize = function() {
  // console.log('initializing...');
  this.emit('initialized', this);
};

Lookup.prototype.on('initialized', function(){
  // console.log('...initialized, now reading...');
  this.emit('read');
});

Lookup.prototype.on('read', function () {
  var self = this;
  read(this.path, function(err, data){
    if (err) return console.error(err);
    self.raw = data;
    // console.log('...read, now processing...');
    self.emit('process');
  });
});

Lookup.prototype.on('normalize', function(){
  var self = this;
  for (var key in self.variables) {
    var val = self.variables[key];
    self.variables[coerceKey(key)] = val;
  }

  // console.log('...normalized');
  // console.log('assigning...');
  self.emit('assign');
});

Lookup.prototype.on('assign', function(){
  var self = this;
  var vars = this.variables;
  Object.keys(vars).map(function(key){
    self.context.variables[key] = vars[key];
  });
  if (self.finish && !self.assigned) self.finish();
  self.assigned = true;
});

Lookup.prototype.on('finished', function (context, fn) {
  // console.log('booya, finished with ' + this.name + '!');
});

function read(path, fn){
  fs.exists(path, function(ex){
    if (!ex) {
      return fn(Path.relative(process.cwd(), path) + ' does not exist');
    }
    fs.readFile(path, {encoding: 'utf8'}, function(err, data){
      if (err) return fn(err);
      fn(null, data);
    });
  });
}

function parseJson(){
  var self = this;
  try {
    var json = JSON.parse(self.raw);
  } catch(err) {
    if (self.finish) return self.finish(err)
    return console.error(err);
  }
  self.variables = json;
  self.emit('normalize');
  // console.log('...processed, now normalizing...');
}

function coerceKey(key){
  key = key
    .toLowerCase()
    .replace(/^repository/, 'repo')
  return key;
}
