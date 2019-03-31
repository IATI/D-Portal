// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var query=exports;

var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }



var monitor = require("pg-monitor");
var pgopts={
};
if(process.env.DSTORE_DEBUG){ monitor.attach(pgopts); }
var pgp = require("pg-promise")(pgopts);


// create or return the db object
query.db = function(){
	if(!query.pg_db)
	{
		query.pg_db = pgp(global.argv.pgro);
	}
	return query.pg_db;
};


var serve_html = require('serve-static')(__dirname+'/../html', {'index': ['index.html', 'index.htm']})




// handle the /dquery url space
query.serv = function(req,res,next){

	if(!argv.pgro)
	{
		res.send("DISABLED");
		return;
	}
	else
	{

// serv up static files
console.log(req.path)
		var ap=req.path.split("/");
		ap.splice(1,1)
		req.path=ap.join("/")
console.log(ap.join("/"))
console.log(req.path)
		serve_html(req,res,()=>{res.send("DISABLED");})
	}

};

