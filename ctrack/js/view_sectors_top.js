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

	var year=2012;
	var dat={
			"from":"trans,country,sector",
			"limit":-1,
			"select":"sector_group,sum_of_percent_of_trans_usd",
			"groupby":"1",
			"orderby":"2-",
			"code":"D|E",
			"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
			"country_code":(args.country || ctrack.args.country)
		};

	var callback=function(data){
//		console.log("fetch transactions sectors "+year);
//		console.log(data);

		var total=0; data.rows.forEach(function(it){
			if(it.sum_of_percent_of_trans_usd>0)
			{
				total+=it.sum_of_percent_of_trans_usd;
			}
			else
			{
				total-=it.sum_of_percent_of_trans_usd;
			}
		});
		var shown=0;
		var dd=[];
		for( var i=0; i<limit ; i++ )
		{
			var v=data.rows[i];			
			if(v)
			{
				if((i==limit-1)&&(i<(data.rows.length-1))) // last one combines everything else
				{
					v={};
					v.usd=Math.floor(total-shown);
					v.sector_group=(1+data.rows.length-limit)+" More";
				}
				else
				{
					v.usd=Math.floor(v.sum_of_percent_of_trans_usd);
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

/*
		var s=[];
		var t;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var n=v.sum_of_percent_of_trans_usd;
			t=t||n;
			v.usd=commafy(""+Math.floor(v.sum_of_percent_of_trans_usd));
			v.pct=Math.floor(100*n/t);
			s.push( plate.replace("{main_sector_row}",v) );
		}
		
		ctrack.chunk("main_sector_rows",s.join(""));
*/

		ctrack.chunk("data_chart_sectors",dd);
		
		ctrack.display();
	};
	fetch.ajax(dat,callback);

}
