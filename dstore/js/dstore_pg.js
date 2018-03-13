// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

module.exports=exports;

var dstore_pg=exports;
var dstore_back=exports;

exports.engine="pg";

var wait=require("wait.for");

var dstore_db=require('./dstore_db');
// how to use query replcaments
dstore_db.text_plate=function(s){ return "${"+s+"}"; }
dstore_db.text_name=function(s){ return s; }

var util=require("util");
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var iati_cook=require('./iati_cook');

var codes=require('../json/iati_codes');
var	query=require("./query");

var err=function (error) {
	console.log("ERROR:", error.message || error); // print the error;
	console.log((error.stack));
	process.exit(1);
}


var monitor = require("pg-monitor");
var pgopts={
};
if(process.env.DSTORE_DEBUG){ monitor.attach(pgopts); }
var pgp = require("pg-promise")(pgopts);


// use global db object

var master_db;

// we have a global db so just return it
dstore_pg.open = function(instance){
	if(!master_db)
	{
		master_db = pgp(global.argv.pg);
	}
	return master_db;
};

// nothing to close?
dstore_pg.close = function(db){
};

// no pragmas to force
dstore_pg.pragmas = function(db){
};

// create tables
dstore_pg.create_tables = function(opts){
	if(!opts){opts={};}

	var db=dstore_pg.open();
	
console.log("CREATING TABLES");

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];


			if(!opts.do_not_drop)
			{
				console.log("DROPPING "+name);
				wait.for(function(cb){
					 db.none("DROP TABLE IF EXISTS "+name+";").then(cb).catch(err);
				});
			}

			var s=dstore_back.getsql_create_table(db,name,tab);
			console.log(s);
			wait.for(function(cb){
				db.none(s).catch(err).then(cb);
			});

// check we have all the columns in the table

			var cs=dstore_back.getsql_create_table_columns(db,name,tab);
			for(var i=0; i<cs.length; i++)
			{
				var s="ALTER TABLE "+name+" ADD COLUMN "+cs[i]+" ;";
				wait.for(function(cb){
					db.none(s).catch(function(error){
						s=undefined;
					}).then(function(error){
						if(s)
						{
							console.log(s);
						}
						return cb(false);
					});
				});
			}

		}

	pgp.end();
	

//	dstore_pg.create_indexes();
	
};

dstore_pg.dump_tables = function(){

	var db=dstore_pg.open();

	console.log("OK?")
	var s=(" SELECT * FROM INFORMATION_SCHEMA.COLUMNS ; ");
	console.log(s);
	var rows=wait.for(function(cb){
		db.any(s,{}).then(function(rows){
			cb(false,rows)
		}).catch(err);
	});
	console.log("OK?")
	ls(rows);
	console.log("OK?")

	pgp.end();
};


dstore_pg.create_indexes = function(idxs){
	var db=dstore_pg.open();
	
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
						wait.for(function(cb){
							db.none(s).then(cb).catch(err);
						});

					}
					if( col.HASH )
					{
						var s=(" CREATE INDEX IF NOT EXISTS "+name+"_hash_"+col.name+" ON "+name+" USING hash ( "+col.name+" ); ");
						console.log(s);
						wait.for(function(cb){
							db.none(s).then(cb).catch(err);
						});

					}
				}
			}
		}

// we also create a text search index
	if(!idxs || idxs=="search")
	{
		var s=(" CREATE INDEX IF NOT EXISTS act_index_text_search ON act USING gin(to_tsvector('simple',title || ' ' || description)); ");
		console.log(s);
		wait.for(function(cb){
			db.none(s).then(cb).catch(err);
		});
	}

	pgp.end();	
};

dstore_pg.delete_indexes = function(){
	var db=dstore_pg.open();
	
console.log("DROPING INDEXS");

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];

			for(var i=0; i<tab.length;i++)
			{
				var col=tab[i];			
				wait.for(function(cb){
					 db.none("DROP INDEX IF EXISTS "+name+"_index_"+col.name+";").catch(err).then(cb);
				});
				wait.for(function(cb){
					 db.none("DROP INDEX IF EXISTS "+name+"_btree_"+col.name+";").catch(err).then(cb);
				});
				wait.for(function(cb){
					 db.none("DROP INDEX IF EXISTS "+name+"_hash_"+col.name+";").catch(err).then(cb);
				});
			}
		}

// special search index

	wait.for(function(cb){
		 db.none("DROP INDEX IF EXISTS act_index_text_search;").catch(err).then(cb);
	});

	pgp.end();	
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
	dstore_db.tables_active={};
	dstore_db.tables_primary={};
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
			
			if(v.PRIMARY)
			{
				dstore_db.tables_primary[name]=v.name;
			}
			
			t[v.name]=ty;
		}
		dstore_db.tables_active[name]=t;
		dstore_db.tables_replace_sql[name]=dstore_pg.getsql_prepare_replace(name,t);
		dstore_db.tables_update_sql[name] =dstore_pg.getsql_prepare_update(name,t);
	}
	
//	ls(dstore_db.tables_primary);
//	ls(dstore_db.tables);
//	ls(dstore_db.tables_active);
//	ls(dstore_db.tables_replace_sql);
//	ls(dstore_db.tables_update_sql);
	
};

dstore_pg.delete_from = function(db,tablename,opts){

	wait.for(function(cb){
		if( opts.trans_flags ) // hack opts as there are currently only two uses
		{
			db.none(" DELETE FROM "+tablename+" WHERE trans_flags=${trans_flags} ",opts).then(cb).catch(err);
		}
		else
		{
			db.none(" DELETE FROM "+tablename+" WHERE aid=${aid} ",opts).then(cb).catch(err);
		}
	});

};


