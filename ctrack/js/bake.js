// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var fs = require("fs");
var util=require('util');

var plate=require("./plate.js");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


try { fs.mkdirSync("json"); } catch(e){}

var ff=fs.readdirSync("text");

var tongues=[];
var chunks={}

for(var i=0;i<ff.length;i++)
{
	var v=ff[i];
	if( v.length==7 && ( v.slice(-4)==".txt") ) // xxx.txt tongue files
	{
		var t=v.slice(0,3);
		tongues.push(t);
		fs.writeFileSync("json/"+t+".json",JSON.stringify(
				plate.fill_chunks(
					fs.readFileSync("text/"+t+".txt",'utf8')
				)
			)
		);
		console.log("Adding "+t+" tongue");
	}
	else // normal chunks
	{
		console.log("Reading "+"text/"+v);
		plate.fill_chunks(fs.readFileSync("text/"+v,'utf8'),chunks);
	}
}

console.log("Writing json/chunks.json");
fs.writeFileSync("json/chunks.json",JSON.stringify(chunks));

console.log("Writing json/tongues.js");
var s=[];
for(var i=0;i<tongues.length;i++)
{
	var v=tongues[i];
	s.push("exports."+v+"=require(\"./"+v+".json\");\n")
}
fs.writeFileSync("json/tongues.js",s.join(""));


