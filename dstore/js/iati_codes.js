// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var iati_codes=exports;

var csv_parse = require('csv-parse');
//var csv=require('csv');

var util=require('util');
var wait=require('wait.for');
var http=require('http');
var https=require('https');
var fs = require('fs');

var refry=require('./refry');
var exs=require('./exs');

var sheeturl=function(n){
	return 	"https://docs.google.com/spreadsheets/d/1jpXHDNmJ1WPdrkidEle0Ig13zLlXw4eV6WkbSy6kWk4/pub?single=true&gid="+n+"&output=csv";
}

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var http_getbody=function(url,cb)
{
	http.get(url, function(res) {
		res.setEncoding('utf8');
		var s="";
		res.on('data', function (chunk) {
			s=s+chunk;
		});
		res.on('end', function() {
			cb(null,s);
		});
	}).on('error', function(e) {
		cb(e,null);
	});

};

var https_getbody=function(url,cb)
{
	https.get(url, function(res) {
		res.setEncoding('utf8');
		var s="";
		res.on('data', function (chunk) {
			s=s+chunk;
		});
		res.on('end', function() {
			cb(null,s);
		});
	}).on('error', function(e) {
		cb(e,null);
	});

};

iati_codes.fetch = function(){

	var codes=require('../json/iati_codes'); // merge with old
	var publishers={};
	var packages={};

	var files=[
			{
				url:"http://iatistandard.org/202/codelists/downloads/clv2/json/en/Sector.json",
				name:"sector",
			},
			{
				url:"http://iatistandard.org/202/codelists/downloads/clv2/json/en/SectorCategory.json",
				name:"sector_category",
			},
			{
				url:"http://iatistandard.org/104/codelists/downloads/clv2/json/en/TransactionType.json",
				name:"old_transaction_type",
			},
			{
				url:"http://iatistandard.org/202/codelists/downloads/clv2/json/en/TransactionType.json",
				name:"new_transaction_type",
			},
			{
				url:"http://iatistandard.org/202/codelists/downloads/clv2/json/en/ActivityStatus.json",
				name:"activity_status",
			}
		];
	
	files.forEach(function(opts){
	
		console.log("Fetching IATI "+opts.name)

		var js=wait.for(http_getbody,opts.url);
		var j=JSON.parse(js);
		var o={};
		j["data"].forEach(function(v){
			o[ v.code ]=v.name;
		});
		codes[opts.name]=o;

	});

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
	var n;
	var t={};
	for(n in codes["old_transaction_type"])
	{
		t[ codes["old_transaction_type"][n] ]=n;
	}
	var o={};
	for(n in codes["old_transaction_type"])
	{
		o[ n ]=n;
	}
	for(n in codes["new_transaction_type"])
	{
		o[ n ]=t[ codes["new_transaction_type"][n] ] || n;
	}

	codes["transaction_type_map"]=o; // map new codes to old codes and leave old codes as they are

	
	console.log("Fetching country_codes")

// it turns out wikipedia is the best source, since the iso website has decided to hide its most precious data behind a paywall
// so now we will scrape wikipedia

	var x=wait.for(https_getbody,"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2");
	var j=refry.xml(x);
	var o={};
	
	refry.tags(j,{0:"table",class:"wikitable"},function(it){
		refry.tags(it,"td",function(it){
			var name=it.title;
			var code=refry.tagval_trim(it,"span");
//console.log(code+" : "+name);
			if( name && code )
			{
				if(name!="unassigned" && name!="user-assigned")
				{
					var aa=name.split(":");
					if(aa[1])
					{
						if(aa[0]!="not used at present stage") // ignore names that must never be used
						{
							o[code]=aa[1].trim();
						}
					}
					else
					{
						o[code]=name;
					}
				}
			}
		});
	});
	
//	ls(o);

	o["XK"]="Kosovo" // yeah this is much better than having it in a list *rolls*eyes*
	
	codes["country"]=o;


// sector groups -> https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=9&output=csv

// IATI sectors ->   https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=0&output=csv
// IATI funders ->   https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=2&output=csv
// CRS funders ->    https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=4&output=csv
// CRS countries ->  https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=7&output=csv
// CRS 2012 ->       https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=3&output=csv
// local currency ->       https://docs.google.com/spreadsheet/pub?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&single=true&gid=8&output=csv


	console.log("Fetching IATI sector IDS csv")

	var x=wait.for(https_getbody,sheeturl(9));
	var lines=wait.for(csv_parse,x);

	var o={};

	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var d=(v[0]);
		var str=v[1];
		if(d && str)
		{
			o[d.trim()]=str.trim();
		}
	}
	codes["sector_names"]=o;
	
	var rev_sector_names={};
	for( var n in codes["sector_names"]   ) { rev_sector_names[   codes["sector_names"  ][n] ]=n }


	console.log("Fetching IATI sector groups csv")

	var x=wait.for(https_getbody,sheeturl(0));
	var lines=wait.for(csv_parse,x);


	var o={};

	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var num=parseInt(v[0]);
		var str=v[1];
		if(num && str)
		{
			o[num]=rev_sector_names[str.trim()];
		}
	}
