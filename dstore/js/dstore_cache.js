// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_cache=exports;


var wait=require("wait.for");

var fs = require('fs');
var util=require("util");
var path=require('path');
var http=require("http");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var http_getbody=function(url,cb)
{
	http.get(url, function(res) {
		if(res.statusCode!=200)
		{
			process.stdout.write("!\n");
			cb(res.statusCode,null);
		}
		else
		{
			res.setEncoding('utf8');
			var s="";
			res.on('data', function (chunk) {
				process.stdout.write(".");
				s=s+chunk;
			});
			res.on('end', function() {
				process.stdout.write(".\n");
				cb(null,s);
			});
		}
	}).on('error', function(e) {
		process.stdout.write("!\n");
		cb(e,null);
	});

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
	else // help
	{
		console.log("dstore cache datastore -- download all xml from the datastore")
		console.log("dstore cache iati      -- download all xml direct from iati publishers")
		console.log("dstore cache empty     -- empty every xml in the cache (so next import will clear all)")
	}

};


dstore_cache.import_xmlfile = function(xmlfile){

	var xmlfilename=path.basename(xmlfile,".xml");
	
	var data=fs.readFileSync(xmlfile,"UCS-2"); // try 16bit first?
	var aa=data.split(/<iati-activity/gi);
	if(aa.length==1) // nothing found so try utf8
	{
		data=fs.readFileSync(xmlfile,"utf8");
		aa=data.split(/<iati-activity/gi);
	}
	
	var acts=[];
	for(var i=1;i<aa.length;i++)
	{
		var v=aa[i];
		var v=v.split(/<\/iati-activity>/gi)[0]; // trim the end
		acts.push("<iati-activity dstore:slug=\""+xmlfilename+"\" dstore:idx=\""+i+"\" "+v+"</iati-activity>"); // rebuild and add import filename
	}


	console.log("\t\tImporting xmlfile : ("+acts.length+") \t"+xmlfilename);
//	wait.for(function(cb){
		require("./dstore_db").fill_acts(acts,xmlfilename);
//		} );
}



dstore_cache.datastore = function(argv){

var codes=["ad","ae","af","ag","ai","al","am","an","ao","aq","ar","as","at","au","aw","ax","az","ba","bb","bd","be","bf","bg","bh","bi","bj","bl","bm","bn","bo","bq","br","bs","bt","bv","bw","by","bz","ca","cc","cd","cf","cg","ch","ci","ck","cl","cm","cn","co","cr","cu","cv","cw","cx","cy","cz","de","dj","dk","dm","do","dz","ec","ee","eg","eh","er","es","et","fi","fj","fk","fm","fo","fr","ga","gb","gd","ge","gf","gg","gh","gi","gl","gm","gn","gp","gq","gr","gs","gt","gu","gw","gy","hk","hm","hn","hr","ht","hu","id","ie","il","im","in","io","iq","ir","is","it","je","jm","jo","jp","ke","kg","kh","ki","km","kn","kp","kr","kw","ky","kz","la","lb","lc","li","lk","lr","ls","lt","lu","lv","ly","ma","mc","md","me","mf","mg","mh","mk","ml","mm","mn","mo","mp","mq","mr","ms","mt","mu","mv","mw","mx","my","mz","na","nc","ne","nf","ng","ni","nl","no","np","nr","nu","nz","om","pa","pe","pf","pg","ph","pk","pl","pm","pn","pr","ps","pt","pw","py","qa","re","ro","rs","ru","rw","sa","sb","sc","sd","se","sg","sh","si","sj","sk","sl","sm","sn","so","sr","ss","st","sv","sx","sy","sz","tc","td","tf","tg","th","tj","tk","tl","tm","tn","to","tr","tt","tv","tw","tz","ua","ug","um","us","uy","uz","va","vc","ve","vg","vi","vn","vu","wf","ws","ye","yt","za","zm","zw"];


	var url="http://datastore.iatistandard.org/api/1/access/activity.xml?&stream=True&recipient-country=";
//	var url="http://datastore.iatistandard.org/api/1/access/activity.xml?&limit=1&recipient-country=";
//	var url="http://datastore.iatistandard.org/api/1/access/activity.xml?&limit1=1&recipient-country=";

	for(var i=0;i<codes.length;i++)
	{
		var v=codes[i];
		var fname="cache/datastore_"+v+".xml";
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

dstore_cache.empty = function(argv){

	var ff=fs.readdirSync(global.argv.cache);
	for(var i=0;i<ff.length;i++)
	{
		var v=global.argv.cache+"/"+ff[i];
		if( v.slice(-4)==".xml")
		{
			console.log("Emptying xml file "+v);
			fs.writeFileSync(v,"");
		}
	}
}


