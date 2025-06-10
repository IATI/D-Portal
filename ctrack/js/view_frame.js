// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const view_frame={}
export default view_frame
view_frame.name="view_frame"

import ctrack  from "./ctrack.js"
import plate   from "./plate.js"
import iati    from "./iati.js"
import fetcher from "./fetcher.js"
import views   from "./views.js"



// the chunk names this view will fill with new data
view_frame.chunks=[
	"frame",
];

// called on view display to fix html in place
view_frame.fixup=function()
{
	var name=ctrack.hash.frame;
	if(name)
	{
		name=name.toLowerCase();
		var v=views[name];
		if(v && v.fixup)
		{
			v.fixup();
		}
	}
	var scale=(ctrack.hash.size || 960)/960;
	$("a").attr("target","_blank");
	if(ctrack.hash.frame=="map")
	{
		$(".map_wrap").css("width","100%");
		$(".map_wrap").css("height","100%");
	}
	else
	{
		$(".frame").css("transform-origin","0 0");
		$(".frame").css("transform","scale("+scale+","+scale+")");
	}
//	$(".frame").css("zoom",scale);
}
//
// Perform ajax call to get numof data
//
view_frame.view=function(args)
{
	ctrack.setcrumb(0);
	ctrack.change_hash();

	var name=ctrack.hash.frame;
	if(name)
	{
		name=name.toLowerCase();
		var v=views[name];
		if(v)
		{
			if(v.chunks)
			{
				v.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
			}
			if(v.ajax)
			{
				v.ajax();
			}
//			ctrack.chunk("frame","{frame_"+name+"}");
		}
	}

//	view_frame.show();
	
	ctrack.popout="frame"; // any clicks should open in a new window
}

view_frame.show=function(args)
{
//	view_frame.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	
	var name=ctrack.hash.frame;
	if(name)
	{
		name=name.toLowerCase();
		var v=views[name];
		if(v)
		{
			if(v.show)
			{
				v.show();
			}
			ctrack.chunk("frame","{frame_"+name+"}");
		}
	}
	
	ctrack.div.master.html( plate.replace( "{view_frame}" ) );
	
	view_frame.fixup();
}
