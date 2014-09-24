// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_planned=exports;
exports.name="view_planned";

var ctrack=require("./ctrack.js")
var views=require("./views.js")
var fetch=require("./fetch.js")

// the chunk names this view will fill with new data
view_planned.chunks=[
	"planned_projects_datas",
	"planned_projects",
];

//
// Perform ajax call to get data
//
view_planned.ajax=function(args)
{	
	var today=fetch.get_today();
	
	args=args || {};
	
	args.q=args.q || {};
	args.q.day_start_gt = today;
	args.q.day_length_not_null = 1;
	args.q.orderby="day_start";

	if(args.output=="count") // just count please
	{
		args.chunk = args.chunk || "planned_projects";
	}
	else
	{
		args.plate = args.plate || "{planned_projects_data}";
		args.chunk = args.chunk || "planned_projects_datas";
	}
	
	views.list_activities.ajax(args);
}
//
// Perform ajax call to get numof data
//
view_planned.view=function(args)
{
	view_planned.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(1);
	ctrack.change_hash();

	view_planned.ajax({output:"count"});
	view_planned.ajax({limit:-1});
}

