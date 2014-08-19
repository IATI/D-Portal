// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sector_activities=exports;
exports.name="sector_activities";

var ctrack=require("./ctrack.js")
var views=require("./views.js")

var iati_codes=require("../../dstore/json/iati_codes.json")

// the chunk names this view will fill with new data
view_sector_activities.chunks=[
	"sector_activities_datas",
];

//
// display the view
//
view_sector_activities.view=function()
{
	ctrack.chunk("alerts","");

	view_sector_activities.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	
	var sector=ctrack.hash.sector_group || "111";
	
	var args={};
	args.zerodata="{alert_no_data3}";
	
	args.plate="{sector_activities_data}";
	args.chunk="sector_activities_datas";
	
	args.q={
//		"sector_group":sector,
//		"from":"act,country,sector",
		"groupby":"aid",
	};
	
	args.callback=function(data){
		
		ctrack.chunk("sector",iati_codes.sector_names[sector] );
		
	};
	
	views.list_activities.ajax(args);
};
