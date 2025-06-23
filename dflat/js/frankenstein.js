// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const frankenstein={}
export default frankenstein

import * as fs   from "fs"

import stringify  from "json-stable-stringify"
import database   from "../json/database.json" with {type:"json"}
import pg_monitor from "pg-monitor"
import pg_promise from "pg-promise"

const pfs = fs.promises



var pgopts={
};
//if(process.env.DSTORE_DEBUG){ pg_monitor.attach(pgopts); }
var pgp = pg_promise(pgopts);


// create or return the db object
frankenstein.db = function(){
	if(!frankenstein.pg_db)
	{
		if(global.argv.pgro)
		{
			frankenstein.pg_db = pgp(global.argv.pgro);
		}
	}
	return frankenstein.pg_db;
};




frankenstein.all=async function()
{
	await frankenstein.stitch()
}


frankenstein.stitch=async function()
{
	var tree={}
	var paths={}

// get the base data layout and duplicate it

	let build
	build=function(input,output,path)
	{
		for(const n in input)
		{
			if((path+n).startsWith("/iati-activities"))
			{
				var v=input[n]
				if(Array.isArray(v))
				{
					var aa=[]
					output[n]=aa
					for(let i=0;i<2;i++)
					{
						var it={}
						aa[i]=it
						build(input[n][0],it,path+n+"/"+i)
					}
				}
				else
				if(typeof v == "object")
				{
					var it={}
					output[n]=it
					build(input[n],it,path+n)
				}
				else
				{
					paths[path+n]=[1,output,n]
					output[n]=input[n]
				}
			}
		}
	}
	build(database.tree,tree,"")

// copy valid values

	let snip
	snip=function(input,path)
	{
		for(const n in input)
		{
			let v=input[n]
			if( Array.isArray(v) )
			{
				for(let i=0 ; (i<input[n].length) && (i<2) ; i++)
				{
					snip(input[n][i],path+n+"/"+i)
				}
			}
			else
			if(typeof v == "object")
			{
				snip(input[n],path+n)
			}
			else
			{
				let pl=""
				let pn="/iati-activities/iati-activity/0"+path+n
				while(pn!=pl)
				{
					let p=paths[pn]
					if( p && p[0]==1 && v!=="" )
					{
						console.log(path+n)
						p[0]=0 // mark as got
						p[1][ p[2] ]=v // copy value
					}
					pl=pn
					pn=pn.replace("/0/","/1/")
				}
			}
		}
	}

	
//	for(var n in paths) { console.log(n) }

	let count=0
	for(var n in paths) { count+=paths[n][0] }
	console.log("count "+count)
	

	let db=frankenstein.db()
	let r= await db.any(`
		select count(*) from xson;
	`)
	
	let total=r[0].count
	let step=100
	
	for(let idx=0;idx<total;idx+=step)
	{
		let rs= await db.any(`
			select xson from xson order by aid limit `+step+` offset `+idx+`;
		`)
		for(let r of rs )
		{
			snip( r.xson , "" )
		}
		let test=0
		for(var n in paths) { test+=paths[n][0] }
		console.log(idx+" : "+test+ " / "+count)
	}



	await pfs.writeFile("json/frankenstein.json",stringify(tree,{space:" "}));
}
