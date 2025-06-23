// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_dash_sluglog={}
export default view_dash_sluglog
view_dash_sluglog.name="view_dash_sluglog"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import iati_codes from "../../dstore/json/iati_codes.json"


var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash_sluglog.chunks=[
	"dash_sluglog",
];

view_dash_sluglog.view=function()
{
	view_dash_sluglog.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	view_dash_sluglog.ajax({});

	ctrack.setcrumb(1);
	ctrack.change_hash();
}

view_dash_sluglog.calc=function()
{
}

view_dash_sluglog.ajax=function()
{
	ctrack.chunk("dash_slugname",ctrack.hash.slug);

	fetcher.ajax({"from":"sluglog","slug":ctrack.hash.slug},function(data)
	{
		ctrack.chunk("dash_sluglog",data.log && ( $('<div/>').text(data.log).html().replace(/\n/g,"<br/>") ) || "N/A");
		ctrack.display(); // every fetcher.ajax must call display once
	});
};
