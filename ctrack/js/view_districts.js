// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_districts=exports;
exports.name="view_districts";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2013.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_districts.chunks=[
	"table_districts_rows",
];

//
// display the view
//
view_districts.view=function(args)
{
	view_districts.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_districts.ajax(args);
};

//
// Perform ajax call to get data
//
view_districts.ajax=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};
	
	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	ctrack.districts_data={};
	
	var display=function()
	{
		var s=[];
		var a=[];
		for(var n in ctrack.districts_data) { a.push( ctrack.districts_data[n] ); }
		a.sort(function(a,b){return (b.order-a.order)});
		a.forEach(function(v){
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}
			s.push( plate.replace("{table_districts_row}",v) );
		});
		ctrack.chunk("table_districts_rows",s.join(""));
		ctrack.display();
	};
	
	var fadd=function(d)
	{
		var it=ctrack.districts_data[d.location];
		if(!it) { it={}; ctrack.districts_data[d.location]=it; }
		
		for(var n in d)
		{
			it[n]=d[n];
		}
	}

	var years=[year-1,year,year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"trans,country,location",
				"limit":args.limit || -1,
				"select":"location_name,sum_of_percent_of_usd",
				"groupby":"location_name",
				"location_code":"adm2",
				"code":"D|E",
				"day_gteq":y+"-01-01","day_lt":(parseInt(y)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		var callback=function(data){
//			console.log("fetch transactions districts "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.location=v.location_name;
				d["t"+(2+year-y)]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				if(y==year)
				{
					d.crs=commafy(""+Math.floor(v.sum_of_percent_of_usd));
					d.order=v.sum_of_percent_of_usd;
				}
				fadd(d);
			}
//			console.log(ctrack.districts_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
	
	var years=[year+1,year+2];
	years.forEach(function(y)
	{
		var dat={
				"from":"budget,country,location",
				"limit":args.limit || 100,
				"select":"location_name,sum_of_percent_of_usd",
				"groupby":"location_name",
				"priority":1, // has passed some validation checks serverside
				"location_code":"adm2",
				"day_end_gteq":y+"-01-01","day_end_lt":(parseInt(y)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		var callback=function(data){
			
//			console.log("fetch budget districts "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.location=v.location_name;
				d["b"+(y-year)]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				fadd(d);
			}
//			console.log(ctrack.districts_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
}
