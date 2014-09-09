// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_list_budgets=exports;
exports.name="list_budgets";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_list_budgets.chunks=[
	"list_budgets_datas",
	"list_budgets_count",
];

//
// display the view
//
view_list_budgets.view=function()
{
	view_list_budgets.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_list_budgets.ajax({year:ctrack.hash.year,funder:ctrack.hash.funder});
};

//
// Perform ajax call to get data
//
view_list_budgets.ajax=function(args)
{
	args=args || {};
	args.zerodata=args.zerodata||"{alert_no_data1}";

	var dat={
			"from":"act,budget",
			"limit":args.limit || -1,
			"select":"sum_of_percent_of_budget_usd,aid,funder_ref,title,reporting,reporting_ref",
			"groupby":"aid",
			"orderby":"1-",
			"budget_priority":1, // has passed some validation checks serverside
			"country_code":(args.country || ctrack.args.country_select),
			"reporting_ref":(args.publisher || ctrack.args.publisher_select),
		};
	for(var n in ctrack.q) { dat[n]=ctrack.q[n]; }
	for(var n in ctrack.hash) { dat[n]=ctrack.hash[n]; }
	for(var n in args.q) { dat[n]=args.q[n]; }
	if(dat.sector_code||dat.sector_group) { dat.from+=",sector"; }
	if(dat.country_code) { dat.from+=",country"; }
	if(dat.location_latitude && dat.location_longitude) { dat.from+=",location"; }
	if(dat.year)
	{
		dat["budget_day_end_gteq"]=(parseInt(dat.year)+0)+"-01-01";
		dat["budget_day_lt"]=(parseInt(dat.year)+1)+"-01-01";
	}
	if(args.output=="count") // just count please
	{
		dat.select="count";
		delete dat.limit;
		delete dat.orderby;
		delete dat.groupby;
	}
	fetch.ajax(dat,function(data){
		if(args.output=="count")
		{
			ctrack.chunk(args.chunk || "list_budgets_count",data.rows[0]["count"]);
			view_stats.calc();
		}
		else
		{
			var s=[];
			var total=0;
			ctrack.args.chunks["table_header_amount"]=undefined;
			if((data.rows.length==0)&&(args.zerodata))
			{
				s.push( plate.replace(args.zerodata,{}) );
				ctrack.args.chunks["table_header_amount"]="";
			}
			ctrack.chunk("list_budgets_count",data.rows.length);
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.num=i+1;
				d.funder_ref=v.funder_ref;
				d.aid=encodeURIComponent(v.aid);
				d.title=v.title || v.aid;
				d.reporting=iati_codes.publisher_names[v.reporting_ref] || v.reporting || v.reporting_ref;
				total+=v.sum_of_percent_of_budget_usd;
				d.amount=commafy(""+Math.floor(v.sum_of_percent_of_budget_usd));
				d.currency="USD";

				s.push( plate.replace(args.plate || "{list_budgets_data}",d) );
			}
			ctrack.chunk(args.chunk || "list_budgets_datas",s.join(""));
			ctrack.chunk("total",commafy(""+Math.floor(total)));
		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
