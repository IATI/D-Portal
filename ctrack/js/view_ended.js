// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_ended=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetxh=require("./fetch.js")

var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")


var refry=require("../../dstore/js/refry.js")

// the chunks this view will fill with new data
view_ended.chunks=[ "ended_projects_datas" ];

//
// set {spinner} in any chunks we are about to fill in
//
view_ended.spinner=function()
{
	ctrack.chunk("ended_projects_datas","{spinner}");
};

//
// Perform ajax call to get data
//
view_ended.ajax=function(args)
{
	args=args || {};
	
//	var today=fetch.get_today();
    
	var dat={
			"from":"act,country",
			"limit":args.limit || 5,
			"orderby":"day_end-",
			"status_code":"3|4",
//			"day_end_lt":today,
			"country_code":(args.country || ctrack.args.country)
		};
	var callback=args.callback || view_ended.callback;
	fetch.ajax(dat,callback);
}

//
// Process the data returned from the ajax call
// This data will be saved into the chunks that we reviously set to spinner
//
view_ended.callback=function(data)
{
//		console.log("fetch finshed : "+today);
//		console.log(data);
		
	var s=[];
	for(i=0;i<data.rows.length;i++)
	{
		var v=data.rows[i];
		v.num=i+1;

		v.title=v.title || v.aid;
		v.date=fetch.get_nday(v.day_end);

		v.activity=v.aid;

		s.push( plate.replace("{ended_projects_data}",v) );
	}

	ctrack.chunk("ended_projects_datas",s.join(""));

	ctrack.display();
}

