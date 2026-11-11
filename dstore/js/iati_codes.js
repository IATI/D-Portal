// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const iati_codes={}
export default iati_codes

import * as util  from "util"
import * as http  from "http"
import * as https from "https"
import * as fs    from "fs"
import * as csv_parse      from "csv-parse"

import fetch          from "node-fetch"
import papa           from "papaparse"
import json_stringify from "json-stable-stringify"
import refry          from "./refry.js"
import exs            from "./exs.js"
import fetch_check    from "./fetch_check.js"

var sheeturl=function(n){
	return 	"https://docs.google.com/spreadsheets/d/1jpXHDNmJ1WPdrkidEle0Ig13zLlXw4eV6WkbSy6kWk4/pub?single=true&gid="+n+"&output=csv";
}

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var http_gethead=async function(url)
{
	const response = await fetch(url);
	return response.headers;
}
var http_getbody_once=async function(url)
{
	const response = await fetch(url);
	if(!response.ok)
	{
		throw new Error(url+" returned HTTP "+response.status)
	}
	const data = await response.text();
	return data;
}
// try once more after a short wait, in case the failure was brief
var http_getbody=async function(url)
{
	try{
		return await http_getbody_once(url)
	}catch(e){
		console.log("Retrying after: "+e.message)
		await new Promise(function(resolve){ setTimeout(resolve,5000) })
		return await http_getbody_once(url)
	}
}
var https_getbody=http_getbody;

// read one of the files in json/, or undefined if it does not exist yet
var read_json=function(name)
{
	try{
		return JSON.parse( fs.readFileSync(import.meta.dirname+"/../json/"+name) );
	}catch(e){
		if(e.code=="ENOENT")
		{
			return undefined
		}
		throw e
	}
}

// files is { name: text }. Write them all to temporary files first, then
// rename them all, so a crash while writing leaves the previous files as they
// are, and the new files replace the old ones together.
var write_files=function(files)
{
	var dir=import.meta.dirname+"/../json/"
	for(var name in files)
	{
		console.log("Writing json/"+name)
		fs.writeFileSync(dir+name+".tmp",files[name])
	}
	for(var name in files)
	{
		fs.renameSync(dir+name+".tmp",dir+name)
	}
}

// Fetch everything, check it, and only then write it. Any failure throws and
// writes nothing, so the files from the last good fetch stay as they are.
// opts.force skips the checks that compare with the last fetch, for when a
// large fall in datasets or publishers is genuine.
iati_codes.fetch = async function(opts){

	opts=opts||{}

	var previous={
		codes    : read_json("iati_codes.json"),
		packages : read_json("packages.json"),
	}
	if(!previous.codes)
	{
		console.log("No json/iati_codes.json, starting from empty")
	}

	// start from the previous codes, so anything not fetched again is kept
	var codes=structuredClone(previous.codes||{})

	var names=await iati_codes.fetch1(codes)
	var fetched=await iati_codes.fetch2(codes)

	var required=[ ...names, "transaction_type", "country", "publisher_names", "publisher_slugs" ]
	var problems=fetch_check.check( { codes:codes, packages:fetched.packages }, previous, required, opts.force )
	if(problems.length>0)
	{
		throw new Error("fetched data failed its checks, nothing was written:\n  "+problems.join("\n  ")+
			"\nIf a fall is genuine, \"dstore fetch --force\" skips the checks that compare with the last fetch")
	}

	var packages=fetched.packages

	var cc=[]
	var validhash={}
	for( var slug in packages)
	{
		var dataset=packages[slug]
		validhash[slug]=dataset.id
		var safeslug=slug.replace(/[^0-9a-zA-Z\-_]/g, '_') // sanitize the slug just in case
		var url=dataset.resources && dataset.resources[0] && dataset.resources[0].url
		if(url)
		{
			url=url.split(" ").join("%20") // spaces in urls breaks curl
			cc.push("curl -k -L -o "+safeslug+".xml \""+url+"\" \n")
		}
	}

	write_files({
		"packages.json"   : json_stringify(packages,{ space: ' ' }),
		"curl.txt"        : cc.join(""),
		"validhash.json"  : json_stringify(validhash,{ space: ' ' }),
		"iati_codes.json" : json_stringify(codes,{ space: ' ' }),
		"publishers.json" : json_stringify(fetched.publishers,{ space: ' ' }),
	})
}


