#!/usr/bin/env node
// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// we expect dstore to be the current directory when this cmd is run
// as we will be creating db/cache directories there

const cmd={}
export default cmd

import * as fs from "fs"
import * as util from "util"
import * as path from "path"

import express      from "express"
import minimist     from "minimist"
import dstore_argv  from "./argv.js"
import dstore_db    from "./dstore_db.js"
import dstore_cache from "./dstore_cache.js"
import iati_codes   from "./iati_codes.js"
import dstore_stats from "./dstore_stats.js"


var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
let argv=minimist(process.argv.slice(2))
global.argv=argv
dstore_argv.parse(argv)


	// make sure we have a db dir
	fs.mkdir("db",function(e){});

	//ls(argv)
	if( argv._[0]=="init" )
	{
		await dstore_db.create_tables();
		process.exit();
	}
	else
	if( argv._[0]=="analyze" )
	{
		await dstore_db.analyze();
		process.exit();
	}
	else
	if( argv._[0]=="vacuum" )
	{
		await dstore_db.vacuum();
		process.exit();
	}
	else
	if( argv._[0]=="index" )
	{
		await dstore_db.create_indexes(argv._[1]); // add indexes to previously inserted data
		process.exit();
	}
	else
	if( argv._[0]=="unindex" )
	{
		await dstore_db.delete_indexes(); // remoce indexes from previously inserted data
		process.exit();
	}
	else
	if( argv._[0]=="check" )
	{
		await dstore_db.create_tables({do_not_drop:true});
		process.exit();
	}
	else
	if( argv._[0]=="dump" )
	{
		await dstore_db.dump_tables();
		process.exit();
	}
	else
	if( argv._[0]=="fake" )
	{
		await dstore_db.fake_trans(); // create fake transactions
		process.exit();
	}
	else
	if( argv._[0]=="augment" )
	{
		await dstore_db.augment_related(); // create related
		process.exit();
	}
	else
	if( argv._[0]=="cache" )
	{
		await dstore_cache.cmd(argv);
		process.exit();
	}
	else
	if( argv._[0]=="exs" )
	{
// we now use freechange for exchange so this has been removed
		process.exit();
	}
	else
	if( argv._[0]=="fetch" )
	{
		console.log("fetching")
		await iati_codes.fetch();
		process.exit();
	}
	else
	if( argv._[0]=="import" )
	{
		await dstore_cache.import_xmlfile( argv._[1] );
		process.exit();
	}
	else
	if( argv._[0]=="stats" )
	{
		await dstore_stats.cmd(argv);
		process.exit();
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
		">	dstore augment \n"+
		"Cleanup and create related links that are not explicitly listed in a project.\n"+
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
