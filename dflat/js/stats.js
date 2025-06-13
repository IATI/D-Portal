// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const stats={}
export default stats

import * as fs   from "fs"
import * as util from "util"
import * as path from "path"

import assert from "assert"

//import assert    from "assert"

import shell     from "shelljs"
import stringify from "json-stable-stringify"
import database   from "../json/database.json" with {type:"json"}
import pg_monitor from "pg-monitor"
import pg_promise from "pg-promise"

const pfs = fs.promises

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var pgopts={
};
if(process.env.DSTORE_DEBUG){ pg_monitor.attach(pgopts); }
var pgp = pg_promise(pgopts);


// create or return the db object
stats.db = function(){
	if(!stats.pg_db)
	{
		stats.pg_db = pgp(global.argv.pgro);
	}
	return stats.pg_db;
};


stats.compress_table = function(tab){

// delete the first few days that had bad data
	for( var i=17992 ; i<17998 ; i++ )
	{
		if(tab[i])
		{
			delete tab[i]
		}
	}


// remove all middle values, only keep the days where the value changes

	var prev=[]
	var days = Object.keys(tab).sort()
	for( let day of days )
	{
		prev[0]=prev[1]
		prev[1]=prev[2]
		prev[2]={ day:day , value:tab[day] }

		if( prev[0] && prev[1] && prev[2] )
		{
			if( (prev[0].value==prev[1].value) && (prev[1].value==prev[2].value) )
			{
				delete tab[ prev[1].day ]
			}
		}
		
	}


}

stats.fill = async function(ret,opts){
	
	let xpathroot="/"

	let andthis=""
	
	let pid=""
	if(opts.pid)
	{
		xpathroot="/iati-activities/"
		andthis=` and pid='${opts.pid}' `
	}

	var day=Math.floor((new Date())/8.64e7);

	var db=stats.db()


	ret.xpath=ret.xpath || {}

	for(let n in database.paths)
	{
		if( n.startsWith(xpathroot) )// only make these stats
		{
			let p=database.paths[n]
			let j=p.jpath
			
			if( j && j.length>1)
			{

	var tstart=new Date().getTime()

				ret.xpath[n]=ret.xpath[n] || {}
				let rn=ret.xpath[n]
				
				let tname=""
				let tt=""
				for( let v of j ) { tname=tt ; tt=tt+v }
				let jx=j[j.length-1]

				var sqlpid ="" 
				if(!opts.pid) { sqlpid = " , count( distinct pid ) as cp " }
				var sql =` 
					select count(*) as cc
					, count( distinct aid ) as ca
					, count( distinct xson->>'${jx}') as cd
					${sqlpid}
					from xson where root='${tname}' and xson->>'${jx}' is not null ${andthis} ;`
	//			console.log(sql)
				let rc = await db.any( sql )
				
				var sqlpid ="" 
				if(!opts.pid) { sqlpid = " , MAX(pid) as pid " }
				var sql = `select count(*) as count , xson->>'${jx}' as value , MAX(aid) as aid ${sqlpid}
						from xson where root='${tname}' and xson->>'${jx}' is not null ${andthis} group by xson->>'${jx}' order by 1 desc limit 10;`
	//			console.log(sql)
				let rt = await db.any( sql )
				
				rn.count=rn.count || {}
				rn.count[day]=rc[0].cc
				stats.compress_table(rn.count)

				rn.activities=rn.activities || {}
				rn.activities[day]=rc[0].ca
				stats.compress_table(rn.activities)

	if(!opts.pid)
	{
				rn.publishers=rn.publishers || {}
				rn.publishers[day]=rc[0].cp
				stats.compress_table(rn.publishers)
	}
				rn.distinct=rn.distinct || {}
				rn.distinct[day]=rc[0].cd
				stats.compress_table(rn.distinct)

				rn.top=rt

	var ttime = (( new Date().getTime() ) - tstart)/1000

				if(!opts.quiet)
				{
					console.log(n+" : "+rc[0].cc+" : "+rc[0].ca+" : "+rc[0].cp+" : "+rc[0].cd+" T "+ttime)
				}
				
	//			console.log(rt)

			}
		}
	}
	
	return ret
}

stats.cmd = async function(argv){

// fix pid so it can be used as a filename	
	var clean=function(s)
	{
		return s.trim().toUpperCase().replace(/\W+/g,"-")
	}
	


	var filename=argv._[1]

assert( filename , "base filename required" )


	var ret={}
	
	if( argv.publishers )
	{
		var db=stats.db()
		let its = await db.any( `select pid , max(xson->>'') as name , count( distinct aid ) as count from xson where pid is not null and root='/iati-activities/iati-activity/reporting-org/narrative' group by pid ;` )
		let pids={}
		let pids_length=0
//only include publishers with 100 or more activities as this takes a long time
		for(let it of its) { if( it.pid && it.count>=100 ) { pids_length++ ; pids[it.pid]={ name:it.name||"unknown",count:it.count } } } // name may be unknown
		
		var dir = filename + '/pids';
//console.log( dir )
		if( ! fs.existsSync(dir) ) { fs.mkdirSync(dir, 0x1E4) }

// save array of pids that will be in the pids directory
		fs.writeFileSync(dir+".json", stringify({pids:pids},{ space: ' ' }) )

		let pn=0
		for(let pid in pids)
		{
			pn++
			
			ret={}
			let outputfilename=dir+"/"+clean(pid)+".json"

			let prog=Math.floor(100*pn/pids_length)
			console.log( prog+"% : "+outputfilename + " : "+pids[pid].count+" : "+pids[pid].name )

			if(fs.existsSync(outputfilename))
			{
				ret=JSON.parse( fs.readFileSync(outputfilename).toString() )
			}
			
			await stats.fill(ret,{pid:pid,quiet:true})

			fs.writeFileSync(outputfilename, stringify(ret,{ space: ' ' }) )
		}
	}
	else
	{
		
		if(filename) // try and load in previous stats from this file
		{
			if(fs.existsSync(filename))
			{
				ret=JSON.parse( fs.readFileSync(filename).toString() )
			}
		}

		await stats.fill(ret,{})

		if(filename) // write out new stats
		{
			fs.writeFileSync(filename, stringify(ret,{ space: ' ' }) )
		}
		else // dump to commandline
		{
			console.log( stringify(ret,{ space: ' ' }) )
		}
		
	}

}