// fetch the code lists into codes, returns the names of the downloaded lists
iati_codes.fetch1 = async function(codes){

	var files=[

// old codes, do not change
			{
				url:"http://reference.iatistandard.org/104/codelists/downloads/clv2/json/en/TransactionType.json",
				name:"old_transaction_type",
			},

// new codes, these should be kept current
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/Sector.json",
				name:"sector",
			},
/* replaced with csv/sector_category.csv */
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/SectorCategory.json",
				name:"sector_category",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/SectorVocabulary.json",
				name:"sector_vocab",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/TransactionType.json",
				name:"new_transaction_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/ActivityStatus.json",
				name:"activity_status",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/OrganisationType.json",
				name:"org_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/OrganisationRole.json",
				name:"org_role",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/DocumentCategory.json",
				name:"doc_cat",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/IndicatorVocabulary.json",
				name:"indicator_vocab",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/ResultVocabulary.json",
				name:"result_vocab",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/PolicyMarkerVocabulary.json",
				name:"policy_vocab",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/PolicyMarker.json",
				name:"policy_code",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/PolicySignificance.json",
				name:"policy_sig",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/BudgetType.json",
				name:"budget_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/BudgetStatus.json",
				name:"budget_status",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/ActivityScope.json",
				name:"activity_scope",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/Region.json",
				name:"region_code",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/RegionVocabulary.json",
				name:"region_vocab",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/ActivityScope.json",
				name:"act_scope",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/HumanitarianScopeVocabulary.json",
				name:"hum_scope_vocab",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/HumanitarianScopeType.json",
				name:"hum_scope_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/CollaborationType.json",
				name:"collab_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/FlowType.json",
				name:"flow_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/FinanceType.json",
				name:"finance_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/AidType.json",
				name:"aid_type",
			},
			{
				url:"http://reference.iatistandard.org/203/codelists/downloads/clv3/json/en/TiedStatus.json",
				name:"tied_status",
			},
		];

	for(let opts of files)
	{

		console.log("Fetching IATI "+opts.name)

		let js=await http_getbody(opts.url);
		let j=JSON.parse(js);
		let active;
		let withdrawn;
		j["data"].forEach(function(v){
			if(v.status && v.status=="withdrawn")
			{
				withdrawn=withdrawn||{}
				withdrawn[ v.code ]=v.name;
			}
			else
			{
				active=active||{}
				active[ v.code ]=v.name;
			}
		});
		if(active)
		{
			codes[opts.name]=active;
		}
		if(withdrawn)
		{
			codes[opts.name+"_withdrawn"]=withdrawn;
		}

	}

// merge old/new transaction types and build map

	var n;
	var o={};
	for(n in codes["old_transaction_type"])
	{
		o[ n ]=codes["old_transaction_type"][n];
	}
	for(n in codes["new_transaction_type"])
	{
		o[ n ]=codes["new_transaction_type"][n];
	}
	codes["transaction_type"]=o;


// conversion from new code to old (we keep using old codes internally)
// This used to fail for C and IR as the wording changed so is now explicitly mapped
	var t={
		"1": "IF",
		"2": "C",
		"3": "D",
		"4": "E",
		"5": "IR",
		"6": "LR",
		"7": "R",
		"8": "QP",
		"9": "QS",
		"10": "CG",
	}
	var o={}
	for(n in codes["old_transaction_type"])	{ o[n]=n; } // copy
	for(n in codes["new_transaction_type"]) { o[n]=n; } // copy
	for(n in t) { o[n]=t[n]; } // map

	codes["transaction_type_map"]=o; // map new codes to old codes where we can and leave old codes as they are

	var o={
		"IF": 1,
		"C":  2,
		"D":  3,
		"E":  4,
		"IR": 5,
		"LR": 6,
		"R":  7,
		"QP": 8,
		"QS": 9,
		"CG": 10,
	}
	codes["transaction_type_num"]=o; // map old codes to new numbers

	console.log("Parsing csv/iati_funders.csv")
	var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/iati_funders.csv",{encoding:"utf8"}) ).data;

	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[1];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}

//	ls(o);
	codes["iati_funders"]=o;


	console.log("Parsing csv/imf_currencies.csv")
	var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/imf_currencies.csv",{encoding:"utf8"}) ).data;


	var o=[];
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[1];
		if(a && a.length>0 && b && b.length>0 )
		{
			o.push({id:a.trim(),name:b.trim()});
		}
	}

//	ls(o);
	codes["iati_currencies"]=o;



	console.log("Parsing csv/local_currency.csv")
	var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/local_currency.csv",{encoding:"utf8"}) ).data;

	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[1];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}

