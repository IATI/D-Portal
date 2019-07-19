// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dfetch=exports;

var util=require("util")
var path=require("path")
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var pfs=require("pify")( require("fs") )
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


dfetch.download_prepare=async function(argv)
{
	console.log("Preparing \""+argv.dir+"\" to fetch upto "+argv.limit+" IATI packages.")

	if(! await pfs.existsSync(argv.dir) ){ await pfs.mkdirSync(argv.dir) } // create output directory

	var body=JSON.parse( await getbody("https://iatiregistry.org/api/3/action/package_search?rows="+argv.limit) )
	var results=body.result.results

	await pfs.writeFile( path.join(argv.dir,"all.meta.json") , stringify( results , {space:" "} ) )

	for(var idx in results)
	{
		var result=results[idx]
		var slug=result.name
		var url=result.resources[0].url
		ls(slug+" : "+url)

		await pfs.writeFile( path.join(argv.dir,slug+".meta.json") , stringify( result , {space:" "} ) )
	}

}
