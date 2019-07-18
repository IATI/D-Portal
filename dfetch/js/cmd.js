// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var pfs=require("pify")( require("fs") )

var jml=require("./jml.js")
var xson=require("./xson.js")

var stringify = require('json-stable-stringify');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.run=async function(argv)
{
	if( argv._[0]=="download" )
	{
		await require("./dfetch.js").download_all()
		return
	}

	// help text
	console.log(
		"\n"+
		">	dfetch download \n"+
		"Download all the iati data.\n"+
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
