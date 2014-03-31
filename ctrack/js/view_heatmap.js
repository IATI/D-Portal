// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_heatmap=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")

view_heatmap.setup=function()
{
// global vars
	ctrack.map={};
	ctrack.map.lat=0;
	ctrack.map.lng=0;
	ctrack.map.zoom=6;
	ctrack.map.heat=undefined;
	ctrack.map.api_ready=false;
		
//display map 
	display_ctrack_map=function(){
		ctrack.map.api_ready=true;
		view_heatmap.fixup();
	}

// always load map api
	head.js("https://maps.googleapis.com/maps/api/js?key=AIzaSyDPrMTYfR7XcA3PencDS4dhovlILuumB_w&libraries=visualization&sensor=false&callback=display_ctrack_map");

}


// the chunk names this view will fill with new data
view_heatmap.chunks=[
];


// called on view display to fix html in place
view_heatmap.fixup=function()
{
	if(ctrack.map.api_ready)
	{
		if($("#map").length>0)
		{
			if(ctrack.map.heat)
			{

//				console.log("map loaded");
				var mapOptions = {
				  center: new google.maps.LatLng(ctrack.map.lat, ctrack.map.lng),
				  zoom: ctrack.map.zoom,
				  scrollwheel: false
				};
				var map = new google.maps.Map(document.getElementById("map"),
					mapOptions);
				


				var heatmapData = [];

				for(var i=0;i<ctrack.map.heat.length;i++)
				{
					var v=ctrack.map.heat[i];
					heatmapData.push({
						location : new google.maps.LatLng(v.lat,v.lng) ,	weight : v.wgt || 1
					});
				}


				var heatmap = new google.maps.visualization.HeatmapLayer({
				  data: heatmapData
				});
				heatmap.setMap(map);

				var fixradius=function()
				{
						var s=Math.pow(2,map.getZoom())/4;
						if(s<4){s=4;}
						if(s>256){s=0;}
						heatmap.setOptions({radius:s});
				}
				 google.maps.event.addListener(map, 'zoom_changed', fixradius);
				 fixradius();
			}
		}
	}
}

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
			"country_percent":100, // *only* this country
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

