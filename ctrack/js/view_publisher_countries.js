// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher_countries=exports;
exports.name="view_publisher_countries";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2013.json");

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_publisher_countries.chunks=[
	"table_publisher_countries_rows",
	"table_publisher_countries",
	"countries_count",
];

//
// display the view
//
view_publisher_countries.view=function(args)
{
	view_publisher_countries.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_publisher_countries.ajax(args);
};

view_publisher_countries.show=function()
{
	var year=parseInt(ctrack.hash.year) || ctrack.year;
	if(year!=view_publisher_countries.year) // new year update?
	{
		view_publisher_countries.ajax()
	}
	ctrack.div.master.html( plate.replace( "{view_publisher_countries}" ) );
};

//
// Perform ajax call to get data
//
view_publisher_countries.ajax=function(args)
{
	args=args || {};

	var gotcrs; // set this to the CRS publisher if we have a map
	var publisher=(args.publisher || ctrack.args.publisher_select);
	if(publisher)
	{
		gotcrs=iati_codes.iati_funders[publisher];
		if(!gotcrs)
		{
			if(iati_codes.funder_names[publisher.toUpperCase()])
			{
				gotcrs=publisher.toUpperCase(); // a country code
			}
		}
	}

	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);
	view_publisher_countries.year=year;

	ctrack.publisher_countries_data={};

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
		for(var n in ctrack.publisher_countries_data) { a.push( ctrack.publisher_countries_data[n] ); }
		if(!sortby)
		{
			sortby=tables.sortby();
		}
		a.sort(sortby);
		a.forEach(function(v){
			if(!v.crs){v.crs="";}
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}

			if(gotcrs)
			{
				s.push( plate.replace(args.plate || "{table_publisher_countries_crs_row}",v) );
			}
			else
			{
				s.push( plate.replace(args.plate || "{table_publisher_countries_row}",v) );
			}
		});
		if(gotcrs)
		{
			ctrack.chunk(args.chunk || "table_publisher_countries_crs_rows",s.join(""));
			ctrack.chunk("table_publisher_countries","{table_publisher_countries_crs}"); // use CRS version
		}
		else
		{
			ctrack.chunk(args.chunk || "table_publisher_countries_rows",s.join(""));
			ctrack.chunk_clear("table_publisher_countries");
		}

		ctrack.chunk("countries_count",a.length);

		var p=function(s)
		{
			s=s || "";
			s=s.replace(/[,]/g,"");
			return parseInt(s);
		}
			var cc=[];
		cc[0]=["country","t"+(year-1),"t"+(year),"t"+(year+1),"b"+(year+1),"b"+(year+2)];
		a.forEach(function(v){
			cc[cc.length]=[v.country_code,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
 
		ctrack.display();

	};
	view_publisher_countries.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.publisher_countries_data[d.country_code];
		if(!it) { it={}; ctrack.publisher_countries_data[d.country_code]=it; }
		
		if(gotcrs)
		{
			var crs=crs_year[ (d.country_code || "" ).toUpperCase() ];
			if(crs)
			{
				if(crs[gotcrs])
				{
					d.crs=commafy(""+Math.floor(crs[gotcrs]*ctrack.convert_usd));
				}
			}
		}

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
				"select":"country_code,sum_of_percent_of_trans_usd",
				"groupby":"country_code",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
//			console.log("fetch transactions donors "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				var num=v.sum_of_percent_of_trans_usd*ctrack.convert_usd;
				d.country_code=v.country_code || "N/A";
				d.country_name=iati_codes.country[v.country_code] || v.country_code || "N/A";
				d["t"+(2+y-year)]=commafy(""+Math.floor(num));
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
				"from":"act,budget,country",
				"limit":args.limit || -1,
				"select":"country_code,sum_of_percent_of_budget_usd",
				"budget_priority":1, // has passed some validation checks serverside
				"groupby":"country_code",
				"budget_day_end_gteq":y+"-"+ctrack.args.newyear,"budget_day_end_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.country_code=v.country_code || "N/A";
				d.country_name=iati_codes.country[v.country_code] || v.country_code || "N/A";
				d["b"+(y-year)]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd*ctrack.convert_usd));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
}
