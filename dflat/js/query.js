// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var query=exports;

var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var dflat=require('./dflat.js');
var savi=require('./savi.js');
var xson=require('./xson.js');
var jml=require('./jml.js');

var dstore_db=require("../../dstore/js/dstore_db.js");

var dquery=require('./dquery.js');

var express = require('express');
var serve_html = express.static(__dirname+"/../html",{'index': ['dquery.html']})


// handle the /dquery url space
query.serv = async function(req,res,next){

	let sql=req.body.sql||req.query.sql
	let form=(req.body.form||req.query.form||"json").toLowerCase()
	let from=(req.body.from||req.query.from||"").toLowerCase()
	let human=(req.body.human||req.query.human||"").toLowerCase()

	if( form=="xml" || form=="html" ) // force xson as thats the only one that makes sense for these
	{
		from="xson"
	}

	if(sql) // a post query
	{
		let q={}
		q.form=form
		q.from=from
		q.human=human

		let r={}
		r.query=sql

// allow qvals in body or query string ( body has priority )
		r.qvals={}
		for( let n in req.query )
		{
			r.qvals[n]=req.query[n]
		}
		for( let n in req.body )
		{
			r.qvals[n]=req.body[n]
		}
// pick up defaults from sql any line that begins with --$aid=1234
		let lines=r.query.split("\n")
		for(let l of lines)
		{
			if( l.startsWith("--$")) // magic starting sequence
			{
				let aa=l.split("=")
				let n=(aa[0].substring(3)).trim() // remove magic
				let v=((aa.slice(1)).join("=")).trim() // everything after first =
				if((n!="")&&(v!="")) // got name and value
				{
					if( r.qvals[n] === undefined ) // not set yer
					{
						r.qvals[n]=v // so set it
					}
				}
			}
		}

		delete r.qvals.sql
		delete r.qvals.form
		delete r.qvals.from
		delete r.qvals.human

		await dstore_db.query_select(q,res,r,req)
	}
	else
	{
		// serv up static files
		serve_html(req,res,next)
	}

};

