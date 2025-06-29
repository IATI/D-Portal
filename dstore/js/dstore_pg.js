// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const dstore_pg={}
export default dstore_pg

import * as util from "util"
import * as fs   from "fs"
import * as url  from "url"

import Cursor         from "pg-cursor"
import pg_monitor     from "pg-monitor"
import pg_promise     from "pg-promise"
import dflat          from "../../dflat/js/dflat.js"
import dflat_database from "../../dflat/json/database.json" with {type:"json"}
import refry          from "./refry.js"
import exs            from "./exs.js"
import iati_xml       from "./iati_xml.js"
import iati_cook      from "./iati_cook.js"
import query          from "./query.js"

const dstore_db=global.dstore_db

const dstore_back=dstore_pg
dstore_back.engine="pg";


// how to use query replcaments
dstore_db.text_plate=function(s){ return "${"+s+"}"; }
dstore_db.text_name=function(s){ return s; }

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var err=function (error) {
	console.log("ERROR:", error.message || error); // print the error;
	console.log((error.stack));
	process.exit(1);
}

// use global pgp cache ?

var master_pgp;
var dbs={}

dstore_pg.open = async function(req){

	if(!master_pgp)
	{
		var pgopts={
		};
		if(process.env.DSTORE_DEBUG)
		{
			var monitor = pg_monitor;
			 monitor.attach(pgopts);
		}
		master_pgp = pg_promise(pgopts);

	}

	let pg=global.argv.pg

// prefer X-MD5 header from nginx before we check subdomain
	let md5key = ( req && req.headers && req.headers["x-md5"] ) || ( req && req.subdomains && req.subdomains[req.subdomains.length-1] ) // use first sub domain

	if( typeof md5key !== 'string' )
	{
		md5key = argv.instance // use command line value
	}

	if( typeof md5key === 'string' )
	{
		md5key=md5key.toLowerCase().replace(/[^A-Za-z0-9]/g, '')
		if(md5key.length!=32) // is this is a valid MD5 32 characters of a-z 0-9
		{
			md5key=undefined
		}
	}

	if( typeof md5key === 'string' ) // open an instance database
	{
		pg = 'postgres:///db_'+md5key
	}

//console.log("using instance PG database "+pg)

	if( ! dbs[pg] ) // create db
	{
		dbs[pg]=master_pgp(pg)
	}

	return dbs[pg];
};

// nothing to close?
dstore_pg.close = async function(db){

//	if(db)
//	{
//		db.$pool.end();
//	}

};

// no pragmas to force
//dstore_pg.pragmas = async function(db){
//};

// create tables
dstore_pg.create_tables = async function(opts){
await ( await dstore_pg.open() ).task( async db => {

	if(!opts){opts={};}

console.log("CREATING TABLES");

	for(var name in dstore_db.tables)
	{
		var tab=dstore_db.tables[name];

		if(!opts.do_not_drop)
		{
			console.log("DROPPING "+name);
			await db.none("DROP TABLE IF EXISTS "+name+";").catch(err);
		}

		var s=dstore_back.getsql_create_table(db,name,tab);
		console.log(s);
		await db.none(s).catch(err)

// check we have all the columns in the table

		var cs=dstore_back.getsql_create_table_columns(db,name,tab);
		for(var i=0; i<cs.length; i++)
		{
			let s="ALTER TABLE "+name+" ADD COLUMN "+cs[i]+" ;";
			await db.none(s).catch(function(error){
					s=undefined;
				})
			if(s)
			{
				console.log(s);
			}
		}

	}

	dstore_pg.close(db)
})

};

dstore_pg.dump_tables = async function(){
await ( await dstore_pg.open() ).task( async db => {

	var s=(" SELECT * FROM INFORMATION_SCHEMA.COLUMNS ; ");
	console.log(s);
	var rows=await db.any(s,{}).catch(err);

	ls(rows);

	dstore_pg.close(db)
})

};


