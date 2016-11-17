// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_act=exports;
exports.name="view_act";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var savi=require("./savi.js")

var refry=require("../../dstore/js/refry.js")

// the chunk names this view will fill with new data
view_act.chunks=[
	"act",
];

// called on view display to fix html in place
view_act.fixup=function()
{
	savi.fixup({});
}

//
// display the view
//
view_act.view=function(args)
{
	view_act.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(3);
	ctrack.change_hash();
	view_act.ajax({
		aid:ctrack.hash.aid,
		lat:ctrack.hash.lat,
		lng:ctrack.hash.lng,
		country:ctrack.hash.country,
		publisher:ctrack.hash.publisher,
	});
};

//
// Perform ajax call to get data
//
view_act.ajax=function(args)
{
	args=args || {};
    
	var dat={
			"select":"jml",
			"from":"act,jml",
			"distincton":"aid",
			"aid":args.aid,
		};

	if(args.lat)
	{
		dat.location_latitude_gt=Number(args.lat)-0.001;
		dat.location_latitude_lt=Number(args.lat)+0.001;
	}
	if(args.lng)
	{
		dat.location_longitude_gt=Number(args.lng)-0.001;
		dat.location_longitude_lt=Number(args.lng)+0.001;
	}
//	for(var n in ctrack.q) { dat[n]=ctrack.q[n]; }
//	for(var n in ctrack.hash) { dat[n]=ctrack.hash[n]; }
//	for(var n in args.q) { dat[n]=args.q[n]; }
//	if(dat.country_code) { dat.from+=",country"; }
//	if(dat.location_latitude && dat.location_longitude) { dat.from+=",location"; }
	fetch.ajax_dat_fix(dat,args);
	if(dat.aid){
		delete dat.location_latitude_gt;
		delete dat.location_latitude_lt;
		delete dat.location_longitude_gt;
		delete dat.location_longitude_lt;
		delete dat.country_code;
		delete dat.reporting_ref;
	}
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_act.numof_callback");
//		console.log(data);
			
		if(data["rows"][0])
		{
			var aa=[];
			for(var i=0;i<data.rows.length;i++)
			{
				aa[i]=refry.json( data["rows"][i].jml );
//				console.log(aa[i]);
			}
			ctrack.chunk("xml", aa.join("") );
		}
		else
		{
			ctrack.chunk("xml","{missing_data}");
		}
				
		ctrack.display(); // every fetch.ajax must call display once
	});
}
