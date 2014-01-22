var sys = require('sys')
var child_process = require('child_process');

var exec=function(s,f){
	console.log(s);
	child_process.exec(s, function(error, stdout, stderr) {
		sys.puts(stdout);
		if(f) { f(null,stdout); }
		});
};


/*
for i,v in ipairs(bake.files_min_js) do
print('compressing '..v)
	bake.execute( bake.cd_base , bake.cmd.java ,
"-jar "..arg.compiler.." --js_output_file "..bake.cd_out.."/"..v..".min.js --js "..bake.cd_out.."/"..v..".js")

end
*/


var jsfiles=[
"src/ctrack.chunks.js",
"src/ctrack.plate.js",
"src/ctrack.html.js",
"src/ctrack.iati.js",
"src/ctrack.json.js"];



//console.log( jsfiles.join(" ") )

exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -b -o src/ctrack.max.js");
exec("node_modules/uglify-js/bin/uglifyjs "+jsfiles.join(" ")+" --wrap ctrack -c -m -o src/ctrack.min.js");



