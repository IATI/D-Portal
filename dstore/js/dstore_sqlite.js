// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

module.exports=exports;

var dstore_sqlite=exports;
var dstore_back=exports;

exports.engine="sqlite";

var uniqid = require('uniqid');

var refry=require("./refry");
var exs=require("./exs");
var iati_xml=require("./iati_xml");

var wait=require("wait.for");

var http=require("http");
var sqlite3 = require("sqlite3").verbose();

var iati_cook=require('./iati_cook');
var dstore_db=require('./dstore_db');
// how to use query replcaments
dstore_db.text_plate=function(s){ return "$"+s; }
dstore_db.text_name=function(s){ return "$"+s; }

var	query=require("./query");

var util=require("util");
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var err=function (error) {
	console.log("ERROR:", error.message || error); // print the error;
	console.log((error.stack));
	process.exit(1);
}


dstore_sqlite.close = function(db){
	db.close();
};

dstore_sqlite.open = function(instance){
//	var db = new sqlite3.cached.Database( global.argv.database );
	var db;
	
	if(argv.instance)
	{
		instance=String( instance || argv.instance ).replace(/[^A-Za-z0-9]/g, ''); // force alphanumeric only
		var dbfilename=__dirname+"/../../dstore/instance/"+instance+".sqlite";
		
console.log("using instance databsse "+dbfilename)		
		db = new sqlite3.Database( dbfilename );
	}
	else
	{
		db = new sqlite3.Database( global.argv.database );
	}
	
	db.configure("busyTimeout",100000); // wait upto 100 sec on busy locks
	
//	dstore_sqlite.pragmas(db);
		
	return db;
};

// set prefered pragmas
dstore_sqlite.pragmas = function(db)
{
// speed up data writes.
	db.serialize(function() {
		db.run("PRAGMA synchronous = 0 ;");
		db.run("PRAGMA encoding = \"UTF-8\" ;");
		db.run("PRAGMA journal_mode=WAL;");
		db.run("PRAGMA mmap_size=268435456;");
		db.run("PRAGMA temp_store=2;");
	});
}


// run a query
dstore_sqlite.query = function(db,q,v,cb){
	return db.run(q,v,cb);
}

dstore_sqlite.query_run = function(db,q,v,cb){
	return db.run(q,v,cb);
}
dstore_sqlite.query_all = function(db,q,v,cb){
	return db.all(q,v,cb);
}
dstore_sqlite.query_each = function(db,q,v,cb){
	return db.each(q,v,cb);
}

dstore_sqlite.query_exec = function(db,q,v,cb){
	return db.exec(q,v,cb);
}


dstore_sqlite.create_tables = function(opts){
	if(!opts){opts={};}

	var db = dstore_sqlite.open();

	db.serialize(function() {

		dstore_sqlite.pragmas(db);
	
		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];


			if(!opts.do_not_drop)
			{
				console.log("DROPPING "+name);
				db.run("DROP TABLE IF EXISTS "+name+";");
			}

			var s=dstore_sqlite.getsql_create_table(db,name,tab);
			console.log(s);
			db.run(s);
			
// check we have all the columns in the table

			var cs=dstore_sqlite.getsql_create_table_columns(db,name,tab);
			for(var i=0; i<cs.length; i++)
			{
				var s="ALTER TABLE "+name+" ADD COLUMN "+cs[i]+" ;";
				console.log(s);
				db.run(s,function(){});
			}

// add indexs

			for(var i=0; i<tab.length;i++)
			{
				var col=tab[i];
				
				if( col.INDEX )
				{
					s=(" CREATE INDEX IF NOT EXISTS "+name+"_index_"+col.name+" ON "+name+" ( "+col.name+" ); ");
					console.log(s);
					db.run(s);
				}
			}
		}

		console.log("Created database "+argv.database);
		
	});
	
	dstore_sqlite.close(db);

}


dstore_sqlite.create_indexes = function(){

	var db = dstore_sqlite.open();

	db.serialize(function() {
	
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
					db.run(s);
				}
			}
		}

		console.log("Created indexes "+argv.database);
		
	});
	
	dstore_sqlite.close(db);
}

dstore_sqlite.delete_indexes = function(){

	var db = dstore_sqlite.open();

	db.serialize(function() {
	
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
					db.run(s);
				}
			}
		}

		console.log("Deleted indexes "+argv.database);
		
	});
	
	dstore_sqlite.close(db);
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