dstore_pg.create_indexes = async function(idxs){
await ( await dstore_pg.open() ).task( async db => {

console.log("CREATING INDEXS");

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];

			if( (!idxs) || (idxs==name) )
			{

				for(var i=0; i<tab.length;i++)
				{
					var col=tab[i];
					if( col.INDEX )
					{
						var s=(" CREATE INDEX IF NOT EXISTS "+name+"_btree_"+col.name+" ON "+name+" USING btree ( "+col.name+" ); ");
						console.log(s);
						await db.none(s).catch(err);

					}
					if( col.HASH )
					{
						var s=(" CREATE INDEX IF NOT EXISTS "+name+"_hash_"+col.name+" ON "+name+" USING hash ( "+col.name+" ); ");
						console.log(s);
						await db.none(s).catch(err);

					}
					if( col.GIN )
					{
						var s=(" CREATE INDEX IF NOT EXISTS "+name+"_gin_"+col.name+" ON "+name+" USING gin ( "+col.name+" ); ");
						console.log(s);
						await db.none(s).catch(err);

					}

					if(col.XSON_INDEX)
					{
						let t=col.XSON_INDEX
						let n=t[0]
						let nu=n.replace(/[\W_]+/g,"_");
						var s=(" CREATE INDEX IF NOT EXISTS "+name+"_xson_"+nu+" ON "+name+" USING btree (((xson ->> '"+n+"')::text)) WHERE xson ->> '"+n+"' IS NOT NULL ; ");
						console.log(s);
						await db.none(s).catch(err);
					}

				}
			}
		}

// we also create a text search index
	if(!idxs || idxs=="search")
	{
		var s=(" CREATE INDEX IF NOT EXISTS act_index_text_search ON act USING gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') )); ");
		console.log(s);
		await db.none(s).catch(err);

		var s=(" CREATE INDEX IF NOT EXISTS xson_index_text_search ON xson USING gin(to_tsvector('simple', xson->>'' )); ");
		console.log(s);
		await db.none(s).catch(err);

	}

	dstore_pg.close(db)
})

};

dstore_pg.delete_indexes = async function(){
await ( await dstore_pg.open() ).task( async db => {

console.log("DROPING INDEXS");

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];

			for(var i=0; i<tab.length;i++)
			{
				var col=tab[i];

				if( col.name )
				{
					 await db.none("DROP INDEX IF EXISTS "+name+"_index_"+col.name+";").catch(err);
					 await db.none("DROP INDEX IF EXISTS "+name+"_btree_"+col.name+";").catch(err);
					 await db.none("DROP INDEX IF EXISTS "+name+"_hash_"+col.name+";").catch(err);
					 await db.none("DROP INDEX IF EXISTS "+name+"_gin_"+col.name+";").catch(err);
				}

				if(col.XSON_INDEX)
				{
					let t=col.XSON_INDEX
					let n=t[0]
					let nu=n.replace(/[\W_]+/g,"_");
					var s=(" DROP INDEX IF EXISTS "+name+"_xson_"+nu+" ; ");
					await db.none(s).catch(err);
				}

			}
		}

// special search index

	 await db.none("DROP INDEX IF EXISTS act_index_text_search;").catch(err);
	 await db.none("DROP INDEX IF EXISTS xson_index_text_search;").catch(err);

	dstore_pg.close(db)
})

};



// return array of columns
dstore_pg.getsql_create_table_columns=function(db,name,tab)
{
	var ss=[];

	for(var i=0; i<tab.length;i++)
	{
		var s=[];

		var col=tab[i];

		if(col.name)
		{
			s.push(" "+col.name+" ");

			if(col.INTEGER)				{ s.push(" INTEGER "); }
			else
			if(col.REAL) 				{ s.push(" REAL "); }
			else
			if(col.BLOB) 				{ s.push(" BLOB "); }
			else
			if(col.NOCASE)				{ s.push(" CITEXT "); }
			else
			if(col.TEXT)				{ s.push(" TEXT "); }
			else
			if(col.JSON)				{ s.push(" JSONB "); }

			if(col.NOT_NULL)			{ s.push(" NOT NULL "); }

			if(col.PRIMARY) 			{ s.push(" PRIMARY KEY "); }
			else
			if(col.UNIQUE) 				{ s.push(" UNIQUE "); }

			ss.push(s.join(""))
		}
	}

	return ss;
}

dstore_pg.getsql_create_table=function(db,name,tab)
{
	var s=[];

	s.push("CREATE TABLE IF NOT EXISTS "+name+" ( ");

	var cs=dstore_pg.getsql_create_table_columns(db,name,tab)

	s.push(cs.join(" , "))

// add unique constraints
	for(var i=0; i<tab.length;i++)
	{
		var col=tab[i];
		if(col.UNIQUE) // add a multiple unique constraint
		{
			s.push(" , UNIQUE ("+(col.UNIQUE.join(","))+") ");
		}
	}

	s.push(" ); ");

	return s.join("");
};


