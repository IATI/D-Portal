// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_pg=exports;

var wait=require("wait.for");

var pgp = require("pg-promise")({});

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


dstore_pg.open = function(){};

dstore_pg.close = function(db){};

dstore_pg.pragmas = function(db){};


dstore_pg.create_tables = function(db){};

dstore_pg.check_tables = function(){};


dstore_pg.create_indexes = function(){};

dstore_pg.delete_indexes = function(){};


dstore_pg.replace_vars = function(db,name,it){};

dstore_pg.replace = function(db,name,it){};


dstore_pg.getsql_prepare_replace = function(name,row){};

dstore_pg.getsql_prepare_update = function(name,row){};

dstore_pg.getsql_create_table=function(db,name,tab){};


dstore_pg.cache_prepare = function(tables){
	
	dstore_pg.tables=tables;

};

dstore_pg.delete_from = function(db,tablename,opts){


};
