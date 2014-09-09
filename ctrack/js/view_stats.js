// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_stats=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

// the chunk names this view will fill with new data
view_stats.chunks=[
	"total_projects",
	"missing_projects",
	"active_projects",
	"ended_projects",
	"planned_projects",
	"numof_publishers",
	"percent_of_activities_with_location",
];

view_stats.calc=function()
{
	var tot=ctrack.chunk("total_projects") || 0;
	var num=ctrack.chunk("total_activities_with_location") || 0;
	if( num<1 || tot<1 )
	{
		ctrack.chunk("percent_of_activities_with_location",0);
	}
	else
	{
		var pct=Math.ceil(100*num/tot);
		ctrack.chunk("percent_of_activities_with_location",pct);
	}

/*
	
	var pt=parseInt(ctrack.chunk("total_projects"))||0;
	var pa=parseInt(ctrack.chunk("active_projects"))||0;
	var pe=parseInt(ctrack.chunk("ended_projects"))||0;
	var pp=parseInt(ctrack.chunk("planned_projects"))||0;
	
	var pm=pt - (pa+pe+pp)
	if(pm>0)
	{
		ctrack.chunk("missing_projects",pm);
	}
	else
	{
		ctrack.chunk("missing_projects",0);
	}
*/

//	console.log(pm);
}

//
// Perform ajax call to get numof data
//
view_stats.ajax=function(args)
{
	args=args || {};
    
	var dat={
			"select":"stats",
			"from":"act,country",
			"country_code":(args.country || ctrack.args.country_select),
			"reporting_ref":(args.publisher || ctrack.args.publisher_select),
		};
		
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_stats.numof_callback");
//		console.log(data);
			
		if(data.rows[0])
		{
			ctrack.chunk("total_projects",data.rows[0]["COUNT(DISTINCT aid)"]);
			ctrack.chunk("numof_publishers",data.rows[0]["COUNT(DISTINCT reporting_ref)"]);
		}
		
		view_stats.calc();
		
		ctrack.display(); // every fetch.ajax must call display once
	});
	
	
	var dat={
			"select":"stats",
			"from":"act,country,location",
			"limit":-1,
			"country_percent":100, // *only* this country
			"location_longitude_not_null":1, // must have a location
			"location_latitude_not_null":1, // must have a location
			"country_code":(args.country || ctrack.args.country_select),
			"reporting_ref":(args.publisher || ctrack.args.publisher_select),
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("total_activities_with_location");
//		console.log(data);
			
		if(data.rows[0])
		{
			ctrack.chunk("total_activities_with_location",data.rows[0]["COUNT(DISTINCT aid)"]);
		}
		view_stats.calc();

		ctrack.display(); // every fetch.ajax must call display once
	});
	
	views.planned.ajax({output:"count"});
	views.active.ajax({output:"count"});
	views.ended.ajax({output:"count"});
	views.missing.ajax({output:"count"});
	
}
