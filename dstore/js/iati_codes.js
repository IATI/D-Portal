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
	
		var js=wait.for(http_getbody,opts.url);
		var j=JSON.parse(js);
		var o={};
		j["data"].forEach(function(v){
			o[ v.code ]=v.name;
		});
		codes[opts.name]=o;

	});
	
	fs.writeFileSync("json/iati_codes_to_name.json",JSON.stringify(codes));

}


