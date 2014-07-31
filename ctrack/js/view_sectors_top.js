// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sectors_top=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year_sectors=require("../../dstore/json/crs_2012_sectors.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_sectors_top.chunks=[
];


//
// Perform fake ajax call to get data 
//
view_sectors_top.ajax=function(args)
{
	args=args || {};
	var limit=args.limit || 5;

	var list=[];
// insert crs data if we have it
	var crs=crs_year_sectors[ (args.country || ctrack.args.country || "xx" ).toUpperCase() ];
	for(var n in crs)
	{
		if(n!="Grand Total")
		{
			var d={};
			d.sector_group=n;
			d.usd=crs[n];
			list.push(d);
		}
	}
	list.sort(function(a,b){
		return ( (b.usd||0)-(a.usd||0) );
	});

	var total=0; list.forEach(function(it){
		if(it.usd>0)
		{
			total+=it.usd;
		}
		else
		{
			total-=it.usd;
		}
	});
	var shown=0;
	var dd=[];
	for( var i=0; i<limit ; i++ )
	{
		var v=list[i];			
		if(v)
		{
			if((i==limit-1)&&(i<(list.length-1))) // last one combines everything else
			{
				v={};
				v.usd=Math.floor(total-shown);
				v.sector_group=(1+list.length-limit)+" More";
			}
			else
			{
				v.usd=Math.floor(v.usd);
			}
			
			if(v)
			{
				var d={};
				d.num=v.usd;
				if(d.num<0) { d.num=-d.num; }
				shown+=d.num;
				d.pct=Math.floor(100*d.num/total);
				d.str_num=commafy(v.usd)+" USD";
				d.str_lab=v.sector_group;
				d.str=d.str_lab+" ("+d.pct+"%)"+"<br/>"+d.str_num;
				dd.push(d);
			}
		}
	}

	ctrack.chunk("data_chart_sectors",dd);
	
	ctrack.display_wait+=1;
	ctrack.display();


}
