// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var chart=exports;
exports.name="chart";

var csscolor=require("./csscolor.js")
var ctrack=require("./ctrack.js")

chart.draw=function(sel,data,options){

	var opt={			//	All stylings are in pixels
		style:"donut", 	//	Style of chart - there is only donut flavour for now
		layout:"right",	//	Caption placement - left, right, five
		clockwise:1,    // if -1 then fill piechart in reverse
		width:600,		//	Width of entire chart div
		height:400,		//	Height of entire chart div
		center_x:200,	//	Center of chart in div from the left
		center_y:200,	//	Center of chart in div from the top
		radius:140,		//	Size of chart
		hole:70,		//	Size of hole in chart - how big is your donut?
		color:["#0f0","#8f0","#4f0","#0f4","#0f8","#4f4"],	//	Add as many colours as you want for pie slices (5 max for now)
		caption_css:{"width":160,"padding":"8px","borderStyle":"solid","borderWidth":4},	//	Styling for the caption div
		caption_edge:4,	//	Margin of caption div from the edge of entire chart div depending on layout (left/right)
		stroke_width:4,	//	Thickness of chart border
		line_width:1,	//	Thickness of lines from caption to chart
		tints:{						//	Changing the numbers below apart from [1,1,1,1] gives experimental effects
			fill:[1,1,1,1],			//	Background color of chart - [1,1,1,1] gets you slice colors
			line:[0,0,0,0.5],		//	Color of line from caption to chart - [1,1,1,1] gets you slice colors
			stroke:[0.5,0.5,0.5,1],	//	Border color of chart - [2,2,2,2] gets you #fff border
			text:[0,0,0,1],			//	Color of caption fonts
			back:[1,1,1,1],			//	Background color of caption div
			border:[0.5,0.5,0.5,1],	//	Border color of caption div
		},
	}
	for(var n in options) { opt[n]=options[n]; }
	
	var getdat=function(name,idx){
		var v=data[idx]; // check data first
		var r;
		if("object"==typeof v)
		{
			r=v[name];
		}
		if(r===undefined)
		{
			if(name=="num") // allow single numerical data array
			{
				if("number"==typeof v)
				{
					r=v;
				}
			}
		}
		if(r===undefined) // allow opts to add labels/colors/etc
		{
			var vv=opt[name];
			if("object"==typeof vv)
			{
				r=vv[idx%vv.length]; // extra values, with simple wraping
			}
		}

		return r;
	}

	var div={};
	opt.div=div;
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

	var	ang=-(Math.PI*1/2);	
	var max=0; for (var i=0; i<data.length; i++){ max+=getdat("num",i); }

	opt.seg_rad=[];
	for (var i=0; i<data.length; i++){

		var seg = ( (getdat("num",i)/max) * (Math.PI*2) ) * opt.clockwise ;

		opt.seg_rad[i]=ang+(seg/2);

		ctx.beginPath();
		ctx.arc(opt.center_x,opt.center_y,opt.radius,ang	,ang+seg, opt.clockwise<0 /*false*/);
		ctx.arc(opt.center_x,opt.center_y,opt.hole	,ang+seg,ang	, opt.clockwise>0 /*true*/);
		ctx.closePath();

		var cc=csscolor.parseCSSColor( getdat("color",i) );

		if(opt.tints.fill)
		{
			ctx.fillStyle = csscolor.rgba_to_str(cc,opt.tints.fill);
			ctx.fill();
		}

		if(opt.tints.stroke)
		{
			ctx.lineWidth = opt.stroke_width;
			ctx.strokeStyle = csscolor.rgba_to_str(cc,opt.tints.stroke);
			ctx.stroke();
		}
		ang += seg;
	}	

	div.over.empty();

	opt.lines=[];
	opt.pos=[];
	opt.ds=[];
	
	var ppx=0;
	var ppy=0;

	for (var i=0; i<data.length; i++){
		var cc=csscolor.parseCSSColor( getdat("color",i) );
		
		d=$("<div></div>").html(getdat("str",i))
		if(opt.tints.text)   { d.css("color",           csscolor.rgba_to_str(cc,opt.tints.text));   }
		if(opt.tints.back)   { d.css("background-color",csscolor.rgba_to_str(cc,opt.tints.back));   }
		if(opt.tints.border) { d.css("border-color",    csscolor.rgba_to_str(cc,opt.tints.border)); }
		d.css(opt.caption_css);
		div.over.append(d);
		opt.ds[i]=d;
		
		var w=d.outerWidth(true);
		var h=d.outerHeight(true);
		var hax=opt.caption_edge;
		var px,py,lx,ly;
		if(opt.layout=="five")
		{
			if(i==1) { px=opt.width-w-hax;	py=hax;					lx=px+(w/2);	ly=py+(h/2); } else
			if(i==2) { px=opt.width-w-hax;	py=opt.height-h-hax;	lx=px+(w/2);	ly=py+(h/2); } else
			if(i==3) { px=hax;				py=opt.height-h-hax;	lx=px+(w/2);	ly=py+(h/2); } else
			if(i==4) { px=hax;				py=hax;					lx=px+(w/2);	ly=py+(h/2); } else
			if(i==0) { px=(opt.width-w)/2;	py=(opt.height-h)/2;	lx=px+(w/2);	ly=py+(h/2); }
		}
		else
		if(opt.layout=="left")
		{
			px=hax;
			py=ppy; ppy+=h;
			lx=px+w;
			ly=py+(h/2);
		}
		else
		if(opt.layout=="right")
		{
			px=opt.width-w-hax;
			py=ppy; ppy+=h;
			lx=px;
			ly=py+(h/2);
		}
		
		if(px!==undefined) { opt.pos[i]=[px,py]; }
		if(lx!==undefined) { opt.lines[i]=[lx,ly]; }
	}

	var fix;
	
	if( (opt.layout=="left") || (opt.layout=="right") )
	{
		fix=[0, (opt.height-ppy)/2 ]; // center
	}

	if(fix)
	{
		for(i=0;i<data.length;i++)
		{
			var pos=opt.pos[i];
			if(pos)
			{
				pos[0]+=fix[0];
				pos[1]+=fix[1];
			}
			var line=opt.lines[i];
			if(line)
			{
				line[0]+=fix[0];
				line[1]+=fix[1];
			}
		}
	}

	for(i=0;i<data.length;i++)
	{
		var d=opt.ds[i];
		if(d)
		{
			var pos=opt.pos[i];
			if(pos)
			{
				d.css("position","absolute");
				d.css("left",pos[0]);
				d.css("top",pos[1]);
			}
		}
	}

	for(i=0;i<data.length;i++)
	{
		var line=opt.lines[i];
		if(line)
		{
			if(opt.tints.line)
			{
				var cc=csscolor.parseCSSColor( getdat("color",i) );
				var c=opt.hole+((opt.radius-opt.hole)/2);
				var dx=Math.cos(opt.seg_rad[i])*c;
				var dy=Math.sin(opt.seg_rad[i])*c;
				dx+=opt.center_x;
				dy+=opt.center_y;

				ctx.beginPath();
				ctx.moveTo(line[0],line[1]);
				ctx.lineTo(dx,dy);
				ctx.closePath();
				
				ctx.lineWidth = opt.line_width;
				ctx.strokeStyle = csscolor.rgba_to_str(cc,opt.tints.line);
				ctx.stroke();
			}
		}
	}

	return opt;
}

