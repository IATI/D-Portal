// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_main=exports;
exports.name="main";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")


// the chunk names this view will fill with new data
view_main.chunks=[
];

//
// Perform ajax call to get numof data
//
view_main.ajax=function(args)
{
}
