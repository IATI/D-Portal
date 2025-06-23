// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const cmd={}
export default cmd

import * as fs   from "fs"
import * as util from "util"
import * as path from "path"

import minimist     from "minimist"
import stringify    from "json-stable-stringify"
import dflat        from "./dflat.js"
import jml          from "./jml.js"
import xson         from "./xson.js"
import savi         from "./savi.js"
import fetch        from "./fetch.js"
import frankenstein from "./frankenstein.js"
import stats        from "./stats.js"
import packages     from "./packages.js"
import cronos       from "./cronos.js"
import dflat_sqlite from "./dflat_sqlite.js"


let pfs=fs.promises


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.parse=function(argv)
{
	argv.filename_dflat=import.meta.filename.replace(".js",".wrap.js")

	argv.cronos =           argv.cronos || process.env.DFLAT_CRONOS || "cronos"

	argv.dir    =           argv.dir    || process.env.DFLAT_DIR    || "dataflat"
	argv.limit  = parseInt( argv.limit  || process.env.DFLAT_LIMIT  || "999999"     )

// we need this to connect to the postgres server and read stats
	argv.pgro   = argv.pgro             || process.env.DSTORE_PGRO  || undefined                    ; // read only PG

}

cmd.parse_filename=async function(argv,opts)
{
	argv.filename = argv.filename || argv._[1]
	
	if( ! argv.filename ) { return }
	
	if( argv.filename.endsWith(opts.input) )
	{
		argv.filename=argv.filename.substring(0,argv.filename.length - opts.input.length)
	}
	
	if( ! argv.input )
	{
		argv.input=argv.filename + opts.input
	}

	if( ! argv.output )
	{
		argv.output=argv.filename + opts.output
	}

	
	console.log( argv.filename )
	console.log( argv.input )
	console.log( argv.output )

}

