var Litmus = require('../lib/litmus-api');
var expect = require('chai').expect;
var sinon = require('sinon');
var assert = require('assert');


describe('Litmus', function(){

  var options = { username: 'username', password: 'password'};

  describe('constructor', function() {
    it('should throw error if no options are passed in', function(done) {
      expect(function(){ new Litmus() }).to.throw(Error);
      done();
    });
  });

  describe('#initVars.reqObj.user', function() {
    
    it('should return username if available', function(done){
      var litmus = new Litmus(options);
      expect(litmus.reqObj.auth.user).to.equal('username');
      done();
    });

    it('should return an empty string if no username is passed', function(done){
      var litmus = new Litmus({});
      expect(litmus.reqObj.auth.user).to.equal('');
      done();
    });

  });


  describe('#initVars.reqObj.pass', function() {
    
    it('should return password if available', function(done){
      var litmus = new Litmus(options);
      expect(litmus.reqObj.auth.pass).to.equal('password');
      done();
    });

    it('should return an empty string if no password is passed', function(done){
      var litmus = new Litmus({});
      expect(litmus.reqObj.auth.user).to.equal('');
      done();
    });

  });


  describe('#request', function() {

    var litmus = new Litmus({});
    var options = {};
    options.url = 'http://company.litmus.com'

    beforeEach(function(){ sinon.stub(litmus, 'request'); });

    afterEach(function(){ litmus.request.restore(); });

    it('should match properties', function(done) {
      
      options.method = 'GET';
      litmus.request(options.method, options.url);

      expect(litmus.request.args[0].length).to.equal(2);

      done();

    });

  })

});