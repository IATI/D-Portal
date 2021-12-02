// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var fetcher=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")


var papa=require("papaparse")

var iati_codes=require("../../dstore/json/iati_codes.json")


var refry=require("../../dstore/js/refry.js")
//var iati_xml=require("../../dstore/js/iati_xml.js")

//var fetcher=require("./fetcher.js")


// pre fetch cache data we will need for future fetches
fetcher.prefetch_aids=function(aids,f)
{

	var setaids=function(d){

		var rows=d


		if( typeof rows == "object" && d.response && d.response.docs ) // datastore style
		{
			rows=d.response.docs
		}
		else
		if( typeof rows == "object" &&  d.rows ) // dportal style
		{
			rows=d.rows
		}
		else
		if( typeof rows == "object" &&  d.result ) // dportal dquery old style
		{
			rows=d.result
		}
		else
		if( typeof rows == "object" &&  d.feed &&  d.feed.entry ) // google sheets horrible style
		{
			rows=d.feed.entry
		}

//console.log(rows)

		var aids=[]
		
		for(var i=0 ; i<rows.length ; i++ )
		{
			var v=rows[i]
			
			if( typeof v == "string" )
			{
				aids.push(v)
			}
			else
			if( Array.isArray(v) )
			{
				if(v[0]) { aids.push(v[0]) }
			}
			else
			if( typeof v == "object" )
			{
				if(v.aid) { aids.push(v.aid) }
				else
				if(v.iati_identifier) { aids.push(v.iati_identifier) }
				else
				if(v["iati-identifier"]) { aids.push(v["iati-identifier"]) }
				else
				if(v["content"]&&v["content"]["$t"]) { aids.push(v["content"]&&v["content"]["$t"]) }
			}
		}

//		console.log(aids)
		
		fetcher.aids=aids // remember this array for all later requests
		
		f()
	}


	fetcher.aids=undefined
	if( aids )
	{

// bottle some complex queries

		switch( aids.trim().toUpperCase() )
		{
			case "COVID-19":
				aids="/dquery?sql="+encodeURI(`
SELECT DISTINCT aid FROM xson WHERE
(
	root='/iati-activities/iati-activity/humanitarian-scope' AND
	xson->>'@type'='1' AND
	xson->>'@vocabulary'='1-2' AND
	xson->>'@code'='EP-2020-000012-001'
)OR(
	root='/iati-activities/iati-activity/humanitarian-scope' AND
	xson->>'@type'='2' AND
	xson->>'@vocabulary'='2-1' AND
	xson->>'@code'='HCOVD20'
)OR(
	root='/iati-activities/iati-activity/tag' AND
	xson->>'@vocabulary'='99' AND
	xson->>'@vocabulary-uri' IS NULL AND
	UPPER(xson->>'@code')='COVID-19'
)OR(
	root='/iati-activities/iati-activity/title/narrative' AND
	to_tsvector('simple', xson->>'') @@ to_tsquery('simple','COVID-19')
)OR(
	root='/iati-activities/iati-activity/description/narrative' AND
	to_tsvector('simple', xson->>'') @@ to_tsquery('simple','COVID-19')
)OR(
	root='/iati-activities/iati-activity/transaction/description/narrative' AND
	to_tsvector('simple', xson->>'') @@ to_tsquery('simple','COVID-19')
)OR(
	root='/iati-activities/iati-activity/sector' AND
	xson->>'@vocabulary'='1' AND
	xson->>'@code'='12264'
)
`)
			break;
		}
		
		var protocol=( aids.split(":")[0] || "" ).toLowerCase()
		if( (protocol=="https") || (protocol=="http") || aids.startsWith("/") ) // go fish
		{

			console.log("Prefetching : "+aids)

			$.ajax({
				url: aids,
				success: function(din){
					var dat={}
					if(din)
					{
						if( typeof din == "string" )
						{
							try {

								dat=JSON.parse(din)
//								console.log("JSON",dat)

							} catch (e) {

								try {
									
									dat=papa.parse(din,{header:true}).data
//									console.log("CSV",dat)

								} catch (e) {}

							}
						}
						else
						{
							dat=din
						}
					}
					setaids(dat) // got remote json
				}
			});

		}
		else
		{
			try {

				var d=JSON.parse(aids);
				setaids(d) // got local json
				
			} catch (e) {

				setaids( aids.split(",") ) // string split on ,
			}
		}
	}
	else
	{
		f() // nothing to wait for
	}

}

fetcher.get_today=function()
{
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    return today;
}

fetcher.get_nday=function(n)
{
	var now = new Date(n*1000*60*60*24);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var nday = now.getFullYear() + "-" + (month) + "-" + (day);
    return nday;
}

fetcher.ajax=async function(dat,callback)
{
// we may queue a bunch of requests, this makes us wait for the last one before updating the view
	ctrack.display_wait_update(1);

	if(fetcher.aids)
	{

		let d = await fetch( ctrack.args.q , {
			method: 'POST', // *GET, POST, PUT, DELETE, etc.
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			headers: {
				'Content-Type': 'application/json',
			},
			redirect: 'follow', // manual, *follow, error
			referrer: 'no-referrer', // no-referrer, *client
			body: JSON.stringify(dat) // body data type must match "Content-Type" header
		})
			  
		d = await d.json()

		callback(d)

	}
	else

	{
		$.ajax({
			dataType: "json",
			url: ctrack.args.q + "?callback=?",
			data: dat,
			success: callback,
			error:function(){ callback() },
		});
	}
}

