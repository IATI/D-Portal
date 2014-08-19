// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher=exports;
exports.name="publisher";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

// the chunk names this view will fill with new data
view_publisher.chunks=[
	
];

// called on view display to fix html in place
view_publisher.fixup=function()
{
	views.map.fixup();
}
//
// Perform ajax call to get numof data
//
view_publisher.view=function(args)
{

	views.main.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	views.planned.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.active.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.ended.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.stats.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.publisher_countries_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.publisher_sectors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});


	ctrack.setcrumb(0);
	ctrack.change_hash();

	views.planned.ajax({output:"count"});
	views.active.ajax({output:"count"});
	views.ended.ajax({output:"count"});
	views.missing.ajax({output:"count"});
	views.stats.ajax();
	
	views.active.ajax({limit:5,plate:"{table_active_data}",chunk:"table_active_datas"});
	views.ended.ajax({limit:5,plate:"{table_ended_data}",chunk:"table_ended_datas"});

	views.publisher_countries_top.ajax();
	views.publisher_sectors_top.ajax();

	ctrack.map.pins=undefined;
	views.map.ajax_heat({limit:4000,round:0});
	
}
