// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

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

if(argv.cmd)
{
//	console.log("cmd found : "+cmd);
	if( argv.cmd=="init" )
	{
		require("./js/dstore_db").create_tables();
		return;
	}
	else
	if( argv.cmd=="check" )
	{
		require("./js/dstore_db").check_tables();
		return;
	}
	else
	if( argv.cmd=="exs" )
	{
		wait.launchFiber( require("./js/dstore_db").hack_exs );
		return;
	}
	else
	if( argv.cmd=="fetch" )
	{
		wait.launchFiber( require("./js/iati_codes").fetch );
		return;
	}
	else
	if( argv.cmd=="analyze" )
	{
		require("./js/dstore_db").analyze();
		return;
	}
	else
	if( argv.cmd=="import" )
	{
//		console.log("Attempting Import");
		
		var xmlfile=argv.xmlfile;
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
			require("./js/dstore_db").fill_acts(acts,xmlfilename);
		});

		return;		
	}
}





app.use(express.logger());
app.use(express.json());

//app.use("/");

app.use("/q",function (req, res) {
	require("./js/query").serv(req,res);
});

app.use(express.compress());
app.use(express.static(__dirname+"/../ctrack"));

console.log("Starting dstore server at http://localhost:"+argv.port+"/");

app.listen(argv.port);
