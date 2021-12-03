// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

module.exports=exports;

var dstore_sqlite=exports;
var dstore_back=exports;

var url=require("url")

exports.engine="sqlite";

var refry=require("./refry");
var exs=require("./exs");
var iati_xml=require("./iati_xml");

var dflat=require('../../dflat/js/dflat');
var dflat_database=require('../../dflat/json/database.json');

//var wait=require("wait.for-es6");

var http=require("http");
var sqlite = require("sqlite-async");//.verbose();

var iati_cook=require('./iati_cook');
var dstore_db=require('./dstore_db');
// how to use query replcaments
dstore_db.text_plate=function(s){ return "$"+s; }
dstore_db.text_name=function(s){ return "$"+s; }

var	query=require("./query");

var util=require("util");
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


dstore_sqlite.close = async function(db){
	await db.close();
};

dstore_sqlite.open = async function(req){
//	var db = new sqlite3.cached.Database( global.argv.database );
	var db;
	
	let md5key = ( req && req.subdomains && req.subdomains[req.subdomains.length-1] ) // use first sub domain
	
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
		var dbfilename=__dirname+"/../../dstore/instance/"+md5key+".sqlite";
		
console.log("using instance database "+dbfilename)

		db = sqlite.open( dbfilename );
	}
	else
	{
		db = sqlite.open( global.argv.database );
	}
	
//	db.configure("busyTimeout",100000); // wait upto 100 sec on busy locks
	
//	dstore_sqlite.pragmas(db);
		
	return db;
};

// set prefered pragmas
dstore_sqlite.pragmas = async function(db)
{
// speed up data writes.

	await db.run("PRAGMA synchronous = 0 ;");
	await db.run("PRAGMA encoding = \"UTF-8\" ;");
	await db.run("PRAGMA journal_mode=WAL;");
	await db.run("PRAGMA mmap_size=268435456;");
	await db.run("PRAGMA temp_store=2;");
}


// run a query
dstore_sqlite.query = async function(db,q,v){
	return await db.run(q,v);
}

dstore_sqlite.query_run = async function(db,q,v){
	return await db.run(q,v,cb);
}
dstore_sqlite.query_all = async function(db,q,v){
	return await db.all(q,v,cb);
}
dstore_sqlite.query_each = async function(db,q,v){
	return await db.each(q,v);
}

dstore_sqlite.query_exec = async function(db,q,v){
	return await db.exec(q,v);
}


dstore_sqlite.create_tables = async function(opts){
	if(!opts){opts={};}

	var db = await dstore_sqlite.open();

//	db.serialize(function() {

	await dstore_sqlite.pragmas(db);

	for(var name in dstore_db.tables)
	{
		var tab=dstore_db.tables[name];


		if(!opts.do_not_drop)
		{
			console.log("DROPPING "+name);
			await db.run("DROP TABLE IF EXISTS "+name+";");
		}

		var s=dstore_sqlite.getsql_create_table(db,name,tab);
		console.log(s);
		await db.run(s);
		
// check we have all the columns in the table

		var cs=dstore_sqlite.getsql_create_table_columns(db,name,tab);
		for(var i=0; i<cs.length; i++)
		{
			var s="ALTER TABLE "+name+" ADD COLUMN "+cs[i]+" ;";
			console.log(s);
			await db.run(s).catch(function(){}); // ignore errors
		}

// add indexs

		for(var i=0; i<tab.length;i++)
		{
			var col=tab[i];
			
			if( col.INDEX )
			{
				s=(" CREATE INDEX IF NOT EXISTS "+name+"_index_"+col.name+" ON "+name+" ( "+col.name+" ); ");
				console.log(s);
				await db.run(s);
			}
		}
	}

	console.log("Created database "+argv.database);
	
	await dstore_sqlite.close(db);

}


dstore_sqlite.create_indexes = async function(){

	var db = await dstore_sqlite.open();

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

	for(var name in dstore_sqlite.tables)
	{
		var tab=dstore_sqlite.tables[name];
		var s;

// add indexs

		for(var i=0; i<tab.length;i++)
		{
			var col=tab[i];
			
			if( col.INDEX )
			{
				s=(" CREATE INDEX IF NOT EXISTS "+name+"_index_"+col.name+" ON "+name+" ( "+col.name+" ); ");
				console.log(s);
				await db.run(s);
			}
		}
	}

	console.log("Created indexes "+argv.database);
	
	await dstore_sqlite.close(db);
}

