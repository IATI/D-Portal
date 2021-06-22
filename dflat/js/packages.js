// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var packages=exports;

var util=require("util")
var path=require("path")
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var fse=require("fs-extra")
var stringify = require('json-stable-stringify');

var request=require('request');

var fs=require("fs")
var pfs=require("pify")( require("fs") )
var dflat=require("./dflat.js")
var jml=require("./jml.js")
var xson=require("./xson.js")

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
	argv.dir_logs   = path.join(argv.dir,"logs")
	argv.dir_xml   = path.join(argv.dir,"xml")

	await fse.emptyDir(argv.dir) // create output directories
	await fse.emptyDir(argv.dir_downloads)
	
	await fse.emptyDir(argv.dir_logs)
	await fse.emptyDir(argv.dir_xml)
	
}

packages.prepare_download_common_downloads=async function(argv,downloads)
{
	downloads.sort(function(a,b){
		if (a.slug < b.slug) { return -1 }
		if (a.slug > b.slug) { return  1 }
		return 0
	})

	var txt=[]
	var curl=[]
	for(var idx in downloads)
	{
		var it=downloads[idx]

		if( it.url.toLowerCase().startsWith("http") || it.url.toLowerCase().startsWith("ftp") ) // some mild sanity/security
		{
			it.url=it.url.split(" ").join("%20")	// spaces break *sometimes* when used in the url
			it.url=it.url.split("(").join("%28").split(")").join("%29")	// and brackets confuse bash
			
			txt.push("'"+it.slug+"' '"+it.url+"'\n")
		}
		else
		{
			console.log("ignoring bad url "+it.slug+" "+it.url)
		}
	}
	await fse.writeFile( path.join(argv.dir,"downloads.txt") , txt.join("") )


	await fse.writeFile( path.join(argv.dir,"downloads.sh") ,
`
dirname=$( dirname "$(readlink -f "$0")" )
cd "$dirname"

if ! [ -x "$(command -v curl)" ]; then
	echo "curl is not installed, atempting to install"
	sudo apt install -y curl
fi

if ! [ -x "$(command -v parallel)" ]; then
	echo "parallel is not installed, atempting to install"
	sudo apt install -y parallel
fi

if ! [ -x "$(command -v uchardet)" ]; then
	echo "uchardet is not installed, atempting to install"
	sudo apt install -y uchardet
fi

if ! [ -x "$(command -v iconv)" ]; then
	echo "iconv is not installed, atempting to install"
	sudo apt install -y iconv
fi

if ! [ -x "$(command -v pcregrep)" ]; then
	echo "pcregrep is not installed, atempting to install"
	sudo apt install -y pcregrep
fi

if ! [ -x "$(command -v xsltproc)" ]; then
	echo "xsltproc is not installed, atempting to install"
	sudo apt install -y xsltproc
fi

if ! [ -x "$(command -v sed)" ]; then
	echo "sed is not installed, atempting to install"
	sudo apt install -y sed
fi


dodataset() {
declare -a 'a=('"$1"')'
slug=\x24{a[0]}
url=\x24{a[1]}

echo > logs/$slug.txt

echo Downloading $slug from "$url" | tee -a logs/$slug.txt

httpcode=$( curl -w "%{http_code}" --fail --silent --show-error --retry 4 --retry-delay 10 --speed-time 30 --speed-limit 100 --insecure --ciphers 'DEFAULT:!DH' --location --output downloads/$slug.xml "$url" )

if [ "$httpcode" -ne "200" ] && [ "$httpcode" -ne "301" ] && [ "$httpcode" -ne "302" ] && [ "$httpcode" -ne "226" ] ; then

	rm downloads/$slug.xml
	echo curl: download ERROR $httpcode | tee -a logs/$slug.txt

else

# force output to utf8 and replace xml declaration on first line of file, iconv may fail if uchardet picks a bad charset...

	ffmt=$(uchardet downloads/$slug.xml)
	mv downloads/$slug.xml downloads/$slug.xml2
	iconv -f $ffmt -t utf8 downloads/$slug.xml2 -o downloads/$slug.xml || cp downloads/$slug.xml2 downloads/$slug.xml
	rm downloads/$slug.xml2
	sed -i'' 's/^<?.*?>//g' downloads/$slug.xml

# try and convert old files to 2.03

	version=$( pcregrep --buffer-size=10000000 --no-filename -o1 -r '<iati-.*version=\"([^\"]*)\"' downloads/$slug.xml | head -n 1 )

	if [ ! -z "$version" ]; then
	if (( $(echo "$version < 2.0" |bc -l) )); then

		fmt="activities"
		if grep -q "<iati-organisations" downloads/$slug.xml ; then
			fmt="organisations"
		fi
		
		echo "Converting IATI $fmt version $version to version 2.03" | tee -a logs/$slug.txt

		if [ ! -f "iati-$fmt.xsl" ] ; then
			curl -sS https://raw.githubusercontent.com/codeforIATI/iati-transformer/main/iati_transformer/static/iati-$fmt.xsl -o iati-$fmt.xsl
		fi

		cp downloads/$slug.xml downloads/$slug.xml2
		xsltproc -o downloads/$slug.xml ./iati-$fmt.xsl downloads/$slug.xml2 2>&1 | tee -a logs/$slug.txt
		rm downloads/$slug.xml2
		
	fi
	fi
	
fi

}
export -f dodataset

if [ "$1" = "debug" ] ; then
	cat downloads.txt | parallel -j 1 --bar dodataset
else
	cat downloads.txt | sort -R | parallel -j 64 --bar dodataset
fi

cat logs/*.txt >logs.txt

`)
	await fse.chmod(     path.join(argv.dir,"downloads.sh") , 0o755 )


	await fse.writeFile( path.join(argv.dir,"packages.sh") ,
`
dirname=$( dirname "$(readlink -f "$0")" )
cd "$dirname"

if ! [ -x "$(command -v parallel)" ]; then
	echo "parallel is not installed, atempting to install"
	sudo apt install -y parallel
fi

dodataset() {
declare -a 'a=('"$1"')'
slug=\x24{a[0]}
url=\x24{a[1]}

echo Parsing $slug from "$url" | tee -a logs/$slug.txt

node ${argv.filename_dflat} --dir . packages $slug 2>&1 | tee -a logs/$slug.txt

}
export -f dodataset

if [ "$1" = "debug" ] ; then
	cat downloads.txt | parallel -j 1 --bar dodataset
else
	cat downloads.txt | sort -R | parallel -j -1 --bar dodataset
fi

cat logs/*.txt >logs.txt

`)
	await fse.chmod(     path.join(argv.dir,"packages.sh") , 0o755 )


	await fse.writeFile( path.join(argv.dir,"sqlite.sh") ,
`
dirname=$( dirname "$(readlink -f "$0")" )
cd "$dirname"

if ! [ -x "$(command -v parallel)" ]; then
	echo "parallel is not installed, atempting to install"
	sudo apt install -y parallel
fi

if ! [ -x "$(command -v sqlite3)" ]; then
	echo "sqlite3 is not installed, atempting to install"
	sudo apt install -y sqlite3
fi


# ccreate new sqlite database

rm database.sqlite
node ${argv.filename_dflat} sqlite tables | sqlite3 database.sqlite | tee -a logs/$slug.txt


dodataset() {
declare -a 'a=('"$1"')'
slug=\x24{a[0]}
url=\x24{a[1]}

echo sqlite $slug from "$url" | tee -a logs/$slug.txt

node ${argv.filename_dflat} sqlite insert downloads/$slug.xml | sqlite3 database.sqlite | tee -a logs/$slug.txt

}
export -f dodataset

cat downloads.txt | parallel -j 1 --bar dodataset

cat logs/*.txt >logs.txt

`)
	await fse.chmod(     path.join(argv.dir,"sqlite.sh") , 0o755 )


	console.log(
`
You may now run the bash scripts in \"`+argv.dir+`\" to download and parse packages.

These scripts will try and apt install any missing commands that they require.
`)

}



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

		var body=JSON.parse( await getbody("https://iatidatastore.iatistandard.org/api/datasets/?format=json&page_size="+limit+"&page="+page) )

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
		var url="https://iatidatastore.iatistandard.org/api/activities/?format=xml&fields=all&dataset="+result.id+"&page_size=20&page=1"
		
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

