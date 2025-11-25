// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_list_orgs={}
export default view_list_orgs
view_list_orgs.name="view_list_orgs"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import csvw       from "./csvw.js"
import views      from "./views.js"
import refry      from "../../dstore/js/refry.js"
import iati_codes from "../../dstore/json/iati_codes.json"


var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_list_orgs.chunks=[
	"list_orgs_datas",
	"list_orgs_count",
];

//
// display the view
//
view_list_orgs.view=function()
{
	view_list_orgs.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_list_orgs.ajax({q:ctrack.hash});
};

//
// Perform ajax call to get data
//
view_list_orgs.ajax=function(args)
{
	args=args || {};
	args.zerodata=args.zerodata||"{alert_no_data1}";

	var dat={
			"from":"act",
			"limit":-1,
			"select":"aid",
			"sql":`
, rs AS
( SELECT DISTINCT xson->>'@ref' AS org FROM xson 
WHERE root='/iati-activities/iati-activity/participating-org'
AND aid IN ( SELECT aid FROM qs ) )
, ns AS
(
SELECT pid,xson->'/name/narrative'->0->>'' AS name FROM xson WHERE root='/iati-organisations/iati-organisation'
)

SELECT xson->>'@ref' AS pid , COUNT( DISTINCT xson.aid ) AS aid_count , name FROM xson INNER JOIN ns ON ns.pid=xson->>'@ref'
WHERE root='/iati-activities/iati-activity/participating-org'
AND aid IN ( SELECT aid FROM qs )
GROUP BY xson->>'@ref',name ORDER BY 2 DESC
`
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
			ctrack.chunk(args.chunk || "list_orgs_count",commafy(data.rows[0]["count"]));
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
			ctrack.chunk("list_orgs_count",data.rows.length);
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.num=i+1;

				d.pid=v.pid || "N/A";
				d.name=v.name || "N/A";
				d.count=v.aid_count;
				d.count_num=commafy(""+v.aid_count);
				a.push(d);
				s.push( plate.replace(args.plate || "{list_orgs_data}",d) );
			}
			ctrack.chunk(args.chunk || "list_orgs_datas",s.join(""));
			ctrack.chunk("numof_orgs" , data.rows.length );

			var cc=[];
			cc[0]=["pid","name","count","link"];
			a.forEach(function(v){
				cc[cc.length]=[v.pid,v.name,v.count,ctrack.origin+"/ctrack.html?/participating-org@ref="+v.pid];
			});
			ctrack.chunk((args.chunk || "list_orgs_datas")+"_csv","data:text/csv;charset=UTF-8,"+ctrack.encodeURIComponent(csvw.arrayToCSV(cc)));

		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
