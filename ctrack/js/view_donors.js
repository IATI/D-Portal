// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donors=exports;
exports.name="stats";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donors.chunks=[
	"table_donors_rows",
	"table_donors",
];

//
// display the view
//
view_donors.view=function(args)
{
	view_donors.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_donors.ajax(args);
};

//
// Perform ajax call to get data
//
view_donors.ajax=function(args)
{
	args=args || {};

	ctrack.donors_data={};

	ctrack.sortby="order"; // reset sortby
	var display=function(sortby)
	{
		var s=[];
		var a=[];
		for(var n in ctrack.donors_data) { a.push( ctrack.donors_data[n] ); }
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

			if( iati_codes.crs_no_iati[v.funder] )
			{
				if(v.t2012=="0") { v.t2012="-"; }
				if(v.t2013=="0") { v.t2013="-"; }
				if(v.t2014=="0") { v.t2014="-"; }
				if(v.b2014=="0") { v.b2014="-"; }
				if(v.b2015=="0") { v.b2015="-"; }
			}

			v.donor=iati_codes.funder_names[v.funder] || iati_codes.publisher_names[v.funder] || iati_codes.country[v.funder] || v.funder;
			s.push( plate.replace(args.plate || "{table_donors_row}",v) );
		});
		ctrack.chunk(args.chunk || "table_donors_rows",s.join(""));

		ctrack.chunk_clear("table_donors");

	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}
		var cc=[];
		cc[0]=["crs","funder","t2012","t2013","t2014","b2014","b2015"];
		a.forEach(function(v){
			cc[cc.length]=[p(v.crs),v.funder,p(v.t2012),p(v.t2013),p(v.t2014),p(v.b2014),p(v.b2015)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
 
		ctrack.display();

	};
	view_donors.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.donors_data[d.funder];
		if(!it) { it={}; ctrack.donors_data[d.funder]=it; }
		
		for(var n in d)
		{
			if(d[n])
			{
				it[n]=d[n];
			}
		}
	}

// insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.crs=commafy(""+Math.floor(crs[n]));
		d.order=crs[n];
		fadd(d);
	}

	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"act,trans,country",
				"limit":args.limit || 100,
				"select":"funder_ref,sum_of_percent_of_trans_usd",
				"funder_ref_not_null":"",
				"groupby":"funder_ref",
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
				d.funder=v.funder_ref;
				d["t"+year]=commafy(""+Math.floor(num));
				if(year==2012)
				{
					if( num > (d.order||0) ) { d.order=num; } // use 2012 transaction value for sort if bigger
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
				"from":"act,budget,country",
				"limit":args.limit || 100,
				"select":"funder_ref,sum_of_percent_of_budget_usd",
				"budget_priority":1, // has passed some validation checks serverside
				"funder_ref_not_null":"",
				"groupby":"funder_ref",
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
				d.funder=v.funder_ref;
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
}
