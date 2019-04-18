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


var serve_html = require('serve-static')(__dirname+'/../html', {'index': ['dquery.html']})




// handle the /dquery url space
query.serv = async function(req,res,next){

	if(!argv.pgro)
	{
		res.send("DISABLED");
		return;
	}
	else
	{
		if(req.body.sql) // a post query
		{
//			console.log( req.body.sql )
			var db=query.db()
			var ret={}
			var starting=new Date().getTime()
			ret.result=await db.any( req.body.sql ).catch((e)=>{
				ret.error=e.toString()
				res.jsonp(ret)
			})
			var ending=new Date().getTime()
			ret.duration=(ending-starting)/1000.0
			res.jsonp(ret);
		}
		else
		{
			// serv up static files
			serve_html(req,res,()=>{res.send("DISABLED");})
		}
	}

};