// get a lock on a filedata object that has not been updated in a while
dstore_sqlite.lock_file_data = function(age){
}

// delete  a row by a specific ID
dstore_sqlite.delete_from_pm = function(db,tablename,opts){
	return new Promise(function (fulfill, reject){

		if( opts.trans_flags ) // hack opts as there are currently only two uses
		{
			db.run(" DELETE FROM "+tablename+" WHERE trans_flags=? ",opts.trans_flags);
		}
		else
		{
			db.run(" DELETE FROM "+tablename+" WHERE aid=? ",opts.aid);
		}
		
		fulfill();

	});
};
dstore_sqlite.delete_from_cb = function(db,tablename,opts,cb){
		dstore_sqlite.delete_from_pm(db,tablename,opts).then(cb).catch(err);
}

dstore_sqlite.delete_from = function(db,tablename,opts){

		if( opts.trans_flags ) // hack opts as there are currently only two uses
		{
			db.run(" DELETE FROM "+tablename+" WHERE trans_flags=? ",opts.trans_flags);
		}
		else
		{
			db.run(" DELETE FROM "+tablename+" WHERE aid=? ",opts.aid);
		}

};

dstore_sqlite.replace_pm = function(db,name,it){
	return new Promise(function (fulfill, reject){

		var $t=dstore_sqlite.replace_vars(db,name,it);
		var s=dstore_db.tables_replace_sql[name];
		var sa = db.prepare(s);
		sa.run($t);	
		sa.finalize(); // seems faster to finalize now rather than let it hang?

		fulfill(true);

	});
}
dstore_sqlite.replace_cb = function(db,name,it,cb){
	dstore_sqlite.replace_pm(db,name,it).then(cb).catch(err);
}
dstore_sqlite.replace = function(db,name,it){

		var $t=dstore_sqlite.replace_vars(db,name,it);
		var s=dstore_db.tables_replace_sql[name];
		var sa = db.prepare(s);
		sa.run($t);	
		sa.finalize(); // seems faster to finalize now rather than let it hang?

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

dstore_sqlite.dump_tables = function(){

	var db = dstore_sqlite.open();

	db.serialize(function() {
	
		db.all("SELECT * FROM sqlite_master;", function(err, rows)
		{
			ls(rows);
		});

	});

	dstore_sqlite.close(db);
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
			
			t[v.name]=ty;
		}
		dstore_db.tables_active[name]=t;
		dstore_db.tables_replace_sql[name]=dstore_sqlite.getsql_prepare_replace(name,t);
		dstore_db.tables_update_sql[name] =dstore_sqlite.getsql_prepare_update(name,t);
	}
}



// call with your tables like so
//dstore_sqlite.cache_prepare(tables);
// to setup


dstore_sqlite.fake_trans = function(){

	var db = dstore_back.open();
	
	var ids={};

	var fake_ids=[];
	
	process.stdout.write("Removing all fake transactions\n");

	dstore_back.delete_from(db,"trans",{trans_flags:1});

	db.all("SELECT reporting_ref , trans_code ,  COUNT(*) AS count FROM act  JOIN trans USING (aid)  GROUP BY reporting_ref , trans_code", function(err, rows)
	{
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
			db.all("SELECT * FROM act  JOIN trans USING (aid)  WHERE reporting_ref=? AND trans_code=\"C\" ",v, function(err, rows)
			{
				for(j=0;j<rows.length;j++)
				{
					var t=rows[j];
//					process.stdout.write(t.aid+"\n");
					t.trans_code="D";
					t.trans_flags=1;
					dstore_back.replace(db,"trans",t);
				}
	//				ls(rows);
			});
		}

	});

};



