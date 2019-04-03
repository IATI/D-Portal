// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var pfs=require("pify")( require("fs") )

var dflat=require("./dflat.js")
var jml=require("./jml.js")

var stringify = require('json-stable-stringify');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.run=async function(argv)
{
	if( argv._[0]=="fetch" )
	{
		await require("./fetch.js").all()
		return
	}

	if( argv._[0]=="xml2json" )
	{
		var filename=argv.filename || argv._[1] ;
		if(filename)
		{
			var dat=await pfs.readFile(filename+".xml",{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			await pfs.writeFile(filename+".json",stringify(json,{space:" "}));

			return
		}
	}
	
	if( argv._[0]=="xml2csv")
	{
		var filename=argv.filename || argv._[1] ;
		if(filename)
		{
			var dat=await pfs.readFile(filename+".xml",{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			var csv=dflat.xson_to_xsv(json,"/iati-activities/iati-activity",{"/iati-activities/iati-activity":true})

			await pfs.writeFile(filename+".csv",csv);

			return
		}
	}
	
	if( argv._[0]=="frankenstein" )
	{
		await require("./frankenstein.js").all()
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
		">	dflat xml2csv filename[.xml] \n"+
		"Convert activities from filename.xml into filename.csv/*\n"+
		"\n"+
		">	dflat frankenstein \n"+
		"Build a full example activity from parts of other activities\n"+
		"\n"+
		"\n"+
	"");
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv
	global.argv=argv
	require("../../dstore/js/argv").parse(argv);
	cmd.run(argv)
}
