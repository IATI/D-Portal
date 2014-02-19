// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var sys = require('sys')
var child_process = require('child_process');
var lazy = require("lazy");
var fs = require("fs");


var text = fs.readFileSync("chunks/base.html",'utf8');

var chunk;
var chunks={};

text.split("\n").forEach(function(l){
		if(l[0]=="#")
		{
			if(l[1]!="#")
			{
				var name=l.substring(1).replace(/\s+/g, " ").split(" ")[0];
				if(name)
				{
					chunk=chunks[name];
					if(!chunk)
					{
						chunk=[];
						chunks[name]=chunk;				
					}
				}
			}
		}
		else
		if(chunk)
		{
			chunk.push(l);
		}
	});

for( n in chunks )
{
	chunks[n]=chunks[n].join("\n");
}

fs.writeFileSync("js/ctrack.chunks.js","exports.chunks="+JSON.stringify(chunks)+";");


console.log("Parsed chunks/base.html into js/ctrack.chunks.js")


var exec=function(s,f){
	console.log(s);
	child_process.exec(s, function(error, stdout, stderr) {
		sys.puts(stdout);
//		sys.puts(stderr);
		if(error){throw new Error(error);}
		if(f) { f(null,stdout); }
		});
};

var jsfiles=[
"js/ctrack.chunks.js",
"js/ctrack.plate.js",
"js/ctrack.html.js",
"js/ctrack.iati.js",
"js/ctrack.json.js"];


console.log("Creating js/ctrack.js")
exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -c -m -o js/ctrack.js -p relative --source-map js/ctrack.map ");

console.log("All done.")
