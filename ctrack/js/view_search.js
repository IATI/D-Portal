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
	for(var n in iati_codes.sector_withdrawn)
	{
		var v=iati_codes.sector_withdrawn[n];
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
	for(var n in iati_codes.activity_status)
	{
		var v=iati_codes.activity_status[n];
		var s=v+" ("+n+")";
		strings.push(s);
		lookup[s]={group:"status",value:n,text:v,str:s};
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

	var typeaheadref=$('#view_search_string').typeahead({
	  hint: false,
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
		
		var vraw=$('#view_search_string').val() || $('#view_search_string_only').val();
		var v=vraw;
		
// remove and trim non alphanumerics, so search is very simple for now
//		if(v) { v=v.replace(/[^A-Za-z0-9]+/gi," ").trim(); }

// just trim it...
		if(v) { v=v.trim(); }
		
		var enable_search=false;
		
		if(v)
		{
			enable_search=true;
			txt.push("Searching activity title for the term \""+v+"\"")
			que.push("search="+ctrack.encodeURIComponent(v))
			ctrack.hash.search=v
			q.text_search=v;
			q.raw_text_search=vraw;
		}
		else
		{
			delete ctrack.hash.search
			txt.push("Searching for any activities")
		}

		var v=$("#view_search_select_country").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the recipient country is \""+v+"\"")
			que.push("country="+v)
			ctrack.hash.country=v
			q.country_code=v;
		}
		else
		{
			delete ctrack.hash.country
		}
		
		var v=$("#view_search_select_funder").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the CRS funder is \""+v+"\"")
			que.push("funder="+v)
			ctrack.hash.funder=v
			q.funder_ref=v;
		}
		else
		{
			delete ctrack.hash.funder
		}

		var v=$("#view_search_select_sector").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI sector is \""+v+"\"")
			que.push("sector_code="+v)
			ctrack.hash.sector_code=v
			q.sector_code=v;
		}
		else
		{
			delete ctrack.hash.sector_code
		}

		var v=$("#view_search_select_category").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI sector category is \""+v+"\"")
			que.push("sector_group="+v)
			ctrack.hash.sector_group=v
			q.sector_group=v;
		}
		else
		{
			delete ctrack.hash.sector_group
		}

		var v=$("#view_search_select_publisher").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI publisher is \""+v+"\"")
			que.push("publisher="+v)
			ctrack.hash.publisher=v
			q.reporting_ref=v;
		}
		else
		{
			delete ctrack.hash.publisher
		}


		var donemin;
		var v=$("#view_search_select_year_min").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the year reported to IATI is greater than or equal to \""+v+"\"")
			que.push("year_min="+v);
			que.push("year="+v);
			ctrack.hash.year_min=v
			q.day_end_gt=(parseInt(v,10))+"-01-01";
			
		}
		else
		{
			delete ctrack.hash.year_min
		}

		var v=$("#view_search_select_year_max").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the year reported to IATI is less than or equal to \""+v+"\"")
			que.push("year_max="+v);
			if(!donemin) { que.push("year="+v); }
			ctrack.hash.year_max=v
			q.day_start_lteq=(parseInt(v,10)+1)+"-01-01";
		}
		else
		{
			delete ctrack.hash.year_max
		}

		var v=$("#view_search_select_status").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI status is \""+v+"\"")
			que.push("status="+v)
			ctrack.hash.status=v
			q.status_code=v;
		}
		else
		{
			delete ctrack.hash.status
		}

		var v=$("#view_search_select_policy").val();		
		if(v)
		{
			enable_search=true;
			txt.push("Where the IATI policy marker is \""+v+"\"")
			que.push("policy="+v)
			ctrack.hash.policy=v
			q.filter_policy_code=v;
		}
		else
		{
			delete ctrack.hash.policy
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
		
		ctrack.display_hash(); // display current search settings in hash string so we can bookmark
		
		return "?"+que.join("&")+"#view=main";
	}
	
	var search_select_ids={
		"view_search_select_country":true,
		"view_search_select_funder":true,
		"view_search_select_sector":true,
		"view_search_select_category":true,
		"view_search_select_publisher":true,
		"view_search_select_year_min":true,
		"view_search_select_year_max":true,
		"view_search_select_status":true,
		"view_search_select_policy":true,
	};

	var search_select_sort_ids={
		"view_search_select_country":true,
		"view_search_select_sector":true,
		"view_search_select_category":true,
		"view_search_select_publisher":true,
		"view_search_select_status":true,
		"view_search_select_policy":true,
	};

	var o={allow_single_deselect:true,search_contains:true,placeholder_text:"Select an option",placeholder_text_multiple:"Select one or multiple options"};
	for(var n in search_select_ids)
	{
		$("#"+n).chosen(o).change(build_query);
	}
	
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
	
	var sort_chosen_by="ABC";
	var sort_chosen=function(sel)
	{

		var selected = sel.val(); // cache selected value, before reordering
		var opts_list = sel.find('option').filter(function() { return this.value || $.trim(this.value).length != 0; });
		opts_list.sort(
			function(a, b)
			{
				if(sort_chosen_by=="123")
				{
					return $(a).val().toUpperCase() > $(b).val().toUpperCase() ? 1 : -1;
				}
				else
				{
					return $(a).text() > $(b).text() ? 1 : -1;
				}
			}
		);
		sel.html('').append(opts_list);
		if(selected)
		{
			sel.val(selected); // set cached selected value
		}
	}

	$('#view_search_order').bind('click', function(e, a) {
			e.preventDefault();			

			var a1=$('#view_search_order span.order_1, #view_search_order .toggle_abc');
			var a2=$('#view_search_order span.order_2, #view_search_order .toggle_123');
			
			if(sort_chosen_by=="ABC")
			{
				a1.show().hide();
				a2.hide().show();
				sort_chosen_by="123";
				ctrack.hash.sort="123";
				ctrack.display_hash();
			}
			else
			{
				a1.hide().show();
				a2.show().hide();
				sort_chosen_by="ABC";
				ctrack.hash.sort="ABC";
				ctrack.display_hash();
			}
			
			
			for(var n in search_select_sort_ids)
			{
				sort_chosen($("#"+n));
				$("#"+n).trigger('chosen:updated');
			}
				
		});
	
	$('#view_search_clear').bind('click', function(e, a) {
			e.preventDefault();
			for(var n in search_select_ids)
			{
				$("#"+n+' option').prop('selected', false);
				$("#"+n).trigger('chosen:updated');
			}
			build_query();
		});
		

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

