// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var packages=exports;

var util=require("util")
var path=require("path")
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var fse=require("fs-extra")
var stringify = require('json-stable-stringify');

var request=require('request');

// I promise to turn a url into data
var getbody=require("pify")( function(url,cb)
{
	request(url, function (error, response, body) {
		if(error) { cb(error,null); }
		else      { cb(null,body);  }
	});
} );


packages.prepare_download=async function(argv)
{
	console.log("Preparing \""+argv.dir+"\" directory to fetch upto "+argv.limit+" IATI packages.")
	
	var dir_downloaded=path.join(argv.dir,"downloaded")
	var dir_packages=path.join(argv.dir,"packages")

	await fse.emptyDir(argv.dir) // create output directories
	await fse.emptyDir(dir_downloaded)
	await fse.emptyDir(dir_packages)

	var body=JSON.parse( await getbody("https://iatiregistry.org/api/3/action/package_search?rows="+argv.limit) )
	var results=body.result.results

	await fse.writeFile( path.join(argv.dir,"packages.meta.json") , stringify( results , {space:" "} ) )


	var curl=[]

	for(var idx in results)
	{
		var result=results[idx]
		var slug=result.name
		var url=result.resources[0].url

		await fse.writeFile( path.join( dir_packages ,slug+".meta.json") , stringify( result , {space:" "} ) )
		
		curl.push("echo "+slug+" : "+url+" ; curl -s -S -A \"Mozilla/5.0\" --fail --retry 4 --retry-delay 10 --speed-time 30 --speed-limit 1000 -k -L -o downloaded/"+slug+".xml \""+url+"\" 2>&1 >/dev/null | tee downloaded/"+slug+".log\n")
		
	}


	await fse.writeFile( path.join(argv.dir,"downloaded.curl") , curl.join("") )

	await fse.writeFile( path.join(argv.dir,"fetch_packages_with_curl_in_parallel.sh") ,"cd `dirname $0` ; cat downloaded.curl | sort -R | parallel -j 0 --bar")
	await fse.chmod(     path.join(argv.dir,"fetch_packages_with_curl_in_parallel.sh") , 0o755 )
	
	console.log("You may now run the script "+path.join(argv.dir,"fetch_packages_with_curl_in_parallel.sh")+" to download packages.")

}
