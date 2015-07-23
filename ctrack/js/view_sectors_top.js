// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sectors_top=exports;
exports.name="view_sectors_top";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year_sectors=require("../../dstore/json/crs_2013_sectors.json")

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
	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	var list=[];

	var dat={
			"from":"act,trans,country,sector",
			"limit":-1,
			"select":"sector_group,sum_of_percent_of_trans_usd",
			"sector_group_not_null":1,
			"groupby":"sector_group",
			"trans_code":"D|E",
			"trans_day_gteq":year+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(year)+1)+"-"+ctrack.args.newyear,
//			"country_code":(args.country || ctrack.args.country_select),
//			"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//			"title_like":(args.search || ctrack.args.search),
		};
	fetch.ajax_dat_fix(dat,args);

	if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
	var callback=function(data){
		
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.sector_group=iati_codes.sector_names[ v.sector_group ];
			d.usd=Math.floor(v.sum_of_percent_of_trans_usd*ctrack.convert_usd);
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
					d.str_num=commafy(v.usd)+" "+ctrack.display_usd;
					d.str_lab=v.sector_group;
					d.str="<b>"+d.str_num+"</b> ("+d.pct+"%)<br/>"+d.str_lab;
					dd.push(d);
				}
			}
		}

		ctrack.chunk("data_chart_sectors",dd);	
		ctrack.display();

	};
	fetch.ajax(dat,callback);

}
