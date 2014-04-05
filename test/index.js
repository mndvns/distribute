
var debug = require('debug')('distribute:test');
var assert = require('assert');
var should = require('should');
var path = require('path');
var Lib = require('..');

process.stdout.write('\u001B[2J');

describe('distribute', function(){

  run('Makefile');
  run('component.json');
  run('package.json');

  function run(name){
    it('should load a local ' + name, function(done){
      var basename = name.split('.')[0].toLowerCase();
      var vars;
      var lib = Lib({
        lookups: [name],
        root: __dirname + '/fixtures/' + basename,
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
  }

});
