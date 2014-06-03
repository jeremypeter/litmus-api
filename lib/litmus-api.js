var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

function Litmus(options){

  if(!options) { throw new Error('No options passed in')}

  this.options = options || {};
  this.initVars();

}


// Initialize variables
Litmus.prototype.initVars = function() {

  this.reqObj = {
    auth: {
      user: this.options.username || '',
      pass: this.options.password || ''      
    }
  };

};

Litmus.prototype.request = function(method, url, body, cb) {
  
  var options = this.reqObj;
  options.method = method;
  options.url = this.options.url + '/' + url;

  if( (options.method === 'POST') || (options.method === 'PUT') ) {
    options.headers = { 'Content-type': 'application/xml', 'Accept': 'application/xml' };
    options.body = body;
  }
  
  return request(options);

};


////////////////////////////////////////////////////////////////
// Test Set Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.getTests = function(cb) {
  
  var urlPath = 'tests.xml';

  return this.request('GET', urlPath, null, cb);

};

Litmus.prototype.getTest = function(testId, cb) {

  var urlPath = 'tests/'+ testId +'.xml';

  return this.request('GET', urlPath, null, cb);
  
};

Litmus.prototype.updateTest = function(testId, body, cb) {

  var urlPath = 'tests/'+ testId +'.xml';

  return this.request('PUT', urlPath, body, cb);

};  

Litmus.prototype.deleteTest = function(testId, cb) {

  var urlPath = 'tests/'+ testId +'.xml';

  return this.request('DELETE', urlPath, null, cb);

};


////////////////////////////////////////////////////////////////
// Test Set Version Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.getVersions = function(testId, cb) {

  var urlPath = 'tests/'+ testId +'/versions.xml';

  return this.request('GET', urlPath, null, cb);

};

Litmus.prototype.getVersion = function(testId, version, cb) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'.xml';
  
  return this.request('GET', urlPath, null, cb);

};

Litmus.prototype.createVersion = function(testId, cb) {

  var urlPath = 'tests/'+ testId +'/versions.xml';

  return this.request('POST', urlPath, null, cb);

};

Litmus.prototype.pollVersion = function(testId, version, cb) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/poll.xml';

  return this.request('GET', urlPath, null, cb);
};


////////////////////////////////////////////////////////////////
// Result Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.getResults = function(testId, version, cb) {
  
  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results.xml';
  
  return this.request('GET', urlPath, null, cb);

};

Litmus.prototype.getResult = function(testId, version, resultId, cb) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results/'+ resultId +'.xml';
  
  return this.request('GET', urlPath, null, cb);

};

Litmus.prototype.updateResult = function(testId, version, resultId, body, cb) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results/'+ resultId +'.xml';

  return this.request('PUT', urlPath, body, cb);

};

Litmus.prototype.retestResult = function(testId, version, resultId, cb) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results/'+ resultId +'/retest.xml';

  return this.request('POST', urlPath, null, cb);

};

////////////////////////////////////////////////////////////////
// Email Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.createEmailTest = function(body, cb) {

  var urlPath = 'emails.xml';

  return this.request('POST', urlPath, body, cb);

};

Litmus.prototype.getEmailClients = function(cb) {

  var urlPath = 'emails/clients.xml';

  return this.request('GET', urlPath, null, cb);

};

module.exports = Litmus;