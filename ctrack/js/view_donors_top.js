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

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donors_top.chunks=[
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
	var crs=crs_year[ (args.country || ctrack.args.country || "xx" ).toUpperCase() ];
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

	var total=0; list.forEach(function(it){total+=it.usd;});
	var shown=0;
	var top=list[0] && list[0].usd || 0;
	var dd=[];
	for( var i=0; i<limit ; i++ )
	{
		var v=list[i];
		
		if((i==limit-1)&&(i<(list.length-1))) // last one combines everything else
		{
			v={};
			v.usd=total-shown;
			v.funder=(1+list.length-limit)+" More";
		}
		
		if(v)
		{
			shown+=v.usd;
			var d={};
			d.num=v.usd;
			d.pct=Math.floor(100*v.usd/total);
			d.str_num=commafy(d.num)+" USD";
			d.str_lab=iati_codes.funder_names[v.funder] || iati_codes.publisher_names[v.funder] || iati_codes.country[v.funder] || v.funder;
			d.str=d.str_lab+" ("+d.pct+"%)"+"<br/>"+d.str_num;
			dd.push(d);
		}
	}
		
	ctrack.chunk("data_chart_donors",dd);

	ctrack.display_wait+=1;
	ctrack.display();
}
