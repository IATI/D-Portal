// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_list_transactions=exports;
exports.name="list_transactions";

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
view_list_transactions.chunks=[
	"list_transactions_datas",
];

//
// display the view
//
view_list_transactions.view=function()
{
	view_list_transactions.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	view_list_transactions.ajax({q:ctrack.hash});
};

//
// Perform ajax call to get data
//
view_list_transactions.ajax=function(args)
{
	args=args || {};

	var dat={
			"from":"act,trans,country",
			"limit":args.limit || -1,
			"select":"sum_of_percent_of_trans_usd,aid,funder,title,reporting_org",
			"groupby":"aid",
			"orderby":"1-",
			"trans_code":"D|E",
			"country_code":(args.country || ctrack.args.country)
		};
	if(args.q)
	{
		for(var n in args.q) // override with special qs
		{
			dat[n]=args[n];
		}
	}
	
	fetch.ajax(dat,function(data){
//		console.log("fetch transactions "+year);
//		console.log(data);

		var s=[];
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.funder=v.funder;
			d.aid=v.aid;
			d.title=v.title || v.aid;
			d.reporting_org=v.reporting_org;
			d.amount=commafy(""+Math.floor(v.sum_of_percent_of_trans_usd));

			s.push( plate.replace(args.plate || "{list_transactions_data}",d) );
		}
		ctrack.chunk(args.chunk || "list_transactions_datas",s.join(""));
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
