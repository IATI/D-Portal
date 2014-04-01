// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donors_top=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donors_top.chunks=[
	"main_money_rows",
];


//
// Perform fake ajax call to get data 
//
view_donors_top.ajax=function(args)
{
	args=args || {};
	var limit=args.limit || 5;

	var list=[];
// insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.usd=crs[n];
		list.push(d);
	}
	list.sort(function(a,b){
		return ( (b.usd||0)-(a.usd||0) );
	});

//	var total=0; list.forEach(function(it){total+=it.usd;});
	var top=list[0] && list[0].usd || 0;
	var s=[];
	for( var i=0; i<limit ; i++ )
	{
		var v=list[i];
		if(v)
		{
			v.pct=Math.floor(100*v.usd/top)
			v.donor=iati_codes.funder_names[v.funder] || iati_codes.country[v.funder] || v.funder;
			s.push( plate.replace("{main_money_row}",v) );
		}
	}

	ctrack.chunk("main_money_rows",s.join(""));
	ctrack.display();
}
