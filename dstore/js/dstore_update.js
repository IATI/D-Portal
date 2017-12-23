// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_update=exports;

var fs = require('fs');
var util=require("util");
var path=require('path');
var http=require("http");
var request = require('request');
var dstore_db = require("./dstore_db")
var refry = require("./refry")
var iati_xml = require("./iati_xml")

var packages = require('../json/packages.json');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var http_gethead=function(url)
{
	return new Promise(function (fulfill, reject){

		request.head(url,function(err,ret){
			if(err)
			{
				reject(err)
			}
			else
			{
				fulfill(ret)
			}
		})
		
	})
}

var http_getbody=function(url)
{
	return new Promise(function (fulfill, reject){

		request({uri:url,timeout:20000,encoding:null}, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			fulfill(body);
		  }
		  else
		  {
			reject( error || response.statusCode );
		  }
		})

	})
	
};

var	bufferToString=function(buffer) {

	var charset="unknown"

	if(!buffer) { return ""; }
	var jschardet = require("jschardet")
	var iconv = require("iconv-lite")


	var head=buffer.slice(0,1024); // grab a small part of the file as a test header

	var headc=iconv.decode(head,"utf-8"); // assume utf8 and check for an xml header in case it was not
	var aa=headc.split("?>")
	if( aa[1] ) // found an xml header
	{
		aa=aa[0].split("encoding=")
		if( aa[1] ) // found an encoding in the header eg -> <?XML encoding="utf-8"
		{
			var bb=aa[1].split("'"); // could be this quote type
			if(bb[0]=="" && bb[1] )
			{
				charset=bb[1].toLowerCase();
			}
			else
			{
				var bb=aa[1].split("\""); // or this quote type
				if(bb[0]=="" && bb[1] )
				{
					charset=bb[1].toLowerCase();
				}
			}
		}
	}

	if( charset=="unknown" ) // might be utf-16 or utf-32 so check for them, otherwise assume utf-8
	{

		// the following is very resource hungry, hence the tiny head slice to stop us running out of memory
		charset = (jschardet.detect(head).encoding || "utf-8");

		charset = charset.toLowerCase();
		if(charset.slice(0,3)!="utf") { charset="utf-8"; } // we only care about sniffing utf 16/32 formats, any other format and we will force utf-8 instead

		// we should have picked one of the following UTF-8 , UTF-16 LE , UTF-16 BE , UTF-32 LE , UTF-32 BE
	}
	

	return iconv.decode(buffer,charset);
}


dstore_update.cmd = function(argv){

	if( argv._[1]=="test" )
	{
		dstore_update.test(argv);
	}
	else
	if( argv._[1]=="urls" )
	{
		dstore_update.urls(argv);
	}
	else
	if( argv._[1]=="download" )
	{
		dstore_update.download(argv);
	}
	else
	if( argv._[1]=="parse" )
	{
		dstore_update.parse(argv);
	}
	else // help
	{
		console.log("dstore update urls                    # refresh the xml file download urls ")
		console.log("dstore update parse                   # parse the next xml in queue ")
		console.log("dstore update parse --aid=...         # parse a specific id ")
		console.log("dstore update download                # download the next file in queue ")
		console.log("dstore update download --slug=...     # force download a specific file ")
	}

}

dstore_update.parse = function(argv){

	var db = dstore_db.open()

	dstore_db.xml_lock(db,60).then(function(aid){
		if(aid)
		{
console.log("LOCKED "+aid)
			dstore_update.xml(db,aid).then(function(){
				dstore_db.close(db)
			},function(){
				console.log("FAILED TO LOCK XML")
				dstore_db.close(db)
			})
		}
		else
		{
			console.log("NO XML IN QUEUE")
			dstore_db.close(db)
		}
	})

}

dstore_update.download = function(argv){

	var db = dstore_db.open()
	
	if(argv.slug)
	{
		// try and lock
		dstore_db.file_lock_slug(db,argv.slug).then(function(slug){
			if(slug)
			{
				// force update
				dstore_update.slug(db,slug,true).then(function(){
					dstore_db.close(db)
				},function(){
					console.log("FAILED TO LOCK FILE")
					dstore_db.close(db)
				})
			}
			else
			{
				console.log("SLUG NOT FOUND")
				dstore_db.close(db)
			}
		})
	}
	else
	{
		dstore_db.file_lock(db,60).then(function(slug){
			if(slug)
			{
	//			console.log("LOCKED "+slug)
				dstore_update.slug(db,slug).then(function(){
					dstore_db.close(db)
				},function(){
					console.log("FAILED TO LOCK FILE")
					dstore_db.close(db)
				})
			}
			else
			{
				console.log("NO FILES IN QUEUE")
				dstore_db.close(db)
			}
		})
	}
}

