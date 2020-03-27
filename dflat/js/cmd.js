#!/usr/bin/env node
// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var pfs=require("pify")( require("fs") )

var dflat=require("./dflat.js")
var jml=require("./jml.js")
var xson=require("./xson.js")

var stringify = require('json-stable-stringify');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.parse=function(argv)
{
	argv.filename_dflat=__filename

	argv.cronos =           argv.cronos || process.env.DFLAT_CRONOS || "cronos"

	argv.dir    =           argv.dir    || process.env.DFLAT_DIR    || "dataflat"
	argv.limit  = parseInt( argv.limit  || process.env.DFLAT_LIMIT  || "999999"     )

// we need this to connect to the postgres server and read stats
	argv.pgro   = argv.pgro             || process.env.DSTORE_PGRO  || undefined                    ; // read only PG

}

cmd.parse_filename=async function(argv,opts)
{
	argv.filename = argv.filename || argv._[1]
	
	if( ! argv.filename ) { return }
	
	if( argv.filename.endsWith(opts.input) )
	{
		argv.filename=argv.filename.substring(0,argv.filename.length - opts.input.length)
	}
	
	if( ! argv.input )
	{
		argv.input=argv.filename + opts.input
	}

	if( ! argv.output )
	{
		argv.output=argv.filename + opts.output
	}

	
	console.log( argv.filename )
	console.log( argv.input )
	console.log( argv.output )

}

cmd.run=async function(argv)
{
	if( argv._[0]=="fetch" )
	{
		await require("./fetch.js").all()
		return
	}

	if( argv._[0]=="xml2json" )
	{
		await cmd.parse_filename(argv,{input:".xml",output:".json"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			dflat.clean(json)
			await pfs.writeFile(argv.output,stringify(json,{space:" "}));

			return
		}
	}
	
	if( argv._[0]=="json2xml" )
	{
		await cmd.parse_filename(argv,{input:".json",output:".xml"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=JSON.parse(dat)
			var xml=jml.to_xml( xson.to_jml(json) )
			await pfs.writeFile(argv.output,xml);

			return
		}
	}

	if( argv._[0]=="xml2csv")
	{
		await cmd.parse_filename(argv,{input:".xml",output:".csv"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			var csv=dflat.xson_to_xsv(json,"/iati-activities/iati-activity",{"/iati-activities/iati-activity":true})

			await pfs.writeFile(argv.output,csv);

			return
		}
	}
	
	if( argv._[0]=="frankenstein" )
	{
		await require("./frankenstein.js").all()
		return
	}

	if( argv._[0]=="stats" )
	{
		await require("./stats.js").cmd(argv)
		return
	}

	if( argv._[0]=="packages" )
	{
		if( argv._[1] )
		{
			await require("./packages.js").process_download(argv)
		}
		else
		{
			await require("./packages.js").prepare_download(argv)
		}
		return
	}

	if( argv._[0]=="cronos" )
	{
		if( argv._[1] == "update" )
		{
			await require("./cronos.js").update(argv)
		}
		else
		{
			await require("./cronos.js").help(argv)
		}
		return
	}

	// help text
	console.log(
`
>	dflat fetch 

Fetch remote files and update cached data

>	dflat xml2json filename[.xml] 

Convert activities from filename.xml into filename.json

	--output filename.xml.json 
	Explicit output path/filename.

>	dflat xml2csv filename[.xml] 

Convert activities from filename.xml into filename.csv

	--output filename.csv 
	Explicit output path/filename.

>	dflat json2xml filename[.json] 

Convert activities from filename.json into filename.xml

	--output filename.xml 
	Explicit output path/filename.

>	dflat frankenstein 

Build a full example activity from parts of other activities

>	dflat stats 

Build or update json based stats

>	dflat packages 

Prepare a data directory to fetch IATI packages into.

	--dir dataflat
	Directory to download into.

	--limit 999999 
	Maximum number of packages to download.

	--source registry
	The source for the packages, registry or datastore.

>	dflat packages filename

Process a downloaded package into multiple files. The file to process 
should be found in downloads/filename.xml we will then process it 
and write it into other locations such as packages/ or 
activities/ in the data directory.

	--dir dataflat
	Directory to process data in.

>	dflat cronos update cronosdir

	--cronos cronos
	Directory to process cronos data in, expects to find a cronos.json 
	file within this folder.

Update a git repository as a chronological series of data files using 
git commits insode branches as chronological history.

`)
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv
	global.argv=argv
	cmd.parse(argv)
	cmd.run(argv)
}
