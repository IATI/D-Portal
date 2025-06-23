// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_donor_budgets={}
export default view_donor_budgets
view_donor_budgets.name="view_donor_budgets"

import ctrack     from "./ctrack.js"
import views      from "./views.js"
import iati_codes from "../../dstore/json/iati_codes.json"


var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donor_budgets.chunks=[
	"donor_budgets_datas",
];

//
// display the view
//
view_donor_budgets.view=function()
{
	view_donor_budgets.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	
	var year=ctrack.hash.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	var funder=ctrack.hash.funder;
	
	var args={};
	args.zerodata="{alert_no_data1}";
	
	args.plate="{donor_budgets_data}";
	args.chunk="donor_budgets_datas";
	
	args.q={
		"year":year,
		"funder_ref":funder,
	};
	args.q["budget_day_start_gteq"]=year+"-"+ctrack.args.newyear;
	args.q["budget_day_start_lt"]=(parseInt(year)+1)+"-"+ctrack.args.newyear;				
							
	ctrack.chunk("alerts","");
	if( iati_codes.crs_no_iati[funder] )
	{
		args.zerodata="{alert_no_iati}";
	}
	args.callback=function(data){
		ctrack.chunk("donor",iati_codes.funder_names[funder] || iati_codes.country[funder] || funder );
		ctrack.chunk("year",year);
	};
	
	views.list_budgets.ajax(args);
};
