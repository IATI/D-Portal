// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

module.exports=exports;

var dstore_pg=exports;
var dstore_back=exports;

var wait=require("wait.for");

var dstore_db=require('./dstore_db');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var monitor = require("pg-monitor");
var pgopts={
};
monitor.attach(pgopts);
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
				 db.none("DROP TABLE IF EXISTS "+name+";").catch(err).then(cb);
			});

			wait.for(function(cb){
				db.none(s).catch(err).then(cb);
			});

// indexs

//			for(var i=0; i<tab.length;i++)
//			{
//				var col=tab[i];			
//				if( col.INDEX )
//				{
//					s=(" CREATE INDEX IF NOT EXISTS "+name+"_index_"+col.name+" ON "+name+" ( "+col.name+" ); ");
//					console.log(s);
//					db.run(s);
//				}
//			}
		}



	pgp.end();	
};

dstore_pg.check_tables = function(){};


dstore_pg.create_indexes = function(){};

dstore_pg.delete_indexes = function(){};


dstore_pg.replace_vars = function(db,name,it){};

dstore_pg.replace = function(db,name,it){};


dstore_pg.getsql_prepare_replace = function(name,row){};

dstore_pg.getsql_prepare_update = function(name,row){};

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



dstore_pg.cache_prepare = function(tables){
	
	dstore_pg.tables=tables;

};

dstore_pg.delete_from = function(db,tablename,opts){


};
