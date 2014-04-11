
var name = require('../package.json').name;
var debug = require('debug')(name + ':test');
var assert = require('assert');
var should = require('should');
var path = require('path');
var fs = require('fs');
var Lib = require('..');

process.stdout.write('\u001B[2J');

fs.readdirSync('test/fixtures').forEach(function(dir){

  var names = [
    'Makefile',
    'component.json',
    'package.json'
  ].map(function(name){
    return name
      .replace('\.', '\-')
      .toLowerCase();
  }).filter(function(name){
    return ~dir.indexOf(name);
  }).map(function(name){
    return name
      .replace('\-', '\.');
  });

  describe('`' + name + '`', function(){
    it('should ' + dir, function(done){
      var vars;
      var lib = Lib({
        lookups: names,
        root: 'test/fixtures/' + dir,
        onFinish: function(){
          vars = this && this.variables;
          should.exist(vars);
          vars.should.have.properties('name', 'repo');
          vars.name.should.equal('foo');
          vars.repo.should.equal('buzz/bar');
          done();
        }
      });
    });

  });
});
