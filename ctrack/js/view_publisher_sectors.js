// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher_sectors=exports;
exports.name="view_publisher_sectors";

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

view_publisher_sectors.show=function()
{
	var year=parseInt(ctrack.hash.year) || ctrack.year;
	if(year!=view_publisher_sectors.year) // new year update?
	{
		view_publisher_sectors.ajax()
	}
	ctrack.div.master.html( plate.replace( "{view_publisher_sectors}" ) );
};

//
// Perform ajax call to get data
//
view_publisher_sectors.ajax=function(args)
{
	args=args || {};

	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);
	view_publisher_sectors.year=year;

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
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}

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
		cc[0]=["sector","t"+(year-1),"t"+(year),"t"+(year+1),"b"+(year+1),"b"+(year+2)];
		a.forEach(function(v){
			cc[cc.length]=[v.sector_code,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2)];
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


	var years=[year-1,year,year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,trans,sector",
				"limit":args.limit || -1,
				"select":"sector_code,sum_of_percent_of_trans_usd",
				"groupby":"sector_code",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		if(dat.country_code) { dat.from+=",country"; }
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
				d["t"+(2+y-year)]=commafy(""+Math.floor(num*ctrack.convert_usd));
				if(y==year)
				{
					d.order=num; // default, use ctrack.year transaction value for sort
				}
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
	
	var years=[year+1,year+2];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,budget,sector",
				"limit":args.limit || -1,
				"select":"sector_code,sum_of_percent_of_budget_usd",
				"budget_priority":1, // has passed some validation checks serverside
				"groupby":"sector_code",
				"budget_day_end_gteq":y+"-"+ctrack.args.newyear,"budget_day_end_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		if(dat.country_code) { dat.from+=",country"; }
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.sector_code=v.sector_code || "N/A";
				d.sector_name=iati_codes.sector[v.sector_code] || v.sector_code || "N/A";
				d["b"+(y-year)]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd*ctrack.convert_usd));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
}
