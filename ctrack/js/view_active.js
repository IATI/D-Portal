// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_active=exports;
exports.name="active";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
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
	args=args || {};
	
	var today=fetch.get_today();
    
	var dat={
			"from":"act,country",
			"limit":args.limit || 5,
			"orderby":args.orderby || "day_end",
			"day_end_gt":today,
			"day_start_lt":today,
			"country_code":(args.country || ctrack.args.country)
		};
		
	if(args.output=="count") // just count please
	{
		dat.select="count";
		delete dat.limit;
		delete dat.orderby;
	}
	
	fetch.ajax(dat,args.callback || function(data)
	{		
		if(args.output=="count")
		{
			ctrack.chunk(args.chunk || "active_projects",data.rows[0]["count"]);
		}
		else
		{
			var s=[];
			for(i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				v.num=i+1;

				v.title=v.title || v.aid;
				v.date=fetch.get_nday(v.day_end);

				v.activity=v.aid;

				s.push( plate.replace(args.plate || "{active_projects_data}",v) );
			}

			ctrack.chunk(args.chunk || "active_projects_datas",s.join(""));
		}
		ctrack.display(); // every fetch.ajax must call display once
	});
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

