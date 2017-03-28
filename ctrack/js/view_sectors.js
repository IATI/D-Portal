// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sectors=exports;
exports.name="view_sectors";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year_sectors=require("../../dstore/json/crs.js").sectors

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

view_sectors.show=function()
{
	var year=parseInt(ctrack.hash.year) || ctrack.year;
	if(year!=view_sectors.year) // new year update?
	{
		view_sectors.ajax()
	}
	ctrack.div.master.html( plate.replace( "{view_sectors}" ) );
};

//
// Perform ajax call to get data
//
view_sectors.ajax=function(args)
{
	args=args || {};

	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);
	view_sectors.year=year;

	ctrack.sectors_data={};
	
	ctrack.sortby="t2"; // reset sortby
//	var rev_sector_category={}; for(var n in iati_codes.sector_category) { rev_sector_category[ iati_codes.sector_category[n] ]=n; }
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
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}
			v.sector=iati_codes.sector_category[v.group] || v.group;
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
		cc[0]=["crs","sector","t"+(year-1),"t"+year,"t"+(year+1),"b"+(year+1),"b"+(year+2)];
		a.forEach(function(v){
			cc[cc.length]=[p(v.crs),v.group,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2)];
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
	var crs=crs_year_sectors[ (args.country || ctrack.args.country || "" ).toUpperCase() ];
	if(crs)
	{
//console.log(crs);
		var crsg={};
		for(var n in crs)
		{
			if(n!="Grand Total")
			{
				var group=n.substring(0, 3); // now we have numbers, just take the first 3 digits
//				group=iati_codes.sector_group[group] || group; // but we may need to group them some more
//				if(!iati_codes.sector_category[group]){ group="930"; } // use other if we do not know the group
				if(!crsg[group]){crsg[group]=0;}
				crsg[group]+=crs[n];
			}
		}

		for(var n in crsg)
		{
			var d={};
			d.group=n;
			d.crs=commafy(""+Math.floor(crsg[n]*ctrack.convert_usd));
			d.crs_num=crsg[n];
			fadd(d);
//console.log(d);
		}
	}
	
	var years=[year-1,year,year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,trans,country,sector",
				"limit":args.limit || -1,
				"select":"sector_group,"+ctrack.convert_str("sum_of_percent_of_trans"),
				"sector_group_not_null":1,
				"groupby":"sector_group",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		var callback=function(data){
//			console.log("fetch transactions sectors "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.group=v.sector_group;
				d["t"+(2+y-year)]=commafy(""+Math.floor(ctrack.convert_num("sum_of_percent_of_trans",v)));
//				d["num_t"+(2+y-year)]=Math.floor(v.sum_of_percent_of_trans_usd);
				fadd(d);
			}
//			console.log(ctrack.sectors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
	
	var years=[year+1,year+2];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,budget,country,sector",
				"limit":args.limit || -1,
				"select":"sector_group,"+ctrack.convert_str("sum_of_percent_of_budget"),
				"sector_group_not_null":1,
				"groupby":"sector_group",
				"budget_priority":1, // has passed some validation checks serverside
				"budget_day_start_gteq":y+"-"+ctrack.args.newyear,"budget_day_start_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		var callback=function(data){
			
//			console.log("fetch budget sectors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.group=v.sector_group;
				d["b"+(y-year)]=commafy(""+Math.floor(ctrack.convert_num("sum_of_percent_of_budget",v)));
				fadd(d);
			}
//			console.log(ctrack.sectors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
}
