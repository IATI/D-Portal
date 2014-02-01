//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var dstore_sqlite=exports;
if(typeof dstore_sqlite  === "undefined") { dstore_sqlite ={}; }
required["dstore_sqlite"]=dstore_sqlite;

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
		}

		console.log("Created database "+nconf.get("database"));
		
	});
	
	db.close();
}


dstore_sqlite.getsql_prepare_insert = function(name,row){

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
		
		if(col.INTEGER)		{ s.push(" INTEGER "); }
		else
		if(col.REAL) 		{ s.push(" REAL "); }
		else
		if(col.TEXT) 		{ s.push(" TEXT "); }
		else
		if(col.BLOB) 		{ s.push(" BLOB "); }

		if(col.PRIMARY) 	{ s.push(" PRIMARY KEY "); }
		else
		if(col.UNIQUE) 		{ s.push(" UNIQUE "); }
		
		if(i<tab.length-1)
		{
		s.push(" , ");
		}
	}
	
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

	dstore_sqlite.tables_insert_sql={};
	dstore_sqlite.tables_update_sql={};
	dstore_sqlite.tables_active={};
	for(var name in dstore_sqlite.tables)
	{
		var t={};
		for(var i=0; i<dstore_sqlite.tables[name].length; i++ )
		{
			var v=dstore_sqlite.tables[name][i];
			t[v.name]=true;
		}
		dstore_sqlite.tables_active[name]=t;
		dstore_sqlite.tables_insert_sql[name]=dstore_sqlite.getsql_prepare_insert(name,t);
		dstore_sqlite.tables_update_sql[name]=dstore_sqlite.getsql_prepare_update(name,t);
	}
}

// call with your tables like so
//dstore_sqlite.cache_prepare(tables);
// to setup

