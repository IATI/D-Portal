// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher_countries_top=exports;
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
view_publisher_countries_top.chunks=[
	"data_chart_publisher_countries",
	"countries_count",
];


//
// Perform fake ajax call to get data 
//
view_publisher_countries_top.ajax=function(args)
{
	args=args || {};
	var limit=args.limit || 5;

	var list=[];

	var year=2012;
	var dat={
			"from":"act,trans,country",
			"limit":-1,
			"select":"country_code,sum_of_percent_of_trans_usd",
			"groupby":"country_code",
			"trans_code":"D|E",
//			"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
			"country_code":(args.country || ctrack.args.country_select),
			"reporting_ref":(args.publisher || ctrack.args.publisher_select),
		};
	fetch.ajax(dat,function(data){
//			console.log("fetch transactions donors "+year);
//			console.log(data);
			
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			var num=v.sum_of_percent_of_trans_usd;
			d.country_code=v.country_code || "N/A";
			d.country_name=iati_codes.country[v.country_code] || v.country_code || "N/A";
			d.usd=Math.floor(num);
			list.push(d)
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
				v.str_lab=(1+list.length-limit)+" More";
			}
			
			if(v)
			{
				shown+=v.usd;
				var d={};
				d.num=v.usd;
				d.pct=Math.floor(100*v.usd/total);
				d.str_num=commafy(d.num)+" USD";
				d.str_lab=v.str_lab || v.country_name;
				d.str=d.str_lab+" ("+d.pct+"%)"+"<br/>"+d.str_num;
				dd.push(d);
			}
		}
			
		ctrack.chunk("data_chart_publisher_countries",dd);
		ctrack.chunk("countries_count",list.length);

		ctrack.display();
	});

}
