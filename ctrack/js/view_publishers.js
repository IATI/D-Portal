// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publishers=exports;
exports.name="view_publishers";

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
view_publishers.chunks=[
	"table_publishers_count",
	"table_publishers_rows",
	"table_publishers",
];

//
// display the view
//
view_publishers.view=function(args)
{
	view_publishers.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_publishers.ajax(args);
};

//
// Perform ajax call to get data
//
view_publishers.ajax=function(args)
{
	args=args || {};

	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	ctrack.publishers_data={};

	ctrack.sortby="order"; // reset sortby
	var display=function(sortby)
	{
		var s=[];
		var a=[];
		for(var n in ctrack.publishers_data) { a.push( ctrack.publishers_data[n] ); }
		if(!sortby)
		{
			sortby=tables.sortby();
		}
		a.sort(sortby);
		a.forEach(function(v){
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}

			v.publisher=iati_codes.publisher_names[v.reporting_ref] || iati_codes.country[v.reporting_ref] || v.reporting_ref;
			s.push( plate.replace(args.plate || "{table_publishers_row}",v) );
		});
		ctrack.chunk(args.chunk || "table_publishers_rows",s.join(""));
		ctrack.chunk("table_publishers_count",a.length);

		ctrack.chunk_clear("table_publishers");

	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}
		var cc=[];
		cc[0]=["publisher","t"+(year-1),"t"+(year),"t"+(year+1),"b"+(year+1),"b"+(year+2)];
		a.forEach(function(v){
			cc[cc.length]=[v.publisher,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
 
		ctrack.display();

	};
	view_publishers.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.publishers_data[d.reporting_ref];
		if(!it) { it={}; ctrack.publishers_data[d.reporting_ref]=it; }
		
		for(var n in d)
		{
			if(d[n])
			{
				it[n]=d[n];
			}
		}
	}

	var years=[year-1,year,year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,trans,country",
				"limit":args.limit || -1,
				"select":"reporting_ref,sum_of_percent_of_trans_usd",
				"groupby":"reporting_ref",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
				"title_like":(args.search || ctrack.args.search),
			};
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
//			console.log("fetch transactions publishers "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				var num=v.sum_of_percent_of_trans_usd*ctrack.convert_usd;
				d.reporting_ref=v.reporting_ref;
				d["t"+(2+y-year)]=commafy(""+Math.floor(num));
				if(y==year)
				{
					if( num > (d.order||0) ) { d.order=num; } // use ctrack.year transaction value for sort if bigger
				}
				fadd(d);
			}
//			console.log(ctrack.publishers_data);
			
			display();
		});
	});
	
	var years=[year+1,year+2];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,budget,country",
				"limit":args.limit || -1,
				"select":"reporting_ref,sum_of_percent_of_budget_usd",
				"budget_priority":1, // has passed some validation checks serverside
				"groupby":"reporting_ref",
				"budget_day_end_gteq":y+"-"+ctrack.args.newyear,"budget_day_end_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
				"title_like":(args.search || ctrack.args.search),
			};
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget publishers "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.reporting_ref=v.reporting_ref;
				d["b"+(y-year)]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd*ctrack.convert_usd));
				fadd(d);
			}
//			console.log( "b"+(y-year) );
//			console.log(ctrack.publishers_data);
			
			display();
		});
	});
}
