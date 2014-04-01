// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var ctrack=exports;

var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var savi=require("./savi.js")

var views=require("./views.js");

var ganal=require("./ganal.js");

var iati_codes=require("../../dstore/json/iati_codes.json")


// export savi
ctrack.savi_fixup=savi.fixup;

ctrack.get_chart_data=function(name)
{
		return ctrack.chunk(name) || [];
};


ctrack.setup=function(args)
{
	args=args || {};
	args.tongue	=args.tongue 	|| 	"eng"; 		// english
	args.art	=args.art 		|| 	"/art/"; 	// local art
	args.q		=args.q 		|| 	"/q"; 		// local q api

	ctrack.args=args;
	
	ctrack.crumbs=[{hash:"#view=main",view:"main"}];
	ctrack.setcrumb=function(idx)
	{
// try not to leave holes in the crumbs list, so align to left
		if(idx > ctrack.crumbs.length ) { idx=ctrack.crumbs.length; }
		
		var it={};
		ctrack.crumbs=ctrack.crumbs.slice(0,idx);
		ctrack.crumbs[idx]=it;
		it.hash=ctrack.last_hash;
		it.view=ctrack.last_view;
	};
	ctrack.show_crumbs=function()
	{
		for(var i=0;i<ctrack.crumbs.length;i++)
		{
			var v=ctrack.crumbs[i];
			if(v)
			{
				ctrack.chunk("crumb"+i+"_hash",v.hash);
				ctrack.chunk("crumb"+i+"_view",v.view);
			}
			else
			{
				ctrack.chunk("crumb"+i+"_hash","#view=main");
				ctrack.chunk("crumb"+i+"_view","main");
			}
		}
		ctrack.chunk("crumbs","{crumbs"+ctrack.crumbs.length+"}");
	}

	ctrack.q={};
	window.location.search.substring(1).split("&").forEach(function(n){
		var aa=n.split("=");
		ctrack.q[aa[0]]=aa[1];
	});
// temporary country force hack
	if( ctrack.q.country )
	{
		args.country=ctrack.q.country.toLowerCase();
		args.chunks["country_name"]=iati_codes.country[args.country.toUpperCase()];
		args.chunks["country_flag"]="{art}flag/"+args.country+".png";
		args.chunks["background_image"]="{art}back/"+args.country+".jpg";
	}

	if( ctrack.q.tongue ) // choose a new tongue
	{
		args.tongue=ctrack.q.tongue;
	}
	
	ctrack.chunks={};
	plate.push_namespace(ctrack.chunks);
	if(args.chunks)
	{
		plate.push_namespace(args.chunks);
	}

	if( args.tongue!="non" ) // use non as a debugging mode
	{
		var tongues=require("../json/tongues.js"); // load all tongues
		var tongue=tongues[ args.tongue ];
		if(tongue){plate.push_namespace(tongue);}
		plate.push_namespace(require("../json/eng.json")); // english fallback for any missing chunks
	}
	plate.push_namespace(require("../json/chunks.json"));

// set or get a chunk in the ctrack namespace
	ctrack.chunk=function(n,s){
		if( s !== undefined )
		{
			ctrack.chunks[n]=s;
		}
		return ctrack.chunks[n];
	}
// set global defaults
	ctrack.chunk("art",args.art);
	ctrack.chunk("tongue",args.tongue);

	ctrack.div={};

	ctrack.div.master=$(ctrack.args.master);
	ctrack.div.master.empty();
	ctrack.div.master.html( plate.replace("{loading}")  );
	
	
	ctrack.chunk("today",fetch.get_today());
	ctrack.chunk("hash","");
	
	var s="?";
	if(ctrack.q.country)
	{
		s=s+"country="+ctrack.q.country;
	}
	ctrack.chunk("mark",s);
 
	ctrack.hash={};
	ctrack.hash_split=function(q,v)
	{
		if(q[0]=="#") { q=q.substring(1);}
		v=v;
		var aa=q.split("&");
		aa.forEach(function(it){
			var bb=it.split("=");
//console.log(bb);
			if( ( "string" == typeof bb[0] ) && ( "string" == typeof bb[1] ) )
			{
				v[ bb[0] ] = bb[1] ;
			}
		});
		return v;
	}


	ctrack.view_done={};
	ctrack.show_view=function(name)
	{
		if(name)
		{
			name=name.toLowerCase();
			var v=views[name];
			if(v && v.view)
			{
				v.view();
			}
			ganal.view(); // record view action
		}
	}

	ctrack.hash={"view":"main"};
	ctrack.display_wait=0;
	ctrack.display=function()
	{
		ctrack.display_wait--;
		if(ctrack.display_wait<=0)
		{
			ctrack.display_wait=0;
			ctrack.change_hash();
		}
	}
	ctrack.change_hash=function(h)
	{
		if(h)
		{
			ctrack.hash={};
			for(var n in h)
			{
				ctrack.hash[n]=h[n];
			}
		}
		ctrack.last_hash="";
		ctrack.display_hash();
		ctrack.check_hash();
	}
	ctrack.display_hash=function()
	{
		var a=[];
		for(var n in ctrack.hash)
		{
			a.push(n+"="+ctrack.hash[n]);
		}
		document.location.hash=a.join("&");
	}
	ctrack.last_hash="";
	ctrack.last_view="";
	ctrack.check_hash=function()
	{
		var h=document.location.hash;
		if(h!=ctrack.last_hash)
		{
			ctrack.chunk("hash",h);
			ctrack.last_hash=h;
			var l={};
			ctrack.hash=ctrack.hash_split(h,l);
			
			if(ctrack.last_view!=l.view) // scroll up when changing views
			{
				ctrack.last_view=l.view;
				$("html, body").bind("scroll mousedown DOMMouseScroll mousewheel keyup", function(){
					$('html, body').stop();
				});
				$('html, body').animate({ scrollTop:0 }, 'slow', function(){
					$("html, body").unbind("scroll mousedown DOMMouseScroll mousewheel keyup");
				})
				
				ctrack.show_view(l.view);
//console.log("new view");
   			}

//console.log("displaying view");

			ctrack.show_crumbs();
			ctrack.div.master.html( plate.replace( "{view_"+l.view+"}" ) );

// these are now view hooks
			var name=l.view;
			if(name)
			{
				name=name.toLowerCase();
				var v=views[name];
				if(v && v.fixup)
				{
					v.fixup();
				}
			}
		}
	};
	$(window).bind( 'hashchange', function(e) { ctrack.check_hash(); } );

// wait for images to load before performing any data requests?
	$(window).load(function() {
		for(var n in views)
		{
			var v=views[n];
			if(typeof v == "object")
			{
				if(v.setup)
				{
//					console.log("setup "+n);
					v.setup(); // perform initalization of all views
				}
			}
		}
		ctrack.check_hash();
		ctrack.display_hash(); // this will display view=main or whatever page is requsted
	});

}