dstore_sqlite.fill_acts = function(acts,slug,data,head,main_cb){

	var before_time=Date.now();
	var after_time=Date.now();
	var before=0;
	var after=0;

	var db = dstore_back.open();	
	db.serialize();
	
	wait.for(function(cb){
		db.run("BEGIN TRANSACTION",cb);
	});
	
	db.each("SELECT COUNT(*) FROM act", function(err, row)
	{
		before=row["COUNT(*)"];
	});

// delete everything related to this slug
	db.each("SELECT aid FROM slug WHERE slug=?",slug, function(err, row)
	{

		(["act","jml","trans","budget","country","sector","location","slug"]).forEach(function(v,i,a){
			dstore_back.delete_from(db,v,{aid:row["aid"]});
		});


	});

	wait.for(function(cb){ db.run("PRAGMA page_count", function(err, row){ cb(err); }); });

	var progchar=["0","1","2","3","4","5","6","7","8","9"];

	if(acts.length==0) // probably an org file, try and import budgets from full data
	{

		var org=refry.xml(data,slug); // raw xml convert to jml
		var aid=iati_xml.get_aid(org);


		console.log("importing budgets from org file for "+aid)

		dstore_back.delete_from(db,"budget",{aid:aid});


		var o=refry.tag(org,"iati-organisation");
		if(o)
		{
			console.log(o[0]+" -> "+o["default-currency"])
			iati_cook.activity(o); // cook the raw json(xml) ( most cleanup logic has been moved here )
		}

		refry.tags(org,"total-budget",function(it){dstore_db.refresh_budget(db,it,org,{aid:aid},0);});
		refry.tags(org,"recipient-org-budget",function(it){dstore_db.refresh_budget(db,it,org,{aid:aid},0);});
		refry.tags(org,"recipient-country-budget",function(it){dstore_db.refresh_budget(db,it,org,{aid:aid},0);});

		dstore_back.replace(db,"slug",{"aid":aid,"slug":slug});
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

			dstore_db.refresh_act(db,aid,json,head);

	// block and wait here

			wait.for(function(cb){
				db.run("PRAGMA page_count", function(err, row){
					cb(err);
				});
			});
		}
	}

	wait.for(function(cb){ db.run("COMMIT TRANSACTION",cb); });
	process.stdout.write("\n");

	db.each("SELECT COUNT(*) FROM act", function(err, row)
	{
		after=row["COUNT(*)"];
	});


	db.run("PRAGMA page_count", function(err, row){
		dstore_back.close(db);
		
		after_time=Date.now();
		
		process.stdout.write(after+" ( "+(after-before)+" ) "+(after_time-before_time)+"ms\n");
		
		if(main_cb){ main_cb(); }
	});

};

// call after major data changes to help sqlite optimise queries

dstore_sqlite.vacuum = function(){

	process.stdout.write("VACUUM start\n");
	var db = dstore_back.open();
	db.run("VACUUM", function(err, row){
		dstore_back.close(db);
		process.stdout.write("VACUUM done\n");
	});

}

dstore_sqlite.analyze = function(){


	process.stdout.write("ANALYZE start\n");
	var db = dstore_back.open();
	db.run("ANALYZE", function(err, row){
		dstore_back.close(db);
		process.stdout.write("ANALYSE done\n");
	});
}


dstore_sqlite.warn_dupes = function(db,aid){

// report if this id is from another file and being replaced, possibly from this file even
// I think we should complain a lot about this during import
		db.each("SELECT * FROM slug WHERE aid=?",aid, function(err, row)
		{
			console.log("\nDUPLICATE: "+row.slug+" : "+row.aid);
		});
		
};


// the database part of the query code
dstore_sqlite.query_select=function(q,res,r,req){

	var db = dstore_db.open(req && req.subdomains && req.subdomains[0]); // pick instance using subdomain
	db.serialize();
	
if(true)
{
	db.all( "EXPLAIN QUERY PLAN "+r.query,r.qvals,
		function(err,rows)
		{
			if(rows)
			{
				r.sqlite_explain_detail=[];
				rows.forEach(function(it){
					r.sqlite_explain_detail.push(it.detail);
				});
			}
		}
	);
}

	db.each(r.query,r.qvals, function(err, row)
	{
		if(err)
		{
			console.log(r.query+"\n"+err);
			r.error=err
		}
		else
		{
			r.rows.push(row);
			r.count++;
		}
	});

	db.run(";", function(err, row){

		query.do_select_response(q,res,r);
		
		dstore_back.close(db);
	});

}



// generic query
dstore_sqlite.query=function(q,v,cb){

	var db = dstore_db.open();
	db.serialize();
	
	db.all(q,v, function(err, rows)
	{
		dstore_back.close(db);
		if(err) { console.log(q+"\n"+err); }
		cb(err,rows)
	});

}


//////////////////////////////
// new import promises code //
//////////////////////////////

dstore_sqlite.transaction_begin = function(db){
	return new Promise(function (fulfill, reject){

		db.run("BEGIN TRANSACTION",function(err, ret){
			if(err) { reject(err) } else { fulfill(ret) }
		})
		
	});
}

