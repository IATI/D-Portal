// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_update=exports;

var fs = require('fs');
var util=require("util");
var path=require('path');
var http=require("http");
var request = require('request');
var dstore_db = require("./dstore_db")

var packages = require('../json/packages.json');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

dstore_update.cmd = function(argv){

	if( argv._[1]=="test" )
	{
		dstore_update.test(argv);
	}
	else // help
	if( argv._[1]=="urls" )
	{
		dstore_update.urls(argv);
	}
	else // help
	{
		console.log("dstore update test            -- test")
		console.log("dstore update urls            -- refresh the xml file download urls")
	}

}

dstore_update.test = function(argv){

	var db = dstore_db.open()
		
	dstore_db.file_lock(db,60).then(function(slug){
		if(slug)
		{
			console.log("LOCKED "+slug)
			dstore_db.close(db)
			dstore_update.slug(slug)
		}
		else
		{
			console.log("NOTHING TO LOCK")
			dstore_db.close(db)
		}
	})

}

dstore_update.urls = function(argv){
	
	var db = dstore_db.open()
	
	var chain=dstore_db.transaction_begin(db) // our promise chain

	var dofile=function(slug,url){

		chain=chain.then(function(){
			
			return dstore_db.file_url(db,slug,url).then(function(){
				console.log(slug+" -> "+url)
			})

		})
	}

	var count=0
	for( var slug in packages)
	{
		var package=packages[slug]
		
		var url=package.resources && package.resources[0] && package.resources[0].url
		if(url)
		{
			count++
			if(count>10) { break } // for testing a smaller dataset
			dofile(slug,url)
		}
	}
	

	chain=chain.then(function(){
		return dstore_db.transaction_commit(db)
	})

	chain=chain.then(function(){
		dstore_db.close(db)
	})

}


// call this after locking a slug to perform a file download and check
dstore_update.slug = function(slug){

	var db = dstore_db.open()

console.log("UPDATE "+slug)

	dstore_db.close(db)

}