dstore_pg.getsql_prepare_replace = function(name,row){

	var s=[];

	s.push("INSERT INTO "+name+" ( ");

	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" "+n+" ");
		need_comma=true
	}

	s.push(" ) VALUES ( ");

	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" ${"+n+"} ");
		need_comma=true
	}

	s.push(" ) ");


	var pkey=dstore_db.tables_primary[name];
	if(pkey)
	{
		s.push("ON CONFLICT ("+pkey+") DO UPDATE SET ");
		var need_comma=false;
		for(var n in row)
		{
			if(need_comma) { s.push(" , "); }
			s.push(" "+n+"=${"+n+"} ");
			need_comma=true
		}
//		s.push(" WHERE "+pkey+"=$("+pkey+") ")
	}


	return s.join("");
}

dstore_pg.getsql_prepare_update = function(name,row){

	var pkey=dstore_db.tables_primary[name];

	var s=[];
	s.push("UPDATE "+name+" SET ");
	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" "+n+"=${"+n+"} ");
		need_comma=true
	}
	s.push(" WHERE "+pkey+"=$("+pkey+") ")
	s.push(" ");
	return s.join("");

};



// prepare some sql code, keep it in dstore_db as it all relates to dstore_db.tables data
dstore_pg.cache_prepare = function(){

	dstore_db.tables_replace_sql={};
	dstore_db.tables_update_sql={};
	dstore_db.tables_primary={};
	for(var name in dstore_db.tables)
	{
		var t=dstore_db.tables_active[name];
		for(var i=0; i<dstore_db.tables[name].length; i++ )
		{
			var v=dstore_db.tables[name][i];
			if(v.PRIMARY)
			{
				dstore_db.tables_primary[name]=v.name;
			}
		}
		dstore_db.tables_replace_sql[name]=dstore_pg.getsql_prepare_replace(name,t);
		dstore_db.tables_update_sql[name] =dstore_pg.getsql_prepare_update(name,t);
	}

//	ls(dstore_db.tables_primary);
//	ls(dstore_db.tables);
//	ls(dstore_db.tables_active);
//	ls(dstore_db.tables_replace_sql);
//	ls(dstore_db.tables_update_sql);

};

dstore_pg.delete_from = async function(db,tablename,opts){

	if( opts.trans_flags ) // hack opts as there are currently only two uses
	{
		await db.none(" DELETE FROM "+tablename+" WHERE trans_flags=${trans_flags} ",opts).catch(err);
	}
	else
	if(opts.aid && opts.slug)
	{
		await db.none(" DELETE FROM "+tablename+" WHERE aid=${aid} AND slug=${slug}",opts).catch(err);
	}
	else
	if(opts.aid)
	{
		await db.none(" DELETE FROM "+tablename+" WHERE aid=${aid} ",opts).catch(err);
	}
	else
	if(opts.pid)
	{
		await db.none(" DELETE FROM "+tablename+" WHERE pid=${pid} ",opts).catch(err);
	}

};


dstore_pg.replace = async function(db,name,it){

	await db.none(dstore_db.tables_replace_sql[name],it).catch(err);

};

// get a row by aid
dstore_pg.select_by_aid = async function(db,name,aid){

	var rows= await db.any("SELECT * FROM "+name+" WHERE aid=${aid};",{aid:aid}).catch(err);

	return rows[0]
};


