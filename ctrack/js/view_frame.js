// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_frame=exports;
exports.name="frame";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

// the chunk names this view will fill with new data
view_frame.chunks=[
	"frame",
];

// called on view display to fix html in place
view_frame.fixup=function()
{
	var name=ctrack.hash.frame;
	if(name)
	{
		name=name.toLowerCase();
		var v=views[name];
		if(v && v.fixup)
		{
			v.fixup();
		}
	}
	var scale=(ctrack.hash.size || 960)/960;
	$("a").attr("target","_blank");
	$(".frame").css("transform-origin","0 0");
	$(".frame").css("transform","scale("+scale+","+scale+")");
}
//
// Perform ajax call to get numof data
//
view_frame.view=function(args)
{
	ctrack.setcrumb(0);
	ctrack.change_hash();

	var name=ctrack.hash.frame;
	if(name)
	{
		name=name.toLowerCase();
		var v=views[name];
		if(v)
		{
			if(v.chunks)
			{
				v.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
			}
			if(v.ajax)
			{
				v.ajax();
			}
//			ctrack.chunk("frame","{frame_"+name+"}");
		}
	}

//	view_frame.show();
	
	ctrack.popout="frame"; // any clicks should open in a new window
}

view_frame.show=function(args)
{
//	view_frame.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	
	var name=ctrack.hash.frame;
	if(name)
	{
		name=name.toLowerCase();
		var v=views[name];
		if(v)
		{
			if(v.show)
			{
				v.show();
			}
			ctrack.chunk("frame","{frame_"+name+"}");
		}
	}
	
	ctrack.div.master.html( plate.replace( "{view_frame}" ) );
	
	view_frame.fixup();
}
