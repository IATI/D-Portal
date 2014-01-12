
var nconf = require('nconf');
var express = require('express');
var app = express();

nconf.argv().env().file({ file: '	' });
nconf.set("database_file","db/main.sqlite");

if(nconf.get("cmd"))
{
	var cmd=nconf.get("cmd");
	console.log("cmd found : "+cmd);
	if( cmd=="import" )
	{
		console.log("Attempting Import");
		
		var xmlfile=nconf.get("xmlfile");
		console.log("Importing xmlfile : "+xmlfile);
		
	}
}


app.use(express.logger());

//app.use("/");

app.use("/test",function (req, res) {
	var t=require("./src/test")
	var html=required["test"].html(req,res);
	res.writeHead(200, {'Content-Type': html.mime});
	res.end(html.headbody);
});

app.use("/dstore_db",function (req, res) {
	require("./src/dstore_db").test(req,res);
});


app.use(express.compress());
app.use(express.static(__dirname));

app.listen(process.env.PORT || 1337);
