// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_sqlite=exports;

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');

var wait=require('wait.for');

var util=require('util');
var http=require('http');
var nconf = require('nconf');
var sqlite3 = require('sqlite3').verbose();

// we also plan an indexdb alternative...

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


dstore_sqlite.open = function(){
	var db = new sqlite3.Database( nconf.get("database") );
	
// speed up data writes.
	db.serialize(function() {
		db.run('PRAGMA synchronous = 0 ;');
		db.run('PRAGMA encoding = "UTF-8" ;');
		db.run('PRAGMA journal_mode=WAL;');
	});
	
	return db;
};


dstore_sqlite.create_tables = function(){

	var db = dstore_sqlite.open();

	db.serialize(function() {
	
// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_sqlite.tables)
		{
			var tab=dstore_sqlite.tables[name];
			var s=dstore_sqlite.getsql_create_table(db,name,tab);

			console.log(s);

			db.run("DROP TABLE IF EXISTS "+name+";");
			db.run(s);

// add indexs

			for(var i=0; i<tab.length;i++)
			{
				var col=tab[i];
				
				if( col.INDEX )
				{
//					s=(" CREATE INDEX IF NOT EXISTS "+name+"_index_"+col.name+" ON "+name+" ( "+col.name+" ); ");
//					console.log(s);
//					db.run(s);
				}
			}
		}

		console.log("Created database "+nconf.get("database"));
		
	});
	
	db.close();
}


dstore_sqlite.replace_vars = function(db,name,it){
	var json={};

	for(var n in it) { if( n!="xml" && n!="jml" && n!="json" ) { // skip these special long strings
		json[n]=it[n]; } }
	
	var $t={}; for(var n in dstore_sqlite.tables_active[name]) { $t["$"+n]=it[n]; } // prepare to insert using named values
	
	$t.$json=JSON.stringify(json); // everything apart from xml/jml also lives in this json string

	for(var n in it) { if( n.slice(0,4)=="raw_") {
		$t["$"+n]=it[n]; }}

	return $t;
}

dstore_sqlite.replace = function(db,name,it){
	
	var $t=dstore_sqlite.replace_vars(db,name,it);
		
//	ls($t);

//db.run( dstore_sqlite.getsql_prepare_replace(name,dstore_sqlite.tables_active[name]) , $t );


	var sa = db.prepare(dstore_sqlite.tables_replace_sql[name]);
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

dstore_sqlite.getsql_create_table=function(db,name,tab)
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
		
		if(col.NOCASE)		 		{ s.push(" COLLATE NOCASE "); }
		
		if(i<tab.length-1)
		{
		s.push(" , ");
		}
	}

// multiple primary keys?
/*
	var primary_done=false;
	for(var i=0; i<tab.length;i++)
	{
		var col=tab[i];
		
		if(col.PRIMARY)
		{
			if(!primary_done)
			{
				primary_done=true;
				s.push(" , PRIMARY KEY ( ");
			}
			else
			{
				s.push(" , ");
			}
			
			s.push(" "+col.name+" ");
		}
	}
	if(primary_done)
	{
		s.push(" ) ");
	}
*/
	
	s.push(" ); ");

	return s.join("");
}

dstore_sqlite.check_tables = function(){

	var db = dstore_sqlite.open();

	db.serialize(function() {
	
		db.all("SELECT * FROM sqlite_master;", function(err, rows)
		{
			ls(rows);
		});

	});

	db.close();
}


// prepare some sql code
dstore_sqlite.cache_prepare = function(tables){
	
	dstore_sqlite.tables=tables;

	dstore_sqlite.tables_replace_sql={};
	dstore_sqlite.tables_update_sql={};
	dstore_sqlite.tables_active={};
	for(var name in dstore_sqlite.tables)
	{
		var t={};
		for(var i=0; i<dstore_sqlite.tables[name].length; i++ )
		{
			var v=dstore_sqlite.tables[name][i];
			
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
		dstore_sqlite.tables_active[name]=t;
		dstore_sqlite.tables_replace_sql[name]=dstore_sqlite.getsql_prepare_replace(name,t);
		dstore_sqlite.tables_update_sql[name] =dstore_sqlite.getsql_prepare_update(name,t);
	}
}

// call with your tables like so
//dstore_sqlite.cache_prepare(tables);
// to setup