// enter key press on search2
	$('#view_search_string_only').bind("enterKey",function(e){
		window.location.href=build_query(e);
	});
	$('#view_search_string_only').keyup(function(e){
		if(e.keyCode == 13)
		{
			$(this).trigger("enterKey");
		}
	});

// initialise page		
	refresh();

	if(typeaheadref)
	{
		typeaheadref.focus();
	}
	else
	{
		$('#view_search_string_only').focus();
	}
	
	if(	(sort_chosen_by=="ABC") && (ctrack.hash.sort=="123") )
	{
		$('#view_search_order').trigger("click");
	}

//	for(var n in ctrack.hash){console.log(n+" = "+ctrack.hash[n])}
// update the current selection to values found in the hash
	if(ctrack.hash.search)
	{
		var vs=ctrack.hash.search.split(",")
		$("#view_search_string").val(vs).trigger('chosen:updated');
		$("#view_search_string_only").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.country)
	{
		var vs=ctrack.hash.country.split(",")
		$("#view_search_select_country").val(vs).trigger('chosen:updated');
	}
	
	if(ctrack.hash.funder)
	{
		var vs=ctrack.hash.funder.split(",")
		$("#view_search_select_funder").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.publisher)
	{
		var vs=ctrack.hash.publisher.split(",")
		$("#view_search_select_publisher").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.sector_code)
	{
		var vs=ctrack.hash.sector_code.split(",")
		$("#view_search_select_sector").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.sector_group)
	{
		var vs=ctrack.hash.sector_group.split(",")
		$("#view_search_select_category").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.year_min)
	{
		var vs=ctrack.hash.year_min.split(",")
		$("#view_search_select_year_min").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.year_max)
	{
		var vs=ctrack.hash.year_max.split(",")
		$("#view_search_select_year_max").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.status)
	{
		var vs=ctrack.hash.status.split(",")
		$("#view_search_select_status").val(vs).trigger('chosen:updated');
	}

	if(ctrack.hash.policy)
	{
		var vs=ctrack.hash.policy.split(",")
		$("#view_search_select_policy").val(vs).trigger('chosen:updated');
	}

