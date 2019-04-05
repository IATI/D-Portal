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
			for( let i = j.length-2 ; i>0 ; i-- )
			{
				fromx="from ( select aid , jsonb_array_elements(xson->'"+j[i]+"') as xson \n"+
				fromx+" \n"+
				") as xson"+i+" "
			}
			let jx=j[j.length-1]

			var sql = "select count( xson->>'"+jx+"') "+fromx+" where xson->>'"+jx+"' is not null;"
			console.log(sql)
			let rc = await db.any( sql )
			
			var sql = "select count( distinct aid ) "+fromx+" where xson->>'"+jx+"' is not null;"
			console.log(sql)
			let ra = await db.any( sql )

			var sql = "select count( distinct xson->>'"+jx+"') "+fromx+" where xson->>'"+jx+"' is not null;"
			console.log(sql)
			let rd = await db.any( sql )

			var sql = "select count(*) as count , xson->>'"+jx+"' as value , MAX(aid) as aid "+fromx+" where xson->>'"+jx+"' is not null group by xson->>'"+jx+"' order by 1 desc limit 10;"
			console.log(sql)
			let rt = await db.any( sql )
			
			rn.count=rn.count || {}
			rn.count[day]=rc[0].count

			rn.distinct=rn.distinct || {}
			rn.distinct[day]=rd[0].count

			rn.activities=rn.activities || {}
			rn.activities[day]=ra[0].count

			rn.top=rt

			console.log(n+" : "+rc[0].count+" : "+ra[0].count+" : "+rd[0].count)

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
