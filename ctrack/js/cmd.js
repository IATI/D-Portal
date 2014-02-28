// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var wait=require('wait.for');
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

	// help text
	console.log(
		"\n"+
		"ctrack import tongue tmp/tongue.csv \n"+
		"Import language table from a csv file.\n"+
		"\n"+
		"ctrack export tongue tmp/tongue.csv \n"+
		"Export language table into a csv file.\n"+
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
