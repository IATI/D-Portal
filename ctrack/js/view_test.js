// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_test=exports;
exports.name="stats";

var csscolor=require("./csscolor.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_test.chunks=[
];

view_test.view=function(args)
{
	ctrack.setcrumb(0);
	ctrack.change_hash();

	view_test.ajax();
}

//
// Perform fake ajax call to get data 
//
view_test.ajax=function(args)
{
	args=args || {};
	var limit=args.limit || 5;

	var list=[];
// insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.usd=crs[n];
		list.push(d);
	}
	list.sort(function(a,b){
		return ( (b.usd||0)-(a.usd||0) );
	});

	var total=0; list.forEach(function(it){total+=it.usd;});
	var shown=0;
//	var top=list[0] && list[0].usd || 0;
	var s=[];
	var dd=[];
	for( var i=0; i<limit-1 ; i++ )
	{
		var v=list[i];
		if(v)
		{
			shown+=v.usd;
			var d={};
			d.num=v.usd;
			d.str_num=commafy(d.num)+" usd";
			d.str_lab=iati_codes.funder_names[v.funder] || iati_codes.country[v.funder] || v.funder;
			dd.push(d);
		}
	}
	var d={};
	d.num=total-shown;
	d.str_num=commafy(d.num)+" usd";
	d.str_lab="other";
	dd.push(d);
		
	ctrack.chunk("data_chart_donors",dd);

	ctrack.display();
}


ctrack.draw_chart=function(sel,data,options){

	var opt={
		width:400,
		height:400,
		radius:140,
		hole:70,
		caption_maxwidth:100,
	}
	for(var n in options)
	{
		opt[n]=options[n];
	}

	var div={};
	div.master=$(sel);
	div.canvas=$("<canvas width='"+opt.width+"' height='"+opt.height+"'></canvas>");
	div.over=$("<div></div>");

	div.master.empty();
	div.master.append(div.canvas);
	div.master.append(div.over);
	
	var css={"width":opt.width,"height":opt.height};
	div.master.css(css);
	div.canvas.css(css);
	div.over.css(css);

// slot div.over above the canvas
	div.master.css({"position":"relative"});
	div.canvas.css({"position":"absolute","top":0,"left":0});
	div.over.css({"position":"absolute","top":0,"left":0});
	
	
	var ctx = div.canvas[0].getContext('2d');
//	ctx.canvas.width=opt.width;
//	ctx.canvas.heght=opt.height;


	div.over.html("This is a caption.")

//	var data=[0.1,0.2,0.3,0.4];

	var	ang=-(Math.PI/2);
	
	var max=0; for (var i=0; i<data.length; i++){ max+=data[i].num; }
	
	for (var i=0; i<data.length; i++){

		var seg = ( (data[i].num/max) * (Math.PI*2) );

		ctx.beginPath();
		ctx.arc(opt.width*0.5,opt.height*0.5,opt.radius,ang,ang + seg,false);
		ctx.arc(opt.width*0.5,opt.height*0.5,opt.hole,ang + seg,ang,true);
		ctx.closePath();

		ctx.fillStyle = "#44c";
		ctx.fill();

		ctx.lineWidth = 4;
		ctx.strokeStyle = "#008";
		ctx.stroke();

		ang += seg;
	}	

}

