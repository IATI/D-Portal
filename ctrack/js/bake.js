// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var fs = require("fs");

var plate=require("./plate.js");


fs.writeFileSync("json/chunks.json",JSON.stringify(
		plate.fill_chunks(
			fs.readFileSync("chunks/base.html",'utf8')
		)
	)
);


console.log("Parsed chunks/base.html into json/chunks.json");


/*
var sys = require('sys')
var child_process = require('child_process');

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
"js/require.js",
"../dstore/json/iati_codes.js",
"../dstore/json/crs_2012.js",
"js/ctrack.chunks.js",
"js/ctrack.plate.js",
"js/ctrack.html.js",
"js/ctrack.iati.js",
"js/ctrack.json.js"];


console.log("Creating js/ctrack.js")
exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -c -m -o js/ctrack.js -p relative --source-map js/ctrack.map ");

console.log("All done.")

*/
