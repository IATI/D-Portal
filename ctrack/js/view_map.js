// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_map=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")

view_map.setup=function()
{
// global vars
	ctrack.map={};
	ctrack.map.lat=0;
	ctrack.map.lng=0;
	ctrack.map.zoom=6;
	ctrack.map.heat=undefined;
	ctrack.map.pins=undefined;
	ctrack.map.api_ready=false;
		
//display map 
	display_ctrack_map=function(){
		ctrack.map.api_ready=true;
		view_map.fixup();
	}


}


// the chunk names this view will fill with new data
view_map.chunks=[
];


view_map.loaded=false;

// called on view display to fix html in place
view_map.fixup=function()
{
	if(!view_map.loaded)
	{
		view_map.loaded=true;
		head.js("https://maps.googleapis.com/maps/api/js?key=AIzaSyDPrMTYfR7XcA3PencDS4dhovlILuumB_w&libraries=visualization&sensor=false&callback=display_ctrack_map");
	}
	if(ctrack.map.api_ready)
	{
		if($("#map").length>0)
		{
			if( ctrack.map.heat || ctrack.map.pins ) // got some data
			{

//				console.log("map loaded");
				var mapOptions = {
				  center: new google.maps.LatLng(ctrack.map.lat, ctrack.map.lng),
				  zoom: ctrack.map.zoom,
				  scrollwheel: false
				};
				var map = new google.maps.Map(document.getElementById("map"),
					mapOptions);
				

				var heatmap_data;
				var heatmap;
				var pinsmap_data;
				var pinsmap;
				var markers=[];

				if( ctrack.map.pins )
				{
					ctrack.map.pins.forEach(function(v){
						// To add the marker to the map, use the 'map' property
						var marker = new google.maps.Marker({
							position: new google.maps.LatLng(v.lat,v.lng),
							map: map,
							title:v.title,
						});
						markers.push(marker);
						google.maps.event.addListener(marker, "click", function (e) {
							window.location.hash="#view=act&aid="+v.aid;
						});
					});
				}
				else
				if( ctrack.map.heat )
				{
					heatmap_data = [];

					for(var i=0;i<ctrack.map.heat.length;i++)
					{
						var v=ctrack.map.heat[i];
						heatmap_data.push({
							location : new google.maps.LatLng(v.lat,v.lng) ,	weight : v.wgt || 1
						});
					}


					heatmap = new google.maps.visualization.HeatmapLayer({
					  data: heatmap_data
					});
					heatmap.setMap(map);

				}
				var fixradius=function()
				{
						var s=Math.pow(2,map.getZoom())/4;
						if(s<4){s=4;}
						if(s>256){s=0;}

						if(pinsmap)
						{
						}
						else
						if(heatmap)
						{
							heatmap.setOptions({radius:s});
						}						
				}
				google.maps.event.addListener(map, 'zoom_changed', fixradius);
				fixradius();
			}
		}
	}
}

view_map.view=function()
{
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_map.ajax_pins({limit:-1});
}

//
// Perform ajax call to get data
//
view_map.ajax=function(args)
{
	view_map.ajax_heat(args);
	view_map.ajax_pins(args);
}


view_map.ajax_heat=function(args)
{
	if(ctrack.map.heat) { ctrack.display(); return; } // only fetch once

	args=args || {};
    
	var dat={
			"select":"count,round1_location_longitude,round1_location_latitude",
			"from":"act,country,location",
			"limit":args.limit || 5,
			"location_longitude_not_null":1,
			"location_latitude_not_null":1,
			"orderby":"1-",
			"groupby":"2,3",
			"country_percent":100, // *only* this country
			"country_code":(args.country || ctrack.args.country)
		};
		
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("fetch map heat");
//		console.log(data);
		
		ctrack.map.heat=undefined;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			if( ("number"== typeof v.round1_location_longitude) && ("number"== typeof v.round1_location_latitude) )
			{
				if(!ctrack.map.heat)
				{
					ctrack.map.heat=[];
					ctrack.map.lat=v.round1_location_latitude; // use first (most popular)
					ctrack.map.lng=v.round1_location_longitude;
				}
				ctrack.map.heat.push({
					lat:v.round1_location_latitude,
					lng:v.round1_location_longitude,
					wgt:v.count
				});
			}
		}

		ctrack.display(); // every fetch.ajax must call display once
	});
}

view_map.ajax_pins=function(args)
{
	if(ctrack.map.pins) { ctrack.display(); return; } // only fetch once
	
	args=args || {};
    
	var dat={
			"select":"count,location_longitude,location_latitude,aid,title",
			"from":"act,country,location",
			"form":"jcsv",
			"limit":args.limit || 5,
			"location_longitude_not_null":1,
			"location_latitude_not_null":1,
			"orderby":"1-",
			"groupby":"2,3",
			"country_percent":100, // *only* this country
			"country_code":(args.country || ctrack.args.country)
		};
		
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("fetch map pins");
//		console.log(data);
		
		ctrack.map.pins=undefined;
		var h=data && data[0];
		if(h)
		{
			var count=0;
			var lat=0;
			var lng=0;
			for(var i=1;i<data.length;i++)
			{
				var t=data[i]; var v={}; for(var j=0;j<h.length;j++) { v[h[j]]=t[j]; }
				if( ("number"== typeof v.location_longitude) && ("number"== typeof v.location_latitude) )
				{
					if(!ctrack.map.pins)
					{
						ctrack.map.pins=[];
					}
					ctrack.map.pins.push({
						lat:v.location_latitude,
						lng:v.location_longitude,
						wgt:v.count,
						aid:v.aid,
						title:v.title
					});
					lat+=v.location_latitude;
					lng+=v.location_longitude;
					count++;
				}
			}
			if(count>0)
			{
				ctrack.map.lat=lat/count; // use average
				ctrack.map.lng=lng/count;
			}
		}
		ctrack.display(); // every fetch.ajax must call display once
	});
}