fetcher.tourl=function(dat)
{
	var p={}; // filter empty values from url
	for(var n in dat)
	{
		switch( typeof dat[n] )
		{
			case "number"  :                    p[n]=dat[n] ; break; // all numbers
			case "string"  : if( dat[n]!="" ) { p[n]=dat[n] } break; // ignore empty strings
			case "boolean" : if( dat[n]     ) { p[n]="1"    } break; // flags only if true
		}
	}
	return ctrack.args.q + "?"  + $.param(p)
}

//modify dat so it reflects the args or base settings (eg limit to a publisher)
fetcher.ajax_dat_fix=function(dat,args,flag)
{
	args=args||{}
	
	dat["reporting_ref"]	=	dat["reporting_ref"]	||	args.publisher || ctrack.hash.publisher ;

	dat["country_code"]		=	dat["country_code"]		||	ctrack.args.country_select;
	dat["sector_code"]		=	dat["sector_code"]		||	ctrack.q.sector_code;
	dat["sector_group"]		=	dat["sector_group"]		||	ctrack.q.sector_group;

	dat["reporting_ref"]	=	dat["reporting_ref"]	||	ctrack.args.publisher_select;
	dat["funder_ref"]		=	dat["funder_ref"]		||	ctrack.args.funder_ref_select;
	dat["status_code"]		=	dat["status_code"]		||	ctrack.args.status_code_select;

	dat["text_search"]		=	dat["text_search"]		||	ctrack.args.search;

	dat["policy_code"]		=	dat["policy_code"]		||	ctrack.args.policy_code ; // this policy explode the data

	dat["filter_policy_code"]	=	dat["policy"]		||	ctrack.args.policy || ctrack.hash.policy ; // this policy does not


//	dat["day_start_lt"]		=	dat["day_start_lt"]		||	(args.date_max 		|| ctrack.args.date_max);
//	dat["day_end_gteq"]		=	dat["day_end_gteq"]		||	(args.date_min 		|| ctrack.args.date_min);

// allow query or hash to add extra values
	for(var n in ctrack.q) { dat[n]=ctrack.q[n]; }
	for(var n in ctrack.hash) { dat[n]=ctrack.hash[n]; }

	if(flag=="trans")
	{
		dat["trans_country"]		=	dat["country_code"]		;
		dat["trans_sector"]			=	dat["sector_code"]		;
		dat["trans_sector_group"]	=	dat["sector_group"]		;
	}
	else
	if(flag=="budget")
	{
		dat["budget_country"]		=	dat["country_code"]		;
		dat["budget_sector"]		=	dat["sector_code"]		;
		dat["budget_sector_group"]	=	dat["sector_group"]		;
	}

// then allow passed in args to overide that
	if(args.q)
	{
		for(var n in args.q) { dat[n]=args.q[n]; }
	}

	if(fetcher.aids)
	{
		dat.aids=fetcher.aids
	}

// finally make sure we filter out aid sector/country values that would explode the transaction or budget values
// these need to only use the trans_* or budget_* country or sectory filters which will have been filled in above
	if((flag=="trans")||(flag=="budget"))
	{
		delete dat["country_code"];
		delete dat["sector_code"];
		delete dat["sector_group"];
	}


	if( dat["day_start_lteq"] )
	{
		if(ctrack.args.year_max) // merge
		{
			var s=(Number(ctrack.args.year_max)+1) + "-01-01"
			if(s<dat["day_start_lteq"])
			{
				dat["day_start_lteq"]=s
			}
		}
	}
	else
	{
		if(ctrack.args.year_max)
		{
			dat["day_start_lteq"]=(Number(ctrack.args.year_max)+1) + "-01-01"
		}
	}

	if( dat["day_end_gt"] )
	{
		if(ctrack.args.year_min) // merge
		{
			var s=(ctrack.args.year_min) + "-01-01"
			if(s>dat["day_end_gt"])
			{
				dat["day_end_gt"]=s
			}
		}
	}
	else
	{
		if(ctrack.args.year_min)
		{
			dat["day_end_gt"]=(ctrack.args.year_min) + "-01-01"
		}
	}

// join any extra tables we might now need due to extra restrictions
	if(dat.from)
	{
		if( dat.funder_ref || dat.reporting_ref || dat.status_code )
		{
			if(dat.from.indexOf("act")==-1) { dat.from+=",act"; }
		}
		if( dat.sector_code || dat.sector_group )
		{
			if(dat.from.indexOf("sector")==-1) { dat.from+=",sector"; }
		}
		if(dat.country_code)
		{
			if(dat.from.indexOf("country")==-1) { dat.from+=",country"; }
		}
		if(
			dat.location_latitude || dat.location_longitude ||
			dat.location_latitude_lt || dat.location_longitude_lt ||
			dat.location_latitude_gt || dat.location_longitude_gt )
		{
			if(dat.from.indexOf("location")==-1) { dat.from+=",location"; }
		}
		if(dat.policy_code)
		{
			if(dat.from.indexOf("policy")==-1) { dat.from+=",policy"; }
		}
	}

//console.log(dat)

	return dat;
}

