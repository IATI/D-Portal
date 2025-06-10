// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_dash_slugs={}
export default view_dash_slugs
view_dash_slugs.name="view_dash_slugs"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import iati_codes from "../../dstore/json/iati_codes.json"


var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash_slugs.chunks=[
	"dash_list_slug_datas",
];

view_dash_slugs.view=function()
{
	view_dash_slugs.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	view_dash_slugs.ajax({});

	ctrack.setcrumb(1);
	ctrack.change_hash();
}

view_dash_slugs.calc=function()
{
}

view_dash_slugs.ajax=function(args)
{
	args=args || {};
	var dat={
			"select":"count,slug",
			"from":"act",
			"groupby":"slug",
			"orderby":"1-",
			"limit":-1
		};
	fetcher.ajax_dat_fix(dat,args);
	fetcher.ajax(dat,args.callback || function(data)
	{
		var s=[];
		var total=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=commafy(Number(v.count));
			d.slug=v.slug;

			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_list_slugs_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_list_slugs_datas",s.join(""));
		
		ctrack.display(); // every fetcher.ajax must call display once
	});
}
