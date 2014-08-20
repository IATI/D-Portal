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

// called on view display to fix html in place (run "onload" javascript here)
view_generator.fixup=function()
{
	$("#generator").empty();
	
	var $top=$("<div></div>").appendTo("#generator");
	var $bot=$("<div></div>").appendTo("#generator");
	
	var $form=$("<form></form>").appendTo($top);

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
	
	for(var n in genes) // defaults
	{
		var v=genes[n];
		v.name=v.name || n;
		v.width=v.width || 960;
		v.height=v.height || 480;
	}

	var $genes=$("<select></select>").appendTo($form);
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

		var $countries;

		if(gene)
		{
			$countries=$("<select></select>").appendTo($opts);
			$("<option value></option>").appendTo($countries);
			for(var n in iati_codes.country) // defaults
			{
				var v=iati_codes.country[n];
				var $o=$("<option value='"+n+"'>"+v+"</option>").appendTo($countries);
			}
		}

		var change=function(e){
			$bot.empty();
			var q="?";
			var hash="#view=frame&frame="+gene.name;
			var style="width:"+gene.width+"px;"+"height:"+gene.height+"px;overflow:hidden;";
			
			var country=$countries && $countries.val();
			if(country && country!="")
			{
				q=q+"country="+country+"&"
			}
			
			var frame="<iframe scrolling=\"no\" src=\"http://d-portal.org/ctrack.html"+q+hash+"\" style=\""+style+"\"></iframe>";
			var $frame=$(frame);
			$("<textarea style='display:block;width:960px;height:100px;'>"+frame+"</textarea>").appendTo($bot);
			$frame.appendTo($bot);
		};

		if($countries) { $countries.change(change); }

	});
}
//
// Perform ajax call to get numof data
//
view_generator.view=function(args)
{
}
