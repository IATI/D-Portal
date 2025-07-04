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

var sheeturl=function(n){
	return 	"https://docs.google.com/spreadsheets/d/1jpXHDNmJ1WPdrkidEle0Ig13zLlXw4eV6WkbSy6kWk4/pub?single=true&gid="+n+"&output=csv";
}

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var http_gethead=async function(url)
{
	const response = await fetch(url);
	return response.headers;
}
var http_getbody=async function(url)
{
	const response = await fetch(url);
	const data = await response.text();
	return data;
}
var https_getbody=http_getbody;

iati_codes.fetch = async function(){

	try{
		await iati_codes.fetch1()
	}catch(e){console.log(e)}

	try{
		await iati_codes.fetch2()
	}catch(e){console.log(e)}
}


iati_codes.fetch1 = async function(){

	var codes=JSON.parse( fs.readFileSync(import.meta.dirname+"/../json/iati_codes.json") );

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
		console.log("ERROR Failed to update list of countries!")
	}
	else
	{
		codes["country"]=o;
	}

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


	console.log("Writing json/iati_codes.json for the first time")
	fs.writeFileSync(import.meta.dirname+"/../json/iati_codes.json",json_stringify(codes,{ space: ' ' }));

}

iati_codes.fetch2 = async function(){

	var codes=JSON.parse( fs.readFileSync(import.meta.dirname+"/../json/iati_codes.json") );

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
	if(start>2000) // sanity, just in case of total registry failure
	{
		console.log("Writing json/packages.json")
		fs.writeFileSync(import.meta.dirname+"/../json/packages.json",json_stringify(packages,{ space: ' ' }));

		console.log("Writing json/download.txt")

		var cc=[]

		for( var slug in packages)
		{
			var ppackage=packages[slug]
			slug=slug.replace(/[^0-9a-zA-Z\-_]/g, '_') // sanitize the slug just in case
			var url=ppackage.resources && ppackage.resources[0] && ppackage.resources[0].url
			if(url)
			{
				url=url.split(" ").join("%20") // spaces in urls breaks curl
				cc.push("curl -k -L -o "+slug+".xml \""+url+"\" \n")
			}
		}

		fs.writeFileSync(import.meta.dirname+"/../json/curl.txt",cc.join(""));

		console.log("Writing json/validhash.json")

		var validhash={}

		for( var slug in packages)
		{
			var ppackage=packages[slug]
			var hash=ppackage.id
			validhash[slug]=hash
		}

		fs.writeFileSync(import.meta.dirname+"/../json/validhash.json",json_stringify(validhash,{ space: ' ' }));
	}



console.log("************************ This next bit takes a loooooong time to get every publisher id from iati...");
console.log("************************ It's OK to CTRL+C and skip this last bit if you don't care.");
if(true)
{
//	codes.publisher_ids={};
	codes.publisher_slugs={};
	codes.publisher_names={};
	codes.publisher_secondary={};

	var js=await https_getbody("https://iatiregistry.org/api/3/action/group_list");
	var j=JSON.parse(js).result;
	for(let v of j)
	{
		console.log("Fetching publisher info for "+v);
		let jjs=await https_getbody("https://iatiregistry.org/api/3/action/group_show?show_historical_publisher_names=true&id="+v);
		let jj=JSON.parse(jjs).result;
		publishers[v]=jj

		let ids=jj.publisher_iati_id.split("|");
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

// add a temp publisher id
	codes.publisher_names["XI-IATI-OFID"]="The OPEC Fund for International Development"
	codes.publisher_names["XI-IATI-WHS-NEPAL"]="Nepal Traceability Study 2016"


//	ls(publishers);

	console.log("Writing json/iati_codes.json for the last time")
	fs.writeFileSync(import.meta.dirname+"/../json/iati_codes.json",json_stringify(codes,{ space: ' ' }));

	console.log("Writing json/publishers.json")
	fs.writeFileSync(import.meta.dirname+"/../json/publishers.json",json_stringify(publishers,{ space: ' ' }));

}

}