//ls(lines)
//ls(o);
		
	codes["sector_group"]=o;


	console.log("Fetching IATI funders csv")

	var x=wait.for(https_getbody,sheeturl(2));
	var lines=wait.for(csv_parse,x);


	var o={};
	for(var i=1;i<lines.length;i++)
	{
		var v=lines[i];
		var a=(v[0]);
		var b=v[3];
		if(a && a.length>0 && b && b.length>0 )
		{
			o[a.trim()]=b.trim();
		}
	}
	
//	ls(o);
	codes["iati_funders"]=o;


	console.log("Fetching IATI currencies csv")

	var x=wait.for(https_getbody,sheeturl(10));
	var lines=wait.for(csv_parse,x);


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
	
	

	console.log("Fetching local currency csv")

	var x=wait.for(https_getbody,sheeturl(8));

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

	
	console.log("Fetching CRS funders csv")

	var x=wait.for(https_getbody,sheeturl(4));
	var lines=wait.for(csv_parse,x);

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


	console.log("Fetching CRS countries csv")

	var x=wait.for(https_getbody,sheeturl(7));
	var lines=wait.for(csv_parse,x);

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
	
		
	console.log("Writing json/iati_codes.json")	
//	fs.writeFileSync("json/iati_codes.js","exports.codes="+JSON.stringify(codes)+";\n");
	fs.writeFileSync(__dirname+"/../json/iati_codes.json",JSON.stringify(codes,null,'\t'));

	
	var x=wait.for(https_getbody,sheeturl(3));
	var lines=wait.for(csv_parse,x);

	var o={};

	var head=[];
	for(var i=0;i<lines[0].length;i++)
	{
		var v=lines[0][i];
		head[i]=codes.rev_crs_funders[ v.trim() ];
	}
//	ls(head);
	
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
	
//	ls(o);

	console.log("Writing json/crs_2012.json")
//	fs.writeFileSync("json/crs_2012.js","exports.crs="+JSON.stringify(o)+";\n");
	fs.writeFileSync(__dirname+"/../json/crs_2012.json",JSON.stringify(o,null,'\t'));

//	codes["local_currency"]=o;


//

	var x=wait.for(https_getbody,sheeturl(11));
	var lines=wait.for(csv_parse,x);

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
	
//	ls(o);

	console.log("Writing json/crs_2012_sectors.json")
//	fs.writeFileSync("json/crs_2012.js","exports.crs="+JSON.stringify(o)+";\n");
	fs.writeFileSync(__dirname+"/../json/crs_2012_sectors.json",JSON.stringify(o,null,'\t'));


	var x=wait.for(https_getbody,sheeturl(14));
	var lines=wait.for(csv_parse,x);

	var o={};

	var head=[];
	for(var i=0;i<lines[0].length;i++)
	{
		var v=lines[0][i];
		head[i]=codes.rev_crs_funders[ v.trim() ];
	}
//	ls(head);
	
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
	
//	ls(o);

	console.log("Writing json/crs_2013.json")
