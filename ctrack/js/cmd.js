// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var fs = require('fs');
var express = require('express');
var util=require('util');
var path=require('path');
var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.run=function(argv)
{
	if( argv._[0]=="import" && argv._[1]=="tongue" )
	{
		var filename=argv._[2] || argv.filename;
		if(filename)
		{
			return require("./tongue.js").import(filename);
		}
	}
	else
	if( argv._[0]=="export" && argv._[1]=="tongue" )
	{
		var filename=argv._[2] || argv.filename;
		if(filename)
		{
			return require("./tongue.js").export(filename);
		}
	}
	else
	if( argv._[0]=="tint" )
	{
		var name=argv._[1];
		var r=argv._[2];
		var g=argv._[3];
		var b=argv._[4];
		
		console.log("creating rgba file",name,r,g,b);
		
		var txt=fs.readFileSync("art/rgba/original.css",'utf8');
		
		txt = txt.replace(/rgba\((.+?)\)/g, function(match, contents, offset, s){
			var aa=contents.split(",");
			var c=(parseInt(aa[0]) + parseInt(aa[1]) + parseInt(aa[2]) ) / (255*3);
			return "rgba("+Math.floor(r*c)+","+Math.floor(g*c)+","+Math.floor(b*c)+","+aa[3]+")";
		});

		fs.writeFileSync("art/rgba/"+name+".css",txt,'utf8');
		
		return;
	}
	// help text
	console.log(
		"\n"+
		">	ctrack import tongue tmp/tongue.csv \n"+
		"Import language table from a csv file.\n"+
		"\n"+
		">	ctrack export tongue tmp/tongue.csv \n"+
		"Export language table into a csv file.\n"+
		"\n"+
		">	ctrack tint red 255 0 0 \n"+
		"Create art/rgba/red.css with a 255,0,0 rgb tint using art/rgba/original.css as the template.\n"+
		"\n"+
		"\n"+
	"");
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv; global.argv=argv;
	cmd.run(argv);
}