dstore_pg.fill_acts = async function(acts,slug,data,head){
await ( await dstore_pg.open() ).tx( async db => {

	var before_time=Date.now();
	var after_time=Date.now();
	var before=0;
	var after=0;

//	await db.none("BEGIN;").catch(err);

/*
	wait.for(function(cb){
		db.one("SELECT COUNT(*) FROM act;").then(function(row){
			before=row.count;
			cb();
		}).catch(err);
	});
*/


// find old data and remove it before we do anything else
	var rows=await db.any("SELECT aid FROM slug WHERE slug=${slug} AND aid IS NOT NULL;",{slug:slug}).catch(err);
	var deleteme={} // create map
	for(let row of rows) { deleteme[ row["aid"] ] = true }

// clean up slug table, which may have some old nulls
	await db.any("DELETE FROM slug WHERE slug=${slug} AND aid IS NULL ;",{slug:slug}).catch(err);


	var progchar=["0","1","2","3","4","5","6","7","8","9"];

	if(acts.length==0) // probably an org file, try and import budgets from full data
	{

		var org=refry.xml(data,slug); // raw xml convert to jml
		var aid=iati_xml.get_aid(org);

		var orgxml=refry.tag(org,"iati-organisations"); // check for org file data
		if(orgxml)
		{

			console.log("importing xson from org file for "+aid)

			let xtree=dflat.xml_to_xson( orgxml )
			dflat.clean(xtree)
			xtree=xtree["/iati-organisations/iati-organisation"][0]		// <-- only imports the first org, did not expect multiples so need to re hack this

			let pid=xtree["/organisation-identifier"] || xtree["/reporting-org@ref"]

// remember dataset
			xtree["@dstore:dataset"]=slug
			xtree["@xmlns:dstore"]="http://d-portal.org/xmlns/dstore"

// get old ids for this slug ( hax as we keep the pid in the aid slot... )
			var rows= await db.any("SELECT * FROM slug WHERE slug=${slug};",{slug:slug}).catch(err);

// and delete them all
			for(let r of rows)
			{
				if(r.aid)
				{
					await db.none("DELETE FROM xson WHERE pid=${pid} AND aid IS NULL ;",{pid:r.aid}).catch(err);
					await dstore_back.delete_from(db,"budget",{aid:r.aid});
					await dstore_back.delete_from(db,"slug",{aid:r.aid});
				}
			}

			let xs=[]
			let xwalk
			xwalk=function(it,path)
			{
				let x={}

				x.aid=null
				x.pid=pid // we have a pid but no aid
				x.root=path
				x.xson=JSON.stringify( it );

				if(x.xson)
				{
					xs.push(x)
				}

				for(let n in it )
				{
					let v=it[n]
					if(Array.isArray(v))
					{
						for(let i=0;i<v.length;i++)
						{
							xwalk( v[i] , path+n )
						}
					}
				}
			}
			xwalk( xtree ,"/iati-organisations/iati-organisation")

			for(let x of xs )
			{
				await dstore_back.replace(db,"xson",x);
			}

			console.log("importing budgets from org file for "+pid)

			await dstore_back.delete_from(db,"budget",{aid:pid});

			for( let it of refry.all_tags(org,"total-budget")){ await dstore_db.refresh_budget(db,it,xtree,{aid:pid},0); }
			for( let it of refry.all_tags(org,"recipient-org-budget")){ await dstore_db.refresh_budget(db,it,xtree,{aid:pid},0); }
			for( let it of refry.all_tags(org,"recipient-country-budget")){ await dstore_db.refresh_budget(db,it,xtree,{aid:pid},0); }

			await dstore_back.replace(db,"slug",{"aid":pid,"slug":slug});

			delete deleteme[aid] // replaced so no need to delete
		}
	}


	let count_new=0
	for(var i=0;i<acts.length;i++)
	{
		var xml=acts[i];

		let json=refry.xml(xml,slug);
		var aid=iati_xml.get_aid(json);
		if(aid)
		{
			var p=Math.floor(progchar.length*(i/acts.length));
			if(p<0) { p=0; } if(p>=progchar.length) { p=progchar.length-1; }
			process.stdout.write(progchar[p]);

			// do not let one error break the whole file
			try{
				if( await dstore_db.refresh_act(db,aid,json,head) )
				{
					count_new++ // only count if a real activity that we added

					delete deleteme[aid] // replaced no need to delete
				}
			}catch(e){
				console.log(e)
			}

			let pct=Math.floor(100*i/acts.length)
			if( global && global.argv && global.argv.statusfile ) // write status to a file
			{
				fs.writeFileSync( global.argv.statusfile , "import "+pct+"%\n" )
			}

		}
	}


	process.stdout.write("\n");

	let delete_list=[];
	for( let n in deleteme)
	{
		delete_list.push(n)
	}
	console.log("deleting "+delete_list.length+" old activities")

	if( delete_list.length>0 ) // delete activities that used to be in this file but are not there any more
	{
		for( let v of ["act","jml","xson","trans","budget","country","sector","location","policy","related"] )
		{
			await db.none("DELETE FROM "+v+" WHERE aid = ANY(${aids}) ;",{aids:delete_list}).catch(err);
		}
		await db.none("DELETE FROM slug WHERE slug=${slug} AND aid = ANY(${aids}) ;",{slug:slug,aids:delete_list}).catch(err);
	}




/*
	wait.for(function(cb){
		db.one("SELECT COUNT(*) FROM act;").then(function(row){
			after=row.count;
			cb();
		}).catch(err);
	});
*/

//	await db.none("COMMIT;").catch(err);

	after_time=Date.now();

	console.log("added "+count_new+" new activities in "+(after_time-before_time)+"ms\n")
//	process.stdout.write(after+" ( "+(after-before)+" ) "+(after_time-before_time)+"ms\n");

	dstore_pg.close(db)
})

};



