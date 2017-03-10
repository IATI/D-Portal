// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_list_publishers=exports;
exports.name="view_list_publishers";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs.js").donors

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_list_publishers.chunks=[
	"list_publishers_datas",
	"list_publishers_count",
];

//
// display the view
//
view_list_publishers.view=function()
{
	view_list_publishers.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_list_publishers.ajax({q:ctrack.hash});
};

//
// Perform ajax call to get data
//
view_list_publishers.ajax=function(args)
{
	args=args || {};
	args.zerodata=args.zerodata||"{alert_no_data1}";

	var dat={
			"from":"act",
			"limit":args.limit || -1,
			"select":"count,reporting_ref,any_reporting",
			"groupby":"reporting_ref",
			"orderby":"1-",
		};
	fetch.ajax_dat_fix(dat,args);
	
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
			ctrack.chunk(args.chunk || "list_publishers_count",data.rows[0]["count"]);
			view_stats.calc();
		}
		else
		{
			var s=[];
			ctrack.args.chunks["table_header_amount"]=undefined;
			if((data.rows.length==0)&&(args.zerodata))
			{
				s.push( plate.replace(args.zerodata,{}) );
				ctrack.args.chunks["table_header_amount"]="";
			}
			var a=[];
			ctrack.chunk("list_publishers_count",data.rows.length);
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				if(v.reporting_ref) // ignore missing publisher data
				{
					var d={};
					d.num=i+1;

					d.reporting_ref=v.reporting_ref || "N/A";
					d.reporting=iati_codes.publisher_names[v.reporting_ref] || v.reporting || v.reporting_ref || "N/A";
					d.count_num=Math.floor(v.count||0);
					d.count=commafy(""+d.count_num);
					a.push(d);
					s.push( plate.replace(args.plate || "{list_publishers_data}",d) );
				}
			}
			ctrack.chunk(args.chunk || "list_publishers_datas",s.join(""));
			ctrack.chunk("numof_publishers" , data.rows.length );

			var cc=[];
			cc[0]=["reporting_ref","reporting","count"];
			a.forEach(function(v){
				cc[cc.length]=[v.reporting_ref,v.reporting,v.count_num];
			});
			ctrack.chunk((args.chunk || "list_publishers_datas")+"_csv","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));

		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