dstore_sqlite.transaction_commit = function(db){
	return new Promise(function (fulfill, reject){

		db.run("COMMIT TRANSACTION",function(err, ret){
			if(err) { reject(err) } else { fulfill(ret) }
		})
		
	});
}


dstore_sqlite.file_lock = function(db,age){

// cleanup any broken locks that are too old, ideally this should do nothing
	dstore_sqlite.file_lock_clean(db,2*60*60) // 2 hours?

	return dstore_sqlite.file_lock_once(db,age).then(function(slug){
		return slug
	},function(){
		return dstore_sqlite.file_lock(db,age) // try again
	})
}

// clean out old locks
dstore_sqlite.file_lock_clean = function(db,age){
	return new Promise(function (fulfill, reject){

		var time=Math.floor(new Date() / 1000) // our current time

		db.run(

" UPDATE file SET file_lock=NULL WHERE file_lock IS NOT NULL AND file_check<=$file_check ; "

		,{$file_check:time-age}, function(err)
		{
			if(err) { throw(err) } else {
				fulfill()
			}
		})
		
	})
}

dstore_sqlite.file_lock_once = function(db,age){
	return new Promise(function (fulfill, reject){
		
		var time=Math.floor(new Date() / 1000) // our current time

		db.all(

" SELECT * FROM file WHERE file_lock IS NULL AND ( file_check<=$file_check OR file_check IS NULL ) ORDER BY file_check ASC LIMIT 1 ; "

		,{$file_check:time-age}, function(err, rows)
		{
			if(err) { throw(err) } else {
				if( ! rows[0] )
				{
					fulfill() // no file found needing an update, but it worked
				}
				else
				{
					var slug=rows[0].slug
					
					dstore_sqlite.file_lock_slug(db,slug).then(fulfill,reject)
				}
			}
		})

	})
}

dstore_sqlite.file_lock_slug = function(db,slug){
	return new Promise(function (fulfill, reject){
		
		var lockname=uniqid() // this is us
		var time=Math.floor(new Date() / 1000) // our current time

		db.all(

" UPDATE file SET file_lock=$file_lock , file_check=$file_check WHERE slug=$slug AND file_lock IS NULL ; "

		,{$file_lock:lockname,$file_check:time,$slug:slug}, function(err, rows)
		{
			if(err) { throw(err) } else {

				db.all(

" SELECT * FROM file WHERE slug=$slug AND file_lock=$file_lock AND file_check=$file_check ; "

				,{$file_lock:lockname,$file_check:time,$slug:slug}, function(err, rows)
				{
					if(err) { throw(err) } else {
						if( rows[0] && rows[0].slug==slug ) // sucess
						{
							fulfill(slug) // we claimed it
						}
						else // fail
						{
							reject() // race failure, try again
						}
					}
				})
			}
		})

	})
}


dstore_sqlite.file_get = function(db,slug){
	return new Promise(function (fulfill, reject){

		db.all(

" SELECT * FROM file WHERE slug IS $slug ; "

		,{$slug:slug}, function(err, rows)
		{
			if(err) { throw(err) } else {
				fulfill(rows[0])
			}
		})

	});
};

dstore_sqlite.file_url = function(db,slug,url){
	return new Promise(function (fulfill, reject){

		db.run(

	"INSERT OR IGNORE INTO file ( slug ) VALUES ( $slug );" // manifest first so update will always work

		,{$slug:slug}, function(err)
		{
			if(err) { throw(err) } else {
				db.run(

			"UPDATE file SET file_url=$file_url WHERE slug=$slug;"

				,{$slug:slug,$file_url:url}, function(err)
				{
					if(err) { throw(err) } else {
						fulfill(true)
					}
				})
			}
		})

	});
}


dstore_sqlite.xml_data = function(db,slug,aid,idx,data){
	return new Promise(function (fulfill, reject){

		var time=Math.floor(new Date() / 1000) // our current time

		db.run(

	"INSERT OR IGNORE INTO xml ( aid ) VALUES ( $aid );" // manifest first so update will always work

		,{$aid:aid}, function(err)
		{
			if(err) { throw(err) } else {
				db.run(

			"UPDATE xml SET slug=$slug , xml_idx=$xml_idx , xml_download=$xml_download , xml_data=$xml_data WHERE aid=$aid;"

				,{$slug:slug,$aid:aid,$xml_idx:idx,$xml_data:data,$xml_download:time}, function(err)
				{
					if(err) { throw(err) } else {
						fulfill(true)
					}
				})
			}
		})

	});
}

