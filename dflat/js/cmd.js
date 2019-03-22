// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var pfs=require("pify")( require("fs") )

var dflat=require("./dflat.js")

var stringify = require('json-stable-stringify');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.run=async function(argv)
{
	if( argv._[0]=="xml2json" )
	{
		var filename=argv.filename || argv._[1] ;
		if(filename)
		{
			var dat=await pfs.readFile(filename+".xml",{ encoding: 'utf8' });
			var json=dflat.xml_to_json(dat)
			await pfs.writeFile(filename+".json",stringify(json,{space:" ",cmp:(a,b)=>{
				if(a.key=="0" || b.key=="1") { return -1 }
				if(b.key=="0" || a.key=="1") { return  1 }
				return a.key > b.key ? 1 : -1;
				
			}}));

			return
		}
	}
	
	if( argv._[0]=="xml2csv")
	{
		var filename=argv.filename || argv._[1] ;
		if(filename)
		{
			var dat=await pfs.readFile(filename+".xml",{ encoding: 'utf8' });
			var json=dflat.xml_to_json(dat)
			
			var headers={}
			var cb
			cb=function(it,root)
			{
				for(var n in it)
				{
					var v=it[n]
					if( Array.isArray(v) )
					{
						for( var i=0 ; i<v.length ; i++ )
						{
							cb(v[i],root+n)
						}
					}
					else
					{
						headers[ root+n ]=true
					}
				}
			}
			cb(json,"")
			
			var header=[]
			for(var n in headers)
			{
				if(n.startsWith("iati-activities/iati-activity"))
				{
					var s=n.substr( ("iati-activities/iati-activity").length )
					if(s)
					{
						header.push(s)
					}
				}
			}
			
			header.sort()
			for(var i=header.length;i>=0;i--)
			{
				header[i+1]={id:header[i],title:header[i]}
			}
			header[0]={id:"TYPE",title:"TYPE"}


			const createCsvWriter = require('csv-writer').createObjectCsvWriter;
			const csvWriter = createCsvWriter({
				path: filename+'.csv',
				header: header
			});
			
			
			var a=json["iati-activities/iati-activity"]
			for(var ai=0; ai<a.length ; ai++)
			{
				var it={}
				it.TYPE="iati-activity"
				var b=a[ai]
				for(var bn in b)
				{
					var bv=b[bn]
					if( ! Array.isArray(bv) )
					{
						it[ bn ] = bv
					}
				}
				await csvWriter.writeRecords([it])
				var c=[]
				for(var bn in b)
				{
					if( Array.isArray(b[bn]) )
					{
						c.push(bn)
					}
				}
				c.sort() // good order
				for(var ci=0;ci<c.length;ci++)
				{
					var bn=c[ci]
					var d=b[bn]
					for(var di=0;di<d.length;di++)
					{
						var it={}
						it.TYPE="iati-activity"+bn
						it["/iati-identifier"]=b["/iati-identifier"] // copy id
						
						var e=d[di]
						for(var en in e)
						{
							var ev=e[en]
							it[ bn+en ] = ev
						}
					
						await csvWriter.writeRecords([it])
					}
				}
			}

			return
		}
	}
	
	// help text
	console.log(
		"\n"+
		">	dflat xml2json filename[.xml] \n"+
		"Convert activities from filename.xml into filename.json/*\n"+
		"\n"+
		">	dflat xml2csv filename[.xml] \n"+
		"Convert activities from filename.xml into filename.csv/*\n"+
		"\n"+
		"\n"+
	"");
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv
	global.argv=argv
	cmd.run(argv)
}