//	ls(o);
	codes["local_currency"]=o;


	console.log("Parsing csv/crs_funders.csv")

	var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/crs_funders.csv",{encoding:"utf8"}) ).data;

	var d={};
	var o={};
	var r={};
	var funder_names={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[1]);
		var b=v[0];
		var c=v[2];
		var n=parseInt(v[4])||0;
		var display_name=v[3];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
			r[b.trim()]=a.trim();

			if(n) // number
			{
				o[a.trim()]=n;
				r[n]=a.trim();
			}
		}
		if(a && a.length>0 && c && c.length>0 )
		{
			d[a.trim()]=true;

//			if(n) // number
//			{
//				d[n]=true;
//			}
		}
		if(a && a.length>0 && display_name && display_name.length>0 )
		{
			funder_names[a.trim()]=display_name;

			if(n) // number
			{
				funder_names[n]=display_name;
			}
		}
	}

//	ls(o);
	codes.funder_names=funder_names;
	codes.crs_funders=o;
	codes.rev_crs_funders=r;
	codes.crs_no_iati=d;


	console.log("Parsing csv/crs_countries.csv")

	var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/crs_countries.csv",{encoding:"utf8"}) ).data;

	var o={};
	var r={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[1]);
		var b=v[0];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
			r[b.trim()]=a.trim();
		}
	}
	codes.crs_countries=o;
	codes.rev_crs_countries=r;



	for(var year=2015;year<=2019;year++)
	{

		console.log("Parsing csv/crs_"+year+".csv")
		console.log(import.meta.dirname+"/../csv/crs_"+year+".csv")

		var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/crs_"+year+".csv",{encoding:"utf8"}) ).data;

		var o={};

		var head=[];
		for(var i=0;i<lines[0].length;i++)
		{
			var v=lines[0][i];
			head[i]=codes.rev_crs_funders[ v.trim() ];
		}

		for(var i=1;i<lines.length;i++)
		{
			var v=lines[i];
			var a=codes.rev_crs_countries[ v[0].trim() ];
			if(a)
			{
				var t={};
				o[a]=t;
				for(var j=0;j<v.length;j++)
				{
					var h=head[j];
					if(h)
					{
						var n=Number(v[j]);
						if(n)
						{
							t[h]=Math.round(n*1000000); // convert to usd, from millions of usd
						}
					}
				}
			}
		}
		console.log("Writing json/crs_"+year+".json")
		fs.writeFileSync(import.meta.dirname+"/../json/crs_"+year+".json",json_stringify(o,{ space: ' ' }));



		console.log("Parsing csv/crs_"+year+"_sectors.csv")

		var lines=papa.parse( fs.readFileSync(import.meta.dirname+"/../csv/crs_"+year+"_sectors.csv",{encoding:"utf8"}) ).data;

		var o={};

		var head=[];
		for(var i=0;i<lines[0].length;i++)
		{
			var v=lines[0][i];
			head[i]=v.trim();
		}
	//	ls(head);

		for(var i=1;i<lines.length;i++)
		{
			var v=lines[i];
			var a=v[1]||"" ; a=codes.rev_crs_countries[ a.trim() ];
			if(a)
			{
				var t={};
				o[a]=t;
				for(var j=2;j<v.length;j++)
				{
					var h=head[j];
					if(h)
					{
						var n=Number(v[j]);
						if(n)
						{
							t[h]=Math.round(n*1000000); // convert to usd, from millions of usd
						}
					}
				}
			}
		}
		console.log("Writing json/crs_"+year+"_sectors.json")
		fs.writeFileSync(import.meta.dirname+"/../json/crs_"+year+"_sectors.json",json_stringify(o,{ space: ' ' }));
	}



/*
	console.log("Parsing csv/sector_category.csv")


	var x=fs.readFileSync(import.meta.dirname+"/../csv/sector_category.csv","utf8");
	var lines=papa.parse( x ).data;
	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[1];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}

//	ls(o);
	codes["sector_category"]=o;
*/


	console.log("Fetching country_codes")

	var x=JSON.parse( await https_getbody("https://codelists.codeforiati.org/api/json/en/Country.json") )
	o={}
	for(let c of x.data)
	{
		o[c.code]=c.name
	}

	let count=0
	for(let n in o){count++}
	if(count<10) // sanity check
	{
		throw new Error("Failed to update list of countries, only "+count+" found")
	}
	codes["country"]=o;

// sector groups -> https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=9&output=csv

// IATI sectors ->   https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=0&output=csv
// IATI funders ->   https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=2&output=csv
// CRS funders ->    https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=4&output=csv
// CRS countries ->  https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=7&output=csv
// CRS 2012 ->       https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=3&output=csv
// local currency ->       https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=8&output=csv


