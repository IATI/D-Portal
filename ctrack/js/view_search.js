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
		
//		que.push("this is a test");
//		txt.push("this is a test");
		
		var v=$('#view_search_string').val();
		
		if(v)
		{
			txt.push("Searching activity title for the term \""+v+"\"")
			que.push("search="+v)
		}
		else
		{
			txt.push("Searching for any activities")
			que.push("search")
		}

		var v=$("#view_search_select_country").val();		
		if(v)
		{
			txt.push("Where the recipient country is \""+v+"\"")
			que.push("country="+v)
		}
		
		var v=$("#view_search_select_funder").val();		
		if(v)
		{
			txt.push("Where the CRS funder is \""+v+"\"")
			que.push("funder="+v)
		}

		var v=$("#view_search_select_sector").val();		
		if(v)
		{
			txt.push("Where the IATI sector is \""+v+"\"")
			que.push("sector="+v)
		}

		var v=$("#view_search_select_category").val();		
		if(v)
		{
			txt.push("Where the IATI sector category is \""+v+"\"")
			que.push("category="+v)
		}

		var v=$("#view_search_select_publisher").val();		
		if(v)
		{
			txt.push("Where the IATI publisher is \""+v+"\"")
			que.push("publisher="+v)
		}

		var v=$("#view_search_select_year").val();		
		if(v)
		{
			txt.push("Where the year reported to IATI is \""+v+"\"")
			que.push("year="+v)
		}


		$("#search_span").html("<span>"+txt.join("</span><span>")+"</span>");
		$("#search_link").attr("href","?"+que.join("&"));
		
	}
	
	var o={allow_single_deselect:true,search_contains:true};
	$("#view_search_select_country").chosen(o).change(build_query);
	$("#view_search_select_funder").chosen(o).change(build_query);
	$("#view_search_select_sector").chosen(o).change(build_query);
	$("#view_search_select_category").chosen(o).change(build_query);
	$("#view_search_select_publisher").chosen(o).change(build_query);
	$("#view_search_select_year").chosen(o).change(build_query);

	var apply=function(v){
		if(v)
		{
//			console.log(v);
			var hash="#view_search_select_"+v.group;
			$(hash).parent().show();
			$(hash).val(v.value).trigger("chosen:updated");
			var s=$('#view_search_string').val();
			s=s.replace(v.str,"");
			$('#view_search_string').typeahead('val', s);
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
	
	$('#view_search_string').bind('typeahead:change', function(ev, a) {
		build_query();
	});

}
//
// Perform ajax call to get numof data
//
view_search.view=function(args)
{

	views.search.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

//	views.planned.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
//	views.active.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
//	views.ended.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
//	views.stats.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
//	views.donors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
//	views.sectors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});


	ctrack.setcrumb(0);
	ctrack.change_hash();

/*
	views.planned.ajax({output:"count"});
	views.active.ajax({output:"count"});
	views.ended.ajax({output:"count"});
	views.missing.ajax({output:"count"});
*/
//	views.stats.ajax();
	
//	views.active.ajax({limit:5,plate:"{table_active_data}",chunk:"table_active_datas"});
//	views.ended.ajax({limit:5,plate:"{table_ended_data}",chunk:"table_ended_datas"});

//	views.donors_top.ajax();
//	views.sectors_top.ajax();	

//	ctrack.map.pins=undefined;
//	views.map.ajax_heat({limit:200});

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

}
