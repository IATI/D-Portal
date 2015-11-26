// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_active=exports;
exports.name="view_active";

var ctrack=require("./ctrack.js")
var views=require("./views.js")
var fetch=require("./fetch.js")

// the chunk names this view will fill with new data
view_active.chunks=[
	"active_projects_datas",
	"active_projects",
];

//
// Perform ajax call to get data
//
view_active.ajax=function(args)
{	
	var today=fetch.get_today();
	
	args=args || {};
	
	
	args.q=args.q || {};
	args.q.day_end_gteq = today + ( args.notnull?"":"|NULL" ); // if args.notnull then ignore nulls...
	args.q.day_start_lteq = today;
	args.q.day_length_not_null = 1;
	args.q.orderby="day_end";

// local sort to put the nulls last
	args.compare=args.compare || function(a,b){
		if( null === a.day_end ) { if( null === b.day_end ) { return 0; } else { return  1; } }
		if( null === b.day_end ) { if( null === a.day_end ) { return 0; } else { return -1; } }
		if(a.day_end < b.day_end) { return -1; }
		if(a.day_end > b.day_end) { return  1; }
		return 0;
	};
	
	if(args.output=="count") // just count please
	{
		args.chunk = args.chunk || "active_projects";
	}
	else
	{
		args.plate = args.plate || "{active_projects_data}";
		args.chunk = args.chunk || "active_projects_datas";
	}
	
	views.list_activities.ajax(args);
}
//
// Perform ajax call to get numof data
//
view_active.view=function(args)
{
	view_active.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(1);
	ctrack.change_hash();

	view_active.ajax({output:"count"});
	view_active.ajax({limit:-1});
}

