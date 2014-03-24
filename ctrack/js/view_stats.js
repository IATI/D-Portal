// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_stats=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")


// the chunk names this view will fill with new data
view_stats.chunks=[
	"total_projects",
	"numof_publishers",
];

//
// Perform ajax call to get numof data
//
view_stats.numof_ajax=function(args)
{
	args=args || {};
    
	var dat={
			"select":"stats",
			"from":"act,country",
			"country_code":(args.country || ctrack.args.country)
		};
	fetch.ajax(dat,args.callback || function(data)
	{
		console.log("view_stats.numof_callback");
		console.log(data);
			
		ctrack.chunk("total_projects",data.rows[0]["COUNT(*)"]);
		ctrack.chunk("numof_publishers",data.rows[0]["COUNT(DISTINCT reporting_org)"]);
		
		ctrack.display(); // every fetch.ajax must call display once
	});
}
