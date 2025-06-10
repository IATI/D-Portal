// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_donors_top={}
export default view_donors_top
view_donors_top.name="view_donors_top"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import refry      from "../../dstore/js/refry.js"
import iati_codes from "../../dstore/json/iati_codes.json"
import crs        from "../../dstore/json/crs.js"

let crs_year=crs.donors


var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donors_top.chunks=[
	"data_chart_donors",
	"donors_count",
];

view_donors_top.ajax=function(args)
{
	args=args || {};
	var limit=args.limit || 5;

	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);


	var dat={
			"from":"act,trans",
			"limit":-1,
			"select":"funder_ref,"+ctrack.convert_str("sum_of_percent_of_trans"),
			"funder_ref_not_null":"",
			"groupby":"funder_ref",
			"trans_code":"D|E",
		};
	if(year!="all years") // all years?
	{
		dat["trans_day_gteq"]=year+"-"+ctrack.args.newyear;
		dat["trans_day_lt"]=(parseInt(year)+1)+"-"+ctrack.args.newyear;
	}
	fetcher.ajax_dat_fix(dat,args,"trans");
	if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
	fetcher.ajax(dat,function(data){
//			console.log("fetch transactions donors "+year);
//			console.log(data);
		
		var list=[];

		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.code=v.funder_ref || "N/A"
			d.funder=v.funder_ref;
			d.usd=Math.floor(ctrack.convert_num("sum_of_percent_of_trans",v));
			list.push(d);
		}

		list.sort(function(a,b){
			return ( (b.usd||0)-(a.usd||0) );
		});
		
		var total=0; list.forEach(function(it){total+=it.usd;});
		var shownpct=0;
		var shown=0;
		var top=list[0] && list[0].usd || 0;
		var dd=[];
		var d2=[];
		for( var i=0; i<limit ; i++ )
		{
			var v=list[i];
			
			if((i==limit-1)&&(i<(list.length-1))) // last one combines everything else
			{
				v={};
				v.usd=total-shown;
				v.funder=(1+list.length-limit)+" More";
				v.code="..."
			}
			
			if(v)
			{
				shown+=v.usd;
				var d={};
				d.code=v.code
				d.num=v.usd;
				d.pct=Math.round(100*shown/total)-shownpct;
				shownpct+=d.pct
				d.str_num=commafy(d.num)+" "+ctrack.display_usd;
				d.str_lab=iati_codes.funder_names[v.funder] || iati_codes.publisher_names[v.funder] || iati_codes.country[v.funder] || v.funder;
				d.str="<b>"+d.str_num+"</b> ("+d.pct+"%)<br/>"+d.str_lab;
				dd.push(d);
				d2.push( plate.replace("{donor_graph_bars_item}",d) );
			}
		}
		
		ctrack.chunk("data_chart_donors",dd);
		ctrack.chunk("donors_count",list.length);

		ctrack.chunk("donor_graph_bars_items",d2.join(""));
		ctrack.chunk("donor_graph","{donor_graph_bars}");
		
		if(list.length==0) { ctrack.chunk("donor_graph",""); } // remove graph if no data

		ctrack.display();

	});
}