dstore_pg.warn_dupes = async function(db,aid,slug){

	var ret=false

// report if this id is from another file and being replaced, possibly from this file even
// I think we should complain a lot about this during import
	var rows=await db.any("SELECT * FROM slug WHERE aid=${aid} AND slug!=${slug};",{aid:aid,slug:slug}).catch(err);

	for(var i in rows)
	{
		var row=rows[i]
//		console.log("\nDUPLICATE: "+row.slug+" : "+row.aid);
		ret=true
	}

	return ret
};


dstore_pg.query_params=function(string,params)
{
	let values=[]
	let index=0
	for( let key in params )
	{
		let value=params[key]

		string=string.split(`\$\{${key}\}`)
		if( string.length>1 ) { values[index]=value ; index=index+1 } // found at least 1
		string=string.join(`$${index}`)
	}
	return [string,values,index]
}

// probably not safe
dstore_pg.query_params_string=function(string,params)
{
	let index=0
	for( let key in params )
	{
		let value=params[key]
		if( typeof value == "string" )
		{
			value="'"+value.split("'").join("\\'")+"'"
		}

		string=string.split(`\$\{${key}\}`).join(value)

		index=index+1
	}
	return string
}

// the database part of the query code
dstore_pg.query_select=async function(q,res,r,req){

let ss=query.stream_start(q,res,r,req)
let conn=null
let cursor=null

let cleanup=function(error)
{
	r.error=error.message || error
	console.log(r)

	if( cursor )
	{
		cursor.close(() => conn.done());
	}
	else
	if( conn )  // I don't think this will happen
	{
		conn.done()
	}

	query.stream_stop(ss) // return error
}

	let db=await ( await dstore_pg.open(req) )

	let sql=dstore_pg.query_params_string( r.query , r.qvals )
	r.dquery=url.format({
		protocol: req.protocol,
		host:     req.get("host"),
		pathname: "/dquery",
		hash:     "#"+encodeURI(sql)
	})

	var qq=dstore_pg.query_params(r.query,r.qvals)

	try{

		conn = await db.connect()
		cursor = conn.client.query(new Cursor(qq[0],qq[1]))
		var rows=[]
		do{

			rows = await cursor.read(1)
			if( rows[0] )
			{
				query.stream_item(ss,rows[0])
			}
			if(ss.broken) // no one is listening and webpage connection has been closed
			{
				break // so stop sending data and cleanup
			}

		} while(rows.length>0);
		cursor.close(() => conn.done());

		delete r.query // do not return these
		delete r.qvals

		if(!ss.broken) // no one is listening
		{
			query.stream_stop(ss)
		}

	}catch(error){cleanup(error)}
}


dstore_pg.analyze = async function(){
await ( await dstore_pg.open() ).task( async db => {

	var start_time=Date.now();
	process.stdout.write("ANALYZE start\n");
	await db.any("ANALYZE;").catch(err)
	var time=(Date.now()-start_time)/1000;
	process.stdout.write("ANALYSE done "+time+"\n");

	dstore_pg.close(db)

})

}


dstore_pg.vacuum = async function(){
await ( await dstore_pg.open() ).task( async db => {

	var start_time=Date.now();
	process.stdout.write("VACUUM start\n");

	await db.any("VACUUM;").catch(err);

	var time=(Date.now()-start_time)/1000;
	process.stdout.write("VACUUM done "+time+"\n");

	dstore_pg.close(db)

})

}

