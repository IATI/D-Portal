// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const views={}
export default views

// import

import ctrack                        from "./ctrack.js"
import plate                         from "./plate.js"
import iati                          from "./iati.js"
import fetcher                       from "./fetcher.js"
import views_dash                    from "./view_dash.js"                    ; views.dash                         = views_dash
import views_dash_quality            from "./view_dash_quality.js"            ; views.dash_quality                 = views_dash_quality
import views_dash_cronlog            from "./view_dash_cronlog.js"            ; views.dash_cronlog                 = views_dash_cronlog
import views_dash_sluglog            from "./view_dash_sluglog.js"            ; views.dash_sluglog                 = views_dash_sluglog
import views_dash_slugs              from "./view_dash_slugs.js"              ; views.dash_slugs                   = views_dash_slugs
import views_missing                 from "./view_missing.js"                 ; views.dash_missing                 = views_missing
import views_ended                   from "./view_ended.js"                   ; views.dash_ended                   = views_ended
import views_planned                 from "./view_planned.js"                 ; views.dash_planned                 = views_planned
import views_active                  from "./view_active.js"                  ; views.dash_active                  = views_active
import views_stats                   from "./view_stats.js"                   ; views.dash_stats                   = views_stats
import views_map                     from "./view_map.js"                     ; views.dash_map                     = views_map
import views_heatmap                 from "./view_heatmap.js"                 ; views.dash_heatmap                 = views_heatmap
import views_search                  from "./view_search.js"                  ; views.dash_search                  = views_search
import views_main                    from "./view_main.js"                    ; views.dash_main                    = views_main
import views_donors_top              from "./view_donors_top.js"              ; views.dash_donors_top              = views_donors_top
import views_donors                  from "./view_donors.js"                  ; views.dash_donors                  = views_donors
import views_donor_transactions      from "./view_donor_transactions.js"      ; views.dash_donor_transactions      = views_donor_transactions
import views_donor_budgets           from "./view_donor_budgets.js"           ; views.dash_donor_budgets           = views_donor_budgets
import views_donor_activities        from "./view_donor_activities.js"        ; views.dash_donor_activities        = views_donor_activities
import views_sectors_top             from "./view_sectors_top.js"             ; views.dash_sectors_top             = views_sectors_top
import views_sectors                 from "./view_sectors.js"                 ; views.dash_sectors                 = views_sectors
import views_sector_transactions     from "./view_sector_transactions.js"     ; views.dash_sector_transactions     = views_sector_transactions
import views_sector_budgets          from "./view_sector_budgets.js"          ; views.dash_sector_budgets          = views_sector_budgets
import views_sector_activities       from "./view_sector_activities.js"       ; views.dash_sector_activities       = views_sector_activities
import views_countries               from "./view_countries.js"               ; views.dash_countries               = views_countries
import views_countries_top           from "./view_countries_top.js"           ; views.dash_countries_top           = views_countries_top
import views_districts               from "./view_districts.js"               ; views.dash_districts               = views_districts
import views_act                     from "./view_act.js"                     ; views.dash_act                     = views_act
import views_test                    from "./view_test.js"                    ; views.dash_test                    = views_test
import views_data_quality            from "./view_data_quality.js"            ; views.dash_data_quality            = views_data_quality
import views_total                   from "./view_total.js"                   ; views.dash_total                   = views_total
import views_list_activities         from "./view_list_activities.js"         ; views.dash_list_activities         = views_list_activities
import views_list_transactions       from "./view_list_transactions.js"       ; views.dash_list_transactions       = views_list_transactions
import views_list_budgets            from "./view_list_budgets.js"            ; views.dash_list_budgets            = views_list_budgets
import views_list_publishers         from "./view_list_publishers.js"         ; views.dash_list_publishers         = views_list_publishers
import views_list_participating_orgs from "./view_list_participating_orgs.js" ; views.dash_list_participating_orgs = views_list_participating_orgs
import views_frame                   from "./view_frame.js"                   ; views.dash_frame                   = views_frame
import views_generator               from "./view_generator.js"               ; views.dash_generator               = views_generator
import views_publishers              from "./view_publishers.js"              ; views.dash_publishers              = views_publishers
import views_savi                    from "./view_savi.js"                    ; views.dash_savi                    = views_savi
import views_related                 from "./view_related.js"                 ; views.dash_related                 = views_related

// remap

views.freetext=views.search
views.search2=views.search
views.publisher=views.main
views.publisher_countries=views.countries
views.publisher_countries_top=views.countries_top
views.publisher_sectors=views.sectors
views.publisher_sectors_top=views.sectors_top