//	fs.writeFileSync("json/crs_2012.js","exports.crs="+JSON.stringify(o)+";\n");
	fs.writeFileSync(__dirname+"/../json/crs_2013.json",JSON.stringify(o,null,'\t'));

//	codes["local_currency"]=o;


//

	var x=wait.for(https_getbody,sheeturl(15));
	var lines=wait.for(csv_parse,x);

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
	
//	ls(o);

	console.log("Writing json/crs_2013_sectors.json")
//	fs.writeFileSync("json/crs_2012.js","exports.crs="+JSON.stringify(o)+";\n");
	fs.writeFileSync(__dirname+"/../json/crs_2013_sectors.json",JSON.stringify(o,null,'\t'));



	var x=wait.for(https_getbody,sheeturl(1794224901));
	var lines=wait.for(csv_parse,x);

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
	
//	ls(o);

	console.log("Writing json/crs_2014.json")
	fs.writeFileSync(__dirname+"/../json/crs_2014.json",JSON.stringify(o,null,'\t'));

	var x=wait.for(https_getbody,sheeturl(830372680));
	var lines=wait.for(csv_parse,x);

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

	console.log("Writing json/crs_2014_sectors.json")
	fs.writeFileSync(__dirname+"/../json/crs_2014_sectors.json",JSON.stringify(o,null,'\t'));



console.log("************************ This next bit takes a loooooong time to get every publisher id from iati...");
if(true)
{
//	codes.publisher_ids={};
	codes.publisher_names={};
	codes.publisher_secondary={};

	var js=wait.for(https_getbody,"https://iatiregistry.org/api/rest/group");
	var j=JSON.parse(js);
	j.forEach(function(v){
		console.log("Fetching publisher info for "+v);
		var jjs=wait.for(https_getbody,"https://iatiregistry.org/api/rest/group/"+v);
		var jj=JSON.parse(jjs);
		publishers[v]=jj
		
		if(jj.extras)
		{			
			var ids=jj.extras.publisher_iati_id.split("|");
			for(var i=0;i<ids.length;i++)
			{
				var id=ids[i].trim();
				if(id!="")
				{
					if(jj.packages.length>0) // ignore unpublished publishers with 0 packages
					{
						codes.publisher_names[ id ]=jj.title;
					}
					else
					{
console.log("unpublished "+id);				
					}
					if(jj.extras.publisher_source_type=="secondary_source")
					{
						codes.publisher_secondary[id]=jj.title;
console.log("secondary "+id);				
					}
				}
			}
		}
	});

// add a temp publisher id
	codes.publisher_names["XI-IATI-OFID"]="The OPEC Fund for International Development"
	codes.publisher_names["XI-IATI-WHS-NEPAL"]="Nepal Traceability Study 2016"
	
//	ls(publishers);

	console.log("Writing json/iati_codes.json")	
//	fs.writeFileSync("json/iati_codes.js","exports.codes="+JSON.stringify(codes)+";\n");
	fs.writeFileSync(__dirname+"/../json/iati_codes.json",JSON.stringify(codes,null,'\t'));

	console.log("Writing json/publishers.json")
	fs.writeFileSync(__dirname+"/../json/publishers.json",JSON.stringify(publishers,null,'\t'));

//
// use the following query
//
// http://iatiregistry.org/api/search/dataset?fl=name,download_url,metadata_modified,groups,id,data_updated&offset=0&limit=99999
// actually that does not work
// try
// http://iatiregistry.org/api/search/dataset?fl=name,res_url&offset=0&limit=99999
//

// get download urls of each xml file ?
/*
	for(var pname in publishers)
	{
		var p=publishers[pname];
		for(var i=0;i<p.packages.length;i++)
		{
			var name=p.packages[i];
			console.log("Fetching package info for "+name);
			var js=wait.for(http_getbody,"http://iatiregistry.org/api/rest/dataset/"+name);
			var j=JSON.parse(js);
			packages[name]=j.download_url; // the only useful value...
		}
	}

// list of urls if we want to do our own scan...
	console.log("Writing json/packages.json")
	fs.writeFileSync(__dirname+"/../json/packages.json",JSON.stringify(packages,null,'\t'));

//	return;
*/
}	

}


