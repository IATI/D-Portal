// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_heatmap=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")

// the chunk names this view will fill with new data
view_heatmap.chunks=[
];

//
// Perform ajax call to get data
//
view_heatmap.ajax=function(args)
{
	args=args || {};
    
	var dat={
			"select":"count,round1_longitude,round1_latitude",
			"from":"act,country,location",
			"limit":args.limit || 5,
			"orderby":"1-",
			"groupby":"2,3",
			"country_code":(args.country || ctrack.args.country)
		};
		
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("fetch heatmap ");
//		console.log(data);
		
		ctrack.map.heat=undefined;
		var donemain=false;
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			if( ("number"== typeof v.round1_longitude) && ("number"== typeof v.round1_latitude) )
			{
				if(!donemain)
				{
					ctrack.map.heat=[];
					donemain=true;
					ctrack.map.lat=v.round1_latitude;
					ctrack.map.lng=v.round1_longitude;
				}
				ctrack.map.heat.push({
					lat:v.round1_latitude,
					lng:v.round1_longitude,
					wgt:v.count
				});
			}
		}

		ctrack.display(); // every fetch.ajax must call display once
	});
}
