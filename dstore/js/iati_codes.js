// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var iati_codes=exports;

var csv=require('csv');
var util=require('util');
var wait=require('wait.for');
var http=require('http');
var https=require('https');
var fs = require('fs');

var refry=require('./refry');
var exs=require('./exs');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var http_getbody=function(url,cb)
{
	http.get(url, function(res) {
		res.setEncoding('utf8');
		var s="";
		res.on('data', function (chunk) {
			s=s+chunk;
		});
		res.on('end', function() {
			cb(null,s);
		});
	}).on('error', function(e) {
		cb(e,null);
	});

};

var https_getbody=function(url,cb)
{
	https.get(url, function(res) {
		res.setEncoding('utf8');
		var s="";
		res.on('data', function (chunk) {
			s=s+chunk;
		});
		res.on('end', function() {
			cb(null,s);
		});
	}).on('error', function(e) {
		cb(e,null);
	});

};

iati_codes.fetch = function(){

	var codes={};
	var publishers={};

if(true)
{
	codes.publisher_ids={};

	var js=wait.for(http_getbody,"http://iatiregistry.org/api/rest/group");
	var j=JSON.parse(js);
	j.forEach(function(v){
		console.log(v);
		var jjs=wait.for(http_getbody,"http://iatiregistry.org/api/rest/group/"+v);
		var jj=JSON.parse(jjs);
		publishers[v]=jj
		
		var ids=jj.extras.publisher_iati_id.split("|");
		for(var i=0;i<ids.length;i++)
		{
			var id=ids[i].trim();
			if(id!="")
			{
				codes.publisher_ids[ id ]=v;
			}
		}
	});
	
//	ls(publishers);

	console.log("Writing json/publishers.json")
	fs.writeFileSync(__dirname+"/../json/publishers.json",JSON.stringify(publishers,null,'\t'));

//	return;
}	
	var files=[
			{
				url:"http://dev.iatistandard.org/_static/codelists/json/en/Sector.json",
				name:"sector",
			},
			{
				url:"http://dev.iatistandard.org/_static/codelists/json/en/TransactionType.json",
				name:"transaction_type",
			},
			{
				url:"http://dev.iatistandard.org/_static/codelists/json/en/ActivityStatus.json",
				name:"activity_status",
			}
		];
	
	files.forEach(function(opts){
	
		console.log("Fetching IATI "+opts.name)

		var js=wait.for(http_getbody,opts.url);
		var j=JSON.parse(js);
		var o={};
		j["data"].forEach(function(v){
			o[ v.code ]=v.name;
		});
		codes[opts.name]=o;

	});

	
	console.log("Fetching country_codes")

// it turns out wikipedia is the best source, since the iso website has decided to hide its most precious data behind a paywall
// so now we will scrape wikipedia

	var x=wait.for(http_getbody,"http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2");
	var j=refry.xml(x);
	var o={};
	
	refry.tags(j,{0:"table",class:"wikitable"},function(it){
		refry.tags(it,"td",function(it){
			var name=it.title;
			var code=refry.tagval_trim(it,"tt");
			if( name && code )
			{
				if(name!="unassigned" && name!="user-assigned")
				{
					var aa=name.split(":");
					if(aa[1])
					{
						o[code]=aa[1].trim();
					}
					else
					{
						o[code]=name;
					}
				}
			}
		});
	});
	
//	ls(o);
	
	codes["country"]=o;



// IATI sectors ->   https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=0&output=csv
// IATI funders ->   https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=2&output=csv
// CRS funders ->    https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=4&output=csv
// CRS countries ->  https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=7&output=csv
// CRS 2012 ->       https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=3&output=csv
// local currency ->       https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=8&output=csv

	console.log("Fetching IATI sector groups csv")

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=0&output=csv");
	var lines=x.split("\n");
	lines=lines.map(function(l){return l.split(",")});

	var o={};

	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var num=parseInt(v[0]);
		var str=v[1];
		if(num && str)
		{
			o[num]=str;
		}
	}
	
//	ls(o);
		
	codes["sector_group"]=o;


	console.log("Fetching IATI funders csv")

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=2&output=csv");
	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node

	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[3];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}
	
//	ls(o);
	codes["iati_funders"]=o;

	console.log("Fetching local currency csv")

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=8&output=csv");
	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node

	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[1];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}
	
//	ls(o);
	codes["local_currency"]=o;

	
	console.log("Fetching CRS funders csv")

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=4&output=csv");
	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node

	var d={};
	var o={};
	var funder_names={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[1]);
		var b=v[0];
		var c=v[2];
		var display_name=v[3];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
		if(a && a.length>0 && c && c.length>0 )
		{
			d[a.trim()]=true;
		}
		if(a && a.length>0 && display_name && display_name.length>0 )
		{
			funder_names[a.trim()]=display_name;
		}
	}
	
//	ls(o);
	codes["funder_names"]=funder_names;
	codes["crs_funders"]=o;
	codes["crs_no_iati"]=d;


	console.log("Fetching CRS countries csv")

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=7&output=csv");
	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node

	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[1]);
		var b=v[0];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}
	
//	ls(o);
	codes["crs_countries"]=o;
	
		
	console.log("Writing json/iati_codes.json")	
//	fs.writeFileSync("json/iati_codes.js","exports.codes="+JSON.stringify(codes)+";\n");
	fs.writeFileSync(__dirname+"/../json/iati_codes.json",JSON.stringify(codes,null,'\t'));




	var rev_crs_funders={};
	for( var n in codes["crs_funders"]   ) { rev_crs_funders[   codes["crs_funders"  ][n] ]=n }
	var rev_crs_countries={};
	for( var n in codes["crs_countries"] ) { rev_crs_countries[ codes["crs_countries"][n] ]=n }
	
	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=3&output=csv");
	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node

	var o={};

	var head=[];
	for(var i=0;i<lines[0].length;i++)
	{
		var v=lines[0][i];
		head[i]=rev_crs_funders[ v.trim() ];
	}
//	ls(head);
	
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=rev_crs_countries[ v[0].trim() ];
		if(a)
		{
			var t={};
			o[a]=t;
			for(var j=0;j<v.length;j++)
			{
				var h=head[j];
				if(h)
				{
					var n=Number(v[j]);
					if(n)
					{
						t[h]=Math.round(n*1000000); // convert to usd, from millions of usd
					}
				}
			}
		}
	}
	
//	ls(o);

	console.log("Writing json/crs_2012.json")
//	fs.writeFileSync("json/crs_2012.js","exports.crs="+JSON.stringify(o)+";\n");
	fs.writeFileSync(__dirname+"/../json/crs_2012.json",JSON.stringify(o,null,'\t'));

//	codes["local_currency"]=o;


//

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=11&output=csv");
	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node

	var o={};

	var head=[];
	for(var i=0;i<lines[0].length;i++)
	{
		var v=lines[0][i];
		head[i]=v.trim();
	}
//	ls(head);
	
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=rev_crs_countries[ v[0].trim() ];
		if(a)
		{
			var t={};
			o[a]=t;
			for(var j=0;j<v.length;j++)
			{
				var h=head[j];
				if(h)
				{
					var n=Number(v[j]);
					if(n)
					{
						t[h]=Math.round(n*1000000); // convert to usd, from millions of usd
					}
				}
			}
		}
	}
	
//	ls(o);

	console.log("Writing json/crs_2012.json")
//	fs.writeFileSync("json/crs_2012.js","exports.crs="+JSON.stringify(o)+";\n");
	fs.writeFileSync(__dirname+"/../json/crs_2012_sectors.json",JSON.stringify(o,null,'\t'));


}


