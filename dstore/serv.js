
var wait=require('wait.for');
var nconf = require('nconf');
var fs = require('fs');
var express = require('express');
var util=require('util');
var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


nconf.argv().file({ file: 'config.json' });
nconf.set("port",1337);
nconf.set("database","db/dstore.sqlite");

// make sure we have a db dir
fs.mkdir("db",function(e){});

if(nconf.get("cmd"))
{
	var cmd=nconf.get("cmd");
	console.log("cmd found : "+cmd);
	if( cmd=="init" )
	{
		require("./js/dstore_db").create_tables();
		return;
	}
	else
	if( cmd=="check" )
	{
		require("./js/dstore_db").check_tables();
		return;
	}
	else
	if( cmd=="hack" )
	{
		wait.launchFiber( require("./js/dstore_db").hack_acts );
		return;
	}
	else
	if( cmd=="exs" )
	{
		wait.launchFiber( require("./js/dstore_db").hack_exs );
		return;
	}
	else
	if( cmd=="fetch" )
	{
		wait.launchFiber( require("./js/iati_codes").fetch );
		return;
	}
	else
	if( cmd=="refresh" )
	{
		require("./js/dstore_db").refresh_acts();
		return;
	}
	else
	if( cmd=="import" )
	{
		console.log("Attempting Import");
		
		var xmlfile=nconf.get("xmlfile");
		console.log("Importing xmlfile : "+xmlfile);
		
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
			acts.push("<iati-activity"+v+"</iati-activity>"); // rebuild
		}
		console.log("activities: "+acts.length);
//			console.log(acts[0]);

		require("./js/dstore_db").fill_acts(acts);

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

console.log("Starting dstore server at http://localhost:"+nconf.get("port")+"/");

app.listen(nconf.get("port"));