dstore_sqlite.delete_indexes = async function(){

	var db = await dstore_sqlite.open();

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

	for(var name in dstore_sqlite.tables)
	{
		var tab=dstore_sqlite.tables[name];
		var s;

// delete indexs

		for(var i=0; i<tab.length;i++)
		{
			var col=tab[i];
			
			if( col.INDEX )
			{
				s=(" DROP INDEX IF EXISTS "+name+"_index_"+col.name+" ;");
				console.log(s);
				await db.run(s);
			}
		}
	}

	console.log("Deleted indexes "+argv.database);
		
	await dstore_sqlite.close(db);
}

dstore_sqlite.replace_vars = function(db,name,it){
	var json={};

//	for(var n in it) { if( n!="xml" && n!="jml" && n!="json" ) { // skip these special long strings
//		json[n]=it[n]; } }
	
	var $t={}; for(var n in dstore_db.tables_active[name]) { $t["$"+n]=it[n]; } // prepare to insert using named values
	
//	$t.$json=JSON.stringify(json); // everything apart from xml/jml also lives in this json string

//	for(var n in it) { if( n.slice(0,4)=="raw_") {
//		$t["$"+n]=it[n]; }}

	return $t;
}

dstore_sqlite.replace = async function(db,name,it){
	
	var $t=dstore_sqlite.replace_vars(db,name,it);
		
//	ls($t);

//db.run( dstore_sqlite.getsql_prepare_replace(name,dstore_sqlite.tables_active[name]) , $t );


	var s=dstore_db.tables_replace_sql[name];
	var sa = await db.prepare(s);
	await sa.run($t);	
	await sa.finalize(); // seems faster to finalize now rather than let it hang?

	
};

// get a row by aid
dstore_sqlite.select_by_aid = async function(db,name,aid){
	
	var rows=await db.all("SELECT * FROM "+name+" WHERE aid=?",aid);

	return rows[0]
};


dstore_sqlite.getsql_prepare_replace = function(name,row){

	var s=[];

	s.push("REPLACE INTO "+name+" ( ");
	
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
		s.push(" $"+n+" ");
		need_comma=true
	}

	s.push(" ); ");

	return s.join("");
}

dstore_sqlite.getsql_prepare_update = function(name,row){

	var s=[];
	s.push("UPDATE "+name+" SET ");
	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" "+n+"=$"+n+" ");
		need_comma=true
	}
	s.push(" ");
	return s.join("");
}

// return array of columns
dstore_sqlite.getsql_create_table_columns=function(db,name,tab)
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
			if(col.TEXT || col.NOCASE)	{ s.push(" TEXT "); }
			else
			if(col.JSON)				{ s.push(" TEXT "); }

			if(col.NOT_NULL)			{ s.push(" NOT NULL "); }

			if(col.PRIMARY) 			{ s.push(" PRIMARY KEY "); }
			else
			if(col.UNIQUE) 				{ s.push(" UNIQUE "); }
			
			if(col.NOCASE)		 		{ s.push(" COLLATE NOCASE "); }
		
			ss.push(s.join(""))
		}
	}
	
	return ss;
}

dstore_sqlite.getsql_create_table=function(db,name,tab)
{
	var s=[];
	
	s.push("CREATE TABLE IF NOT EXISTS "+name+" ( ");
	
	var cs=dstore_sqlite.getsql_create_table_columns(db,name,tab)

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
}

dstore_sqlite.dump_tables = async function(){

	var db = await dstore_sqlite.open();

	var rows=await db.all("SELECT * FROM sqlite_master;")
	ls(rows);

	await dstore_sqlite.close(db);
}


// prepare some sql code, keep it in dstore_db as it all relates to dstore_db.tables data
dstore_sqlite.cache_prepare = function(){
	
	dstore_db.tables_replace_sql={};
	dstore_db.tables_update_sql={};
	dstore_db.tables_active={};
	for(var name in dstore_db.tables)
	{
		var t={};
		for(var i=0; i<dstore_db.tables[name].length; i++ )
		{
			var v=dstore_db.tables[name][i];
			
			var ty="null";
			
			if(v.TEXT) { ty="char"; }
			else
			if(v.NOCASE) { ty="char"; }
			else
			if(v.INTEGER) { ty="int"; }
			else
			if(v.REAL) { ty="float"; }
			
			if(v.name)
			{
				t[v.name]=ty;
			}
		}
		dstore_db.tables_active[name]=t;
		dstore_db.tables_replace_sql[name]=dstore_sqlite.getsql_prepare_replace(name,t);
		dstore_db.tables_update_sql[name] =dstore_sqlite.getsql_prepare_update(name,t);
	}
}


