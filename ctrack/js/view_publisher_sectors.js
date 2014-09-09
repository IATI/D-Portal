// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher_sectors=exports;
exports.name="publisher_sectors";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_publisher_sectors.chunks=[
	"table_publisher_sectors_rows",
	"table_publisher_sectors",
	"sectors_count",
];

//
// display the view
//
view_publisher_sectors.view=function(args)
{
	view_publisher_sectors.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_publisher_sectors.ajax(args);
};

//
// Perform ajax call to get data
//
view_publisher_sectors.ajax=function(args)
{
	args=args || {};

	ctrack.publisher_sectors_data={};

	ctrack.sortby="order"; // reset sortby
	var display=function(sortby)
	{
		var p=function(s)
		{
			s=s || "";
			s=s.replace(/[,]/g,"");
			return parseInt(s);
		}
		var s=[];
		var a=[];
		for(var n in ctrack.publisher_sectors_data) { a.push( ctrack.publisher_sectors_data[n] ); }
		if(!sortby)
		{
			sortby=tables.sortby();
		}
		a.sort(sortby);
		a.forEach(function(v){
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}

			s.push( plate.replace(args.plate || "{table_publisher_sectors_row}",v) );
		});
		ctrack.chunk(args.chunk || "table_publisher_sectors_rows",s.join(""));

		ctrack.chunk("sectors_count",a.length);
		ctrack.chunk_clear("table_publisher_sectors");

	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}
		var cc=[];
		cc[0]=["sector","t2012","t2013","t2014","b2014","b2015"];
		a.forEach(function(v){
			cc[cc.length]=[v.sector_code,p(v.t2012),p(v.t2013),p(v.t2014),p(v.b2014),p(v.b2015)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
 
		ctrack.display();

	};
	view_publisher_sectors.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.publisher_sectors_data[d.sector_code];
		if(!it) { it={}; ctrack.publisher_sectors_data[d.sector_code]=it; }
		
		for(var n in d)
		{
			if(d[n])
			{
				it[n]=d[n];
			}
		}
	}


	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"act,trans,sector",
				"limit":args.limit || 100,
				"select":"sector_code,sum_of_percent_of_trans_usd",
				"groupby":"sector_code",
				"trans_code":"D|E",
				"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
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
				d.sector_code=v.sector_code || "N/A";
				d.sector_name=iati_codes.sector[v.sector_code] || v.sector_code || "N/A";
				d["t"+year]=commafy(""+Math.floor(num));
				if(year==2012)
				{
					d.order=num; // default, use 2012 transaction value for sort
				}
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
	
	var years=[2014,2015];
	years.forEach(function(year)
	{
		var dat={
				"from":"act,budget,sector",
				"limit":args.limit || 100,
				"select":"sector_code,sum_of_percent_of_budget_usd",
				"budget_priority":1, // has passed some validation checks serverside
				"groupby":"sector_code",
				"budget_day_end_gteq":year+"-01-01","budget_day_end_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.sector_code=v.sector_code || "N/A";
				d.sector_name=iati_codes.sector[v.sector_code] || v.sector_code || "N/A";
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
}