dstore_pg.fake_trans = async function(){
await ( await dstore_pg.open() ).task( async db => {

	var ids={};

	var fake_ids=[];

	process.stdout.write("Removing all fake transactions\n");

	await dstore_back.delete_from(db,"trans",{trans_flags:1});

	let rows = await db.any("SELECT reporting_ref , trans_code ,  COUNT(*) AS count FROM act  JOIN trans USING (aid)  GROUP BY reporting_ref , trans_code").catch(err);

	for(let i=0;i<rows.length;i++)
	{
		var v=rows[i];
		if(v.trans_code=="C")
		{
			ids[v.reporting_ref] = (ids[v.reporting_ref] || 0) + 1 ;
		}
		else
		if( (v.trans_code=="D") || (v.trans_code=="E") )
		{
			ids[v.reporting_ref] = (ids[v.reporting_ref] || 0) - 1 ;
		}
	}
	for(var n in ids)
	{
		var v=ids[n];
		if(v>0) // we have commitments but no D or E
		{
			fake_ids.push(n);
		}
	}

	process.stdout.write("The following publishers will have fake transactions added\n");
	ls(fake_ids);

//		process.stdout.write("Adding fake transactions for the following IDs\n");
	for(let i=0;i<fake_ids.length;i++) // add new fake
	{
		var v=fake_ids[i];
		var p=await db.any("SELECT * FROM act  JOIN trans USING (aid)  WHERE reporting_ref=${reporting_ref} AND trans_code=${trans_code} ",{reporting_ref:v,trans_code:"C"}).catch(err);
		for(let j=0;j<p.length;j++)
		{
			var t=p[j];
//					process.stdout.write(t.aid+"\n");
			t.trans_code="D";
			t.trans_flags=1;
			await db.none(dstore_db.tables_replace_sql["trans"],t).catch(err);
		}
	}

	dstore_pg.close(db)

})

};


// generic query
dstore_pg.query=async function(q,v){

	let db = await dstore_pg.open();
	let close=function(){ dstore_pg.close(db); db=undefined; }

	return await db.any(q,v).catch(err).finally(close);

}


dstore_pg.augment_related_implied2 = async function(db)
{

// parents from transactions
	await db.none(`

WITH
p AS (

SELECT

	aid,
	xson->>'/provider-org@provider-activity-id' as related_aid


FROM xson

WHERE root='/iati-activities/iati-activity/transaction'
AND   xson->'/provider-org@provider-activity-id' IS NOT NULL
AND   aid !=xson->>'/provider-org@provider-activity-id'

group by aid , xson->>'/provider-org@provider-activity-id'

)

INSERT INTO related
SELECT aid,related_aid,1 AS related_type,2 AS related_source
FROM p

	`)

}
dstore_pg.augment_related_implied3 = async function(db)
{

// children from transactions
	await db.none(`

WITH
p AS (

SELECT

	aid,
	xson->>'/receiver-org@receiver-activity-id' as related_aid


FROM xson
WHERE root='/iati-activities/iati-activity/transaction'
AND   xson->'/receiver-org@receiver-activity-id' IS NOT NULL
AND   aid !=xson->>'/receiver-org@receiver-activity-id'

group by aid , xson->>'/receiver-org@receiver-activity-id'

)

INSERT INTO related
SELECT aid,related_aid,2 AS related_type,3 AS related_source
FROM p

	`)

}
dstore_pg.augment_related_implied4 = async function(db)
{
// alternative activity ID
	await db.none(`

WITH
p AS (

SELECT

	aid,
	xson->>'@ref' as related_aid


FROM xson
WHERE root='/iati-activities/iati-activity/other-identifier'
AND   xson->>'@type'='A3'
AND   xson->'@ref' IS NOT NULL
AND   aid !=xson->>'@ref'

group by aid , xson->>'@ref'

)

INSERT INTO related
SELECT aid,related_aid,3 AS related_type,4 AS related_source
FROM p

	`)

}
dstore_pg.augment_related_implied5 = async function(db)
{
// parents from participating org
	await db.none(`

WITH
p AS (

SELECT

	aid,
	xson->>'@activity-id' as related_aid


FROM xson

WHERE root='/iati-activities/iati-activity/participating-org'
AND   xson->'@activity-id' IS NOT NULL
AND   aid !=xson->>'@activity-id'
AND   xson->>'@role'=ANY ('{1,2,3}'::char[])

group by aid , xson->>'@activity-id'

)

INSERT INTO related
SELECT aid,related_aid,1 AS related_type,5 AS related_source
FROM p

	`)

}


