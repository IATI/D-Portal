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
//	console.log(s);
	child_process.exec(s, function(error, stdout, stderr) {
		sys.puts(stdout);
		if(f) { f(null,stdout); }
		});
};

var jsfiles=[
"js/ctrack.chunks.js",
"js/ctrack.plate.js",
"js/ctrack.html.js",
"js/ctrack.iati.js",
"js/ctrack.json.js"];


console.log("Creating js/ctrack.max.js")
exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -b -o js/ctrack.max.js");

console.log("Creating js/ctrack.min.js")
exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -c -m -o js/ctrack.min.js");

console.log("All done.")
