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
	};
	genes.sectors_top={
	};
	genes.donors={
	};
	genes.donors_top={
	};
	genes.publisher_sectors={
	};
	genes.publisher_sectors_top={
	};
	genes.publisher_countries={
	};
	genes.publisher_countries_top={
	};
	genes.map={
	};
	for(var n in genes) // set defaults
	{
		var v=genes[n];
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



// called on view display to fix html in place (run "onload" javascript here)
view_generator.fixup=function()
{
/*
	$("#generator").empty();
	
	var $top=$("<div></div>").appendTo("#generator");
	var $bot=$("<div></div>").appendTo("#generator");
	
	var $form=$("<form></form>").appendTo($top);
*/


/*
	var $genes=$("<select></select>").appendTo($form);
	$genes.before("<span>VIEW</span>").after("<br/>");
	$("<option value></option>").appendTo($genes);
	for(var n in genes) // defaults
	{
		var v=genes[n];
		var $o=$("<option value='"+n+"'>"+n+"</option>").appendTo($genes);
	}

	var $opts=$("<div></div>").appendTo($form);

	$genes.change(function(e){

		var name=""+$genes.val();
		var gene=genes[name];
		
//		$opts.html(""+$genes.val());
		
		$bot.empty();
		$opts.empty();

		var $skins;
		var $countries;
		var $publishers;

		if(gene)
		{
			$skins=$("<select></select>").appendTo($opts);
			$skins.before("<span>SKIN</span>").after("<br/>");
			$("<option value></option>").appendTo($skins);
			for(var n in skins) // defaults
			{
				var v=skins[n];
				var $o=$("<option value='"+n+"'>"+n+"</option>").appendTo($skins);
			}

			$countries=$("<select></select>").appendTo($opts);
			$countries.before("<span>COUNTRY</span>").after("<br/>");
			$("<option value></option>").appendTo($countries);
			for(var n in iati_codes.country) // defaults
			{
				var v=iati_codes.country[n];
				var $o=$("<option value='"+n+"'>"+v+"</option>").appendTo($countries);
			}

			$publishers=$("<select></select>").appendTo($opts);
			$publishers.before("<span>PUBLISHER</span>").after("<br/>");
			$("<option value></option>").appendTo($publishers);
			for(var n in iati_codes.publisher_names) // defaults
			{
				var v=iati_codes.publisher_names[n];
				var $o=$("<option value='"+n+"'>"+v+"</option>").appendTo($publishers);
			}
		}

		var change=function(e){
			$bot.empty();
			var q="?";
			var hash="#view=frame&frame="+gene.name;
			
			var width=gene.width;
			var height=gene.height;
			
			var style="width:"+width+"px;"+"height:"+0+"px;overflow:hidden;";
			
			var skin=$skins && $skins.val();
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

			var country=$countries && $countries.val();
			if(country && country!="")
			{
				q=q+"country="+country+"&"
			}

			var publisher=$publishers && $publishers.val();
			if(publisher && publisher!="")
			{
				q=q+"publisher="+publisher+"&"
			}
			
			var url=""+window.location;
			url=url.split("#")[0];
			url=url.split("?")[0];
			var frame="<iframe scrolling=\"no\" src=\""+url+q+hash+"\" style=\""+style+"\"></iframe>";
			
			var $frame=$(frame);
			var $ta=$("<textarea style='display:block;width:960px;height:100px;'></textarea>").appendTo($bot);
			var $aa=$("<a>FIX SIZE</a>").appendTo($bot);
			$frame.appendTo($bot);

			$ta.val( $("<p>").append($frame.clone()).html() );
			$ta.bind('input propertychange',function(){
				$frame.remove();
				$frame=$( $ta.val() );
				$frame.appendTo($bot);
			});

			var newheight=function(){
				height=$($frame[0].contentWindow.document).height();
				console.log(height);
				$frame[0].style.height =	height + 'px';
				$ta.val( $("<p>").append($frame.clone()).html() );
			};
				
			$frame.load(function(){
				newheight();
			});
			
			$aa.click(newheight);

		};

		if($skins     ) {      $skins.change(change); }
		if($countries ) {  $countries.change(change); }
		if($publishers) { $publishers.change(change); }
*/


		var change=function(e){
			var name=""+$("#generator_view").val();
			var gene=genes[name];
			
			if(!gene) { return; }
		
			var q="?";
			var hash="#view=frame&frame="+gene.name;
			
			var width=gene.width;
			var height=gene.height;
			
			var style="width:"+width+"px;"+"height:"+0+"px;overflow:hidden;";
			
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
				q=q+"country="+country+"&"
			}

			var publisher=$("#generator_publisher").val();
			if(publisher && publisher!="")
			{
				q=q+"publisher="+publisher+"&"
			}
			
			var url=""+window.location;
			url=url.split("#")[0];
			url=url.split("?")[0];

			var frame="<iframe scrolling=\"no\" src=\""+url+q+hash+"\" style=\""+style+"\"></iframe>";
			$("#generator_textarea").val( $("<p>").append($(frame)).html() ); // escape for textarea
			var frame_change=function(){
				$("#frame").empty().append( $( $("#generator_textarea").val() ) );
			};
			frame_change();
			$("#generator_textarea").bind('input propertychange',frame_change);

			var frame_height=function(){
				height=$($("#frame iframe")[0].contentWindow.document).height();
				console.log(height);
				$("#frame iframe")[0].style.height=height+'px';
				$("#generator_textarea").val( $("<p>").append($("#frame iframe").clone()).html() );
			};
				
			$("#frame iframe").load(function(){
				frame_height();
			});

			$("#frame_fix_size").click(frame_height);

		};

		change();
		$("#generator_view").change(change);
		$("#generator_skin").change(change);
		$("#generator_country").change(change);
		$("#generator_publisher").change(change);
		
//	});

}
//
// Perform ajax call to get numof data
//
view_generator.view=function(args)
{
	var a=[];
	for(var n in genes) // defaults
	{
		var v=genes[n];
		var s="<option value='"+n+"'>"+n+"</option>";
		a.push(s);
	}
	ctrack.chunk("generator_options_view",a.join(""));

	
	var a=[];
	for(var n in skins) // defaults
	{
		var v=skins[n];
		var s="<option value='"+n+"'>"+n+"</option>";
		a.push(s);
	}
	ctrack.chunk("generator_options_skin",a.join(""));

	var a=[];
	for(var n in iati_codes.country) // defaults
	{
		var v=iati_codes.country[n];
		var s="<option value='"+n+"'>"+v+"</option>";
		a.push(s);
	}
	ctrack.chunk("generator_options_country",a.join(""));
	
	var a=[];
	for(var n in iati_codes.publisher_names) // defaults
	{
		var v=iati_codes.publisher_names[n];
		var s="<option value='"+n+"'>"+v+"</option>";
		a.push(s);
	}
	ctrack.chunk("generator_options_publisher",a.join(""));

}
