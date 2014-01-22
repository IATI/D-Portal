var sys = require('sys')
var child_process = require('child_process');

var exec=function(s,f){
	console.log(s);
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


exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -b -o js/ctrack.max.js");
exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -c -m -o js/ctrack.min.js");

