// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var express = require('express');
//var morgan = require('morgan');
var app = express();

var argv=require('yargs').argv; global.argv=argv;

argv.port=argv.port||1408;
argv.database=argv.database||"../dstore/db/dstore.sqlite";

express.static.mime.define({'text/plain': ['']});

//app.use(morgan('combined'));

app.use(function(req, res, next) {
	var aa=req.path.split("/");
	var ab=aa[aa.length-1].split(".")
//	console.log(aa[aa.length-1]);
	if(ab.length==1) // no extension
	{
		res.contentType('text/html'); // set to html
	}
	
	if( req.get('user-agent').indexOf("Trident/5.0") > -1 ) // only if IE9
	{
		res.set("X-UA-Compatible", "IE=9"); //This fixes IE9 iframes?
	}
	
	next();
});

app.use(express.static(__dirname+"/../static"));

app.use("/q",function (req, res) {
	require("../../dstore/js/query").serv(req,res);
});

console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

