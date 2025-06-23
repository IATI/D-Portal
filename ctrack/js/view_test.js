// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_test={}
export default view_test
view_test.name="view_test"

//import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import csscolor   from "./csscolor.js"
import refry      from "../../dstore/js/refry.js"
import iati_codes from "../../dstore/json/iati_codes.json"
import crs_js        from "../../dstore/json/crs.js"

const ctrack = import("./ctrack.js")

let crs_year=crs_js.donors

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_test.chunks=[
];

view_test.view=function(args)
{
	ctrack.setcrumb(0);
	ctrack.change_hash();

	view_test.ajax();
}

//
// Perform fake ajax call to get data 
//
view_test.ajax=function(args)
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
	var shownpct=0;
	var shown=0;
//	var top=list[0] && list[0].usd || 0;
	var s=[];
	var dd=[];
	for( var i=0; i<limit ; i++ )
	{
		var v=list[i];
		
		if(i==limit-1)
		{
			v={};
			v.usd=total-shown;
			v.funder="Others...";
		}
		
		if(v)
		{
			shown+=v.usd;
			var d={};
			d.num=v.usd;
			d.pct=Math.round(100*shown/total)-shownpct;
			shownpct+=d.pct
			d.str_num=commafy(d.num)+" "+ctrack.display_usd;
			d.str_lab=iati_codes.funder_names[v.funder_ref] || iati_codes.publisher_names[v.funder_ref] || iati_codes.country[v.funder_ref] || v.funder_ref;
			d.str="<b>"+d.str_num+"</b> ("+d.pct+"%)<br/>"+d.str_lab;
			dd.push(d);
		}
	}
		
	ctrack.chunk("data_chart_donors",dd);

	ctrack.display();
}
