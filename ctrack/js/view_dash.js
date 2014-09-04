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
	"dash_listall_country_datas",
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
}

//
// Perform ajax call to get numof data
//
view_dash.ajax=function(args)
{
	args=args || {};
	args.country=ctrack.hash.country;
	
	view_dash.ajax_cronlog(); // basic info
	
	view_dash.ajax1(args); // chain
}

view_dash.ajax_cronlog=function()
{
	fetch.ajax({"from":"cronlog_time"},function(data)
	{
		ctrack.chunk("dash_last_updated",data.time || "N/A");
		ctrack.display(); // every fetch.ajax must call display once
	});
};

view_dash.ajax2=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"select":"count,reporting_ref,reporting",
			"from":"act",//,country",
			"groupby":"reporting_ref",
			"orderby":"1-",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash.ajax");
//		console.log(data);
			
		var s=[];
		var total=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=commafy(v.count);
			d.reporting_ref=v.reporting_ref|| "N/A";
			d.reporting=iati_codes.publisher_names[v.reporting_ref] || v.reporting || v.reporting_ref || "N/A";

			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_list_reporting_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_list_reporting_datas",s.join(""));
		
		ctrack.chunk("dash_total_publishers",commafy(""+Math.floor(data.rows.length)));
			
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
			"select":"count",
			"from":"act",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash.ajax");
//		console.log(data);
		
		if(data.rows.length==1)
		{
			var v=data.rows[0];
			var count_act=v.count;
			ctrack.chunk("dash_total_activities",commafy(""+Math.floor(count_act)));

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
			"select":"count,country_code",
			"from":"country",
			"groupby":"country_code",
			"orderby":"1-",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash.ajax");
//		console.log(data);
		
		var s=[];
		var total=0;
		var bad=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=v.count;
			d.country_code=v.country_code;
			d.country_name=iati_codes.country[d.country_code] || "N/A";
			d.country_valid=iati_codes.country[d.country_code] && "valid" || "invalid";

			if(!iati_codes.country[d.country_code]) { bad+=d.count; }
			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_listall_country_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_listall_country_datas",s.join(""));
		
		ctrack.chunk("dash_country_total",commafy(total));
		ctrack.chunk("dash_country_total_invalid",commafy(bad));
		ctrack.chunk("dash_country_total_invalid_pct",Math.ceil(100*bad/total));
		
		ctrack.chunk("dash_total_countries",commafy(""+Math.floor(data.rows.length)));
		
		view_dash.calc();

		ctrack.display(); // every fetch.ajax must call display once
	});

}
