// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_search=exports;
exports.name="view_search";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

var iati_codes=require("../../dstore/json/iati_codes.json")

// the chunk names this view will fill with new data
view_search.chunks=[
//	"table_active_datas",
//	"table_ended_datas",
];

// called on view display to fix html in place
view_search.fixup=function()
{
//	views.map.fixup();


	var lookup={};
	var strings=[];
	for(var n in iati_codes.sector_names)
	{
		var v=iati_codes.sector_names[n];
		var s=v+" ("+n+")";
		if(v)
		{
			strings.push(s);
			lookup[s]={group:"category",value:n,text:v,str:s};
		}
	}
	for(var n in iati_codes.sector)
	{
		var v=iati_codes.sector[n];
		var s=v+" ("+n+")";
		if(v)
		{
			strings.push(s);
			lookup[s]={group:"sector",value:n,text:v,str:s};
		}
	}
/*
	for(var n in iati_codes.funder_names)
	{
		var v=iati_codes.funder_names[n];
		var s=v+" ("+n+")";
		if(v)
		{
			strings.push(s);
			lookup[s]={group:"funder",value:n,text:v,str:s};
		}
	}
*/
	for(var n in iati_codes.crs_countries)
	{
		var v=iati_codes.country[n];
		var s=v+" ("+n+")";
		if(v)
		{
			strings.push(s);
			lookup[s]={group:"country",value:n,text:v,str:s};
		}
	}
	for(var n in iati_codes.publisher_names)
	{
		var v=iati_codes.publisher_names[n];
		var s=v+" ("+n+")";
		strings.push(s);
		lookup[s]={group:"publisher",value:n,text:v,str:s};
	}
	for(var i=1960;i<2020;i++)
	{
		var s=i+"";
		strings.push(s);
		lookup[s]={group:"year",value:s,text:s,str:s};
	}

	var substringMatcher = function() {
	  return function findMatches(q, cb) {
		var matches, substringRegex;
	 
		// an array that will be populated with substring matches
		matches = [];
	 
		var words=q.split(/(\s+)/);

		var ups={}

		for(var i in words)
		{
			var word=words[i];
			
			if((word!="")&&(!word.match(/\s/))) // ignore blank/spaces
			{
//console.log("searchin:"+word);
				substrRegex = new RegExp(word, 'i');
			 
				// iterate through the pool of strings and for any string that
				// contains the substring `q`, add it to the `matches` array
				$.each(strings, function(i, str) {
				  if (substrRegex.test(str)) {
					if(lookup[str]) // sanity test
					{
						ups[str]=(ups[str]||0)+1;
//						matches.push( lookup[str] );
		//				console.log(lookup[str]);
					}
				  }
				});
			}
		}
//		console.log(ups)
		for(var n in ups)
		{
			matches.push( lookup[n] );
		}
		matches.sort(function(a,b){
			var la=ups[a.str];
			var lb=ups[b.str];
			if(la==lb){ // sort by text
				var aa=a.text.toLowerCase().replace("the ", "");
				var bb=b.text.toLowerCase().replace("the ", "");
				return ((aa > bb) - (bb > aa));
			}
			else if(la<lb) { return 1; } else { return -1; } // sort by number of dupes
		});
			
		cb(matches);
	  };
	};

	$('#view_search_string').typeahead({
	  hint: true,
	  highlight: true,
	  minLength: 1
	},
	{
		name: 'ctrack',
		display: function(a){return a.str;},
		limit:65536,
		source: substringMatcher(),
		templates: {
			suggestion: function(a)
			{
				return "<div><img src=\""+ctrack.args.art+"label_"+a.group+".png\"></img> "+a.str+"</div>";
			}
		}
  	});

	var build_query=function(e){
	
		var txt=[];
		var que=[];
		var q={};
		
//		que.push("this is a test");
//		txt.push("this is a test");
		
		var v=$('#view_search_string').val();
		
		var enable_search=false;
		
		if(v)
		{
			enable_search=true;
			txt.push("Searching activity title for the term \""+v+"\"")
			que.push("search="+v)
			q.text_search=v;
		}
		else
		{
			txt.push("Searching for any activities")
			que.push("search")
		}

		var v=$("#view_search_select_country").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the recipient country is \""+v+"\"")
			que.push("country="+v)
			q.country_code=v;
		}
		
		var v=$("#view_search_select_funder").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the CRS funder is \""+v+"\"")
			que.push("funder="+v)
			q.funder_ref=v;
		}

		var v=$("#view_search_select_sector").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI sector is \""+v+"\"")
			que.push("sector_code="+v)
			q.sector_code=v;
		}

		var v=$("#view_search_select_category").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI sector category is \""+v+"\"")
			que.push("sector_group="+v)
			q.sector_group=v;
		}

		var v=$("#view_search_select_publisher").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI publisher is \""+v+"\"")
			que.push("publisher="+v)
			q.reporting_ref=v;
		}


		var donemin;
		var v=$("#view_search_select_year_min").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the year reported to IATI is greater than or equal to \""+v+"\"")
			que.push("year_min="+v);
			que.push("year="+v);
			q.day_end_gt=(parseInt(v,10))+"-01-01";
			
		}
		var v=$("#view_search_select_year_max").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the year reported to IATI is less than or equal to \""+v+"\"")
			que.push("year_max="+v);
			if(!donemin) { que.push("year="+v); }
			q.day_start_lteq=(parseInt(v,10)+1)+"-01-01";
		}

		$("#search_span").html("<span>"+txt.join("</span><span>")+"</span>");
		if(enable_search)
		{
			$("#search_link").attr("href","?"+que.join("&")+"#view=main");
		}
		else
		{
			$("#search_link").removeAttr("href");
		}
		view_search.ajax({q:q});
	}
	
	var o={allow_single_deselect:true,search_contains:true};
	$("#view_search_select_country").chosen(o).change(build_query);
	$("#view_search_select_funder").chosen(o).change(build_query);
	$("#view_search_select_sector").chosen(o).change(build_query);
	$("#view_search_select_category").chosen(o).change(build_query);
	$("#view_search_select_publisher").chosen(o).change(build_query);
	$("#view_search_select_year_min").chosen(o).change(build_query);
	$("#view_search_select_year_max").chosen(o).change(build_query);

	var apply=function(v){
		if(v)
		{
//			console.log(v);
			var aa=[v.group];
			if(v.group=="year") { aa=["year_min","year_max"]; }
			for(var i=0;i<aa.length;i++)
			{
				var hash="#view_search_select_"+aa[i];
				$(hash).parent().show();
				$(hash).val(v.value).trigger("chosen:updated");
				var s=$('#view_search_string').val();
				s=s.replace(v.str,"");
				$('#view_search_string').typeahead('val', s);
			}
		}
	};

	$('#view_search_string').bind('typeahead:select', function(ev, a) {
		apply(a);
		build_query();
	});

	$('#view_search_string').bind('typeahead:autocomplete', function(ev, a) {
		apply(a);
		build_query();
	});
	
	$('#view_search_string').bind('change', function(ev, a) {
		build_query();
	});
	
	
	build_query();

