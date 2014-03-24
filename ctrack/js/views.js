// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var views=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

// include all view code

views.ended=require("./view_ended.js");
views.planned=require("./view_planned.js");
views.active=require("./view_active.js");
views.stats=require("./view_stats.js");

views.main=require("./view_main.js");