dstore_pg.augment_relatedp_implied6 = async function(db)
{
// parents from participating org
	await db.none(`

WITH
p AS (

SELECT

	pid,xson->>'@ref' AS related_pid

FROM xson

WHERE root='/iati-activities/iati-activity/participating-org'
AND   xson->>'@ref' IS NOT NULL
AND   pid !=xson->>'@ref'
AND   xson->>'@role'=ANY ('{1,2,3}'::char[])

group by pid , xson->>'@ref'

)

INSERT INTO relatedp
SELECT pid,related_pid,1 AS related_type,6 AS related_source
FROM p

	`)

}

dstore_pg.augment_related_dedupe = async function(db)
{

// remove self links
	await db.none(`

   DELETE FROM related
   WHERE aid=related_aid

	`)

// remove all duplicates
	await db.none(`

WITH
one AS (
	WITH rel AS (
		SELECT
		count(*)::int AS count,aid,related_aid,related_type,related_source
		FROM related group by aid,related_aid,related_type,related_source
	)
	SELECT aid,related_aid,related_type,related_source FROM rel WHERE count>1
),
del AS (
   DELETE FROM related AS r
   USING  one o
   WHERE  r.aid          = o.aid
   AND    r.related_aid  = o.related_aid
   AND    r.related_type = o.related_type
   AND    r.related_source = o.related_source
)
INSERT INTO related (aid,related_aid,related_type,related_source)
TABLE one;

	`)


}

dstore_pg.augment_relatedp_dedupe = async function(db)
{

// remove self links
	await db.none(`

   DELETE FROM relatedp
   WHERE pid=related_pid

	`)


// remove all duplicates
	await db.none(`

WITH
one AS (
	WITH rel AS (
		SELECT
		count(*)::int AS count,pid,related_pid,related_type,related_source
		FROM relatedp group by pid,related_pid,related_type,related_source
	)
	SELECT pid,related_pid,related_type,related_source FROM rel WHERE count>1
),
del AS (
   DELETE FROM relatedp AS r
   USING  one o
   WHERE  r.pid          = o.pid
   AND    r.related_pid  = o.related_pid
   AND    r.related_type = o.related_type
   AND    r.related_source = o.related_source
)
INSERT INTO relatedp (pid,related_pid,related_type,related_source)
TABLE one;

	`)


}

dstore_pg.augment_related_linkback = async function(db)
{

	await db.none(`

INSERT INTO related
SELECT related_aid,aid,3-related_type,related_source
FROM related
WHERE related_type=1 OR related_type=2

	`)


// make sure all children link back to parents
/*
	await db.none(`

WITH link AS
(
	SELECT aid,related_aid
	FROM related
	WHERE related_type=1
),
back AS
(
	SELECT aid,related_aid
	FROM related
	WHERE related_type=2
)
INSERT INTO related
SELECT related_aid,aid,2,-2
FROM link
WHERE NOT EXISTS (
	SELECT * FROM back
		WHERE back.related_aid = link.aid
		AND   back.aid         = link.related_aid
);

	`)
*/

// make sure all parents link back to children
/*
	await db.none(`

WITH link AS
(
	SELECT aid,related_aid
	FROM related
	WHERE related_type=2
),
back AS
(
	SELECT aid,related_aid
	FROM related
	WHERE related_type=1
)
INSERT INTO related
SELECT related_aid,aid,1,-1
FROM link
WHERE NOT EXISTS (
	SELECT * FROM back
		WHERE back.related_aid = link.aid
		AND   back.aid         = link.related_aid
);

	`)
*/

// siblings is a problem maybe, so do not do that?

}

