// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const upload={}
export default upload

import * as fs     from "fs"
import * as util   from "util"
import * as child_process   from "child_process"

import fetch       from "node-fetch"
import md5omatic   from "md5-o-matic"
import refry       from "./refry.js"
import exs         from "./exs.js"
import iati_xml    from "./iati_xml.js"
import dstore_db   from "./dstore_db.js"
import upload_html from "./upload.html"

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }




// handle the /upload url space
upload.serv = function(req,res){

	let log=function(a)
	{
		fs.appendFile( import.meta.dirname+"/../../dstore/instance/upload.tsv" , ( new Date().getTime() / 1000 )+"\t"+(req.ip)+"\t"+a.join("\t")+"\n" , function(){} )
	}


	let xmlurl=(req.body && req.body.xmlurl) || (req.query && req.query.xmlurl)

	let jsonplease=(req.body && req.body.jsonplease) || (req.query && req.query.jsonplease)


	let newinstance=function(data)
	{

		var instance=md5omatic(data);

		var xml_filename=import.meta.dirname+"/../../dstore/instance/"+instance+".xml";
		var log_filename=import.meta.dirname+"/../../dstore/instance/"+instance+".log";

		let result=function(ret)
		{
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

			ret=ret || {}

			ret.url="https://preview.d-portal.org/"+instance+"/ctrack.html#view=main"
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


		try{ // ignore errors

			let stats = fs.statSync(log_filename);
			let age = ( new Date().getTime() ) - stats.mtimeMs ;

			if( age < 1000*60*60 ) // we have a young logfile so this is a duplicate upload
			{
				log(["duplicate",data.length])
				return result({error:"duplicate"})
			}

			fs.unlinkSync(log_filename);

		}catch(e){}

		fs.writeFileSync( xml_filename, data );

		child_process.spawn("/dportal/box/instance-create",
			[instance],
			{stdio:["ignore",fs.openSync(log_filename,"a"),fs.openSync(log_filename,"a")]});

			return result()
	}

;(async () => {
	try
	{

		if(req.files && req.files.xml)
		{
			let data=req.files.xml.data.toString('utf8')

			log(["upload",data.length])

			newinstance(data)
		}
		else
		if( xmlurl )
		{

			let res = await fetch(xmlurl)
			let data = await res.text()

			log(["fetch",data.length])

			newinstance(data)

		}
		else
		{
			log(["visit"])
			res.send( upload_html )
		}

	}
	catch(e)
	{
		let err=String(e)

		log(["error",err])

		if( jsonplease )
		{
			res.jsonp({error:err})
		}
		else
		{
			res.status(400).send( err )
		}

	}
})();


};