packages.process_download_save=async function(argv,json,basename)
{

// The generated time stamps in the iati-activities tend to be auto generated garbage so are removed here
// otherwise they change every time we fetch them and confuse any attempt to log what has changed over time.

	dflat.clean_remove_dataset_timestamps(json)


	// do this one virst as it may adjust/create iati-activities@version to match the given data
	var xml=dflat.xson_to_xml(json)
	await pfs.writeFile( basename+".xml" ,xml);

/*
	await pfs.writeFile( basename+".json" ,stringify(json,{space:" "}));

	var stats = xson.xpath_stats(json)
	await pfs.writeFile( basename+".stats.json" ,stringify(stats,{space:" "}));

	if( json["/iati-activities/iati-activity"] )
	{
		var csv=dflat.xson_to_xsv(json,"/iati-activities/iati-activity",{"/iati-activities/iati-activity":true})
		await pfs.writeFile( basename+".csv" ,csv);
	}
	else
	if( json["/iati-organisations/iati-organisation"] )
	{
		var csv=dflat.xson_to_xsv(json,"/iati-organisations/iati-organisation",{"/iati-organisations/iati-organisation":true})
		await pfs.writeFile( basename+".csv" ,csv);
	}
*/

}

packages.process_download_link=async function(basename,linkname)
{
	await fse.ensureSymlink(basename+".json",      linkname+".json")
	await fse.ensureSymlink(basename+".stats.json",linkname+".stats.json")
	await fse.ensureSymlink(basename+".xml"       ,linkname+".xml")
	await fse.ensureSymlink(basename+".csv"       ,linkname+".csv")
}