// wait a little while otherwise above changes do not work...
	setTimeout(build_query,100)
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
	for(var sn in iati_codes.policy_sig)
	{
		var sv=iati_codes.policy_sig[sn];
		if(sv)
		{
			for(var cn in iati_codes.policy_code)
			{
				var cv=iati_codes.policy_code[cn];
				if(cv)
				{
					var n=sn+"_"+cn
					var v=cv+" IS "+sv
					var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
					a.push(s);
				}
			}
		}
	}
	a.sort(compare);
	ctrack.chunk("search_options_policy",a.join(""));

	var a=[];
	for(var n in iati_codes.funder_names) // CRS funders (maybe multiple iati publishers)
	{
		var v=iati_codes.funder_names[n];
		if(v)
		{
			if(n != parseInt(n, 10)) // ignore integer codes
			{
				var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
				a.push(s);
			}
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
	for(var n in iati_codes.sector_withdrawn)
	{
		var v=iati_codes.sector_withdrawn[n];
		if(v)
		{
			var s="<option value='"+n+"'>"+v+" ("+n+") (WITHDRAWN)</option>";
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

	var a=[];
	for(var n in iati_codes.activity_status)
	{
		var v=iati_codes.activity_status[n];
		var s="<option value='"+n+"'>"+v+" ("+n+")</option>";
		a.push(s);
	}
	a.sort(compare);
	ctrack.chunk("search_options_status",a.join(""));

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

view_search.latest=0;
view_search.ajax=function(args)
{
	var args=args || {};
	var dat={
			"from":"act",
			"limit":-1,
			"select":"count_aid",
		};
	fetch.ajax_dat_fix(dat,args);

	$("#search_link").addClass("search_link_disable");
	$("#result_span").html("");
	$("#result_aid_link").html("");
	$("#result_aid_div").addClass("search_aid_link_disable");

	view_search.latest++;

	var count=0; for(var n in args.q) { count++; }
	if(count==0)
	{
		return;
	}

	$("#result_span").html("Searching ...");
	
	var latest=view_search.latest;
	
	fetch.ajax(dat,function(data){
		if(latest!=view_search.latest) { return; } // ignore old search data

		var c=data.rows[0]["count_aid"];
		if( c>0 ) // show results
		{
			$("#search_link").removeClass("search_link_disable");
		}
//console.log( data.rows[0] );
		$("#result_span").html("Found "+c+" activities");
	});
	
	if( args && args.q && args.q.text_search ) // try for exact aid
	{
		fetch.ajax({
				"from":"act",
				"limit":1,
				"aid":args.q.raw_text_search.trim(),
			},function(data){
			if(latest!=view_search.latest) { return; } // ignore old search data

			if( data.rows.length>0 ) // show results
			{
//console.log( data );
				var aid=data.rows[0].aid
//				$("#result_aid_link").html("<a href=\"#view=act&aid="+aid+"\">View the activity with this IATI Identifier</a>");
//				$("#result_aid_div").removeClass("search_aid_link_disable");				
				ctrack.change_hash({view:"act",aid:aid});
			}
		});
	}


}
