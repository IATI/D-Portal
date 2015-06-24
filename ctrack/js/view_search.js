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
	for(var n in iati_codes.sector_category)
	{
		var v=iati_codes.sector_category[n];
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
	 
		// regex used to determine if a string contains the substring `q`
		substrRegex = new RegExp(q, 'i');
	 
		// iterate through the pool of strings and for any string that
		// contains the substring `q`, add it to the `matches` array
		$.each(strings, function(i, str) {
		  if (substrRegex.test(str)) {
			if(lookup[str]) // sanity test
			{
				matches.push( lookup[str] );
//				console.log(lookup[str]);
			}
		  }
		});
	 
		cb(matches);
	  };
	};
	
	var testf=function(a)
	{
		console.log(a);
		return "<div>"+a.str+"</div>";
	}

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
				return "<div><img src=\""+ctrack.args.art+""+a.group+".png\"></img>"+a.str+"</div>";
			}
		}
  	});

	var apply=function(str){
		var v=lookup[str];
		if(v)
		{
			console.log(v);
			var hash="#view_search_select_"+v.group;
			$(hash).parent().show();
			$(hash).val(v.value).trigger("chosen:updated");
			var s=$('#view_search_string').val();
			s=s.replace(str,"");
			$('#view_search_string').typeahead('val', s);
		}
	};

	$('#view_search_string').bind('typeahead:select', function(ev, str) {
		console.log('typeahead:select: ' + str);
		apply(str);
	});

	$('#view_search_string').bind('typeahead:autocomplete', function(ev, str) {
		console.log('typeahead:autocomplete: ' + str);
		apply(str);
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
	for(var n in iati_codes.sector_category) // CRS funders (maybe multiple iati publishers)
	{
		var v=iati_codes.sector_category[n];
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
