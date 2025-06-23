// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const view_total={}
export default view_total
view_total.name="view_total"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import views      from "./views.js"

// the chunk names this view will fill with new data
view_total.chunks=[
	
];

//
// Perform ajax call to get numof data
//
view_total.view=function(args)
{

	ctrack.setcrumb(1);
	ctrack.change_hash();
}
