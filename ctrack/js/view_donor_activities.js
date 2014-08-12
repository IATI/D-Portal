// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donor_activities=exports;
exports.name="donor_activities";

var ctrack=require("./ctrack.js")
var views=require("./views.js")

var iati_codes=require("../../dstore/json/iati_codes.json")

// the chunk names this view will fill with new data
view_donor_activities.chunks=[
	"donor_activities_datas",
];

//
// display the view
//
view_donor_activities.view=function()
{
	view_donor_activities.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	
	var funder=ctrack.hash.funder;
	
	var args={};
	args.zerodata="{alert_no_data1}";
	
	args.plate="{donor_activities_data}";
	args.chunk="donor_activities_datas";
	
	args.q={
		"funder_ref":funder,
		"groupby":"aid",
	};
	
	ctrack.chunk("alerts","");
	if( iati_codes.crs_no_iati[funder] )
	{
		args.zerodata="{alert_no_iati}";
	}

	args.callback=function(data){
		ctrack.chunk("donor",iati_codes.funder_names[funder] || iati_codes.publisher_names[funder] || iati_codes.country[funder] || funder );
		
	};
	
	views.list_activities.ajax(args);
};
