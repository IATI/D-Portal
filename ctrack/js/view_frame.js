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
];

// called on view display to fix html in place
view_frame.fixup=function()
{
	$("a").attr("target","_blank");
//	views.map.fixup();
}
//
// Perform ajax call to get numof data
//
view_frame.view=function(args)
{
	ctrack.setcrumb(0);
	ctrack.change_hash();

	views.sectors_top.ajax();
	
	ctrack.popout=true; // any clicks should open in a new window
}
