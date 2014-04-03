// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publishers=exports;
exports.name="publishers";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

// the chunk names this view will fill with new data
view_publishers.chunks=[
	
];

//
// Perform ajax call to get numof data
//
view_publishers.view=function(args)
{

	ctrack.setcrumb(1);
	ctrack.change_hash();
}