// add explcit tag modes, should be upper case and mnemonic to be used with Q as eg: ?TAG_UNSDG=1
	codes.tag_mode={}
	codes.tag_mode["AGROVOC"] = "https://agrovoc.fao.org/browse/agrovoc/en/"
	codes.tag_mode["UNSDG"]   = "http://reference.iatistandard.org/codelists/UNSDG-Goals/"
	codes.tag_mode["UNSDT"]   = "http://reference.iatistandard.org/codelists/UNSDG-Targets/"
	codes.tag_mode["UNSDI"]   = "https://unstats.un.org/sdgs/indicators/indicators-list/"
	codes.tag_mode["TEI"]     = "https://europa.eu/capacity4dev/joint-programming/documents/tei-codes-0"
	codes.tag_mode["RO"]      = "https://iatistandard.org/en/iati-standard/203/codelists/tagvocabulary/"


	return files.map(function(f){ return f.name })
}

// fetch the dataset and publisher lists, adding publisher names to codes,
// returns { packages, publishers }
iati_codes.fetch2 = async function(codes){

	var publishers={};
	var packages={};


// ignore these keys in the package data as they cache values and just change all the time without being useful
	var ignoreresourcekeys=[
		"created",
		"hash",
		"id",
		"last_modified",
		"mimetype",
		"package_id",
		"revision_id",
		"size",
		"metadata_modified",
	]

	var ignoreextras=[
		"data_updated",
	]

	var ignorethis=[
		"revision_id",
		"isopen",
	]

	var start=0;
	var done=false;
	while(!done)
	{
		console.log( "iatiregistry query for packages "+(start+1)+" to "+(start+1000) );
		var js=await https_getbody("https://iatiregistry.org/api/3/action/package_search?rows=1000&start="+start);

		var j=JSON.parse(js.toString('utf8'));
		var rs=j.result.results;
		done=true;
		for(var i=0;i<rs.length;i++)
		{
			done=false;
			var v=rs[i];
// clean out some key bumf to reduce pointless updates
			v.metadata_modified=undefined // seems to change everynight no matter what so ignore
			if(v.extras)
			{
 				for(var ki=v.extras.length-1;ki>=0;ki--) // backwards as we will be removing
				{
					var kv=v.extras[ki]
					if(kv && kv.key && kv.key.startsWith("issue_")) // these are auto errors that get added by the registry, IGNORE
					{
						v.extras.splice(ki,1) // forget
					}
					else
					if(kv && kv.key)
					{
						for( var ni in ignoreextras) { var n=ignoreextras[ni]
							if(kv.key==n)
							{
								v.extras.splice(ki,1) // forget
								break;
							}
						}
					}
				}
			}
			if(v.resources)
			{
 				for(var ki in v.resources)
				{
					var kv=v.resources[ki]
					for(var ni in ignoreresourcekeys) { var n=ignoreresourcekeys[ni]
						 kv[n]=undefined } // forget
				}
			}

			for( var ni in ignorethis) { var n=ignorethis[ni]
				 v[n]=undefined // forget
			}

			packages[v.name]=v;
		}
		start+=1000;
	}

console.log("************************ This next bit takes a loooooong time to get every publisher id from iati...");
if(true)
{
//	codes.publisher_ids={};
	codes.publisher_slugs={};
	codes.publisher_names={};
	codes.publisher_secondary={};

	var js=await https_getbody("https://iatiregistry.org/api/3/action/group_list");
	var j=JSON.parse(js).result;
	var skipped=[]
	for(let v of j)
	{
		console.log("Fetching publisher info for "+v);
		// one broken publisher should not stop the whole fetch, so skip it and
		// carry on, a mass failure is caught by the checks on publisher names
		let jj
		let ids
		try{
			let jjs=await https_getbody("https://iatiregistry.org/api/3/action/group_show?show_historical_publisher_names=true&id="+v);
			jj=JSON.parse(jjs).result;
			ids=jj.publisher_iati_id.split("|");
		}catch(e){
			console.log("Skipping publisher "+v+": "+e.message);
			skipped.push(v)
			continue
		}
		publishers[v]=jj

		for(let i=0;i<ids.length;i++)
		{
			let id=ids[i].trim();
			if(id!="")
			{
				if(jj.package_count>0) // ignore unpublished publishers with 0 packages
				{
					codes.publisher_names[ id ]=jj.title.trim();
					codes.publisher_slugs[ id ]=v; // so we can link to registry
				}
				else
				{
console.log("unpublished "+id);
				}
				if(jj.publisher_source_type=="secondary_source")
				{
					codes.publisher_secondary[id]=jj.title.trim();
console.log("secondary "+id);
				}
			}
		}

	}
	if(skipped.length>0)
	{
		console.log("Skipped "+skipped.length+" publishers that failed: "+skipped.join(" "));
	}

// add a temp publisher id
	codes.publisher_names["XI-IATI-OFID"]="The OPEC Fund for International Development"
	codes.publisher_names["XI-IATI-WHS-NEPAL"]="Nepal Traceability Study 2016"


//	ls(publishers);

}
	return { packages:packages, publishers:publishers }

}
