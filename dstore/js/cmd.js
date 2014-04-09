// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// we expect dstore to be the current directory when this cmd is run
// as we will be creating db/cache directories there

var wait=require('wait.for');
var fs = require('fs');
var express = require('express');
var util=require('util');
var path=require('path');
var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
var argv=require('yargs').argv; global.argv=argv;

argv.port=argv.port||1337;
argv.database=argv.database||"../dstore/db/dstore.sqlite";


// make sure we have a db dir
fs.mkdir("db",function(e){});
//ls(argv)
if( argv._[0]=="init" )
{
	require("./dstore_db").create_tables(); // 
	return;
}
else
if( argv._[0]=="analyze" )
{
	require("./dstore_db").analyze();
	return;
}
else
if( argv._[0]=="vacuum" )
{
	require("./dstore_db").vacuum();
	return;
}
else
if( argv._[0]=="index" )
{
	require("./dstore_db").create_indexes(); // add indexes to previously inserted data
	return;
}
else
if( argv._[0]=="unindex" )
{
	require("./dstore_db").delete_indexes(); // add indexes to previously inserted data
	return;
}
else
if( argv._[0]=="check" )
{
	require("./dstore_db").check_tables();
	return;
}
else
if( argv._[0]=="exs" )
{
	wait.launchFiber( require("./exs").create_csv );
	return;
}
else
if( argv._[0]=="fetch" )
{
	wait.launchFiber( require("./iati_codes").fetch );
	return;
}
else
if( argv._[0]=="import" )
{
//		console.log("Attempting Import");
	
	var xmlfile=argv._[1];
	var xmlfilename=path.basename(xmlfile,".xml");
	
	var fs = require('fs');
	
	var data=fs.readFileSync(xmlfile,"UCS-2"); // try 16bit first?
	var aa=data.split(/<iati-activity/gi);
	if(aa.length==1) // nothing found so try utf8
	{
		data=fs.readFileSync(xmlfile,"utf8");
		aa=data.split(/<iati-activity/gi);
	}
	
//ls(aa);			
	var acts=[];
	for(var i=1;i<aa.length;i++)
	{
		var v=aa[i];
		var v=v.split(/<\/iati-activity>/gi)[0]; // trim the end
		acts.push("<iati-activity dstore:slug=\""+xmlfilename+"\" dstore:idx=\""+i+"\" "+v+"</iati-activity>"); // rebuild and add import filename
	}


	console.log("\t\tImporting xmlfile : ("+acts.length+") "+xmlfilename);

//		console.log("activities: "+acts.length);
//			console.log(acts[0]);


	wait.launchFiber(function(){
		require("./dstore_db").fill_acts(acts,xmlfilename);
	});

	return;		
}
