// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_dash_cronlog=exports;
exports.name="view_dash_cronlog";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash_cronlog.chunks=[
	"dash_last_updated",
	"dash_cronlog",
];

view_dash_cronlog.view=function()
{
	view_dash_cronlog.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	view_dash_cronlog.ajax({});

	ctrack.setcrumb(1);
	ctrack.change_hash();
}

view_dash_cronlog.calc=function()
{
}

//
// Perform ajax call to get numof data
//
view_dash_cronlog.ajax=function(args)
{
	view_dash_cronlog.ajax_cronlog(); // basic info
	view_dash_cronlog.ajax_cron(); // basic info
}

view_dash_cronlog.ajax_cronlog=function()
{
	fetch.ajax({"from":"cronlog_time"},function(data)
	{
		ctrack.chunk("dash_last_updated",data.time || "N/A");
		ctrack.display(); // every fetch.ajax must call display once
	});
};

view_dash_cronlog.ajax_cron=function()
{
	fetch.ajax({"from":"cronlog"},function(data)
	{
		var log="N/A"
		if(data.log)
		{
			log=$('<div/>').text(data.log).html()
			log=log.replace(/^dstore\/cache\/(.*)\.(curl|import)\.last\.log:/gi,function(v,slug){
					return "<a href=\"#view=dash_sluglog?slug="+slug+"\">"+v+"</a>"
				})
			log=log.replace(/\n/g,"<br/>")
		}
		ctrack.chunk("dash_cronlog", log )
		
		ctrack.display(); // every fetch.ajax must call display once
	});
};