cmd.run=async function(argv)
{
	if( argv._[0]=="fetch" )
	{
		await fetch.all()
		return
	}

	if( argv._[0]=="xml2json" )
	{
		await cmd.parse_filename(argv,{input:".xml",output:".json"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			dflat.clean(json)
			var str=dflat.xson_to_string(json)

			await pfs.writeFile(argv.output,str);

			return
		}
	}
	
	if( argv._[0]=="xml2csv")
	{
		await cmd.parse_filename(argv,{input:".xml",output:".csv"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			dflat.clean(json)
			var csv=dflat.xson_to_xsv(json)

			await pfs.writeFile(argv.output,csv);

			return
		}
	}
	
	if( argv._[0]=="xml2html")
	{
		await cmd.parse_filename(argv,{input:".xml",output:".html"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xml_to_xson(dat)
			dflat.clean(json)
			var html=dflat.xson_to_html(json)

			await pfs.writeFile(argv.output,html);

			return
		}
	}

	if( argv._[0]=="json2xml" )
	{
		await cmd.parse_filename(argv,{input:".json",output:".xml"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=JSON.parse(dat)
			dflat.clean(json)
			var xml=dflat.xson_to_xml(json)
			
			await pfs.writeFile(argv.output,xml);

			return
		}
	}

	if( argv._[0]=="json2csv")
	{
		await cmd.parse_filename(argv,{input:".json",output:".csv"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=JSON.parse(dat)
			dflat.clean(json)
			var csv=dflat.xson_to_xsv(json)

			await pfs.writeFile(argv.output,csv);

			return
		}
	}
	
	if( argv._[0]=="json2html")
	{
		await cmd.parse_filename(argv,{input:".json",output:".html"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=JSON.parse(dat)
			dflat.clean(json)
			var html=dflat.xson_to_html(json)

			await pfs.writeFile(argv.output,html);

			return
		}
	}

	if( argv._[0]=="csv2json" )
	{
		await cmd.parse_filename(argv,{input:".csv",output:".json"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xsv_to_xson(dat)
			dflat.clean(json)
			var str=dflat.xson_to_string(json)

			await pfs.writeFile(argv.output,str);

			return
		}
	}

	if( argv._[0]=="csv2xml" )
	{
		await cmd.parse_filename(argv,{input:".csv",output:".xml"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xsv_to_xson(dat)
			dflat.clean(json)
			var xml=dflat.xson_to_xml(json)
			
			await pfs.writeFile(argv.output,xml);

			return
		}
	}

	if( argv._[0]=="csv2html")
	{
		await cmd.parse_filename(argv,{input:".csv",output:".html"})
		if(argv.input)
		{
			var dat=await pfs.readFile(argv.input,{ encoding: 'utf8' });
			var json=dflat.xsv_to_xson(dat)
			dflat.clean(json)
			var html=dflat.xson_to_html(json)

			await pfs.writeFile(argv.output,html);

			return
		}
	}


	if( argv._[0]=="frankenstein" )
	{
		await frankenstein.all()
		return
	}

	if( argv._[0]=="stats" )
	{
		await stats.cmd(argv)
		return
	}

	if( argv._[0]=="packages" )
	{
		await packages.cmd_prepare(argv)
		return
	}
	if( argv._[0]=="packages-parse" )
	{
		await packages.cmd_process(argv)
		return
	}
	if( argv._[0]=="packages-meta" )
	{
		await packages.cmd_meta(argv)
		return
	}
	if( argv._[0]=="packages-join" )
	{
		await packages.cmd_join(argv)
		return
	}

	if( argv._[0]=="cronos" )
	{
		if( argv._[1] == "update" )
		{
			await cronos.update(argv)
		}
		else
		{
			await cronos.help(argv)
		}
		return
	}

	if( argv._[0]=="sqlite" )
	{
		await dflat_sqlite.cmd(argv)
		return
	}

	// help text
	console.log(
`
>	dflat xml2json filename[.xml]
>	dflat xml2csv filename[.xml]
>	dflat xml2html filename[.xml]

>	dflat json2xml filename[.json]
>	dflat json2csv filename[.json]
>	dflat json2html filename[.json]

>	dflat csv2json filename[.csv]
>	dflat csv2xml filename[.csv]
>	dflat csv2html filename[.csv]

Convert activities or organisations from filename[.xml|.json|.csv] into 
filename[.xml|.json|.csv|.html]

	--output filename[.json]
	Explicit output path/filename.

>	dflat fetch 

Fetch remote files and update cached data

>	dflat frankenstein 

Build a full example activity from parts of other activities

>	dflat stats 

Build or update json based stats

>	dflat packages 

Prepare a data directory to fetch IATI packages into.

	--dir dataflat
	Directory to download into.

	--limit 999999 
	Maximum number of packages to download.

	--source registry
	The source for the packages, registry or datastore.

>	dflat packages-parse filename

Process a downloaded package into multiple files. The file to process 
should be found in downloads/filename.xml we will then process it 
and write it into other locations such as json/ or 
xml/ in the data directory.

	--dir dataflat
	Directory to process data in.

>	dflat packages-meta [slugname]

Merge all the individual meta json files created by package parsing into single 
files containing all the data for all the packages.

If slugname is given then just the meta for this package will be reparsed and 
no global data will be modified. So you should run again later with no slugname 
to generate the global meta.

	--reparse
	Reparse all the xml files to recreate the individual meta files.
	
	--dir dataflat
	Directory to process data in.

>	dflat packages-join [slugname]

Join all the xml files back together to recreate the original data packages.

If slugname is given then just this package will be created.

	--dedupe
	Use the meta data to remove duplicate IDs.

	--dir dataflat
	Directory to process data in.

>	dflat cronos update cronosdir

	--cronos cronos
	Directory to process cronos data in, expects to find a cronos.json 
	file within this folder.

Update a git repository as a chronological series of data files using 
git commits insode branches as chronological history.

>	dflat sqlite

More info about managing an sqlite database of dflat data.


`)
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	let argv=minimist(process.argv.slice(2))
	global.argv=argv
	cmd.parse(argv)
	cmd.run(argv)
}