// delete  a row by a specific ID
dstore_sqlite.delete_from = async function(db,tablename,opts){


	if( opts.trans_flags ) // hack opts as there are currently only two uses
	{
		await db.run(" DELETE FROM "+tablename+" WHERE trans_flags=? ",opts.trans_flags);
	}
	else
	if(opts.aid && opts.slug)
	{
		await db.run(" DELETE FROM "+tablename+" WHERE aid=? AND slug=?",opts.aid,opts.slug);
	}
	else
	if(opts.pid)
	{
		await db.run(" DELETE FROM "+tablename+" WHERE pid=? ",opts.pid);
	}
	else
	{
		await db.run(" DELETE FROM "+tablename+" WHERE aid=? ",opts.aid);
	}
/*
*/
};

// call with your tables like so
//dstore_sqlite.cache_prepare(tables);
// to setup


dstore_sqlite.fake_trans = async function(){

	var db = await dstore_back.open();
	
	var ids={};

	var fake_ids=[];
	
	process.stdout.write("Removing all fake transactions\n");

	await dstore_back.delete_from(db,"trans",{trans_flags:1});

	let rows=await db.all("SELECT reporting_ref , trans_code ,  COUNT(*) AS count FROM act  JOIN trans USING (aid)  GROUP BY reporting_ref , trans_code")

	for(i=0;i<rows.length;i++)
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
	for(i=0;i<fake_ids.length;i++) // add new fake
	{
		var v=fake_ids[i];
		let rows=db.all("SELECT * FROM act  JOIN trans USING (aid)  WHERE reporting_ref=? AND trans_code=\"C\" ",v)
		
		for(j=0;j<rows.length;j++)
		{
			var t=rows[j];
//					process.stdout.write(t.aid+"\n");
			t.trans_code="D";
			t.trans_flags=1;
			await dstore_back.replace(db,"trans",t);
		}

	}

};



dstore_sqlite.fill_acts = async function(acts,slug,data,head){

	var before_time=Date.now();
	var after_time=Date.now();
	var before=0;
	var after=0;

	var db = await dstore_back.open();	
//	db.serialize();
	
	await db.run("BEGIN TRANSACTION")
	
	let row = await db.get("SELECT COUNT(*) FROM act")
	before=row["COUNT(*)"];

// delete everything related to this slug
	let rows=await db.all("SELECT aid FROM slug WHERE slug=?",slug)
	for(let row of rows)
	{

		for( let v of ["act","jml","trans","budget","country","sector","location"] )
		{
			await dstore_back.delete_from(db,v,{aid:row["aid"]});
		}
		await dstore_back.delete_from(db,"slug",{slug:slug,aid:row["aid"]});
	}

	await db.run("PRAGMA page_count")

	var progchar=["0","1","2","3","4","5","6","7","8","9"];

	if(acts.length==0) // probably an org file, try and import budgets from full data
	{
		var o
		try {
			var org=refry.xml(data,slug); // raw xml convert to jml
			var aid=iati_xml.get_aid(org);

			o=refry.tag(org,"iati-organisation"); // check for org file data

		} catch (error) {  console.error(error) }

		if(o)
		{
			console.log("importing budgets from org file for "+aid)

			let xtree=dflat.xml_to_xson( { 0:"iati-organisations" , 1:[o] } )
			dflat.clean(xtree)
			xtree=xtree["/iati-organisations/iati-organisation"][0]

			let pid=xtree["/organisation-identifier"] || xtree["/reporting-org@ref"]

// remember dataset
			xtree["@dstore:dataset"]=slug
			xtree["@xmlns:dstore"]="http://d-portal.org/xmlns/dstore"

//console.log(slug+" : "+pid)
//console.log(xtree)

			await db.run("DELETE FROM xson WHERE pid=? AND aid IS NULL ;",pid);
			
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


			await dstore_back.delete_from(db,"budget",{aid:aid});

			console.log(o[0]+" -> "+o["default-currency"])
			iati_cook.activity(o); // cook the raw json(xml) ( most cleanup logic has been moved here )

			refry.tags(org,"total-budget",function(it){dstore_db.refresh_budget(db,it,xtree,{aid:aid},0);});
			refry.tags(org,"recipient-org-budget",function(it){dstore_db.refresh_budget(db,it,xtree,{aid:aid},0);});
			refry.tags(org,"recipient-country-budget",function(it){dstore_db.refresh_budget(db,it,xtree,{aid:aid},0);});

			await dstore_back.replace(db,"slug",{"aid":aid,"slug":slug});
		}
	}


	for(var i=0;i<acts.length;i++)
	{
		var xml=acts[i];

		json=refry.xml(xml,slug);
		var aid=iati_xml.get_aid(json);
		if(aid)
		{
			var p=Math.floor(progchar.length*(i/acts.length));
			if(p<0) { p=0; } if(p>=progchar.length) { p=progchar.length-1; }
			process.stdout.write(progchar[p]);

			await dstore_db.refresh_act(db,aid,json,head);

	// block and wait here

			await db.run("PRAGMA page_count")
		}
	}

	await db.run("COMMIT TRANSACTION");
	process.stdout.write("\n");

	after = ( await db.get("SELECT COUNT(*) FROM act") )["COUNT(*)"]

	
	await dstore_back.close(db);
		
	after_time=Date.now();
	
	process.stdout.write(after+" ( "+(after-before)+" ) "+(after_time-before_time)+"ms\n");
	
};

