// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donors=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donors.chunks=[
	"table_donors_rows",
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
	
	var display=function()
	{
		var s=[];
		var a=[];
		for(var n in ctrack.donors_data) { a.push( ctrack.donors_data[n] ); }
		a.sort(function(a,b){
			if(b.order==a.order)
			{
				return ( (b.t2012||0) - (a.t2012||0) );
			}
			return ( (b.order||0)-(a.order||0) );
		});
		a.forEach(function(v){
			if(!v.crs){v.crs="0";}
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}

			if( iati_codes.crs_no_iati[v.funder] )
			{
				v.t2012="-";
				v.t2013="-";
				v.t2014="-";
				v.b2014="-";
				v.b2015="-";
			}

			v.donor=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			s.push( plate.replace(args.plate || "{table_donors_row}",v) );
		});
		ctrack.chunk(args.chunk || "table_donors_rows",s.join(""));
		ctrack.display();
	};
	
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
				"select":"funder,sum_of_percent_of_trans_usd",
				"funder_not_null":"",
				"groupby":"funder",
				"trans_code":"D|E",
				"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		fetch.ajax(dat,function(data){
//			console.log("fetch transactions donors "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.funder=v.funder;
				d["t"+year]=commafy(""+Math.floor(v.sum_of_percent_of_trans_usd));
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
				"select":"funder,sum_of_percent_of_budget_usd",
				"priority":1, // has passed some validation checks serverside
				"funder_not_null":"",
				"groupby":"funder",
				"budget_day_end_gteq":year+"-01-01","budget_day_end_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.funder=v.funder;
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
}