packages.process_download=async function(argv)
{
	let slug=argv._[1]
		
	let downloaded_filename=path.join(argv.dir,"downloads/"+slug+".xml")
	
	if( ! fs.existsSync( downloaded_filename ) )
	{
		console.log( "dflat: input XML file does not exist" )
		return
	}

//	console.log( "processing "+downloaded_filename )
	
	let dat=await pfs.readFile( downloaded_filename ,{ encoding: 'utf8' });
	let json={}

	try{

		json=dflat.xml_to_xson(dat)

	}catch(e){
		
		console.log( "dflat: invalid XML format" )
		return
	}

	dflat.clean(json) // we want cleaned up data
	
	let found=0
	let total=0
	let basename=path.join(argv.dir,"xml/"+slug)

// if we find some activities, spit them out individually

	if( json["/iati-activities/iati-activity"] || json["/iati-activities@version"] )
	{
		found=found+1
		let tab=json["/iati-activities/iati-activity"] || []
		console.log( "found "+tab.length+" activities" )
		let idx=0
		await fse.emptyDir(basename)
		for( const act of tab )
		{
			let aid=dflat.saneid( act["/iati-identifier"] || ("ERROR-NO-ID-"+idx) )
			await packages.process_download_save( argv , { "/iati-activities/iati-activity":[act] } , basename+"/"+aid )
			idx=idx+1
			total=total+1
		}
	}

// if we find some organisations, spit them out individually

	if( json["/iati-organisations/iati-organisation"] || json["/iati-organisations@version"] )
	{
		found=found+1
		let tab=json["/iati-organisations/iati-organisation"] || []
		console.log( "found "+tab.length+" organisations" )
		let idx=0
		await fse.emptyDir(basename)
		for( const org of tab )
		{
			let pid=dflat.saneid( org["/organisation-identifier"] || org["/reporting-org@ref"] || ("ERROR-NO-ID-"+idx) )
			await packages.process_download_save( argv , { "/iati-organisations/iati-organisation":[org] } , basename+"/"+pid )
			idx=idx+1
			total=total+1
		}
	}

	if( found==0 )
	{
		console.log( "dflat: no activities or organisations found in XML file" )
		return
	}

}
