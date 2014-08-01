// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_cache=exports;


var wait=require("wait.for");

var fs = require('fs');
var util=require("util");
var path=require('path');
var http=require("http");
var request = require('request');
	
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var http_gethead=function(url,cb)
{
	request.head(url,cb);
}

var http_getbody=function(url,cb)
{
	request({uri:url,timeout:20000,encoding:null}, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		cb(null,body);
	  }
	  else
	  {
		cb( error || response.statusCode , null );
	  }
	})
};

// handle a cache download/import cmd line request
// cache is just a directory containing downloaded xml files
// so we can two step the download - import process
dstore_cache.cmd = function(argv){

	if( argv._[1]=="datastore" )
	{
		dstore_cache.datastore(argv);
	}
	else
	if( argv._[1]=="iati" )
	{
		dstore_cache.iati(argv);
	}
	else
	if( argv._[1]=="empty" )
	{
		dstore_cache.empty(argv);
	}
	else
	if( argv._[1]=="newold" )
	{
		dstore_cache.newold(argv);
	}
	else // help
	{
		console.log("dstore cache datastore -- download all xml from the datastore")
		console.log("dstore cache iati      -- download all xml direct from iati publishers")
		console.log("dstore cache empty     -- empty every xml in the cache (so next import will clear all)")
		console.log("dstore cache newold    -- update cache/new and cache/old with the current state")
	}

};


dstore_cache.import_xmlfile = function(xmlfile){

var charset="unknown";
var	bufferToString=function(buffer) {
		if(!buffer) { return ""; }
		var jschardet = require("jschardet")
		var iconv = require("iconv-lite")
		charset = jschardet.detect(buffer).encoding || "utf-8";
		return iconv.decode(buffer,charset.toLowerCase());
	}


	var xmlfilename=path.basename(xmlfile,".xml");
	var data=bufferToString( fs.readFileSync(xmlfile) ); // guess file format
	var aa=data.split(/<iati-activity/gi);
	
	var acts=[];
	for(var i=1;i<aa.length;i++)
	{
		var v=aa[i];
		var v=v.split(/<\/iati-activity>/gi)[0]; // trim the end
		acts.push("<iati-activity dstore:slug=\""+xmlfilename+"\" dstore:idx=\""+i+"\" "+v+"</iati-activity>"); // rebuild and add import filename
	}


	console.log("\t\tImporting xmlfile <"+charset+">: ("+acts.length+") \t"+xmlfilename);
//	wait.for(function(cb){
		require("./dstore_db").fill_acts(acts,xmlfilename);
//		} );
}



dstore_cache.datastore = function(argv){

	try { fs.mkdirSync(global.argv.cache); } catch(e){}

var codes=["ad","ae","af","ag","ai","al","am","an","ao","aq","ar","as","at","au","aw","ax","az","ba","bb","bd","be","bf","bg","bh","bi","bj","bl","bm","bn","bo","bq","br","bs","bt","bv","bw","by","bz","ca","cc","cd","cf","cg","ch","ci","ck","cl","cm","cn","co","cr","cu","cv","cw","cx","cy","cz","de","dj","dk","dm","do","dz","ec","ee","eg","eh","er","es","et","fi","fj","fk","fm","fo","fr","ga","gb","gd","ge","gf","gg","gh","gi","gl","gm","gn","gp","gq","gr","gs","gt","gu","gw","gy","hk","hm","hn","hr","ht","hu","id","ie","il","im","in","io","iq","ir","is","it","je","jm","jo","jp","ke","kg","kh","ki","km","kn","kp","kr","kw","ky","kz","la","lb","lc","li","lk","lr","ls","lt","lu","lv","ly","ma","mc","md","me","mf","mg","mh","mk","ml","mm","mn","mo","mp","mq","mr","ms","mt","mu","mv","mw","mx","my","mz","na","nc","ne","nf","ng","ni","nl","no","np","nr","nu","nz","om","pa","pe","pf","pg","ph","pk","pl","pm","pn","pr","ps","pt","pw","py","qa","re","ro","rs","ru","rw","sa","sb","sc","sd","se","sg","sh","si","sj","sk","sl","sm","sn","so","sr","ss","st","sv","sx","sy","sz","tc","td","tf","tg","th","tj","tk","tl","tm","tn","to","tr","tt","tv","tw","tz","ua","ug","um","us","uy","uz","va","vc","ve","vg","vi","vn","vu","wf","ws","ye","yt","za","zm","zw"];


	var url="http://datastore.iatistandard.org/api/1/access/activity.xml?&stream=True&recipient-country=";
//	var url="http://datastore.iatistandard.org/api/1/access/activity.xml?&limit=1&recipient-country=";
//	var url="http://datastore.iatistandard.org/api/1/access/activity.xml?&limit1=1&recipient-country=";

	for(var i=0;i<codes.length;i++)
	{
		var v=codes[i];
		var fname=global.argv.cache+"/datastore_"+v+".xml";
		console.log("fetching\t"+url+v);
		var count=0;
		var x=null;
		while(!x && count<10)
		{
			count++;
			try{
				x=wait.for(http_getbody,url+v);
			}catch(e){}
			if(x)
			{
				fs.writeFileSync(fname,x);
				console.log("written\t"+x.length+" bytes to "+fname);
			}
		}
		if(!x)
		{
				fs.writeFileSync(fname,"");
				console.log("****error reading from datastore, have written empty file to "+fname);
		}
		console.log("");
	}
	
}

