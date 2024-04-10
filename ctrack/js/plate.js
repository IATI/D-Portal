// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var plate=exports;

var plated=require("plated").create({hashchunk:"#"},{pfs:{}}) // create a base instance for inline chunks with no file access


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// prepare for new plate code

// load chunks from html files
plate.chunks={}

if(typeof window == 'undefined') // patch node to require text files like webpack
{
	const matchtxt=/\.(txt|html|css)$/
	const fs=require("fs")
	const path=require("path")
	const Module = require("module");
	const orginalLoad = Module._load;
	const cwd = process.cwd();
	Module._load = function (request, _parent)
	{
		if (request.match(matchtxt))
		{
			return fs.readFileSync(
				path.join(path.dirname(_parent ? _parent.filename : cwd), request),
				"utf8");
		}
		return orginalLoad.apply(this, arguments);
	};
}

plated.chunks.fill_chunks( require('../text/general.html'                  ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_act.html'                 ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_active.html'              ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_countries.html'           ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_dash.html'                ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_dash_cronlog.html'        ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_dash_quality.html'        ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_dash_sluglog.html'        ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_dash_slugs.html'          ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_data_quality.html'        ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_districts.html'           ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_donor_activities.html'    ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_donor_budgets.html'       ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_donors.html'              ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_donor_transactions.html'  ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_ended.html'               ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_frame.html'               ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_generator.html'           ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_heatmap.html'             ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_list_activities.html'     ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_list_budgets.html'        ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_list_publishers.html'     ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_list_transactions.html'   ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_list_participating_orgs.html'   ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_main.html'                ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_map.html'                 ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_missing.html'             ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_planned.html'             ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_publisher.html'           ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_publisher_countries.html' ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_publishers.html'          ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_publisher_sectors.html'   ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_savi.html'                ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_search.html'              ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_sector_activities.html'   ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_sector_budgets.html'      ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_sectors.html'             ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_sector_transactions.html' ), plate.chunks )
plated.chunks.fill_chunks( require('../text/view_test.html'                ), plate.chunks )
plated.chunks.fill_chunks( require('../text/general.html'                  ), plate.chunks )
plated.chunks.format_chunks(plate.chunks)

plate.chunks_cmn=plated.chunks.format_chunks(plated.chunks.fill_chunks( require('../text/cmn.txt'), {} ))
plate.chunks_eng=plated.chunks.format_chunks(plated.chunks.fill_chunks( require('../text/eng.txt'), {} ))
plate.chunks_fra=plated.chunks.format_chunks(plated.chunks.fill_chunks( require('../text/fra.txt'), {} ))
plate.chunks_hin=plated.chunks.format_chunks(plated.chunks.fill_chunks( require('../text/hin.txt'), {} ))
plate.chunks_jpn=plated.chunks.format_chunks(plated.chunks.fill_chunks( require('../text/jpn.txt'), {} ))
plate.chunks_spa=plated.chunks.format_chunks(plated.chunks.fill_chunks( require('../text/spa.txt'), {} ))

//console.log(plate.chunks_eng)

// repeatedly replace untill all things that can expand, have expanded, or we ran out of sanity
plate.replace=function(str,arr)
{
	plated.chunks.push_namespace(arr || {}) // force push
	var ret=plated.chunks.replace(str)
	plated.chunks.pop_namespace()
	return ret
}


plate.setup=function(args,ctrack)
{
	plated.chunks.reset_namespace()
	if( args.tongue!="non" ) // use non as a debugging mode
	{
		plated.chunks.push_namespace(plate.chunks_eng); // english fallback for any missing chunks
		var tongue=plate[ "chunks_"+args.tongue ];
		if(tongue){plated.chunks.push_namespace(tongue);} // translation requested
	}
	plated.chunks.push_namespace(plate.chunks); //the main chunks
	if(args.chunks)
	{
		plated.chunks.push_namespace(args.chunks); // override on load
	}
	plated.chunks.push_namespace(ctrack.chunks); // the data we create at runtime
}

