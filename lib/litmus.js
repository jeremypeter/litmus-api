/**
* Send tests to Litmus
* @author jeremypeter
*/

var request = require('request'),
    mail    = require('nodemailer').mail,
    fs      = require('fs'),
    URL     = require('url'),
    cheerio = require('cheerio'),
    builder = require('xmlbuilder'),
    Table   = require('cli-table'),
    chalk   = require('chalk'),
    when    = require('when'),
    _       = require('lodash');


function Litmus(options){

  if(!options) throw new Error('Please provide options');

  this.options = options;
  this.initVars();

}


// Alternative to creating a new instance
Litmus.create = function(options){
  return new Litmus(options);
};

// Initialize variables
Litmus.prototype.initVars = function() {

  this.reqObj = {
    auth: {
      user: this.options.username || '',
      pass: this.options.password || ''      
    }
  };
};


// Get title in html
Litmus.prototype.getTitle = function(html) {
  var $ = cheerio.load(html);
  return when.promise(function(resolve){
    resolve($('title').text())
  })
};

Litmus.prototype.getHtml = function(html) {
 return when.promise(function(resolve){
    request.get(html, function(err, res, body){
      if(err) throw err;
      console.log(message);
      resolve(body);
    });
  });
}

// Run test
Litmus.prototype.run = function(html, title, next) {
  
  var self = this;

  if(!this.validateUrl(html)){
    console.log('not url');
    this.html = html
  }else {
    console.log('url');
    this.getHtml(html).then(function(data){
      self.html = data;
    })
  }

  this.title = title || this.getTitle(this.html);
  this.delay = this.options.delay || 3500;

  if( (this.title === undefined) || (this.title.trim().length === 0) ){
    this.title = title;
  }
  return this.html
  this.getTests(function(body){
    var id = this.getId(body);
    this.sendTest(id);
    setTimeout(next, this.delay);
  });

};

// Grab tests from Litmus
Litmus.prototype.getTests = function(fn) {
  var self = this,
      opts = this.reqObj;
  opts.url = this.options.url + '/tests.xml';
  request.get(opts, function(err, res, body){
    if(err) { throw err; }
    fn.call(self, body);
  });
};

// Grab the name of email and set id if it matches title/subject line
// Requires xml as the body
Litmus.prototype.getId = function(body) {
  var $ = cheerio.load(body, {xmlMode: true}),
      $allNameTags = $('name'),
      subjLine = this.title,
      id,
      $matchedName = $allNameTags.filter(function(){
        return $(this).text() === subjLine;
      });

  if($matchedName.length){
    id = $matchedName.eq(0).parent().children('id').text();
  }

  return id;
};

// Calculate and get the average time for test to complete
Litmus.prototype.getAvgTime = function(body) {
  var $ = cheerio.load(body, { xmlMode: true });
  var avgTimes = $('average_time_to_process');
  var count = 0;
  avgTimes.each(function(i, el){
    count += +$(this).text();
  });

  if(count < 60){
    return count + ' secs';
  }else{
    return  Math.round((count/avgTimes.length)/60) + ' mins';
  }
};

// Log status of test
Litmus.prototype.getStatus = function(body) {
  var $ = cheerio.load(body, { xmlMode: true }),
      statuses = $('status'),
      delayed = [],
      unavailable = [],
      statusCode,
      application;

  statuses.each(function(i, el){

    var $this = $(this);
    statusCode = +$this.text();
    application = $this.parent().children('application_long_name').text();

    if(statusCode === 1){ delayed.push(application); }

    if(statusCode === 2){ unavailable.push(application); }

  });

  return {
    delayed: delayed,
    unavailable: unavailable
  };

};

// Log status table to the command line
Litmus.prototype.logStatusTable = function(body) {
  var table = new Table(),
      delayed = this.getStatus(body).delayed.join('\n'),
      unavailable = this.getStatus(body).unavailable.join('\n'),
      avgTime = this.getAvgTime(body),
      values = [];

  table.options.head = [chalk.bold('Avg. Time to Complete')];
  values.push(avgTime);

  if(delayed.length > 0){
    table.options.head.push(chalk.bold('Delayed'));
    values.push(delayed);
  }

  if(unavailable.length > 0){
    table.options.head.push(chalk.bold('Unavailable'));
    values.push(unavailable);
  }

  table.push(values);

  console.log(table.toString());
};