dstore_cache.empty = function(argv,keep){

	try { fs.mkdirSync(global.argv.cache); } catch(e){}

	var ff=fs.readdirSync(global.argv.cache);
	for(var i=0;i<ff.length;i++)
	{
		var v=global.argv.cache+"/"+ff[i];
		if( v.slice(-4)==".xml")
		{
			var slug=ff[i].slice(0,-4);
			if( (!keep) || (!keep[slug]) )
			{
				console.log("Emptying xml file for "+slug+" : "+v);
				fs.writeFileSync(v,"");
			}
		}
	}
}


dstore_cache.iati = function(argv){
	
	var just_this_slug=argv._[2] || undefined; // just download this slug (filename without .xml)

	try { fs.mkdirSync(global.argv.cache); } catch(e){}

	var slugs={};
	var failed_slugs={};

	var start=0;
	var done=false;
	while(!done)
	{	
		var js=wait.for(http_getbody,"http://iatiregistry.org/api/3/action/package_search?rows=1000&start="+start);

		var j=JSON.parse(js.toString('utf8'));
		var rs=j.result.results;
		done=true;
		for(var i=0;i<rs.length;i++)
		{
			var v=rs[i];
			if(v.type=="dataset")
			{
				done=false;
				if( v.resources[1] || !(v.resources[0] && v.resources[0].url ) )
				{
					console.log(v.resources); // problems with the data?
				}
				if(v.resources[0] && v.resources[0].url )
				{
					var slug=v.name;
					var url=v.resources[0].url;
					var fname=global.argv.cache+"/"+slug+".xml";
					var fname_old=global.argv.cache+"/old/"+slug+".xml";
					
					if( (!just_this_slug) || (just_this_slug==slug) ) // maybe limit to one slug
					{
						slugs[slug]=url;
						
						try{
							console.log((i+start+1)+"/"+(start+rs.length)+":downloading "+slug+" from "+url)
							var download=true;
							try{
								var h=wait.for(http_gethead,url);
								var f; try{ f=fs.statSync(fname); }catch(e){}
		//						console.log(h.headers);
		//						console.log(f);
								if( h && h.headers["last-modified"] && f && f.mtime )
								{
									var hm=Date.parse( h.headers["last-modified"] );
									var fm=Date.parse( f.mtime );
									if(hm<=fm) // we already have a newer file
									{
										download=false;
									}
								}
								if( h && h.headers["content-length"] )
								{
									var size=parseInt(h.headers["content-length"] ) ;
									if( size > 1024*1024*512 ) // huge file, skip it
									{
										failed_slugs[slug]="ERROR! File is too big > 512meg so skipping download...";
										console.log("ERROR! File is too big > 512meg so skipping download...");
										download=false;
									}
								}
								
							}catch(e){}

							if(download)
							{
								var b=wait.for(http_getbody,url);
								fs.writeFileSync(fname,b);
								console.log("written\t"+b.length+" bytes to "+fname);
							}
							else
							{
								console.log("...");
							}
						
						}catch(e){
							failed_slugs[slug]=e;
							console.log("Something went wrong, using last downloaded version of "+slug);
							console.log(e);
						}
					}
				}
			}
		}
		
		start+=1000;
	}
	
	if(!just_this_slug)
	{
		console.log("");
		console.log("EMPTYING OLD CACHE");
		console.log("");

		dstore_cache.empty({},slugs);
	}

	var failed_header=true;
	for(var n in failed_slugs)
	{
		if(failed_header)
		{
			console.log("********************************");
			console.log("THE FOLLOWING FAILED TO DOWNLOAD");
			console.log("********************************");
			failed_header=false;
		}
		
		console.log(n+" : "+slugs[n]);
	}
	console.log("");

}

//
// look in the cache and cache/old directory and copy the new (changed) files into cache/new
// while keeping a last changed copy in cache/old
//
// as long as you do this followed by an import of all the files in cach/new then the database can be
// kept in sync without a full import.
//
dstore_cache.newold = function(argv){
	
	var deleteFolderRecursive = function(path) {
		var files = [];
		if( fs.existsSync(path) ) {
			files = fs.readdirSync(path);
			files.forEach(function(file,index){
				var curPath = path + "/" + file;
				if(fs.lstatSync(curPath).isDirectory()) { // recurse
					deleteFolderRecursive(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	};

	deleteFolderRecursive(global.argv.cache+"/new");

	try { fs.mkdirSync(global.argv.cache); } catch(e){}
	try { fs.mkdirSync(global.argv.cache+"/new"); } catch(e){}
	try { fs.mkdirSync(global.argv.cache+"/old"); } catch(e){}

	var ff=fs.readdirSync(global.argv.cache);
	for(var i=0;i<ff.length;i++)
	{
		var v=ff[i];
		if( v.slice(-4)==".xml")
		{
			var slug=ff[i].slice(0,-4);

			var bse_fname=global.argv.cache+"/"+v;
			var new_fname=global.argv.cache+"/new/"+v;
			var old_fname=global.argv.cache+"/old/"+v;
			
			
			var bdat;
			var odat;
			var thesame=false;
			try{
				bdat=fs.readFileSync( bse_fname );
				odat=fs.readFileSync( old_fname );
				if( bdat.length == odat.length)	
				{
					thesame=true;
					for(var bi=0; bi<bdat.length; bi++)
					{
						if( bdat[bi] != odat[bi] ) // compare full buffer
						{
							thesame=false;
							break;
						}
					}
				}
			}catch(e){}
			
			if(!thesame)
			{
// copy to new
				fs.writeFileSync( new_fname , bdat );
				console.log("NEW "+slug);
			}
			else
			{
// do not copy to new
				console.log("OLD "+slug);
			}

// copy to old
			fs.writeFileSync( old_fname , bdat );
		}
		
// we never delete files, only replace with empty versions, so this is all we have to do.
// if we delete from the cache then also delete from old
// new is rebuilt every time this script is run
	}
	
}
