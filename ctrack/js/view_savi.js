// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const view_savi={}
export default view_savi
view_savi.name="view_savi"

import ctrack     from "./ctrack.js"
import plate      from "./plate.js"
import iati       from "./iati.js"
import fetcher    from "./fetcher.js"
import dflat      from "../../dflat/js/dflat.js"
import dflat_savi from "../../dflat/js/savi.js"

// the chunk names this view will fill with new data
view_savi.chunks=[
	"view_savi_file",
];

view_savi.fixup=function(args)
{
	dflat_savi.fixup()
}

view_savi.view=function(args)
{
	ctrack.setcrumb(0);
	ctrack.change_hash();

	view_savi.ajax();
}

//
// Perform all ajax calls to get data
//
view_savi.ajax=function(args)
{
	args=args||{}
	fetcher.ajax_dat_fix(args)

	if(args.aid)
	{
		view_savi.ajax_aid(args.aid)
	}
	else
	if(args.pid)
	{
		view_savi.ajax_pid(args.pid)
	}
}


view_savi.ajax_aid=function(aid)
{
	var dat={
		"from":"xson",
		"root":"/iati-activities/iati-activity",
		"aid":aid,
	}

	fetcher.ajax(dat,function(iati)
	{
		if(iati.xson)
		{
			iati=iati.xson[0]
		}

		ctrack.chunk("view_savi_file","");

		if(iati)
		{
			dflat.clean(iati) // clean this data

			dflat_savi.prepare(iati) // prepare for display

			dflat_savi.chunks.iati=iati
			dflat_savi.chunks.origin=ctrack.origin

			var dd=dflat_savi.plate('<div>{iati./iati-activities/iati-activity:iati-activity||}</div>')

			ctrack.chunk("view_savi_file",dd);
		}

		ctrack.display();
	})
}

view_savi.ajax_pid=function(pid)
{
	var dat={
		"from":"xson",
		"root":"/iati-organisations/iati-organisation",
		"pid":pid,
	}

	fetcher.ajax(dat,function(iati)
	{
		if(iati.xson)
		{
			iati=iati.xson[0]
		}

		ctrack.chunk("view_savi_file","");

		if(iati)
		{
			dflat.clean(iati) // clean this data

			dflat_savi.prepare(iati) // prepare for display

			dflat_savi.chunks.iati=iati
			dflat_savi.chunks.origin=ctrack.origin

			var dd=dflat_savi.plate('<div>{iati./iati-organisations/iati-organisation:iati-organisation||}</div>')

			ctrack.chunk("view_savi_file",dd);
		}

		ctrack.display();
	})
}