// call after major data changes to help sqlite optimise queries

dstore_sqlite.vacuum = async function(){

	process.stdout.write("VACUUM start\n");
	var db = await dstore_back.open();
	await db.run("VACUUM")
	
	await dstore_back.close(db);
	
	process.stdout.write("VACUUM done\n");

}

dstore_sqlite.analyze = async function(){


	process.stdout.write("ANALYZE start\n");
	var db = await dstore_back.open();
	await db.run("ANALYZE")
	await dstore_back.close(db);
	process.stdout.write("ANALYSE done\n");
}


dstore_sqlite.warn_dupes = async function(db,aid,slug){

	var ret=false
	
// report if this id is from another file and being replaced, possibly from this file even
// I think we should complain a lot about this during import
	let rows = await db.all("SELECT * FROM slug WHERE aid=? AND slug!=?",aid)

	for(var i in rows)
	{
		var row=rows[i]
//		console.log("\nDUPLICATE: "+row.slug+" : "+row.aid);
		ret=true
	}

	return ret
};


// the database part of the query code
dstore_sqlite.query_select=async function(q,res,r,req){

	var db = await dstore_db.open(req); // pick instance using subdomain
//	db.serialize();
	

	let sql=dstore_sqlite.query_params_string( r.query , r.qvals )
	r.dquery=url.format({
		protocol: req.protocol,
		host:     req.get("host"),
		pathname: "/dquery",
		hash:     "#"+encodeURI(sql)
	})


	let ss=query.stream_start(q,res,r,req)

	await db.each(r.query,r.qvals, function(err, row)
	{
		if(err)
		{
			console.log(r.query+"\n"+err);
			r.error=err
		}
		else
		{
			query.stream_item(ss,row)
			r.count++;
		}
//		if(ss.broken) // no one is listening
//		{
//			break
//		}
	});

	delete r.query // do not return these
	delete r.qvals

	query.stream_stop(ss)
		
	await dstore_back.close(db);

}



// generic query
dstore_sqlite.query=async function(q,v,cb){

	var db = await dstore_db.open();
//	db.serialize();
	
/*
	db.all(q,v, function(err, rows)
	{
		dstore_back.close(db);
		if(err) { console.log(q+"\n"+err); }
		cb(err,rows)
	});
*/

	let rows=await db.all(q,v);

	await dstore_back.close(db);

	return rows;
}


// probably not safe
dstore_sqlite.query_params_string=function(string,params)
{
	let index=0
	for( key in params )
	{
		let value=params[key]
		if( typeof value == "string" )
		{
			value="'"+value.split("'").join("\\'")+"'"
		}
		
		string=string.replace(`\$\{${key}\}`,value)
		
		index=index+1
	}
	return string
}

