// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_dash_slugs=exports;
exports.name="view_dash_slugs";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash_slugs.chunks=[
	"dash_slugs",
];

view_dash_slugs.view=function()
{
	view_dash_slugs.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	view_dash_slugs.ajax({});

	ctrack.setcrumb(1);
	ctrack.change_hash();
}

view_dash_slugs.calc=function()
{
}

view_dash_slugs.ajax=function(args)
{
}

