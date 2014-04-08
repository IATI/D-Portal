// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_list_activities=exports;
exports.name="list_activities";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var views=require("./views.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_list_activities.chunks=[
	"list_activities_datas",
];

//
// display the view
//
view_list_activities.view=function()
{
	view_list_activities.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	view_list_activities.ajax({q:ctrack.hash});
};

//
// Perform ajax call to get data
//
view_list_activities.ajax=function(args)
{
	args=args || {};

	var dat={
			"from":"act,country",
			"limit":args.limit || -1,
			"select":"title,aid,funder_ref,commitment,spend,reporting,day_start,day_end",
			"orderby":"4-",
			"country_code":(args.country || ctrack.args.country)
		};
	if(args.q)
	{
		for(var n in args.q) // override with special qs
		{
			dat[n]=args.q[n];
		}
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
			ctrack.chunk(args.chunk || "list_activities_count",data.rows[0]["count"]);
			views.stats.calc();
		}
		else
		{
			var s=[];
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.num=i+1;
				d.funder=v.funder || "N/A";
				d.aid=v.aid || "N/A";
				d.title=v.title || v.aid || "N/A";
				
				d.date_start="N/A"
				d.date_end="N/A"
				if(v.day_start!==null) { d.date_start=fetch.get_nday(v.day_start); }
				if(v.day_end  !==null) { d.date_end  =fetch.get_nday(v.day_end  ); }

				d.reporting=v.reporting || "N/A";
				d.commitment=commafy(""+Math.floor(v.commitment||0));
				d.spend=commafy(""+Math.floor(v.spend||0));
				d.currency="USD";
				d.pct=0;
				if( v.commitment && (v.commitment!=0) )
				{
					d.pct=Math.floor(100*v.spend/v.commitment);
					if(d.pct<0){d.pct=0;}
					if(d.pct>100){d.pct=100;}
				}

				s.push( plate.replace(args.plate || "{list_activities_data}",d) );
			}
			ctrack.chunk(args.chunk || "list_activities_datas",s.join(""));
			ctrack.chunk("total_projects",data.rows.length);
		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
