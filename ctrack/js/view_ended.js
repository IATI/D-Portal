// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_ended=exports;
exports.name="ended";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")


// the chunk names this view will fill with new data
view_ended.chunks=[
	"ended_projects_datas",
	"ended_projects",
];

//
// Perform ajax call to get table data
//
view_ended.datas_ajax=function(args)
{
	args=args || {};
	
	var today=fetch.get_today();
    
	var dat={
			"from":"act,country",
			"limit":args.limit || 5,
			"orderby":"day_end-",
			"day_end_lt":today,
			"country_code":(args.country || ctrack.args.country)
		};
	fetch.ajax(dat,args.callback || function(data)
	{		
		var s=[];
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			v.num=i+1;

			v.title=v.title || v.aid;
			v.date=fetch.get_nday(v.day_end);

			v.activity=v.aid;

			s.push( plate.replace("{ended_projects_data}",v) );
		}

		ctrack.chunk("ended_projects_datas",s.join(""));

		ctrack.display(); // every fetch.ajax must call display once
	});
}

//
// Perform ajax call to get numof data
//
view_ended.numof_ajax=function(args)
{
	args=args || {};
    
	var today=fetch.get_today();

	var dat={
			"select":"count",
			"from":"act,country",
			"day_end_lt":today,
			"country_code":(args.country || ctrack.args.country)
		};
	fetch.ajax(dat,args.callback || function(data)
	{
		console.log("view_ended.numof_callback");
		console.log(data);
			
		ctrack.chunk("ended_projects",data.rows[0]["count"]);
		
		ctrack.display(); // every fetch.ajax must call display once
	});
}
