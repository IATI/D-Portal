// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

module.exports=exports;

var dstore_pg=exports;
var dstore_back=exports;

var wait=require("wait.for");

var dstore_db=require('./dstore_db');

var util=require("util");
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var iati_cook=require('./iati_cook');

var codes=require('../json/iati_codes');



var monitor = require("pg-monitor");
var pgopts={
};
//monitor.attach(pgopts);
var pgp = require("pg-promise")(pgopts);


// use global db object

var master_db;

// we have a global db so just return it
dstore_pg.open = function(){
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
dstore_pg.create_tables = function(){

	var db=dstore_pg.open();

	var err=function (error) {
        console.log("ERROR:", error.message || error); // print the error;
        process.exit(1);
    }
	
console.log("CREATING TABLES");

// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];
			var s=dstore_back.getsql_create_table(db,name,tab);

			console.log(s);

			wait.for(function(cb){
				 db.none("DROP TABLE IF EXISTS "+name+";").then(cb).catch(err);
			});

			wait.for(function(cb){
				db.none(s).catch(err).then(cb);
			});

// indexs

			for(var i=0; i<tab.length;i++)
			{
				var col=tab[i];			
				if( col.INDEX )
				{
					var s=(" CREATE INDEX "+name+"_index_"+col.name+" ON "+name+" ( "+col.name+" ); ");
					console.log(s);

					wait.for(function(cb){
						 db.none("DROP INDEX IF EXISTS "+name+"_index_"+col.name+";").catch(err).then(cb);
					});

					wait.for(function(cb){
						db.none(s).then(cb).catch(err);
					});

				}
			}
		}



	pgp.end();	
};

dstore_pg.check_tables = function(){};


dstore_pg.create_indexes = function(){};

dstore_pg.delete_indexes = function(){};



dstore_pg.getsql_create_table=function(db,name,tab)
{
	var s=[];
	
	s.push("CREATE TABLE "+name+" ( ");
	
	for(var i=0; i<tab.length;i++)
	{
		var col=tab[i];

		s.push(" "+col.name+" ");
		
		if(col.INTEGER)				{ s.push(" INTEGER "); }
		else
		if(col.REAL) 				{ s.push(" REAL "); }
		else
		if(col.BLOB) 				{ s.push(" BLOB "); }
		else
		if(col.TEXT || col.NOCASE)	{ s.push(" TEXT "); }

		if(col.PRIMARY) 			{ s.push(" PRIMARY KEY "); }
		else
		if(col.UNIQUE) 				{ s.push(" UNIQUE "); }
		
//		if(col.NOCASE)		 		{ s.push(" COLLATE NOCASE "); }
		
		if(i<tab.length-1)
		{
		s.push(" , ");
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
	if(false)//(pkey)
	{
		s.push("ON CONFLICT DO UPDATE SET ");
		var need_comma=false;
		for(var n in row)
		{
			if(need_comma) { s.push(" , "); }
			s.push(" "+n+"=${"+n+"} ");
			need_comma=true
		}
		s.push(" WHERE "+pkey+"=$("+pkey+") ")
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

	var err=function (error) {
        console.log("ERROR:", error.message || error); // print the error;
        process.exit(1);
    }

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
	
	var err=function (error) {
        console.log("ERROR:", error.message || error); // print the error;
        process.exit(1);
    }

	wait.for(function(cb){
		db.none(dstore_db.tables_replace_sql[name],it).then(cb).catch(err);
	});
	
};


dstore_pg.fill_acts = function(acts,slug,data,head,main_cb){

	var before_time=Date.now();
	var after_time=Date.now();
	var before=0;
	var after=0;

	var db=dstore_pg.open();

	var err=function (error) {
        console.log("ERROR:", error.message || error); // print the error;
        process.exit(1);
    }
	
	wait.for(function(cb){
		db.one("SELECT COUNT(*) FROM act;").then(function(row){	
			before=row.count;
			cb();
		}).catch(err);
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

/*	if(acts.length==0) // probably an org file, try and import budgets from full data
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
*/

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
