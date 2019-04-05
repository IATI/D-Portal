// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var stats=exports;

var fs=require('fs')
var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var stringify = require('json-stable-stringify');

var database = require("../json/database.json");

var monitor = require("pg-monitor");
var pgopts={
};
//if(process.env.DSTORE_DEBUG){ monitor.attach(pgopts); }
var pgp = require("pg-promise")(pgopts);


// create or return the db object
stats.db = function(){
	if(!stats.pg_db)
	{
		stats.pg_db = pgp(global.argv.pgro);
	}
	return stats.pg_db;
};

stats.cmd = async function(argv){

	var day=Math.floor((new Date())/8.64e7);
	var filename=argv._[1]
	var ret={}
	
	if(filename) // try and load in previous stats from this file
	{
		if(fs.existsSync(filename))
		{
			ret=JSON.parse( fs.readFileSync(filename).toString() )
		}
	}

	var db=stats.db()


	ret.xpath=ret.xpath || {}

	for(let n in database.paths)
	{
		let p=database.paths[n]
		let j=p.jpath
		
		if( j && j[0]=="/iati-activities/iati-activity" && j.length>1)
		{

			ret.xpath[n]=ret.xpath[n] || {}
			let rn=ret.xpath[n]
			
			let fromx="from xson"
			for( let i = 1 ; i<j.length-1 ; i++ )
			{
				fromx="from ( select aid , jsonb_array_elements(xson->'"+j[i]+"') as xson \n"+
				fromx+" \n"+
				") as xson"+i+" "
			}
			let jx=j[j.length-1]

			var sql = 
				"select count( xson->>'"+jx+"') as cc \n"+
				", count( distinct aid ) as ca \n"+
				", count( distinct xson->>'"+jx+"') as cd \n"+
				fromx+" where xson->>'"+jx+"' is not null;"
//			console.log(sql)
			let rc = await db.any( sql )
			
			var sql = "select count(*) as count , xson->>'"+jx+"' as value , MAX(aid) as aid "+fromx+" where xson->>'"+jx+"' is not null group by xson->>'"+jx+"' order by 1 desc limit 10;"
//			console.log(sql)
			let rt = await db.any( sql )
			
			rn.count=rn.count || {}
			rn.count[day]=rc[0].cc

			rn.activities=rn.activities || {}
			rn.activities[day]=rc[0].ca

			rn.distinct=rn.distinct || {}
			rn.distinct[day]=rc[0].cd

			rn.top=rt

			console.log(n+" : "+rc[0].cc+" : "+rc[0].ca+" : "+rc[0].cd)

		}
	}


	if(filename) // write out new stats
	{
		fs.writeFileSync(filename, stringify(ret,{ space: ' ' }) )
	}
	else // dump to commandline
	{
		console.log( stringify(ret,{ space: ' ' }) )
	}
}
