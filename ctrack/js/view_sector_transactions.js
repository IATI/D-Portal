// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_sector_transactions={}
export default view_sector_transactions
view_sector_transactions.name="view_sector_transactions"

import ctrack     from "./ctrack.js"
import views      from "./views.js"
import refry      from "../../dstore/js/refry.js"
import iati_codes from "../../dstore/json/iati_codes.json"


var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_sector_transactions.chunks=[
	"sector_transactions_datas",
];

//
// display the view
//
view_sector_transactions.view=function()
{
	ctrack.chunk("alerts","");
		
	view_sector_transactions.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();

	var year=ctrack.hash.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	var sector=ctrack.hash.sector_group || "111";
	
	var args={};
	args.zerodata="{alert_no_data3}";
	
	args.plate="{sector_transactions_data}";
	args.chunk="sector_transactions_datas";
	
	args.q={
		"year":year,
//		"sector_group":sector,
//		"from":"act,country,sector,trans",
	};
	args.q["trans_day_gteq"]=year+"-"+ctrack.args.newyear;
	args.q["trans_day_lt"]=(parseInt(year)+1)+"-"+ctrack.args.newyear;
				
	args.callback=function(data){

		ctrack.chunk("sector", iati_codes.sector_category[sector] || iati_codes.sector_category_withdrawn[sector] || sector );
		ctrack.chunk("year",year);
	};
	
	views.list_transactions.ajax(args);
};
