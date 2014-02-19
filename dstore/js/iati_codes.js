// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var iati_codes=exports;
if(typeof iati_codes  === "undefined") { iati_codes ={}; }
required["iati_codes"]=iati_codes;

var util=require('util');
var wait=require('wait.for');
var http=require('http');
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

iati_codes.fetch = function(){

	var codes={};


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
	

	console.log("Writing json/iati_codes_to_name.json")
	
	fs.writeFileSync("js/codes.js","exports.codes="+JSON.stringify(codes)+";\n");
	fs.writeFileSync("json/iati_codes_to_name.json",JSON.stringify(codes));

}


