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

	argv.dir_downloads  = path.join(argv.dir,"downloads")
	argv.dir_packages   = path.join(argv.dir,"packages")
	argv.dir_publishers = path.join(argv.dir,"publishers")
	argv.dir_countries  = path.join(argv.dir,"countries")
	argv.dir_activities = path.join(argv.dir,"activities")

	await fse.emptyDir(argv.dir) // create output directories
	await fse.emptyDir(argv.dir_downloads)
	await fse.emptyDir(argv.dir_packages)
	await fse.emptyDir(argv.dir_publishers)
	await fse.emptyDir(argv.dir_countries)
	await fse.emptyDir(argv.dir_activities)

}

packages.prepare_download_common_downloads=async function(argv,downloads)
{
	downloads.sort(function(a,b){
		if (a.slug < b.slug) { return -1 }
		if (a.slug > b.slug) { return  1 }
		return 0
	})
	await fse.writeFile( path.join(argv.dir,"downloads.json") , stringify( downloads , {space:" "} ) )

	var txt=[]
	var curl=[]
	for(var idx in downloads)
	{
		var it=downloads[idx]
		
		txt.push(it.slug+" "+it.url+"\n")

		curl.push("echo Downloading "+it.slug+" : "+it.url+" | tee downloads/"+it.slug+".log ; curl -s -S -A \"Mozilla/5.0\" --fail --retry 4 --retry-delay 10 --speed-time 30 --speed-limit 1000 -k -L -o downloads/"+it.slug+".xml \""+it.url+"\" 2>&1 >/dev/null | tee -a downloads/"+it.slug+".log\n")
	}
	await fse.writeFile( path.join(argv.dir,"downloads.txt") , txt.join("") )
	await fse.writeFile( path.join(argv.dir,"downloads.curl") , curl.join("") )



	var txt=[]
	var parse=[]
	for(var idx in downloads)
	{
		var it=downloads[idx]
		
		txt.push(it.slug+"\n")

		parse.push("echo Parsing "+it.slug+" | tee packages/"+it.slug+".log ; echo 2>&1 >/dev/null | tee packages/"+it.slug+".log\n")
	}
	await fse.writeFile( path.join(argv.dir,"packages.txt") , parse.join("") )
	await fse.writeFile( path.join(argv.dir,"packages.parse") , parse.join("") )



	await fse.writeFile( path.join(argv.dir,"downloads.sh") ,
`
cd \`dirname $0\`

cat downloads.curl | sort -R | parallel -j 0 --bar

cat downloads/*.log >downloads.curl.log

`)
	await fse.chmod(     path.join(argv.dir,"downloads.sh") , 0o755 )


	await fse.writeFile( path.join(argv.dir,"packages.sh") ,
`
cd \`dirname $0\`

cat packages.parse | sort -R | parallel -j 0 --bar

`)
	await fse.chmod(     path.join(argv.dir,"packages.sh") , 0o755 )


	console.log("You may now run the scripts in \""+argv.dir+"\" to download and parse packages.")
}

/*

new datastore

fetch all datasets in pages

https://datastore.iati.cloud/api/datasets/?format=json&page_size=20&page=1


then fetch all activities for each dataset in pages

https://datastore.iati.cloud/api/activities/?format=xml&fields=all&dataset=3112&page_size=20page=1

*/


packages.prepare_download_datastore=async function(argv)
{
	console.log("Preparing \""+argv.dir+"\" directory to fetch upto "+argv.limit+" IATI packages from the datastore.")
	
	await packages.prepare_download_common(argv)

	var limit=20
	if(argv.limit<limit) { limit=argv.limit }
	
	var total=0
	var page=1
	
	var results=[]

	while( total < argv.limit )
	{
		process.stdout.write(".");

		var body=JSON.parse( await getbody("https://datastore.iati.cloud/api/datasets/?format=json&page_size="+limit+"&page="+page) )

// end of list
		if( !body.results ) { break }
		
		results=results.concat(body.results)
		
		total += limit
		page  += 1
	}
	process.stdout.write("\n");
	await fse.writeFile( path.join(argv.dir,"packages.datastore.json") , stringify( results , {space:" "} ) )

	console.log("Found "+results.length+" packages.")

// skim the junk
	var downloads=[]
	for(var idx in results)
	{
		var result=results[idx]
		var slug=result.name
		var url="https://datastore.iati.cloud/api/activities/?format=xml&fields=all&dataset="+result.id+"&page_size=20page=1"
		
		downloads.push( {slug:slug,url:url} )
	}

	await packages.prepare_download_common_downloads(argv,downloads)

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
		process.stdout.write(".");

		var body=JSON.parse( await getbody("https://iatiregistry.org/api/3/action/package_search?rows="+limit+"&start="+total) )

// end of list
		if( body.result.results.length == 0 ) { break }

		results=results.concat(body.result.results)
		
		total += limit
	}
	process.stdout.write("\n");
	await fse.writeFile( path.join(argv.dir,"packages.registry.json") , stringify( results , {space:" "} ) )

	console.log("Found "+results.length+" packages.")

// skim the junk
	var downloads=[]
	for(var idx in results)
	{
		var result=results[idx]
		var slug=result.name
		var url=result.resources[0].url
		
		downloads.push( {slug:slug,url:url} )
	}

	await packages.prepare_download_common_downloads(argv,downloads)
}

