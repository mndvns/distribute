
/**
 * Module dependencies
 */

var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var lookups = require('./lookups');

/**
 * Expose `Distribute`.
 */

module.exports = Distribute;

/**
 * Options:
 *
 *   - `lookups` array of configuration files
 *   - `root` defaulting to _process.cwd()_
 *
 * @param {Object} options
 */

function Distribute(options){
  if (!(this instanceof Distribute))
    return new Distribute(options);

  options = options || {};
  this.root = options.root || process.cwd();
  this.lookups = options.lookups || [];
  this.onFinish = options.onFinish;

  this.data =
  this.variables = {};

  this.emit('init');
}

/**
 * Inherit from `Emitter`.
 */

inherits(Distribute, Emitter);

Distribute.prototype.on('init', function () {
  var self = this;
  var lopts = {
    root: self.root,
    context: self
  };

  self.lookups.map(function(l, i, c){
    l = lookups[l](lopts);
    l.context = self;
    l.finish = function(){ finish.call(l, i < c.length) };
  });

  function finish(isLast){
    if (!isLast) return;
    self.variables = this.variables;
    self.onFinish && self.onFinish();
    this.context = self;
    this.emit('finished');
  }
});
