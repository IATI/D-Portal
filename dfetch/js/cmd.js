// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var util=require("util")
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.parse=function(argv)
{



argv.dir   =           argv.dir   || process.env.DFETCH_DIR   || "downloaded"   ;
argv.limit = parseInt( argv.limit || process.env.DFETCH_LIMIT || "999999"     ) ;

}

cmd.run=async function(argv)
{
	if( argv._[0]=="prepare" )
	{
		await require("./dfetch.js").download_prepare(argv)
		return
	}

	// help text
	console.log(
		"\n"+
		">	dfetch prepare \n"+
		"Prepare a directory to fetch IATI pakages into.\n"+
		"\n"+
		"	--dir downloaded \n"+
		"	Directory to download into.\n"+
		"\n"+
		"	--limit 999999 \n"+
		"	Maximum number of files to download.\n"+
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
