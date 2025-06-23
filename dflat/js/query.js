// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const query={}
export default query

import * as util from "util"

import express   from "express"
import dflat     from "./dflat.js"
import savi      from "./savi.js"
import xson      from "./xson.js"
import jml       from "./jml.js"
import dquery    from "./dquery.js"
//import dstore_db from "../../dstore/js/dstore_db.js"

const dstore_db=global.dstore_db


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var serve_html = express.static(import.meta.dirname+"/../html",{'index': ['dquery.html']})


// handle the /dquery url space
query.serv = async function(req,res,next){

	let body=req.body||{}
	let query=req.query||{}

	let sql=body.sql||query.sql
	let form=(body.form||query.form||"json").toLowerCase()
	let from=(body.from||query.from||"").toLowerCase()
	let human=(body.human||query.human||"").toLowerCase()

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

