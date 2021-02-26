#!/usr/bin/env node
// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// we expect dstore to be the current directory when this cmd is run
// as we will be creating db/cache directories there

//var wait=require('wait.for-es6');
var fs = require('fs');
var express = require('express');
var util=require('util');
var path=require('path');
var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
var argv=require('yargs').argv; global.argv=argv;
require("./argv").parse(argv);

// run everything inside a new async
(async function(){

	// make sure we have a db dir
	fs.mkdir("db",function(e){});

	//ls(argv)
	if( argv._[0]=="init" )
	{
		await require("./dstore_db").create_tables();
//		require("./dstore_db").create_indexes();
		return;
	}
	else
	if( argv._[0]=="analyze" )
	{
		await require("./dstore_db").analyze();
		return;
	}
	else
	if( argv._[0]=="vacuum" )
	{
		await require("./dstore_db").vacuum();
		return;
	}
	else
	if( argv._[0]=="index" )
	{
		await require("./dstore_db").create_indexes(argv._[1]); // add indexes to previously inserted data
		return;
	}
	else
	if( argv._[0]=="unindex" )
	{
		await require("./dstore_db").delete_indexes(); // remoce indexes from previously inserted data
		return;
	}
	else
	if( argv._[0]=="check" )
	{
		await require("./dstore_db").create_tables({do_not_drop:true});
		return;
	}
	else
	if( argv._[0]=="dump" )
	{
		await require("./dstore_db").dump_tables();
		return;
	}
	else
	if( argv._[0]=="fake" )
	{
		await require("./dstore_db").fake_trans(); // create fake transactions
		return;
	}
	else
	if( argv._[0]=="cache" )
	{
		await require("./dstore_cache").cmd(argv);
		return;
	}
	else
	if( argv._[0]=="exs" )
	{
// we now use freechange for exchange so this has been removed
//		require("./exs").create_csv();
		return;
	}
	else
	if( argv._[0]=="fetch" )
	{
		await require("./iati_codes").fetch();
		return;
	}
	else
	if( argv._[0]=="import" )
	{
		await require("./dstore_cache").import_xmlfile( argv._[1] );
		return;		
	}
	else
	if( argv._[0]=="stats" )
	{
		await require("./dstore_stats").cmd(argv);
		return;		
	}

	// help text
	console.log(
		"\n"+
		">	dstore init \n"+
		"Reset or create database (remove all data).\n"+
		"\n"+
		">	dstore analyze \n"+
		"Tell database to analyze itself.\n"+
		"\n"+
		">	dstore vacuum \n"+
		"Tell database to vacuum itself.\n"+
		"\n"+
		">	dstore index \n"+
		"Create any missing indexs.\n"+
		"\n"+
		">	dstore unindex \n"+
		"Remove all indexs.\n"+
		"\n"+
		">	dstore check \n"+
		"Make sure all expected rows and tables are present (live update of structure).\n"+
		"\n"+
		">	dstore fake \n"+
		"Create fake transactions for publishers who do not report any D+E transaction types.\n"+
		"\n"+
		">	dstore cache \n"+
		"Print cache related commands, run this for more help.\n"+
		"\n"+
		">	dstore fetch \n"+
		"Fetch and update code lists.\n"+
		"\n"+
		">	dstore import data.xml \n"+
		"Import data from an iati xml file.\n"+
		"\n"+
		">	dstore stats \n"+
		"Dump database stats.\n"+
		"\n"+
		"\n"+
	"");

})().finally(function(){process.exit()})
