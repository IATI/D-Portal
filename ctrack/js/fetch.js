// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var fetch=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")

var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")


var refry=require("../../dstore/js/refry.js")
//var iati_xml=require("../../dstore/js/iati_xml.js")

//var fetch=require("./fetch.js")



fetch.get_today=function()
{
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    return today;
}

fetch.get_nday=function(n)
{
	var now = new Date(n*1000*60*60*24);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var nday = now.getFullYear() + "-" + (month) + "-" + (day);
    return nday;
}

fetch.ajax=function(dat,callback)
{
// we may queue a bunch of requests, this makes us wait for the last one before updating the view
	ctrack.display_wait+=1;
	
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.q + "?callback=?",
	  data: dat,
	  success: callback
	});
}
