// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var upload=exports;

var util=require('util');
var fs=require('fs');
var child_process=require("child_process");

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var dstore_db=require("./dstore_db");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


// handle the /upload url space
upload.serv = function(req,res){

/*
	if(!argv.instance)
	{
		res.send("DISABLED");
		return;
	}
*/

//console.log("UPLOAD",req.files.xml);

	if(req.files && req.files.xml)
	{

		var md5omatic = require('md5-o-matic');

		var instance=md5omatic(req.files.xml.data.toString('utf8'));

console.log("CREATING INSTANCE : "+instance);

		var xml_filename=__dirname+"/../../dstore/instance/"+instance+".xml";
		var log_filename=__dirname+"/../../dstore/instance/"+instance+".log";

		try{ fs.unlinkSync(log_filename);    }catch(e){} // ignore errors

		fs.writeFileSync(xml_filename, req.files.xml.data );

		child_process.spawn("/dportal/box/instance-create",
			[instance],
			{stdio:["ignore",fs.openSync(log_filename,"a"),fs.openSync(log_filename,"a")]});
			
		let domains=req.hostname.split(".")

		let host
		
		for(let i=0;i<domains.length;i++)
		{
			let subdomain = domains[i]

			if(subdomain && (subdomain.length!=32) ) // skip bits that look like md5 keys
			{
				if(host)
				{
					host=host+"."+subdomain
				}
				else
				{
					host=subdomain
				}
			}
		}

		res.redirect("http://"+instance+"."+host+"/ctrack.html#view=main");

	}
	else
	{
		res.send(
		
		'<html><body>'+
		
		'<form action="/upload" method="post" enctype="multipart/form-data">'+
		'	Select IATI xml file to upload:'+
		'		<input type="file" name="xml" id="xml">'+
		'		<input type="submit" value="Upload..." name="submit">'+
		'</form>'+	

		'</body></html>'+
		
		'')
	}

};

