// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_heatmap={}
export default view_heatmap
view_heatmap.name="view_heatmap"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import views      from "./views.js"


// the chunk names this view will fill with new data
view_heatmap.chunks=[
];

view_heatmap.show=function()
{
//console.log("show")
	views.map.show(true);
}

view_heatmap.fixup=function()
{
//console.log("fixup")
	views.map.fixup();
}

view_heatmap.ajax=function(args)
{
//console.log("ajax")

	ctrack.map.pins=undefined;
	views.map.ajax_heat({limit:-1});	
}


view_heatmap.view=function(args)
{
//console.log("view")

	ctrack.setcrumb(0);
	ctrack.change_hash();
	view_heatmap.ajax()
	view_heatmap.show(true)
	view_heatmap.fixup()
}
