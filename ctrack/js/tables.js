// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var tables=exports;
exports.name="tables";

var csvw=require("./csvw.js")
var ctrack=require("./ctrack.js")
var plate=require("./plate.js")

var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

tables.sortby=function()
{
	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}

	var sortby;
	switch(ctrack.sortby)
	{
		default:
		case "order":
		case "-order":
			sortby=function(a,b){ return ( (b.order||0)-(a.order||0) ); };
		break;
		case "crs":
		case "-crs":
			sortby=function(a,b){ return ( (p(b.crs)||0)-(p(a.crs)||0) ); };
		break;
		case "donor":
		case "-donor":
			sortby=function(a,b){
				if(a.donor<b.donor) { return -1; }
				if(a.donor>b.donor) { return 1; }
				return 0;
			 };
		break;
		case "country":
		case "-country":
			sortby=function(a,b){
				if(a.country_name<b.country_name) { return -1; }
				if(a.country_name>b.country_name) { return 1; }
				return 0;
			 };
		break;
		case "sector":
		case "-sector":
			sortby=function(a,b){
				if(a.sector<b.sector) { return -1; }
				if(a.sector>b.sector) { return 1; }
				return 0;
			 };
		break;
		case "trans":
		case "-trans":
			sortby=function(a,b){
				var t;
				var ta=(p(a.t2012)||0); t=(p(a.t2013)||0); if(t>ta){ta=t}; t=(p(a.t2014)||0); if(t>ta){ta=t}
				var tb=(p(b.t2012)||0); t=(p(b.t2013)||0); if(t>tb){tb=t}; t=(p(b.t2014)||0); if(t>tb){tb=t}
				return tb-ta;
			};
		break
		case "t2012":
		case "-t2012":
			sortby=function(a,b){ return ( (p(b.t2012)||0)-(p(a.t2012)||0) ); };
		break;
		case "t2013":
		case "-t2013":
			sortby=function(a,b){ return ( (p(b.t2013)||0)-(p(a.t2013)||0) ); };
		break;
		case "t2014":
		case "-t2014":
			sortby=function(a,b){ return ( (p(b.t2014)||0)-(p(a.t2014)||0) ); };
		break;
		case "budget":
		case "-budget":
			sortby=function(a,b){
				var t;
				var ta=(p(a.b2014)||0); t=(p(a.t2015)||0); if(t>ta){ta=t};
				var tb=(p(b.b2014)||0); t=(p(b.t2015)||0); if(t>tb){tb=t};
				return tb-ta;
			};
		break
		case "b2014":
		case "-b2014":
			sortby=function(a,b){ return ( (p(b.b2014)||0)-(p(a.b2014)||0) ); };
		break;
		case "b2015":
		case "-b2015":
			sortby=function(a,b){ return ( (p(b.b2015)||0)-(p(a.b2015)||0) ); };
		break;
	}
	if(ctrack.sortby[0]=="-") // reverse order
	{
		var f=sortby;
		sortby=function(a,b){ return -f(a,b); }
	}
	return sortby;
}
