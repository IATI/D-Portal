// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var fetch=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")

var iati_codes=require("../../dstore/json/iati_codes.json")


var refry=require("../../dstore/js/refry.js")
//var iati_xml=require("../../dstore/js/iati_xml.js")

//var fetch=require("./fetch.js")



fetch.get_today=function()
{
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    return today;
}

fetch.get_nday=function(n)
{
	var now = new Date(n*1000*60*60*24);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var nday = now.getFullYear() + "-" + (month) + "-" + (day);
    return nday;
}

fetch.ajax=function(dat,callback)
{
// we may queue a bunch of requests, this makes us wait for the last one before updating the view
	ctrack.display_wait_update(1);
	
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.q + "?callback=?",
	  data: dat,
	  success: callback
	});
}

fetch.tourl=function(dat)
{
	return ctrack.args.q + "?"  + $.param(dat)
}

//modify dat so it reflects the args or base settings (eg limit to a publisher)
fetch.ajax_dat_fix=function(dat,args,flag)
{
	dat["reporting_ref"]	=	dat["reporting_ref"]	||	args.publisher || ctrack.hash.publisher ;

	if(flag=="trans")
	{
		dat["trans_country"]		=	dat["country_code"]		||	ctrack.args.country_select;
		dat["trans_sector"]			=	dat["sector_code"]		||	ctrack.args.sector_code_select;
		dat["trans_sector_group"]	=	dat["sector_group"]		||	ctrack.args.sector_group_select;
	}
	else
	if(flag=="budget")
	{
		dat["budget_country"]		=	dat["country_code"]		||	ctrack.args.country_select;
		dat["budget_sector"]		=	dat["sector_code"]		||	ctrack.args.sector_code_select;
		dat["budget_sector_group"]	=	dat["sector_group"]		||	ctrack.args.sector_group_select;
	}
	else
	{
		dat["country_code"]		=	dat["country_code"]		||	args.country || ctrack.hash.country ;

		dat["country_code"]		=	dat["country_code"]		||	ctrack.args.country_select;
		dat["sector_code"]		=	dat["sector_code"]		||	ctrack.args.sector_code_select;
		dat["sector_group"]		=	dat["sector_group"]		||	ctrack.args.sector_group_select;
	}

	dat["reporting_ref"]	=	dat["reporting_ref"]	||	ctrack.args.publisher_select;
	dat["funder_ref"]		=	dat["funder_ref"]		||	ctrack.args.funder_ref_select;
	dat["status_code"]		=	dat["status_code"]		||	ctrack.args.status_code_select;

	dat["text_search"]		=	dat["text_search"]		||	ctrack.args.search;

	dat["policy_code"]		=	dat["policy_code"]		||	ctrack.args.policy_code ;

//	dat["day_start_lt"]		=	dat["day_start_lt"]		||	(args.date_max 		|| ctrack.args.date_max);
//	dat["day_end_gteq"]		=	dat["day_end_gteq"]		||	(args.date_min 		|| ctrack.args.date_min);

// allow hash overide what we have
	for(var n in ctrack.hash) { dat[n]=ctrack.hash[n]; }

// then allow passed in args to overide that
	if(args.q)
	{
		for(var n in args.q) { dat[n]=args.q[n]; }
	}

	if( dat["day_start_lteq"] )
	{
		if(ctrack.args.year_max) // merge
		{
			var s=(ctrack.args.year_max+1) + "-01-01"
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
			dat["day_start_lteq"]=(ctrack.args.year_max+1) + "-01-01"
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