// goto new url
	var change=function(){

		var name=""+$("#publisher_dropmenu select").val();
		if(name && (name!=""))
		{
			window.location.href="/ctrack.html?publisher="+name
		}

		var name=""+$("#country_dropmenu select").val();
		if(name && (name!=""))
		{
			window.location.href="/ctrack.html?country="+name
		}

	};

// fill in lists
	var refresh=function(){


		var aa=[];
		aa.push("<select>");
		aa.push("<option value=''></option>");
		for(var n in iati_codes.publisher_names) { var v=iati_codes.publisher_names[n];
			aa.push("<option value='"+n+"'>"+v+"</option>");
		}
		aa.push("</select>");
		$("#publisher_dropmenu").html(aa.join(""));
		
		$("#publisher_dropmenu select").change(change);
		$("#publisher_dropmenu select").chosen({search_contains:true,"placeholder_text_single":plate.replace("{search_publisher_dropmenu_text}")});

		var aa=[];
		aa.push("<select>");
		aa.push("<option value=''></option>");
		for(var n in iati_codes.country) { var v=iati_codes.country[n]; // only countries
			if( iati_codes.crs_countries[n] ) // only recipients
			{
				aa.push("<option value='"+n+"'>"+v+"</option>");
			}
		}
		aa.push("</select>");
		$("#country_dropmenu").html(aa.join(""));

		$("#country_dropmenu select").change(change);
		$("#country_dropmenu select").chosen({search_contains:true,"placeholder_text_single":plate.replace("{search_country_dropmenu_text}")});

	};