dstore_pg.replace = function(db,name,it){

	wait.for(function(cb){
		db.none(dstore_db.tables_replace_sql[name],it).then(cb).catch(err);
	});
	
};

// get a row by aid
dstore_pg.select_by_aid = function(db,name,aid){
	
	var rows=wait.for(function(cb){
		db.any("SELECT * FROM "+name+" WHERE aid=${aid};",{aid:aid}).then(function(rows){
			cb(false,rows)
		}).catch(err);
	});

	return rows[0]
};


dstore_pg.fill_acts = function(acts,slug,data,head,main_cb){

	var before_time=Date.now();
	var after_time=Date.now();
	var before=0;
	var after=0;

	var db=dstore_pg.open();

	wait.for(function(cb){
		db.one("SELECT COUNT(*) FROM act;").then(function(row){	
			before=row.count;
			cb();
		}).catch(err);
	});

	wait.for(function(cb){
		db.none("BEGIN;").then(cb).catch(err);
	});

	
	var rows=wait.for(function(cb){
		db.any("SELECT aid FROM slug WHERE slug=${slug};",{slug:slug}).then(function(rows){
			cb(false,rows)
		}).catch(err);
	});


	for(var idx=0;idx<rows.length;idx++)
	{
		var row=rows[idx];
		(["act","jml","trans","budget","country","sector","location","slug"]).forEach(function(v,i,a){
			dstore_pg.delete_from(db,v,{aid:row["aid"]});
		});
	}

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
		}
	}


	process.stdout.write("\n");

	wait.for(function(cb){
		db.none("COMMIT;").then(cb).catch(err);
	});

	wait.for(function(cb){
		db.one("SELECT COUNT(*) FROM act;").then(function(row){	
			after=row.count;
			cb();
		}).catch(err);
	});

	after_time=Date.now();
	
	process.stdout.write(after+" ( "+(after-before)+" ) "+(after_time-before_time)+"ms\n");
	
	pgp.end();	

	if(main_cb){ main_cb(); }
};



dstore_pg.warn_dupes = function(db,aid){

	var ret=false
	
// report if this id is from another file and being replaced, possibly from this file even
// I think we should complain a lot about this during import
	var rows=wait.for(function(cb){
		db.any("SELECT * FROM slug WHERE aid=${aid};",{aid:aid}).then(function(rows){
			cb(false,rows)
		}).catch(err);
	});

	for(var i in rows)
	{
		var row=rows[i]
		console.log("\nDUPLICATE: "+row.slug+" : "+row.aid);
		ret=true
	}

	return ret
};

// the database part of the query code
dstore_pg.query_select=function(q,res,r,req){


// return error do not crash
var err=function (error) {
	r.error=error.message || error 
	query.do_select_response(q,res,r);
}


	var db = dstore_pg.open();
	
	db.any("EXPLAIN ( ANALYZE FALSE , VERBOSE TRUE , FORMAT JSON ) "+r.query,r.qvals).then(function(rows){
//		r.explain=[]; for( var i in rows ) { r.explain[i]=rows[i]["QUERY PLAN"]; }
		r.explain=rows[0]["QUERY PLAN"][0];
		
		db.any(r.query,r.qvals).then(function(rows){

			r.rows=rows;
			r.count=rows.length;

			query.do_select_response(q,res,r);

		}).catch(err);

	}).catch(err);
	

}


dstore_pg.analyze = function(){

	var start_time=Date.now();
	process.stdout.write("ANALYZE start\n");
	var db = dstore_pg.open();
	db.any("ANALYZE;").then(function(rows){
		var time=(Date.now()-start_time)/1000;
		process.stdout.write("ANALYSE done "+time+"\n");
		pgp.end();	
	}).catch(err);
	
}


dstore_pg.vacuum = function(){

	var start_time=Date.now();
	process.stdout.write("VACUUM start\n");
	var db = dstore_pg.open();
	db.any("VACUUM;").then(function(rows){
		var time=(Date.now()-start_time)/1000;

		process.stdout.write("VACUUM done "+time+"\n");
		pgp.end();	
	}).catch(err);
	
}

dstore_pg.fake_trans = function(){

	var db = dstore_pg.open();
	
	var ids={};

	var fake_ids=[];
	
	process.stdout.write("Removing all fake transactions\n");

	dstore_back.delete_from(db,"trans",{trans_flags:1});

	db.any("SELECT reporting_ref , trans_code ,  COUNT(*) AS count FROM act  JOIN trans USING (aid)  GROUP BY reporting_ref , trans_code").then(function(rows)
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
		var ps=[];
		for(i=0;i<fake_ids.length;i++) // add new fake
		{
			var v=fake_ids[i];
			var p=db.any("SELECT * FROM act  JOIN trans USING (aid)  WHERE reporting_ref=${reporting_ref} AND trans_code=${trans_code} ",{reporting_ref:v,trans_code:"C"}).then(function(rows)
			{
				for(j=0;j<rows.length;j++)
				{
					var t=rows[j];
//					process.stdout.write(t.aid+"\n");
					t.trans_code="D";
					t.trans_flags=1;
					var p=db.none(dstore_db.tables_replace_sql["trans"],t).catch(err);
					ps.push(p);
				}
//					ls(rows);
			}).catch(err);
			ps.push(p);
		}
		
		Promise.all(ps).then(function()
		{
//			process.stdout.write("Finished\n");
			pgp.end();
		}).catch(err);

	}).catch(err);

};


// generic query
dstore_pg.query=function(q,v,cb){

	var db = dstore_pg.open();
			
	db.any(q,v).then(function(rows){
		cb(null,rows)
	}).catch(err);

}
