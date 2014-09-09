// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_generator=exports;
exports.name="generator";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

var iati_codes=require("../../dstore/json/iati_codes.json")


// the chunk names this view will fill with new data
view_generator.chunks=[
];


// build data of what iframe widgets we can publish
var genes={};
	genes.sectors={
		crs:true,
		name:"CRS Sectors all (table) for a single country"
	};
	genes.sectors_top={
		crs:true,
		name:"CRS Sectors top (graph) for a single country"
	};
	genes.donors={
		crs:true,
		name:"CRS Donors all (table) for a single country"
	};
	genes.donors_top={
		crs:true,
		name:"CRS Donors top (graph) for a single country"
	};
	genes.publisher_sectors={
		name:"Sectors all (table)"
	};
	genes.publisher_sectors_top={
		name:"Sectors top (graph)"
	};
	genes.publisher_countries={
		name:"Countries all (table)"
	};
	genes.publisher_countries_top={
		name:"Countries top (graph)"
	};
	genes.map={
		name:"Map (only shows precise locations of activities)"
	};
	genes.stats={
		name:"Overview (statistics)"
	};
	for(var n in genes) // set defaults
	{
		var v=genes[n];
		v.id=n;
		v.name=v.name || n;
		v.width=v.width || 960;
		v.height=v.height || 480;
	}
// themes
var skins={}
	skins.original={flava:"original"};
	skins.high={flava:"high"};
	skins.grey={flava:"original",rgba:"grey"};
	skins.mustard={flava:"original",rgba:"mustard"};
	skins.inspire={flava:"original",rgba:"inspire"};

var sizes=[320,400,450,500,550,640,750,960];


// called on view display to fix html in place (run "onload" javascript here)
view_generator.fixup=function()
{
	var change=function(e){
		var name=""+$("#generator_view").val();
		var gene=genes[name];
		var crs_ok=false;
		
		if(!gene) { return; }
	
		var q="?";
		var hash="#view=frame&frame="+gene.id;
		
		var width=gene.width;
		var height=gene.height;
				
		var skin=$("#generator_skin").val();
		if(skin && skin!="")
		{
			var v=skins[skin];
			if(v)
			{
				if(v.flava)
				{
					q=q+"flava="+v.flava+"&"
				}
				if(v.rgba)
				{
					q=q+"rgba="+v.rgba+"&"
				}
			}
		}

		var country=$("#generator_country").val();
		if(country && country!="")
		{
			if(country.split(",").length==1)
			{
				crs_ok=true;
			}
			q=q+"country="+country+"&"
		}

		var publisher=$("#generator_publisher").val();
		if(publisher && publisher!="")
		{
			crs_ok=false;
			q=q+"publisher="+publisher+"&"
		}
		
		var size=$("#generator_size").val();
		if(size && size!="")
		{
			hash=hash+"&size="+size;
			width=size;
		}
		else
		{
			hash=hash+"&size="+width;
		}
		
		var style="width:"+width+"px;"+"height:"+0+"px;";


		var url=""+window.location;
		url=url.split("#")[0];
		url=url.split("?")[0];

		var frame="<iframe frameborder='0' src=\""+url+q+hash+"\" style=\""+style+"\"></iframe>";
		$("#generator_textarea").val( $("<p>").append($(frame)).html() ); // escape for textarea
		
		var frame_change=function(){
			if( crs_ok || (!gene.crs) )
			{
				$("#frame").empty().append( $( $("#generator_textarea").val() ) );
			}
			else
			{
				$("#frame").empty().append( plate.replace("{generator_crs_error}") );
			}
		};
		frame_change();
		$("#generator_textarea").bind('input propertychange',frame_change);

		var last_height=-1;
		var frame_height=function(){
			height=$($("#frame iframe")[0].contentWindow.document).height();
//			console.log(height);
			if(height!=last_height)
			{
				last_height=height;
				$("#frame iframe")[0].style.height=height+'px';
				$("#generator_textarea").val( $("<p>").append($("#frame iframe").clone()).html() );
			}
		};
			
		$("#frame iframe").load(function(){
			frame_height();
		});

		$("#frame_fix_size").click(frame_height);
		
		if(!view_generator.interval)
		{
			view_generator.interval=window.setInterval(function(){
				if( $("#generator_textarea").length==1 ) // make sure we are still visible
				{
					frame_height();
				}
				else
				{
					window.clearInterval(view_generator.interval);
					view_generator.interval=undefined;
				}
			}, 1000);
		}

	};

	change();
	$("#generator_view").change(change);
	$("#generator_skin").change(change);
	$("#generator_country").change(change);
	$("#generator_publisher").change(change);
	$("#generator_size").change(change);
}
//
// Perform ajax call to get numof data
//
view_generator.view=function(args)
{
	var ss=function(a,b)
	{
		var aa=(a.split(">")[1]).split("<")[0];
		var bb=(b.split(">")[1]).split("<")[0];
		aa=aa.toLowerCase().replace("the ", "");
		bb=bb.toLowerCase().replace("the ", "");
		return ((aa > bb) - (bb > aa));
	};
	
	var a=[];
	for(var n in genes) // defaults
	{
		var v=genes[n];
		var s="<option value='"+n+"'>"+v.name+"</option>";
		a.push(s);
	}
	a.sort(ss);
	ctrack.chunk("generator_options_view",a.join(""));

	
	var a=[];
	for(var n in skins) // defaults
	{
		var v=skins[n];
		var s="<option value='"+n+"'>"+n+"</option>";
		a.push(s);
	}
	a.sort(ss);
	ctrack.chunk("generator_options_skin",a.join(""));

	var a=[];
	for(var n in iati_codes.crs_countries) // just recipient countries (use CRS list)
	{
		var v=iati_codes.country[n];
		if(v)
		{
			var s="<option value='"+n+"'>"+v+"</option>";
			a.push(s);
		}
	}
	a.sort(ss);
	ctrack.chunk("generator_options_country",a.join(""));
	
	var a=[];
	for(var n in iati_codes.publisher_names) // defaults
	{
		var v=iati_codes.publisher_names[n];
		var s="<option value='"+n+"'>"+v+"</option>";
		a.push(s);
	}
	a.sort(ss);
	ctrack.chunk("generator_options_publisher",a.join(""));

	var a=[];
	for(var n in sizes) // defaults
	{
		var v=sizes[n];
		var s="<option value='"+v+"'>"+v+" pixels wide</option>";
		a.push(s);
	}
	a.sort(ss);
	ctrack.chunk("generator_options_size",a.join(""));

}
