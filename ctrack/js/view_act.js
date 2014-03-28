// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_act=exports;
exports.name="stats";

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
	savi.fixup();
}

//
// display the view
//
view_act.view=function(args)
{
	view_act.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(3);
	ctrack.change_hash();
	view_act.ajax({aid:ctrack.hash.aid});
};

//
// Perform ajax call to get data
//
view_act.ajax=function(args)
{
	args=args || {};
    
	var dat={
			"aid":args.aid,
			"select":"jml",
			"from":"act,jml"
		};
		
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_act.numof_callback");
//		console.log(data);
			
		if(data["rows"][0])
		{
			ctrack.chunk("xml", refry.json( data["rows"][0].jml ) );
		}
		else
		{
			ctrack.chunk("xml","{missing_data}");
		}
				
		ctrack.display(); // every fetch.ajax must call display once
	});
}
