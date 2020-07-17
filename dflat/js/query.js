// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var query=exports;

var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var dflat=require('./dflat.js');
var savi=require('./savi.js');
var xson=require('./xson.js');
var jml=require('./jml.js');


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

var express = require('express');
var serve_html = express.static(__dirname+"/../html",{'index': ['dquery.html']})



// handle the /dquery url space
query.serv = async function(req,res,next){

/*
	if(!argv.pgro)
	{
		res.send("This does not work with sqlite.");
		return;
	}
	else
*/	{
		let sql=req.body.sql||req.query.sql
		let form=(req.body.form||req.query.form||"json").toLowerCase()
		let root=(req.body.root||req.query.root||"").toLowerCase()
		if(sql) // a post query
		{
//			console.log( req.body.sql )
			var db=query.db()
			var ret={}
			var starting=new Date().getTime()
			ret.result=await db.any( sql ).catch((e)=>{
				ret.error=e.toString()
				res.jsonp(ret)
			})
			var ending=new Date().getTime()
			ret.duration=(ending-starting)/1000.0
			
			if(form=="json") // normal json
			{
				res.set('charset','utf8'); // always utf8
				res.set('Content-Type', 'application/json');
				res.jsonp(ret);
			}
			else // special xsonformat
			{
				
				let tab=[]		 
				// yank xson only out of result 
				for(var i=0;i<ret.result.length;i++)
				{
					if(!root) { root=ret.result[i].root } // remember first root we find
					var it=ret.result[i].xson
					if( "string" == typeof it ) { it=JSON.parse( it ) } // this converts from string for sqlite niceness
					if(it)
					{
						tab.push( it )
					}
				}

				ret={} // create xson style result
				if(root)
				{
					ret[root]=tab
				}
				else // raw xson table of results
				{
					ret=tab
				}

				if(form=="csv")
				{
					var roots={} ; roots[root]=true
					var csv=dflat.xson_to_xsv(ret,root,roots)
					res.set('charset','utf8'); // always utf8
					res.set('Content-Type', 'text/csv');
					res.end(csv);
				}
				else
				if(form=="xml")
				{
					var x=dflat.xson_to_xml(ret)
					res.set('charset','utf8'); // always utf8
					res.set('Content-Type', 'text/xml');
					res.end(x);
				}
				else
				if(form=="html")
				{
					var x=dflat.xson_to_html(ret)
					res.set('charset','utf8'); // always utf8
					res.set('Content-Type', 'text/html');
					res.end(x);
				}
			}
		}
		else
		{
			// serv up static files
			serve_html(req,res,next)
		}
	}

};

