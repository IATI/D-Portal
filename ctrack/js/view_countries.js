// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_countries=exports;
exports.name="view_countries";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs.js").donors

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_countries.chunks=[
	"table_countries_rows",
	"table_countries",
	"countries_count",
];

//
// display the view
//
view_countries.view=function(args)
{
	view_countries.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_countries.ajax(args);
};

view_countries.show=function()
{
	var year=parseInt(ctrack.hash.year) || ctrack.year;
	if(year!=view_countries.year) // new year update?
	{
		view_countries.ajax()
	}
	ctrack.div.master.html( plate.replace( "{view_countries}" ) );
};

//
// Perform ajax call to get data
//
view_countries.ajax=function(args)
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
	view_countries.year=year;

	ctrack.countries_data={};

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
		for(var n in ctrack.countries_data) { a.push( ctrack.countries_data[n] ); }
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
				s.push( plate.replace(args.plate || "{table_countries_crs_row}",v) );
			}
			else
			{
				s.push( plate.replace(args.plate || "{table_countries_row}",v) );
			}
		});
		if(gotcrs)
		{
			ctrack.chunk(args.chunk || "table_countries_crs_rows",s.join(""));
			ctrack.chunk("table_countries","{table_countries_crs}"); // use CRS version
		}
		else
		{
			ctrack.chunk(args.chunk || "table_countries_rows",s.join(""));
			ctrack.chunk_clear("table_countries");
		}

		ctrack.chunk("countries_count",a.length);

		var p=function(s)
		{
			s=s || "";
			s=s.replace(/[,]/g,"");
			return parseInt(s);
		}
			var cc=[];
		cc[0]=["country","t"+(year-1),"t"+(year),"t"+(year+1),"ab"+(year+1),"tb"+(year+1),"link"];
		a.forEach(function(v){
			cc[cc.length]=[v.country_code,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2),"http://d-portal.org/ctrack.html?country="+v.country_code];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
 
		ctrack.display();

	};
	view_countries.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.countries_data[d.country_code];
		if(!it) { it={}; ctrack.countries_data[d.country_code]=it; }
		
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
				"from":"act,trans",
				"limit":args.limit || -1,
				"select":"trans_country,"+ctrack.convert_str("sum_of_percent_of_trans"),
				"trans_country_not_null":"1",
				"groupby":"trans_country",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
			};
		fetch.ajax_dat_fix(dat,args,"trans");
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
//			console.log("fetch transactions donors "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				var num=ctrack.convert_num("sum_of_percent_of_trans",v);
				d.country_code=v.trans_country || "N/A";
				d.country_name=iati_codes.country[v.trans_country] || v.trans_country || "N/A";
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
	
	var years=[year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,budget",
				"limit":args.limit || -1,
				"select":"budget_country,"+ctrack.convert_str("sum_of_percent_of_budget"),
				"budget_priority":1, // has passed some validation checks serverside
				"budget_country_not_null":"1",
				"groupby":"budget_country",
				"budget_day_start_gteq":y+"-"+ctrack.args.newyear,"budget_day_start_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
			};
		fetch.ajax_dat_fix(dat,args,"budget");
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.country_code=v.budget_country || "N/A";
				d.country_name=iati_codes.country[v.budget_country] || v.budget_country || "N/A";
				d["b1"]=commafy(""+Math.floor(ctrack.convert_num("sum_of_percent_of_budget",v)));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});


	var years=[year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"budget",
				"limit":args.limit || -1,
				"select":"budget_country,"+"any_"+ctrack.convert_str("budget"),
				"budget":"country", // only budgets for countries listed in org files
				"budget_country_not_null":"1",
				"groupby":"budget_country",
				"budget_day_start_gteq":y+"-"+ctrack.args.newyear,"budget_day_start_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
			};
		fetch.ajax_dat_fix(dat,args);
		dat.aid=dat.reporting_ref; // use fake reporting aid in budget data to choose a publisher
		delete dat.reporting_ref
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.country_code=v.budget_country || "N/A";
				d.country_name=iati_codes.country[d.country_code] || d.country_code;
				d["b2"]=commafy(""+Math.floor(ctrack.convert_num("budget",v)));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});

}
