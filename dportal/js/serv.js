// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var express = require('express');
var app = express();

var argv=require('yargs').argv; global.argv=argv;

argv.port=argv.port||1337;

express.static.mime.define({'text/plain': ['']});

app.use(express.logger());

app.use(function(req, res, next) {
  res.contentType('text/html');
  next();
});

app.use(express.static(__dirname+"/../serv"));

console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

