// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_list_publishers={}
export default view_list_publishers
view_list_publishers.name="view_list_publishers"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import csvw       from "./csvw.js"
import views      from "./views.js"
import refry      from "../../dstore/js/refry.js"
import iati_codes from "../../dstore/json/iati_codes.json"
import crs        from "../../dstore/json/crs.js"

let crs_year=crs.donors


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
			"select":"count_aid,reporting_ref,any_reporting",
			"groupby":"reporting_ref",
			"orderby":"1-",
		};
	fetcher.ajax_dat_fix(dat,args);
	
	if(args.output=="count") // just count please
	{
		dat.select="count";
		delete dat.limit;
		delete dat.orderby;
		delete dat.groupby;
	}
		
	fetcher.ajax(dat,function(data){
		if(args.output=="count")
		{
			ctrack.chunk(args.chunk || "list_publishers_count",commafy(data.rows[0]["count"]));
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
					d.count_num=Math.floor(v.count_aid||0);
					d.count=commafy(""+d.count_num);
					a.push(d);
					s.push( plate.replace(args.plate || "{list_publishers_data}",d) );
				}
			}
			ctrack.chunk(args.chunk || "list_publishers_datas",s.join(""));
			ctrack.chunk("numof_publishers" , data.rows.length );

			var cc=[];
			cc[0]=["reporting_ref","reporting-org","count","link"];
			a.forEach(function(v){
				cc[cc.length]=[v.reporting_ref,v.reporting,v.count_num,ctrack.origin+"/ctrack.html?publisher="+v.reporting_ref];
			});
			ctrack.chunk((args.chunk || "list_publishers_datas")+"_csv","data:text/csv;charset=UTF-8,"+ctrack.encodeURIComponent(csvw.arrayToCSV(cc)));

		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
