// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donor_budgets=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
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
	view_donor_budgets.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	view_donor_budgets.ajax({year:ctrack.hash.year,funder:ctrack.hash.funder});
};

//
// Perform ajax call to get data
//
view_donor_budgets.ajax=function(args)
{
	args=args || {};

	var year=args.year || 2012;
	var funder=args.funder || "gb";

	var dat={
			"from":"act,budget,country",
			"limit":args.limit || -1,
			"select":"sum_of_percent_of_budget_usd,aid,funder,title",
//			"funder_not_null":"",
			"funder":funder,
			"groupby":"aid",
			"orderby":"1-",
			"budget_priority":1, // has passed some validation checks serverside
			"budget_day_end_gteq":year+"-01-01","budget_day_end_lt":(parseInt(year)+1)+"-01-01",
			"country_code":(args.country || ctrack.args.country)
		};
	fetch.ajax(dat,function(data){
//		console.log("fetch donor_budgets "+year);
//		console.log(data);

		var total=0;
		var s=[];
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.funder=v.funder;
			d.aid=v.aid;
			d.title=v.title || v.aid;
			d.amount=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd));
			total+=v.sum_of_percent_of_budget_usd;

			s.push( plate.replace("{donor_budgets_data}",d) );
		}

		ctrack.chunk("alerts","");
		if( iati_codes.crs_no_iati[funder] )
		{
			ctrack.chunk("alerts","{alert_no_iati}");
		}

		ctrack.chunk("donor",iati_codes.crs_funders[funder] || iati_codes.country[funder] || funder );
		ctrack.chunk("year",year);
		ctrack.chunk("total",commafy(""+Math.floor(total)));

		ctrack.chunk("donor_budgets_datas",s.join(""));
		ctrack.display();
	});
}
