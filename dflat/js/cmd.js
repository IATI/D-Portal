// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var pfs=require("pify")( require("fs") )

var dflat=require("./dflat.js")

var stringify = require('json-stable-stringify');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.run=async function(argv)
{
	if( argv._[0]=="xml2json" )
	{
		var filename=argv.filename || argv._[1] ;
		if(filename)
		{
			var dat=await pfs.readFile(filename+".xml",{ encoding: 'utf8' });
			var json=dflat.xml_to_json(dat)
			await pfs.writeFile(filename+".json",stringify(json,{space:" ",cmp:(a,b)=>{
				if(a.key=="0" || b.key=="1") { return -1 }
				if(b.key=="0" || a.key=="1") { return  1 }
				return a.key > b.key ? 1 : -1;
				
			}}));

			return
		}
	}
	// help text
	console.log(
		"\n"+
		">	dflat xml2json filename[.xml] \n"+
		"Convert activities from filename.xml into filename.json/*\n"+
		"\n"+
		">	dflat json2xml filename[.json] \n"+
		"Convert activities from filename.json into filename.xml\n"+
		"\n"+
		"\n"+
	"");
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv
	global.argv=argv
	cmd.run(argv)
}
