// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_sector_activities={}
export default view_sector_activities
view_sector_activities.name="view_sector_activities"

import ctrack     from "./ctrack.js"
import views      from "./views.js"
import iati_codes from "../../dstore/json/iati_codes.json"

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
		"distincton":"aid",
	};
	
	args.callback=function(data){
		
		ctrack.chunk("sector", iati_codes.sector_category[sector] || iati_codes.sector_category_withdrawn[sector] || sector );
		
	};
	
	views.list_activities.ajax(args);
};
