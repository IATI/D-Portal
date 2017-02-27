// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var wait=require('wait.for');
var fs = require('fs');
var express = require('express');
var util=require('util');
var path=require('path');
var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
var argv=require('yargs').argv; global.argv=argv;
require("./argv").parse(argv);

// make sure we have a db dir
fs.mkdir("db",function(e){});


//app.use(express.json());

//app.use("/");

app.use("/q",function (req, res) {
	require("./query").serv(req,res);
});

//app.use(express.compress());
app.use(express.static(__dirname+"/../../dportal/static"));

console.log("Starting dstore server at http://localhost:"+argv.port+"/");

app.listen(argv.port);


