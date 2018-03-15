// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_dash_slugs=exports;
exports.name="view_dash_slugs";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash_slugs.chunks=[
	"dash_list_slug_datas",
];

view_dash_slugs.view=function()
{
	view_dash_slugs.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	view_dash_slugs.ajax({});

	ctrack.setcrumb(1);
	ctrack.change_hash();
}

view_dash_slugs.calc=function()
{
}

view_dash_slugs.ajax=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count,slug",
			"from":"act",
			"groupby":"slug",
			"orderby":"1-",
			"limit":-1
		};
	fetch.ajax_dat_fix(dat,args);
	fetch.ajax(dat,args.callback || function(data)
	{
		var s=[];
		var total=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=Number(v.count);
			d.slug=v.slug;

			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_list_slugs_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_list_slugs_datas",s.join(""));
		
		ctrack.display(); // every fetch.ajax must call display once
	});
}
