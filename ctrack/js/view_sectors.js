// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sectors=exports;
exports.name="stats";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year_sectors=require("../../dstore/json/crs_2012_sectors.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_sectors.chunks=[
	"table_sectors_rows",
	"table_sectors",
];

//
// display the view
//
view_sectors.view=function(args)
{
	view_sectors.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_sectors.ajax(args);
};

//
// Perform ajax call to get data
//
view_sectors.ajax=function(args)
{
	args=args || {};

	ctrack.sectors_data={};
	
	ctrack.sortby="order"; // reset sortby
	var rev_sector_names={}; for(var n in iati_codes.sector_names) { rev_sector_names[ iati_codes.sector_names[n] ]=n; }
	var display=function(sortby)
	{
		var s=[];
		var a=[];
		for(var n in ctrack.sectors_data) { a.push( ctrack.sectors_data[n] ); }
		if(!sortby)
		{
			sortby=tables.sortby();
		}
		a.sort(sortby);
		a.forEach(function(v){
			if(!v.crs){v.crs="-";}
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}
			v.sector=iati_codes.sector_names[v.group];
			s.push( plate.replace("{table_sectors_row}",v) );
		});
		ctrack.chunk("table_sectors_rows",s.join(""));
		ctrack.chunk_clear("table_sectors");

	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}
			var cc=[];
		cc[0]=["crs","sector","t2012","t2013","t2014","b2014","b2015"];
		a.forEach(function(v){
			cc[cc.length]=[p(v.crs),v.group,p(v.t2012),p(v.t2013),p(v.t2014),p(v.b2014),p(v.b2015)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));

		ctrack.display();
	};
	view_sectors.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.sectors_data[d.group];
		if(!it) { it={}; ctrack.sectors_data[d.group]=it; }		
		for(var n in d)
		{
			it[n]=d[n];
		}
	}
// insert crs data if we have it
	var crs=crs_year_sectors[ (args.country || ctrack.args.country).toUpperCase() ];
	if(crs)
	{
		for(var n in crs)
		{
			if(n!="Grand Total")
			{
				var d={};
				d.group=rev_sector_names[n];
				d.crs=commafy(""+Math.floor(crs[n]));
				d.crs_num=crs[n];
				fadd(d);
			}
		}
	}
	
	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"trans,country,sector",
				"limit":args.limit || 100,
				"select":"sector_group,sum_of_percent_of_trans_usd",
				"sector_group_not_null":1,
				"groupby":"sector_group",
				"trans_code":"D|E",
				"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		var callback=function(data){
//			console.log("fetch transactions sectors "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.group=v.sector_group;
				d["t"+year]=commafy(""+Math.floor(v.sum_of_percent_of_trans_usd));
				d["num_t"+year]=Math.floor(v.sum_of_percent_of_trans_usd);
				fadd(d);
			}
//			console.log(ctrack.sectors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
	
	var years=[2014,2015];
	years.forEach(function(year)
	{
		var dat={
				"from":"budget,country,sector",
				"limit":args.limit || 100,
				"select":"sector_group,sum_of_percent_of_budget_usd",
				"sector_group_not_null":1,
				"groupby":"sector_group",
				"budget_priority":1, // has passed some validation checks serverside
				"budget_day_end_gteq":year+"-01-01","budget_day_end_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
			};
		var callback=function(data){
			
//			console.log("fetch budget sectors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.group=v.sector_group;
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd));
				fadd(d);
			}
//			console.log(ctrack.sectors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
}