dstore_update.urls = function(argv){
	
	var db = dstore_db.open()
	
	var chain=dstore_db.transaction_begin(db) // our promise chain

	var count=0
	for( var slug in packages)
	{
		var package=packages[slug]
		
		var url=package.resources && package.resources[0] && package.resources[0].url
		if(url)
		{
			count++
			if(count>10) { break } // for testing a smaller dataset
			console.log(slug+" -> "+url)
			chain=chain.then( dstore_db.file_url(db,slug,url) )
		}
	}
	

	chain=chain.then(function(){
		return dstore_db.transaction_commit(db)
	})

	chain=chain.then(function(){
		dstore_db.close(db)
	})

}


// call this after locking a slug to perform a file download and check
dstore_update.slug = function(db,slug,forcedownload){

console.log("UPDATE "+slug)

	return dstore_db.file_get(db,slug).then(function(file){

		var time=Math.floor(new Date() / 1000) // our current time
		
		if(file)
		{
			file.file_lock=null
			file.file_log+="TIME : "+(new Date(time*1000))+"\n"
			file.file_log+="Get Header\n"

			var logerr=function(err){
				file.file_log+=err+"\n"
console.log(file.file_log)
				return dstore_db.replace(db,"file",file)
			}
			
			var download=function()
			{
				file.file_log+="Get Body\n"

				return http_getbody(file.file_url).then(function(buffer){
					
					var body=bufferToString(buffer)
					
					file.file_length=buffer.length
					file.file_download=time

					file.file_log ="TIME : "+(new Date(time*1000))+"\n"
					file.file_log+="Downloaded "+file.file_url+" ("+file.file_length+")\n"

					return dstore_update.file_xml(db,file,body).then(function(){
console.log(file.file_log)
						return dstore_db.replace(db,"file",file)
					})

				},logerr)
			}
			
			if(forcedownload)
			{
				return download()
			}

			return http_gethead(file.file_url).then(function(h){

//console.log(h.headers);
				
				var dodownload=true
				
				if( h && h.headers["last-modified"] && file.file_download )
				{
					var hm=Date.parse( h.headers["last-modified"] );
					var fm=Date.parse( (file.file_download||0)*1000 );
					if(hm<=fm) // we already have a newer file so ignore (might change mind when we check the size)
					{
						dodownload=false
					}
				}

				if( h && h.headers["content-length"] && file.file_length )
				{
					var size=parseInt(h.headers["content-length"] ) ;
					if( size == file.file_length ) // wrong size so try download again
					{
						dodownload=false
					}
				}

				if( !dodownload )
				{
//console.log("OLD FILE") // no change

					file.file_log+="No change\n"

console.log(file.file_log)
					return dstore_db.replace(db,"file",file) // END
				}
				else
				{

//console.log("NEW FILE")

					return download()

				}

			},logerr)


		}

	})

}

// call this after locking a slug to perform a file download and check
dstore_update.file_xml = function(db,file,data){

	var log=function(s){file.file_log+=s+"\n"}
	
	var chain=Promise.resolve(null)
	
	var aa=data.split(/<iati-activity/gi);

	if( aa.length>1 ) // file contains activities
	{

		var head=aa[0];
		var tail=""
		if(aa[1])
		{
			tail=aa[aa.length-1].split(/<\/iati-activity>/gi)[1] || "";
		}

		var acts=[];
		for(var i=1;i<aa.length;i++)
		{
			var v=aa[i];
			var v=v.split(/<\/iati-activity>/gi)[0]; // trim the end
			var s=""+
			head+
			"<iati-activity dstore:slug=\""+file.slug+"\""+
			" dstore:idx=\""+i+"\""+
			" dstore:url=\""+file.file_url+"\" "+
				v+
			"</iati-activity>"+
			tail

			acts.push(s)
		}

// remember how many we found
		file.file_count=acts.length
		log("Found "+file.file_count+" activities.")

// mark all existing activities as empty

		chain=chain.then( dstore_db.xml_data(db,slug,null,null,null) )

// then update or create all the ones in the file

		for(i=0;i<acts.length;i++)
		{
			var slug=file.slug
			var s=acts[i]
			var d=refry.xml(s,slug,log) // log any errors
			var aid=iati_xml.get_aid(d) // find aid

			chain=chain.then( dstore_db.xml_data(db,slug,aid,i+1,s) )
		}
		
		return chain
	}
	else // probably an org file, no activities, dump entire file
	{
		log("Saving as an ORG file.")
		file.file_count=0
		file.file_data=data

		return chain
	}

}


// call this after locking an xml activity to perform a parse update
dstore_update.xml = function(db,aid,forceupdate){

console.log("UPDATE "+aid)

	return dstore_db.xml_get(db,aid).then(function(xml){

		var time=Math.floor(new Date() / 1000) // our current time
		
		if(xml)
		{
			xml.xml_lock=null
			xml.xml_log+="TIME : "+(new Date(time*1000))+"\n"
			xml.xml_log+="Get Header\n"

			var logerr=function(err){
				xml.xml_log+=err+"\n"
console.log(xml.xml_log)
				return dstore_db.replace(db,"xml",xml)
			}
			

			return dstore_db.replace(db,"xml",xml)

		}

	})

}

