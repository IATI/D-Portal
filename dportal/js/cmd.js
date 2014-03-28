// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var fs = require('fs');
var util=require('util');
var path=require('path');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

cmd.run=function(argv)
{
	if( argv._[0]=="build" )
	{
		cmd.build();
	}


	// help text
	console.log(
		"\n"+
		">	dportal build \n"+
		"Build all output into serv.\n"+
		"\n"+
		"\n"+
	"");
}

cmd.build=function()
{

}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv; global.argv=argv;
	cmd.run(argv);
}

