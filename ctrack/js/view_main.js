// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_main=exports;
exports.name="view_main";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetcher=require("./fetcher.js")

var views=require("./views.js")

var iati_codes=require("../../dstore/json/iati_codes.json")

// the chunk names this view will fill with new data
view_main.chunks=[
	"table_active_datas",
	"table_ended_datas",
];

// called on view display to fix html in place
view_main.fixup=function()
{
	views.map.fixup();
}
//
// Perform ajax call to get numof data
//
view_main.view=function(args)
{

	views.main.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	views.planned.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.active.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.ended.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.stats.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
		
	views.donors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.countries_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.sectors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	views.savi.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(0);
	ctrack.change_hash();

/*
	views.planned.ajax({output:"count"});
	views.active.ajax({output:"count"});
	views.ended.ajax({output:"count"});
	views.missing.ajax({output:"count"});
*/
	views.stats.ajax();
	
	views.active.ajax({limit:5,plate:"{table_active_data}",chunk:"table_active_datas",notnull:true,callback:function(data){
		if(data.rows.length==0)
		{
			ctrack.chunk("main_active","")
		}
	}});
	views.ended.ajax({limit:5,plate:"{table_ended_data}",chunk:"table_ended_datas",callback:function(data){
		if(data.rows.length==0)
		{
			ctrack.chunk("main_ended","")
		}
	}});


	views.list_participating_orgs.ajax({output:"count",limit:5,chunk:"list_participating_orgs_datas",callback:function(data){
		if( (!data) || (!data.rows) || (data.rows.length==0) )
		{
			ctrack.chunk("main_participating_org","")
		}
	}});

	var top_opts={}

	top_opts.year="all years";

	var test=fetcher.ajax_dat_fix({},{}); // do all the icky merge logic so we can test
	
	if( test["country_code"] )
	{
		ctrack.chunk("countries_graph","");
	}
	else
	{
		views.countries_top.ajax( top_opts );
	}

	if( test["reporting_ref"] || test["funder_ref"] )
	{
		ctrack.chunk("donor_graph","");
	}
	else
	{
		views.donors_top.ajax( top_opts );
	}

	if( test["sector_code"] || test["sector_group"] )
	{
		ctrack.chunk("sector_graph","");
	}
	else
	{
		views.sectors_top.ajax( top_opts );
	}

	if( test["reporting_ref"] ) // show savi org file
	{
		views.savi.ajax_pid( test["reporting_ref"] )
	}
	else
	{
		ctrack.chunk("view_savi_file","");
	}

	ctrack.map.pins=undefined;
	views.map.ajax_heat({limit:200,callback2:function(data){
		if(data.rows.length==0)
		{
			ctrack.chunk("main_map","")
		}
	}});
	
	ctrack.chunk("main_mention_any","");
	if( test["reporting_ref"] )
	{
		ctrack.chunk("main_mention_any","{main_mention_pub}");
		ctrack.chunk("main_mention_pub_link","?/participating-org@ref="+encodeURIComponent(test["reporting_ref"])+"#view=main");
	}
	else
	if( test["/participating-org@ref"] )
	{
		if( iati_codes.publisher_names[ test["/participating-org@ref"] ] ) // only if publisher
		{
			ctrack.chunk("main_mention_any","{main_mention_org}");
			ctrack.chunk("main_mention_org_link","?reporting_ref="+encodeURIComponent(test["/participating-org@ref"])+"#view=main");
		}
	}

}