// initialise page		
	refresh();

}
//
// Perform ajax call to get numof data
//
view_search.view=function(args)
{

	views.search.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(0);
	ctrack.change_hash();


	var compare=function(a,b)
	{
		var aa=(a.split(">")[1]).split("<")[0];
		var bb=(b.split(">")[1]).split("<")[0];
		aa=aa.toLowerCase().replace("the ", "");
		bb=bb.toLowerCase().replace("the ", "");
		return ((aa > bb) - (bb > aa));
	};
	
	
	var a=[];
	for(var n in iati_codes.funder_names) // CRS funders (maybe multiple iati publishers)
	{
		var v=iati_codes.funder_names[n];
		if(v)
		{
			var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
			a.push(s);
		}
	}
	a.sort(compare);
	ctrack.chunk("search_options_funder",a.join(""));


	var a=[];
	for(var n in iati_codes.sector) // CRS funders (maybe multiple iati publishers)
	{
		var v=iati_codes.sector[n];
		if(v)
		{
			var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
			a.push(s);
		}
	}
	a.sort(compare);
	ctrack.chunk("search_options_sector",a.join(""));

	var a=[];
	for(var n in iati_codes.sector_names) // CRS funders (maybe multiple iati publishers)
	{
		var v=iati_codes.sector_names[n];
		if(v)
		{
			var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
			a.push(s);
		}
	}
	a.sort(compare);
	ctrack.chunk("search_options_category",a.join(""));

	var a=[];
	for(var n in iati_codes.crs_countries) // just recipient countries (use CRS list)
	{
		var v=iati_codes.country[n];
		if(v)
		{
			var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
			a.push(s);
		}
	}
	a.sort(compare);
	ctrack.chunk("search_options_country",a.join(""));
//	console.log(a);
	
	var a=[];
	for(var n in iati_codes.publisher_names)
	{
		var v=iati_codes.publisher_names[n];
		var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
		a.push(s);
	}
	a.sort(compare);
	ctrack.chunk("search_options_publisher",a.join(""));

	var a=[];
	for(var i=1960;i<2020;i++)
	{
		var s="<option value='"+i+"'>"+i+"</option>";
		a.push(s);
	}
	a.sort(compare);
	ctrack.chunk("search_options_year",a.join(""));


	var aa=[];
	for(var n in iati_codes.country) { var v=iati_codes.country[n]; // only countries
		if( iati_codes.crs_countries[n] ) // only recipients
		{
			aa.push( {id:n,name:v,cc:n.toLowerCase()} );
		}
	}
	aa.sort(function(a,b){
		var aa=a.name.toLowerCase().replace("the ", "");
		var bb=b.name.toLowerCase().replace("the ", "");
		return ((aa > bb) - (bb > aa));
	});
	var s=[];
	for(var i in aa) { var v=aa[i];
		s.push( plate.replace("{search_country_select}",{it:v}) );
	}
	ctrack.chunk("countries_country_select",s.join(""));

	var aa=[];
	for(var n in iati_codes.publisher_names) { var v=iati_codes.publisher_names[n];
		aa.push( {id:n,name:v} );
	}
	aa.sort(function(a,b){
		var aa=a.name.toLowerCase().replace("the ", "");
		var bb=b.name.toLowerCase().replace("the ", "");
		return ((aa > bb) - (bb > aa));
	});
	var s=[];
	for(var i in aa) { var v=aa[i];
		s.push( plate.replace("{search_publisher_select}",{it:v}) );
	}
	ctrack.chunk("publishers_publisher_select",s.join(""));

	view_search.ajax();
}


view_search.ajax=function(args)
{
	var args=args || {};
	var dat={
			"from":"act",
			"limit":-1,
			"select":"count_aid",
		};
	fetch.ajax_dat_fix(dat,args);

	var count=0; for(var n in args.q) { count++; }
	if(count==0) // disable results button
	{
		$("#search_link").addClass("search_link_disable");
	}
	else // enable results button
	{
		$("#search_link").removeClass("search_link_disable");
	}
	
	$("#result_span").html("...");
	fetch.ajax(dat,function(data){
		var c=data.rows[0]["count_aid"];
		$("#result_span").html("Found "+c+" activities");
	});
	
}
