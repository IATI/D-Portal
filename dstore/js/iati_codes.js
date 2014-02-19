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
	
	var x=wait.for(http_getbody,"http://www.iso.org/iso/home/standards/country_codes/country_names_and_code_elements_xml.htm");
	var j=refry.xml(x);
	var o={};
	j[0][1].forEach(function(v){
		var name=(v[1][0][1][0]);
		var a2=(v[1][1][1]);
		o[a2]=name;
	});
	codes["country"]=o;
	

	console.log("Writing json/iati_codes_to_name.json")
	
	fs.writeFileSync("json/iati_codes_to_name.json",JSON.stringify(codes));

}


