// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_dash=exports;
exports.name="dash";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash.chunks=[
	"dash_list_reporting_datas",
	"dash_total_countries",
	"dash_total_activities",
	"dash_total_publishers",
];

view_dash.view=function()
{
	if( ! ctrack.chunk("dash_total_countries") )
	{
		view_dash.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
		["dash_list_reporting_datas"].forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});

		view_dash.ajax({});
	}

	ctrack.setcrumb(1);
	ctrack.change_hash();
}

view_dash.calc=function()
{
	var s=(new Date).toUTCString();	
	ctrack.chunk("dash_updated_date",s);
}

//
// Perform ajax call to get numof data
//
view_dash.ajax=function(args)
{
	args=args || {};
	args.country=ctrack.hash.country;
	
	view_dash.ajax1(args); // chain
}

view_dash.ajax2=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"select":"stats",
			"from":"act,country",
			"groupby":"reporting_ref",
			"orderby":"1-",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
		console.log("view_dash.ajax");
		console.log(data);
			
		var s=[];
		var total=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=v["COUNT(DISTINCT aid)"];
			d.reporting_ref=v["MAX(reporting_ref)"] || "N/A";
			d.reporting=iati_codes.publisher_names[d.reporting_ref] || iati_codes.country[d.reporting_ref] || v["MAX(reporting)"] || "N/A";

			d.countries=v["COUNT(DISTINCT country_code)"]; //number of countries reported for

			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_list_reporting_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_list_reporting_datas",s.join(""));
			
		view_dash.calc();

		ctrack.display(); // every fetch.ajax must call display once

		view_dash.ajax3(args);
	});
}

view_dash.ajax1=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"select":"stats",
			"from":"act",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
		console.log("view_dash.ajax");
		console.log(data);
		
		if(data.rows.length==1)
		{
			var v=data.rows[0];
			var count_act=v["COUNT(DISTINCT aid)"];
			ctrack.chunk("dash_total_activities",commafy(""+Math.floor(count_act)));

			var count_pub=v["COUNT(DISTINCT reporting_ref)"];
			ctrack.chunk("dash_total_publishers",commafy(""+Math.floor(count_pub)));
		}
		
		view_dash.calc();

		ctrack.display(); // every fetch.ajax must call display once
		
		view_dash.ajax2(args);
	});
}

view_dash.ajax3=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"select":"stats",
			"from":"country",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
		console.log("view_dash.ajax");
		console.log(data);
		
		if(data.rows.length==1)
		{
			var v=data.rows[0];
			var count=v["COUNT(DISTINCT country_code)"];
			ctrack.chunk("dash_total_countries",commafy(""+Math.floor(count)));
		}
		
		view_dash.calc();

		ctrack.display(); // every fetch.ajax must call display once
	});

}