dstore_pg.augment_relatedp_linkback = async function(db)
{

// make sure all children link back to parents
	await db.none(`

INSERT INTO relatedp
SELECT related_pid,pid,3-related_type,related_source
FROM relatedp
WHERE related_type=1 OR related_type=2

	`)
/*
	await db.none(`

WITH link AS
(
	SELECT pid,related_pid
	FROM relatedp
	WHERE related_type=1
),
back AS
(
	SELECT pid,related_pid
	FROM relatedp
	WHERE related_type=2
)
INSERT INTO relatedp
SELECT related_pid,pid,2,-2
FROM link
WHERE NOT EXISTS (
	SELECT * FROM back
		WHERE back.related_pid = link.pid
		AND   back.pid         = link.related_pid
);

	`)
*/

// make sure all parents link back to children
/*
	await db.none(`

WITH link AS
(
	SELECT pid,related_pid,related_source
	FROM relatedp
	WHERE related_type=2
),
back AS
(
	SELECT pid,related_pid
	FROM relatedp
	WHERE related_type=1
)
INSERT INTO relatedp
SELECT related_pid,pid,1,-1
FROM link
WHERE NOT EXISTS (
	SELECT * FROM back
		WHERE back.related_pid = link.pid
		AND   back.pid         = link.related_pid
);

	`)
*/

// siblings is a problem maybe, so do not do that?

}

dstore_pg.augment_related_fill = async function(db)
{

	await db.none(`
		TRUNCATE related
	`)

	await db.none(`

INSERT INTO related
SELECT
	aid,
	xson->>'@ref' AS related_aid,
	(xson->>'@type')::int AS related_type,
	1 AS related_source
FROM xson
WHERE root='/iati-activities/iati-activity/related-activity'
	AND xson->>'@ref' IS NOT NULL
	AND xson->>'@type' IS NOT NULL

	`)

}

dstore_pg.augment_relatedp_fill = async function(db)
{

	await db.none(`
		TRUNCATE relatedp
	`)

	await db.none(`

WITH
p AS (
    SELECT
    a.reporting_ref as pid,
    b.reporting_ref as related_pid,
    r.related_type  as related_type,
    r.related_source  as related_source

    FROM related r
    JOIN act a ON a.aid=r.aid
    JOIN act b ON b.aid=r.related_aid
    WHERE a.reporting_ref!=b.reporting_ref
    GROUP BY a.reporting_ref,b.reporting_ref,r.related_type,r.related_source
)

INSERT INTO relatedp
SELECT pid,related_pid,related_type,related_source
FROM p

	`)

}

dstore_pg.augment_related_dump = async function(db)
{

	let r=await db.any(`
SELECT
related_type,related_source,count(*)::int AS count
FROM related
GROUP BY related_type,related_source ORDER BY 1,2
	`)

	console.log(r)
}

dstore_pg.augment_relatedp_dump = async function(db)
{

	let r=await db.any(`
SELECT
related_type,related_source,count(*)::int AS count
FROM relatedp
GROUP BY related_type,related_source ORDER BY 1,2
	`)

	console.log(r)
}

dstore_pg.augment_related = async function(){
await ( await dstore_pg.open() ).tx( async db => {


console.log("augmenting related table")
	await dstore_pg.augment_related_dump(db)

console.log("fill")
	await dstore_pg.augment_related_fill(db)
		await dstore_pg.augment_related_dump(db)

console.log("parents from participating org")
	await dstore_pg.augment_related_implied5(db)
		await dstore_pg.augment_related_dump(db)

console.log("alternative activity ID")
	await dstore_pg.augment_related_implied4(db)
		await dstore_pg.augment_related_dump(db)

console.log("children from transactions")
	await dstore_pg.augment_related_implied3(db)
		await dstore_pg.augment_related_dump(db)

console.log("parents from transactions")
	await dstore_pg.augment_related_implied2(db)
		await dstore_pg.augment_related_dump(db)

console.log("creating linkbacks")
	await dstore_pg.augment_related_linkback(db)
		await dstore_pg.augment_related_dump(db)

console.log("removing duplicates")
	await dstore_pg.augment_related_dedupe(db)
		await dstore_pg.augment_related_dump(db)

console.log("done augmenting related table")


console.log("building relatedp table")
	await dstore_pg.augment_relatedp_dump(db)

console.log("fill")
	await dstore_pg.augment_relatedp_fill(db)
		await dstore_pg.augment_relatedp_dump(db)


console.log("parents from participating org")
	await dstore_pg.augment_relatedp_implied6(db)
		await dstore_pg.augment_relatedp_dump(db)

console.log("creating linkbacks")
	await dstore_pg.augment_relatedp_linkback(db)
		await dstore_pg.augment_relatedp_dump(db)

console.log("dedupe")
	await dstore_pg.augment_relatedp_dedupe(db)
		await dstore_pg.augment_relatedp_dump(db)

console.log("done building relatedp table")

	dstore_pg.close(db)
})

};


