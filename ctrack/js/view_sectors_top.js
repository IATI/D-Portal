// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_sectors_top={}
export default view_sectors_top
view_sectors_top.name="view_sectors_top"

import ctrack      from "./ctrack.js"
import plate       from "./plate.js"
import iati        from "./iati.js"
import fetcher     from "./fetcher.js"
import refry       from "../../dstore/js/refry.js"
import iati_codes  from "../../dstore/json/iati_codes.json"
import dflat_codes from "../../dflat/json/codelists.json"

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_sectors_top.chunks=[
	"data_chart_publisher_sectors",
	"sectors_count",
];


//
// Perform fake ajax call to get data 
//
view_sectors_top.ajax=function(args)
{
	args=args || {};
	var limit=args.limit || 5;
	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	var list=[];

	var dat={
			"from":"act,trans",
			"limit":-1,
			"select":"trans_sector_group,"+ctrack.convert_str("sum_of_percent_of_trans"),
			"trans_sector_group_not_null":1,
			"groupby":"trans_sector_group",
			"trans_code":"D|E",
		};
	if(year!="all years") // all years?
	{
			dat["trans_day_gteq"]=year+"-"+ctrack.args.newyear;
			dat["trans_day_lt"]=(parseInt(year)+1)+"-"+ctrack.args.newyear;
	}
	fetcher.ajax_dat_fix(dat,args,"trans");

	if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
	var callback=function(data){

		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.code=v.trans_sector_group || "N/A"
			d.sector_group=iati_codes.sector_category[ v.trans_sector_group ] || iati_codes.sector_category_withdrawn[ v.trans_sector_group ] || v.trans_sector_group ;
			d.sector_info=dflat_codes["en-description"]["SectorCategory"][v.trans_sector_group] || v.trans_sector_group
			d.usd=Math.floor(ctrack.convert_num("sum_of_percent_of_trans",v));
			list.push(d);
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
		var shownpct=0;
		var shown=0;
		var dd=[];
		var d2=[];
		var d3=[];
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
					v.code="..."
				}
				else
				{
					v.usd=Math.floor(v.usd);
				}
				
				if(v)
				{
					var d={};
					d.code=v.code
					d.num=v.usd;
					if(d.num<0) { d.num=-d.num; }
					shown+=d.num;
					d.pct=Math.round(100*shown/total)-shownpct;
					shownpct+=d.pct
					d.str_num=commafy(v.usd)+" "+ctrack.display_usd;
					d.str_lab=v.sector_group;
					d.str_info=v.sector_info;
					d.str="<b>"+d.str_num+"</b> ("+d.pct+"%)<br/>"+d.str_lab;
					dd.push(d);
					d2.push( plate.replace("{sector_graph_bars_item}",d) );
					if(v.code!="...")
					{
						d3.push( plate.replace("{sector_graph_bars_list}",d) );
					}
				}
			}
		}

		ctrack.chunk("data_chart_sectors",dd);	
		ctrack.chunk("sectors_count",list.length);

		ctrack.chunk("sector_graph_bars_items",d2.join(""));
		ctrack.chunk("sector_graph_bars_lists",d3.join(""));
		ctrack.chunk("sector_graph","{sector_graph_bars}");

		if(list.length==0) { ctrack.chunk("sector_graph",""); } // remove graph if no data

		ctrack.display();

	};
	fetcher.ajax(dat,callback);

}
