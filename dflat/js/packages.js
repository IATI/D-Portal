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
	if( argv.source=="datastore")
	{
		await packages.prepare_download_datastore(argv)
	}
	else
	{
		await packages.prepare_download_registry(argv)
	}
}

packages.prepare_download_common=async function(argv)
{

	argv.dir_packages=path.join(argv.dir,"packages")

	await fse.emptyDir(argv.dir) // create output directories
	await fse.emptyDir(argv.dir_packages)

}

packages.prepare_download_common_slugs=async function(argv,slugs)
{
	slugs.sort(function(a,b){
		if (a.slug < b.slug) { return -1 }
		if (a.slug > b.slug) { return  1 }
		return 0
	})
	await fse.writeFile( path.join(argv.dir,"packages.json") , stringify( slugs , {space:" "} ) )

	var txt=[]
	var curl=[]
	var parse=[]

	for(var idx in slugs)
	{
		var it=slugs[idx]
		var slug=it.slug
		var url=it.url
		
		txt.push(slug+" "+url+"\n")

		curl.push("echo Downloading "+slug+" : "+url+" | tee packages/"+slug+".log ; curl -s -S -A \"Mozilla/5.0\" --fail --retry 4 --retry-delay 10 --speed-time 30 --speed-limit 1000 -k -L -o packages/"+slug+".xml \""+url+"\" 2>&1 >/dev/null | tee -a packages/"+slug+".log\n")

		parse.push("echo Parsing "+slug+" : "+url+" ; echo 2>&1 >/dev/null | tee packages/"+slug+".log\n")

	}


	await fse.writeFile( path.join(argv.dir,"packages.txt") , txt.join("") )
	await fse.writeFile( path.join(argv.dir,"packages.curl") , curl.join("") )
	await fse.writeFile( path.join(argv.dir,"packages.parse") , parse.join("") )

	await fse.writeFile( path.join(argv.dir,"fetch_packages_with_curl_in_parallel.sh") ,`

cd \`dirname $0\`

cat packages.curl | sort -R | parallel -j 0 --bar

cat packages/*.log >packages.curl.log

`)
	await fse.chmod(     path.join(argv.dir,"fetch_packages_with_curl_in_parallel.sh") , 0o755 )


	await fse.writeFile( path.join(argv.dir,"parse_packages_in_parallel.sh") ,`

cd \`dirname $0\`

cat packages.parse | sort -R | parallel -j 0 --bar

`)
	await fse.chmod(     path.join(argv.dir,"parse_packages_in_parallel.sh") , 0o755 )


	console.log("You may now run the scripts in \""+argv.dir+"\" to fetch and parse packages.")
}

/*

new datastore

fetch all datasets in pages

https://datastore.iati.cloud/api/datasets/?format=json&page_size=20&page=1


then fetch all activities for each dataset in pages

https://datastore.iati.cloud/api/activities/?format=json&fields=all&dataset=3112&page_size=20page=1

*/


packages.prepare_download_datastore=async function(argv)
{
	console.log("Preparing \""+argv.dir+"\" directory to fetch upto "+argv.limit+" IATI packages from the datastore.")
	
	await packages.prepare_download_common(argv)

}



packages.prepare_download_registry=async function(argv)
{
	console.log("Preparing \""+argv.dir+"\" directory to fetch upto "+argv.limit+" IATI packages via the registry.")
	
	await packages.prepare_download_common(argv)
	

	var limit=1000	
	if(argv.limit<limit) { limit=argv.limit }
	
	var total=0
	
	var results=[]

	while( total < argv.limit )
	{
		var body=JSON.parse( await getbody("https://iatiregistry.org/api/3/action/package_search?rows="+limit+"&start="+total) )

// end of list
		if( body.result.results.length == 0 ) { break }

		results=results.concat(body.result.results)
		
		total += limit
	}
	await fse.writeFile( path.join(argv.dir,"packages.iatiregistry.json") , stringify( results , {space:" "} ) )

	console.log("Found "+results.length+" packages.")

// skim the junk
	var slugs=[]
	for(var idx in results)
	{
		var result=results[idx]
		var slug=result.name
		var url=result.resources[0].url
		
		slugs.push( {slug:slug,url:url} )
	}

	await packages.prepare_download_common_slugs(argv,slugs)
}