// Send a new version if id is availabe otherwise send a new test
Litmus.prototype.sendTest = function(id) {
  var self = this;
  var opts = _.clone(this.reqObj);

  opts.headers = { 'Content-type': 'application/xml', 'Accept': 'application/xml' };
  opts.body = this.getBuiltXml(this.html, this.title, this.options.clients);

  if(id){
    this.log(chalk.bold('Sending new version: ') + this.title);
    opts.url = this.options.url + '/tests/'+ id + '/versions.xml';
    request.post(opts, this.mailNewVersion.bind(this));
  }else{
    this.log(chalk.bold('Sending new test: ') + this.title);
    opts.url = this.options.url + '/emails.xml';
    request.post(opts, this.logHeaders.bind(this));
  }
};

// Logs headers of response once email is sent
Litmus.prototype.logHeaders = function(err, res, body) {
  if(err){ throw err; }

  var headers = res.headers;

  Object.keys(headers).forEach(function(key){
    console.log(chalk.bold(key.toUpperCase()) + ': ' + headers[key]);
  });

  console.log('---------------------\n' + body); 
  this.logSuccess('Test sent!');
  this.logStatusTable(body);
};

// Mail a new test using test email Litmus provides
Litmus.prototype.mailNewVersion = function(err, res, body) {
  if(err){ throw err; }

  var $ = cheerio.load(body),
      guid = $('url_or_guid').text(); 

  mail({
      from: 'no-reply@test.com',
      to: guid,
      subject: this.title,
      text: '',
      html: this.html
  });
  this.logSuccess('New version sent!');
  this.logStatusTable(body);

};

// Log list of clients
Litmus.prototype.logClientTable = function(err, res, body){
  var $ = cheerio.load(body, {xmlMode: true});
  var appNames;
  var appCodes;
  var table = new Table();
  table.options.head = [' ','Application Name', 'Application Code']

  $('testing_application').each(function(i, el){
    $this = $(this);
    appNames = $this.children('application_long_name').text();
    appCodes = $this.children('application_code').text();

    table.push([ ++i, appNames, appCodes])
  })

  console.log(table.toString());

};

// Get list of clients that can be tested
Litmus.prototype.getClientList = function() {
  var opts = _.clone(this.reqObj);
  opts.url = this.options.url + '/emails/clients.xml'

  request.get(opts, this.logClientTable);
}

Litmus.prototype.validateUrl = function(url) {
  if (!url) return false;

  if ('string' === typeof url) url = URL.parse(url);

  if ('object' !== typeof url) return false;

  if (!url.host || !url.pathname) return false;

  return true;
};

Litmus.prototype.getBuiltXml2 = function(html, title, clients) {
  var xml = builder.create('test_set')
    .ele('applications', {'type': 'array'});

  clients.forEach(function(client){
    xml = xml.ele('application')
      .ele('code', client)
      .up().up();
  });

  xml = xml.root()
    .ele('save_defaults', 'false').up()
    .ele('use_defaults', 'false').up();

  if(!this.validateUrl(html)){
    xml = xml.ele('email_source')
      .ele('body').dat(html).up()
      .ele('subject', title)
      .end({ pretty: true });
  }else{
    xml = xml.end({ pretty: true });
  }

  return xml;
};


Litmus.prototype.getBuiltXml = function(html, title) {
  var xmlApplications = builder.create('applications').att('type', 'array');

  _.each(this.options.clients, function(app) {
    var item = xmlApplications.ele('application');

    item.ele('code', app);
  });

  //Build Xml to send off, Join with Application XMl
  var xml = builder.create('test_set')
    .importXMLBuilder(xmlApplications)
    .ele('save_defaults', 'false').up()
    .ele('use_defaults', 'false').up()
    .ele('email_source')
      .ele('body').dat(html).up()
      .ele('subject', title)
    .end({pretty: true});

  return xml;
};




// Logging helpers
Litmus.prototype.log = function(str) {
  return console.log(chalk.cyan(str));
};

Litmus.prototype.logSuccess = function(str) {
  return console.log(chalk.green(str));
};

module.exports = Litmus;
