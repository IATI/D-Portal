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


let upload_html = require('fs').readFileSync( __dirname + '/upload.html' , 'utf8' )



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


	console.log( req.query )

	let xmlurl=(req.body && req.body.xmlurl) || (req.query && req.query.xmlurl)

	let jsonplease=(req.body && req.body.jsonplease) || (req.query && req.query.jsonplease)



	let newinstance=function(data)
	{
		var md5omatic = require('md5-o-matic');

		var instance=md5omatic(data);

console.log("CREATING INSTANCE : "+instance);

		var xml_filename=__dirname+"/../../dstore/instance/"+instance+".xml";
		var log_filename=__dirname+"/../../dstore/instance/"+instance+".log";

		try{ fs.unlinkSync(log_filename);    }catch(e){} // ignore errors

		fs.writeFileSync( xml_filename, data );

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
		
		let ret={}
		
		ret.url="http://"+instance+"."+host+"/ctrack.html#view=main"
		ret.instance=instance
		ret.host=host
		
		if( jsonplease )
		{
			res.jsonp(ret);
		}
		else
		{
			res.redirect(ret.url);
		}
	}

	if( xmlurl )
	{
		let fetch=require("node-fetch")

		fetch( xmlurl ).then(res => res.text()).then(function(data){

			newinstance(data)

		})
	}
	else
	if(req.files && req.files.xml)
	{
		let data=req.files.xml.data.toString('utf8')
		
		newinstance(data)
	}
	else
	{
		res.send( upload_html )
	}

};

