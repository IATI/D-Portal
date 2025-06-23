// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_missing={}
export default view_missing
view_missing.name="view_missing"

import ctrack  from "./ctrack.js"
import views   from "./views.js"
import fetcher from "./fetcher.js"


// the chunk names this view will fill with new data
view_missing.chunks=[
	"missing_projects_datas",
	"missing_projects",
];

//
// Perform ajax call to get data
//
view_missing.ajax=function(args)
{	
	var today=fetcher.get_today();
	
	args=args || {};
	
	args.q=args.q || {};
	args.q.day_length_null = 1; // bad data
	
	if(args.output=="count") // just count please
	{
		args.chunk = args.chunk || "missing_projects";
	}
	else
	{
		args.plate = args.plate || "{missing_projects_data}";
		args.chunk = args.chunk || "missing_projects_datas";
	}
	
	views.list_activities.ajax(args);
}
//
// Perform ajax call to get numof data
//
view_missing.view=function(args)
{
	view_missing.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(1);
	ctrack.change_hash();

	view_missing.ajax({output:"count"});
	view_missing.ajax({limit:-1});
}

