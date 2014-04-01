// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donor_activities=exports;
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
	view_donor_activities.ajax({year:ctrack.hash.year,funder:ctrack.hash.funder});
};

//
// Perform ajax call to get data
//
view_donor_activities.ajax=function(args)
{
	args=args || {};

	var funder=args.funder || "gb";

	var dat={
			"from":"act,country",
			"limit":args.limit || -1,
			"select":"title,aid,funder,commitment,spend,reporting_org",
			"funder":funder,
			"orderby":"commitment-",
			"country_code":(args.country || ctrack.args.country)
		};
	fetch.ajax(dat,function(data){
//		console.log("fetched donor_activities ");
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
			d.commitment=commafy(""+Math.floor(v.commitment));
			d.spend=commafy(""+Math.floor(v.spend));
			d.pct=0;
			if( v.commitment && (v.commitment!=0) )
			{
				d.pct=Math.floor(100*v.spend/v.commitment);
				if(d.pct<0){d.pct=0;}
				if(d.pct>100){d.pct=100;}
			}

			s.push( plate.replace("{donor_activities_data}",d) );
		}

		ctrack.chunk("alerts","");
		if( iati_codes.crs_no_iati[funder] )
		{
			ctrack.chunk("alerts","{alert_no_iati}");
		}

		ctrack.chunk("donor",iati_codes.funder_names[funder] || iati_codes.country[funder] || funder );

		ctrack.chunk("donor_activities_datas",s.join(""));
		ctrack.display();
	});
}
