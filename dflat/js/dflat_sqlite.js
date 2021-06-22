// Copyright (c) 2021 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

let dflat_sqlite=exports;

let pfs=require('fs').promises

let util=require('util')

let stringify = require('json-stable-stringify')

let dflat = require("./dflat.js")
let xson = require("./xson.js")

let database = require("../json/database.json")
let codemap = require('../json/codemap.json')

let ls=function(a) { console.log(util.inspect(a,{depth:null})); }


dflat_sqlite.cmd = async function(argv)
{

	if( argv._[1]=="tables" )
	{
		await dflat_sqlite.tables(argv)
		return
	}
	else
	if( argv._[1]=="insert" )
	{
		await dflat_sqlite.insert(argv)
		return
	}
	
	await dflat_sqlite.help()

}

dflat_sqlite.help = async function(argv)
{
	console.log(
`
>	dflat sqlite

This info about managing an sqlite database of dflat data.

>	dflat sqlite tables

Print sqlite code to create tables. Pipe this into the sqlite3 command to
initalize a new database.

>	dflat sqlite insert filename.json

Create sqlite code to insert the given data. Pipe this into the sqlite3 command
to fill up a database. Note that this will not delete or replace it will only
insert more data.

`)


}


dflat_sqlite.pragmas =
`
PRAGMA synchronous  = 0         ;
PRAGMA encoding     = "UTF-8"   ;
PRAGMA temp_store   = 2         ;
`

//PRAGMA journal_mode = WAL       ;
//PRAGMA mmap_size    = 268435456 ;

	
dflat_sqlite.generate_tables = function()
{
	let tables={}
	let tab=function(name,p) // p is a member of this table
	{
		if(name=="") { return {} } // do not care about root activities or organisations attributes
		if( tables[name] ) { return tables[name] }
		let t={}
		tables[name]=t
		for(let i=1;i<p.jpath.length;i++) // sub ids
		{
			let n=p.jpath[i-1]
			for(let j=i-2;j>0;j--)
			{
				n=p.jpath[j]+n
			}
			if(i==p.jpath.length-1)
			{
				t[n+"@key"]="primary"
			}
			else
			{
				t[n+"@key"]="join"
			}
		}
//		t["json"+(p.jpath.length-1)]="text"
		return t
	}

	let ordered_paths=[]
	for( let n in database.paths )
	{
		ordered_paths[ordered_paths.length]=database.paths[n]
	}
	ordered_paths.sort(function(a,b){ return a.orderby - b.orderby })

	for( let p of ordered_paths )
	{

		if( p.jpath )
		{
			let tname=p.jpath.slice(0,-1).join("")
			let t=tab(tname,p)

			let n=p.jpath.slice(1).join("")
			if( n=="" ) { n="" }
			t[ n ]=p.type

		}

	}
	return tables
}

dflat_sqlite.tables = async function(argv){

	console.log( dflat_sqlite.pragmas )
	
	let tables=dflat_sqlite.generate_tables()

	for( let tname in tables )
	{
		let t=tables[tname]

		console.log(`CREATE TABLE IF NOT EXISTS "${tname}" (`)

		let primary
		for( let cname in t )
		{
			let ctype=t[cname]

			if( ctype=="primary" )
			{
				primary=cname
				console.log(` "${cname}" INTEGER NOT NULL ,`)
			}
			else
			if( ctype=="join" )
			{
				primary=cname
				console.log(` "${cname}" INTEGER NOT NULL ,`)
			}
			else
			if( ctype=="int" )
			{
				console.log(` "${cname}" INTEGER ,`)
			}
			else
			if( ctype=="number" )
			{
				console.log(` "${cname}" REAL ,`)
			}
			else
			{
				console.log(` "${cname}" TEXT ,`)
			}

		}
		console.log(` PRIMARY KEY ("${primary}")`)

		console.log(`);`)
	}

}


dflat_sqlite.insert = async function(argv){

	console.log( dflat_sqlite.pragmas )

	let tables=dflat_sqlite.generate_tables()

	let fname=argv._[2]

	let dat=await pfs.readFile(fname,{ encoding: 'utf8' })
	let json=dflat.xml_to_xson(dat)
//	var json=JSON.parse(dat)
	dflat.clean(json)


console.log(`
CREATE TEMP TABLE kvs (k TEXT PRIMARY KEY, v TEXT);
`)


	xson.walk(json,function(it,nn,idx){

		let root=nn.join("")
		let base=nn.slice(1).join("")

		if(root=="") { return }

		let t=tables[root]
		if(!t) { return }
		let p
		
		let dat={}

		for( let name in it )
		{
			let value=it[name]
			if( t[ base+name ] && typeof value != "object" )
			{
				p=database.paths[ root+name ]
				dat[ base+name ] = value
			}
		}
		if(!p) { return }

		let cols=[]
		let vals=[]

		for( let name in dat )
		{
			let value=dat[name]
			cols[cols.length]="\""+name+"\""
			if( typeof value == "string" )
			{
				vals[vals.length]="'"+value.split("'").join("''")+"'"
			}
			else
			{
				vals[vals.length]=value
			}
		}

		cols=cols.join(",")
		vals=vals.join(",")

	
		let primary=p.jpath.length-1
		let ida=[]
		let idb=[]
		for(let i=1 ; i<p.jpath.length ; i++) // sub ids
		{
			if( i != p.jpath.length-1 )
			{
				let n=p.jpath[i-1]
				for(let j=i-2;j>0;j--)
				{
					n=p.jpath[j]+n
				}
				ida[ida.length]="'"+n+"@key'"
				idb[idb.length]="( SELECT v FROM kvs WHERE k = 'id"+i+"' )"
			}
		}
		ida=ida.join(",")
		idb=idb.join(",")

		if(ida!="") { ida=ida+"," }
		if(idb!="") { idb=idb+"," }


console.log(`
INSERT INTO "${root}" ( ${ida} ${cols} ) VALUES( ${idb} ${vals} );
INSERT OR REPLACE INTO kvs VALUES ('id${primary}', ( select last_insert_rowid() ) );
`)

	})

console.log(`
DROP TABLE kvs;
`)


}


