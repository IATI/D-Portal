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

	argv.dir    =           argv.dir    || process.env.DFLAT_DIR   || "data"
	argv.limit  = parseInt( argv.limit  || process.env.DFLAT_LIMIT || "999999"     )

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
		await require("./packages.js").prepare_download(argv)
		return
	}

	// help text
	console.log(
		"\n"+
		">	dflat fetch \n"+
		"Fetch remote files and update cached data\n"+
		"\n"+
		">	dflat xml2json filename[.xml] \n"+
		"Convert activities from filename.xml into filename.json/*\n"+
		"\n"+
		"	--output filename.xml.json \n"+
		"	Explicit output path/filename.\n"+
		"\n"+
		">	dflat xml2csv filename[.xml] \n"+
		"Convert activities from filename.xml into filename.csv/*\n"+
		"\n"+
		"	--output filename.csv \n"+
		"	Explicit output path/filename.\n"+
		"\n"+
		">	dflat json2xml filename[.xml.json] \n"+
		"Convert activities from filename.json into filename.xml/*\n"+
		"\n"+
		"	--output filename.xml \n"+
		"	Explicit output path/filename.\n"+
		"\n"+
		">	dflat frankenstein \n"+
		"Build a full example activity from parts of other activities\n"+
		"\n"+
		">	dflat stats \n"+
		"Build or update json based stats\n"+
		"\n"+
		">	dflat packages \n"+
		"Prepare a data directory to fetch IATI packages into.\n"+
		"\n"+
		"	--dir data \n"+
		"	Directory to download into.\n"+
		"\n"+
		"	--limit 999999 \n"+
		"	Maximum number of packages to download.\n"+
		"\n"+
		"	--source registry\n"+
		"	The source for the packages, registry or datastore.\n"+
		"\n"+
		"\n"+
	"");
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv
	global.argv=argv
	cmd.parse(argv)
	cmd.run(argv)
}
