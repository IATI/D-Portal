// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var util=require('util');
var express = require('express');
var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
var argv=require('yargs').argv; global.argv=argv;

argv.port=argv.port||1337;
argv.database=argv.database||"../dstore/db/dstore.sqlite";


app.use(express.logger());
app.use(express.json());

app.use( function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});



//ls(argv);

// possibly redirect any d-portal subdomain
app.use(function(req,res,next)
{
	var dom=req.headers.host.toLowerCase();
	var port=dom.split(":")[1];
	dom=dom.split(":")[0]; // remove port
	if( ( (dom!="d-portal.org") || port ) && (dom.slice(-12)=="d-portal.org") ) // only mess with d-portal.org subdomains or ports
	{
		var loc='http://d-portal.org'+req.url; // cannocal name
		if(dom=="dev.d-portal.org") // goto dev server
		{
			loc='http://dev.ctrack.iatistandard.org'+req.url;
		}
		res.writeHead(301, {'Location':loc, 'Expires': (new Date).toGMTString()});
		res.end();
	}
	else
	{
		next();
	}
});


if(argv.q)
{
	app.use("/q",function (req, res) {
		res.redirect(argv.q+req.url);
	});
}
else
{
	app.use("/q",function (req, res) {
		require("../../dstore/js/query").serv(req,res);
	});
}

app.use(express.compress());

app.use(express.static(__dirname+"/../"));

console.log("Starting ctrack server at http://localhost:"+argv.port+"/");

app.listen(argv.port);
