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

Litmus.prototype.request = function(method, url, body) {
  
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


Litmus.prototype.getTests = function() {
  
  var urlPath = 'tests.xml';

  return this.request('GET', urlPath, null);

};

Litmus.prototype.getTest = function(testId) {

  var urlPath = 'tests/'+ testId +'.xml';

  return this.request('GET', urlPath, null);
  
};

Litmus.prototype.updateTest = function(testId, body) {

  var urlPath = 'tests/'+ testId +'.xml';

  return this.request('PUT', urlPath, body);

};  

Litmus.prototype.deleteTest = function(testId) {

  var urlPath = 'tests/'+ testId +'.xml';

  return this.request('DELETE', urlPath, null);

};


////////////////////////////////////////////////////////////////
// Test Set Version Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.getVersions = function(testId) {

  var urlPath = 'tests/'+ testId +'/versions.xml';

  return this.request('GET', urlPath, null);

};

Litmus.prototype.getVersion = function(testId, version) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'.xml';
  
  return this.request('GET', urlPath, null);

};

Litmus.prototype.createVersion = function(testId) {

  var urlPath = 'tests/'+ testId +'/versions.xml';

  return this.request('POST', urlPath, null);

};

Litmus.prototype.pollVersion = function(testId, version) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/poll.xml';

  return this.request('GET', urlPath, null);
};


////////////////////////////////////////////////////////////////
// Result Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.getResults = function(testId, version) {
  
  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results.xml';
  
  return this.request('GET', urlPath, null);

};

Litmus.prototype.getResult = function(testId, version, resultId) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results/'+ resultId +'.xml';
  
  return this.request('GET', urlPath, null);

};

Litmus.prototype.updateResult = function(testId, version, resultId, body) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results/'+ resultId +'.xml';

  return this.request('PUT', urlPath, body);

};

Litmus.prototype.retestResult = function(testId, version, resultId) {

  var urlPath = 'tests/'+ testId +'/versions/'+ version +'/results/'+ resultId +'/retest.xml';

  return this.request('POST', urlPath, null);

};

////////////////////////////////////////////////////////////////
// Email Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.createEmailTest = function(body) {

  var urlPath = 'emails.xml';

  return this.request('POST', urlPath, body);

};

Litmus.prototype.getEmailClients = function() {

  var urlPath = 'emails/clients.xml';

  return this.request('GET', urlPath, null);

};


////////////////////////////////////////////////////////////////
// Page Methods
////////////////////////////////////////////////////////////////

Litmus.prototype.createBrowserTest = function(body) {

  var urlPath = 'pages.xml';

  return this.request('POST', urlPath, body);

};

Litmus.prototype.getBrowserClients = function() {

  var urlPath = 'pages/clients.xml';

  return this.request('GET', urlPath, null);

};




module.exports = Litmus;