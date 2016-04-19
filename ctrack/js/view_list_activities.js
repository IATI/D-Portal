// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_list_activities=exports;
exports.name="view_list_activities";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var views=require("./views.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2014.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_list_activities.chunks=[
	"list_activities_datas",
	"list_activities_count",
];

//
// display the view
//
view_list_activities.view=function()
{
	view_list_activities.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_list_activities.ajax({q:ctrack.hash});
};

//
// Perform ajax call to get data
//
view_list_activities.ajax=function(args)
{
	args=args || {};
	args.zerodata=args.zerodata||"{alert_no_data1}";

	var dat={
			"from":"act",
			"limit":args.limit || -1,
			"select":"title,aid,funder_ref,"+ctrack.convert_str("commitment")+","+ctrack.convert_str("spend")+",reporting,reporting_ref,day_start,day_end",
			"orderby":"4-",
			"groupby":"aid",
//			"country_code":(args.country || ctrack.args.country_select),
//			"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//			"title_like":(args.search || ctrack.args.search),
//			"sector_code":(args.sector_code || ctrack.args.sector_code_select),
//			"sector_group":(args.sector_group || ctrack.args.sector_group_select),
//			"funder_ref":(args.funder_ref || ctrack.args.funder_ref_select),
//			"day_start_lteq":(args.date_max || ctrack.args.date_max),
//			"day_end_gteq":(args.date_min || ctrack.args.date_min),
		};
//	for(var n in ctrack.hash) { dat[n]=ctrack.hash[n]; }
//	for(var n in args.q) { dat[n]=args.q[n]; }
//	if(dat.sector_code||dat.sector_group) { dat.from+=",sector"; }
//	if(dat.country_code) { dat.from+=",country"; }
//	if(dat.location_latitude && dat.location_longitude) { dat.from+=",location"; }

	fetch.ajax_dat_fix(dat,args);


	if(args.output=="count") // just count please
	{
		dat.select="count_aid";
		delete dat.limit;
		delete dat.orderby;
		delete dat.groupby;
	}
		
	fetch.ajax(dat,function(data){
		if(args.output=="count")
		{
			ctrack.chunk(args.chunk || "list_activities_count",data.rows[0]["count_aid"]);
			views.stats.calc();
		}
		else
		{
			
			if(args.compare)
			{
				data.rows.sort(args.compare);
			}

			var s=[];
			ctrack.args.chunks["table_header_amount"]=undefined;
			if((data.rows.length==0)&&(args.zerodata))
			{
				s.push( plate.replace(args.zerodata,{}) );
				ctrack.args.chunks["table_header_amount"]="";
			}
			ctrack.chunk("list_activities_count",data.rows.length);
			var a=[];
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.num=i+1;
				d.funder=v.funder || "N/A";
				d.aid=encodeURIComponent(v.aid || "N/A");
				d.title=v.title || v.aid || "N/A";
				
				d.date_start="N/A"
				d.date_end="N/A"
				if(v.day_start!==null) { d.date_start=fetch.get_nday(v.day_start); }
				if(v.day_end  !==null) { d.date_end  =fetch.get_nday(v.day_end  ); }

				d.reporting=iati_codes.publisher_names[v.reporting_ref] || v.reporting || v.reporting_ref || "N/A";
				d.commitment=commafy(""+Math.floor(ctrack.convert_num("commitment",v)));
				d.spend=commafy(""+Math.floor(ctrack.convert_num("spend",v)));
				d.currency=ctrack.display_usd;
				d.pct=0;
				if( v.commitment && (v.commitment!=0) )
				{
					d.pct=Math.floor(100*v.spend/v.commitment);
					if(d.pct<0){d.pct=0;}
					if(d.pct>100){d.pct=100;}
				}

				a.push(d);
				s.push( plate.replace(args.plate || "{list_activities_data}",d) );
			}
			ctrack.chunk(args.chunk || "list_activities_datas",s.join(""));
			ctrack.chunk("total",data.rows.length);


			var cc=[];
			cc[0]=["aid","title","reporting","commitment","spend","currency"];
			a.forEach(function(v){
				cc[cc.length]=[v.aid,v.title,v.reporting,v.commitment,v.spend,v.currency];
			});
			ctrack.chunk((args.chunk || "list_activities_datas")+"_csv","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
			
		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
