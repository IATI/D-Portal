// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_stats=exports;
exports.name="view_stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetcher=require("./fetcher.js")

var views=require("./views.js")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_stats.chunks=[
	"total_projects_human",
	"missing_projects",
	"active_projects",
	"ended_projects",
	"planned_projects",
	"numof_publishers",
	"percent_of_activities_with_location",
	
	"numof_status_code_1",
	"numof_status_code_2",
	"numof_status_code_3",
	"numof_status_code_4",
	"numof_status_code_5",
	"numof_status_code_6",
	"numof_status_code_total",
	"numof_status_code_unknown",
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

}

//
// Perform ajax call to get numof data
//
view_stats.old_ajax=function(args)
{
	args=args || {};
    
	var dat={
			"select":"count_aid",
			"from":"act",
		};
	fetcher.ajax_dat_fix(dat,args);
		
	fetcher.ajax(dat,args.callback || function(data)
	{
			
		if(data.rows[0])
		{
			ctrack.chunk("total_projects",data.rows[0]["count_aid"]);
			ctrack.chunk("total_projects_human",commafy(data.rows[0]["count_aid"]));
		}
		
		view_stats.calc();
		
		ctrack.display(); // every fetcher.ajax must call display once
	});
	
	
	var dat={
			"from":"act",
			"select":"reporting_ref",
			"groupby":"reporting_ref",
			"limit":-1,
		};
	fetcher.ajax_dat_fix(dat,args);
		
	fetcher.ajax(dat,args.callback || function(data)
	{
		ctrack.chunk("numof_publishers",data.rows.length);

		view_stats.calc();
		
		ctrack.display(); // every fetcher.ajax must call display once
	});


	var dat={
			"select":"count_aid",
			"from":"act,location",
			"limit":-1,
		};
	fetcher.ajax_dat_fix(dat,args);
	if(dat.country_code) { dat.country_percent=100;}

	fetcher.ajax(dat,args.callback || function(data)
	{
			
		if(data.rows[0])
		{
			ctrack.chunk("total_activities_with_location",data.rows[0]["count_aid"]);
		}
		view_stats.calc();

		ctrack.display(); // every fetcher.ajax must call display once
	});
	
	views.planned.ajax({output:"count"});
	views.active.ajax({output:"count"});
	views.ended.ajax({output:"count"});
	views.missing.ajax({output:"count"});
	
}


//
// Perform ajax call to get numof data
//
view_stats.new_ajax=function(args)
{
	args=args || {};

	var dat={
			"select":"status_code,count",
			"from":"act",
			"groupby":"status_code",
			"limit":-1,
		};
	fetcher.ajax_dat_fix(dat,args);

	fetcher.ajax(dat,args.callback || function(data)
	{
		let unknown=0
		let total=0
		let counts={1:0,2:0,3:0,4:0,5:0,6:0}
		for(let r of data.rows)
		{
			if( counts[r.status_code]!==undefined ) // code we recognise
			{
				counts[r.status_code] += Number(r.count||0)
				total += Number(r.count||0)
			}
			else // unknown code
			{
				unknown += Number(r.count||0)
				total += Number(r.count||0)
			}
		}
		counts["unknown"]=unknown
		counts["total"]=total
		
		for(let k in counts)
		{
			let v=commafy( counts[k] )
			ctrack.chunk("numof_status_code_"+k,v );
		}

		ctrack.display(); // every fetcher.ajax must call display once
	});



	var dat={
			"from":"act",
			"select":"reporting_ref",
			"groupby":"reporting_ref",
			"limit":-1,
		};
	fetcher.ajax_dat_fix(dat,args);
		
	fetcher.ajax(dat,args.callback || function(data)
	{
		ctrack.chunk("numof_publishers",data.rows.length);

		view_stats.calc();
		
		ctrack.display(); // every fetcher.ajax must call display once
	});

}



//
// Perform ajax call to get numof data
//
view_stats.ajax=function(args)
{

	if(ctrack.q.test)
	{
		ctrack.chunk("main_stats","{new_main_stats}")		
		view_stats.new_ajax(args)
	}
	else
	{
		ctrack.chunk("main_stats","{old_main_stats}")		
		view_stats.old_ajax(args)
	}

}
