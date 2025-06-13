// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const plate={}
export default plate

import plated_js from "plated"

let plated=plated_js.create({hashchunk:"#"},{pfs:{}}) // create a base instance for inline chunks with no file access

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// prepare for new plate code

// load chunks from html files
plate.chunks={}

import text_general                      from '../text/general.html'                      ; plated.chunks.fill_chunks( text_general                      , plate.chunks )
import text_view_act                     from '../text/view_act.html'                     ; plated.chunks.fill_chunks( text_view_act                     , plate.chunks )
import text_view_active                  from '../text/view_active.html'                  ; plated.chunks.fill_chunks( text_view_active                  , plate.chunks )
import text_view_countries               from '../text/view_countries.html'               ; plated.chunks.fill_chunks( text_view_countries               , plate.chunks )
import text_view_dash                    from '../text/view_dash.html'                    ; plated.chunks.fill_chunks( text_view_dash                    , plate.chunks )
import text_view_dash_cronlog            from '../text/view_dash_cronlog.html'            ; plated.chunks.fill_chunks( text_view_dash_cronlog            , plate.chunks )
import text_view_dash_quality            from '../text/view_dash_quality.html'            ; plated.chunks.fill_chunks( text_view_dash_quality            , plate.chunks )
import text_view_dash_sluglog            from '../text/view_dash_sluglog.html'            ; plated.chunks.fill_chunks( text_view_dash_sluglog            , plate.chunks )
import text_view_dash_slugs              from '../text/view_dash_slugs.html'              ; plated.chunks.fill_chunks( text_view_dash_slugs              , plate.chunks )
import text_view_data_quality            from '../text/view_data_quality.html'            ; plated.chunks.fill_chunks( text_view_data_quality            , plate.chunks )
import text_view_districts               from '../text/view_districts.html'               ; plated.chunks.fill_chunks( text_view_districts               , plate.chunks )
import text_view_donor_activities        from '../text/view_donor_activities.html'        ; plated.chunks.fill_chunks( text_view_donor_activities        , plate.chunks )
import text_view_donor_budgets           from '../text/view_donor_budgets.html'           ; plated.chunks.fill_chunks( text_view_donor_budgets           , plate.chunks )
import text_view_donors                  from '../text/view_donors.html'                  ; plated.chunks.fill_chunks( text_view_donors                  , plate.chunks )
import text_view_donor_transactions      from '../text/view_donor_transactions.html'      ; plated.chunks.fill_chunks( text_view_donor_transactions      , plate.chunks )
import text_view_ended                   from '../text/view_ended.html'                   ; plated.chunks.fill_chunks( text_view_ended                   , plate.chunks )
import text_view_frame                   from '../text/view_frame.html'                   ; plated.chunks.fill_chunks( text_view_frame                   , plate.chunks )
import text_view_generator               from '../text/view_generator.html'               ; plated.chunks.fill_chunks( text_view_generator               , plate.chunks )
import text_view_heatmap                 from '../text/view_heatmap.html'                 ; plated.chunks.fill_chunks( text_view_heatmap                 , plate.chunks )
import text_view_list_activities         from '../text/view_list_activities.html'         ; plated.chunks.fill_chunks( text_view_list_activities         , plate.chunks )
import text_view_list_budgets            from '../text/view_list_budgets.html'            ; plated.chunks.fill_chunks( text_view_list_budgets            , plate.chunks )
import text_view_list_publishers         from '../text/view_list_publishers.html'         ; plated.chunks.fill_chunks( text_view_list_publishers         , plate.chunks )
import text_view_list_transactions       from '../text/view_list_transactions.html'       ; plated.chunks.fill_chunks( text_view_list_transactions       , plate.chunks )
import text_view_list_participating_orgs from '../text/view_list_participating_orgs.html' ; plated.chunks.fill_chunks( text_view_list_participating_orgs , plate.chunks )
import text_view_main                    from '../text/view_main.html'                    ; plated.chunks.fill_chunks( text_view_main                    , plate.chunks )
import text_view_map                     from '../text/view_map.html'                     ; plated.chunks.fill_chunks( text_view_map                     , plate.chunks )
import text_view_missing                 from '../text/view_missing.html'                 ; plated.chunks.fill_chunks( text_view_missing                 , plate.chunks )
import text_view_planned                 from '../text/view_planned.html'                 ; plated.chunks.fill_chunks( text_view_planned                 , plate.chunks )
import text_view_publisher               from '../text/view_publisher.html'               ; plated.chunks.fill_chunks( text_view_publisher               , plate.chunks )
import text_view_publisher_countries     from '../text/view_publisher_countries.html'     ; plated.chunks.fill_chunks( text_view_publisher_countries     , plate.chunks )
import text_view_publishers              from '../text/view_publishers.html'              ; plated.chunks.fill_chunks( text_view_publishers              , plate.chunks )
import text_view_publisher_sectors       from '../text/view_publisher_sectors.html'       ; plated.chunks.fill_chunks( text_view_publisher_sectors       , plate.chunks )
import text_view_savi                    from '../text/view_savi.html'                    ; plated.chunks.fill_chunks( text_view_savi                    , plate.chunks )
import text_view_search                  from '../text/view_search.html'                  ; plated.chunks.fill_chunks( text_view_search                  , plate.chunks )
import text_view_sector_activities       from '../text/view_sector_activities.html'       ; plated.chunks.fill_chunks( text_view_sector_activities       , plate.chunks )
import text_view_sector_budgets          from '../text/view_sector_budgets.html'          ; plated.chunks.fill_chunks( text_view_sector_budgets          , plate.chunks )
import text_view_sectors                 from '../text/view_sectors.html'                 ; plated.chunks.fill_chunks( text_view_sectors                 , plate.chunks )
import text_view_sector_transactions     from '../text/view_sector_transactions.html'     ; plated.chunks.fill_chunks( text_view_sector_transactions     , plate.chunks )
import text_view_test                    from '../text/view_test.html'                    ; plated.chunks.fill_chunks( text_view_test                    , plate.chunks )
import text_view_related                 from '../text/view_related.html'                 ; plated.chunks.fill_chunks( text_view_related                 , plate.chunks )

plated.chunks.format_chunks(plate.chunks)

import text_cmn from '../text/cmn.txt' ; plate.chunks_cmn=plated.chunks.format_chunks(plated.chunks.fill_chunks( text_cmn , {} ))
import text_eng from '../text/eng.txt' ; plate.chunks_eng=plated.chunks.format_chunks(plated.chunks.fill_chunks( text_eng , {} ))
import text_fra from '../text/fra.txt' ; plate.chunks_fra=plated.chunks.format_chunks(plated.chunks.fill_chunks( text_fra , {} ))
import text_hin from '../text/hin.txt' ; plate.chunks_hin=plated.chunks.format_chunks(plated.chunks.fill_chunks( text_hin , {} ))
import text_jpn from '../text/jpn.txt' ; plate.chunks_jpn=plated.chunks.format_chunks(plated.chunks.fill_chunks( text_jpn , {} ))
import text_spa from '../text/spa.txt' ; plate.chunks_spa=plated.chunks.format_chunks(plated.chunks.fill_chunks( text_spa , {} ))


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

