// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var ctrack=exports;

var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var savi=require("./savi.js")

var views=require("./views.js");

var iati_codes=require("../../dstore/json/iati_codes.json")

// export savi
ctrack.savi_fixup=savi.fixup;

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
// tempory country force hack
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

	if( args.tongue!="non" ) // use non as a debuging mode
	{
		var tongues={
			"fra":require("../json/fra.json"),
			"spa":require("../json/spa.json")
		};
		var tongue=tongues[ args.tongue ];
		if(tongue){plate.push_namespace(tongue);}
		plate.push_namespace(require("../json/eng.json")); // english fallback
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
	

	ctrack.map={};
	ctrack.map.lat=0;
	ctrack.map.lng=0;
	ctrack.map.zoom=6;
	ctrack.map.heat=undefined;
	
//display map 
display_ctrack_map2=function(){
	ctrack.map.api_ready=true;
	display_ctrack_map();
}
display_ctrack_map=function(){
		if(ctrack.map.api_ready)
		{
			if($("#map").length>0)
			{
				if(ctrack.map.heat)
				{

					console.log("map loaded");
					var mapOptions = {
					  center: new google.maps.LatLng(ctrack.map.lat, ctrack.map.lng),
					  zoom: ctrack.map.zoom,
					  scrollwheel: false
					};
					var map = new google.maps.Map(document.getElementById("map"),
						mapOptions);
					


					var heatmapData = [];

					for(var i=0;i<ctrack.map.heat.length;i++)
					{
						var v=ctrack.map.heat[i];
						heatmapData.push({
							location : new google.maps.LatLng(v.lat,v.lng) ,	weight : v.wgt || 1
						});
					}


					var heatmap = new google.maps.visualization.HeatmapLayer({
					  data: heatmapData
					});
					heatmap.setMap(map);

					var fixradius=function()
					{
							var s=Math.pow(2,map.getZoom())/4;
							if(s<4){s=4;}
							heatmap.setOptions({radius:s});
					}
					 google.maps.event.addListener(map, 'zoom_changed', fixradius);
					 fixradius();
  				}
			}
		}
};
// always load map api
head.js("https://maps.googleapis.com/maps/api/js?key=AIzaSyDPrMTYfR7XcA3PencDS4dhovlILuumB_w&libraries=visualization&sensor=false&callback=display_ctrack_map2");


	ctrack.div={};

	ctrack.div.master=$(ctrack.args.master);
	ctrack.div.master.empty();
	ctrack.div.master.html( plate.replace("{loading}")  );
	
//	ctrack.fetch({});
/*
	ctrack.chunk("active_projects","{spinner}");
	ctrack.chunk("ended_projects","{spinner}");
	ctrack.chunk("planned_projects","{spinner}");
	ctrack.chunk("donor_transactions_datas","{spinner}");
	ctrack.chunk("donor_budgets_datas","{spinner}");
	ctrack.chunk("numof_publishers","{spinner}");
	ctrack.chunk("total_projects","{spinner}");
*/
	
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
	ctrack.prepare_view=function(name)
	{
	if(name)
	{

		if( name.indexOf("main") == 0 ) // only fetch the main once?
		{
//			ctrack.setcrumb(0);
//			if( !ctrack.view_done[name] )
//			{
//				ctrack.view_done[name]=true;
				views.main.view();
//			}
		}
		else
		if( name.indexOf("donors") == 0 )
		{
//			if( !ctrack.view_done[name] )
//			{
//				ctrack.view_done[name]=true;			
//				fetch.donors();
//			}
//			ctrack.setcrumb(1);
//			ctrack.change_hash();
			views.donors.view();
		}
		else
		if( name.indexOf("sectors") == 0 )
		{
			if( !ctrack.view_done[name] )
			{
				ctrack.view_done[name]=true;			
				fetch.sectors();
			}
			ctrack.setcrumb(1);
			ctrack.change_hash();
		}
		else
		if( name.indexOf("districts") == 0 )
		{
			if( !ctrack.view_done[name] )
			{
				ctrack.view_done[name]=true;			
				fetch.districts();
			}
			ctrack.setcrumb(1);
			ctrack.change_hash();
		}
		else
		if( name.indexOf("donor_transactions") == 0 )
		{
//			fetch.donor_transactions({year:ctrack.hash.year,funder:ctrack.hash.funder});
//			ctrack.setcrumb(2);
//			ctrack.change_hash();
			views.donor_transactions.view();
		}
		else
		if( name.indexOf("donor_budgets") == 0 )
		{
//			fetch.donor_budgets({year:ctrack.hash.year,funder:ctrack.hash.funder});
//			ctrack.setcrumb(2);
//			ctrack.change_hash();
			views.donor_budgets.view();
		}
		else
		if( name.indexOf("donor_activities") == 0 )
		{
			fetch.donor_activities({funder:ctrack.hash.funder});
			ctrack.setcrumb(2);
			ctrack.change_hash();
		}
		else
		if( name.indexOf("act") == 0 )
		{
			views.act.view();
		}
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
				
				ctrack.prepare_view(l.view);
//console.log("new view");
   			}

//console.log("displaying view");

			ctrack.show_crumbs();
			ctrack.div.master.html( plate.replace( "{view_"+l.view+"}" ) );

// these need to be hooks
//console.log("fixing view with js");
			savi.fixup();
			display_ctrack_map();
		}
	};
	$(window).bind( 'hashchange', function(e) { ctrack.check_hash(); } );

	$( document ).on("click", "a", function(event){
		var s=$(this).prop("href");
		if(s)
		{
			s=s.split("#");
			if(s[1])
			{
				s=s[1];
				var aa=s.split("_");
				console.log( s );
				if(aa[0]=="ctrack") // ours
				{
					event.preventDefault();
					if(aa[1]=="index")
					{
						ctrack.update_hash({"view":"main"});
					}
					else
					if(aa[2]=="more")
					{
						switch(aa[1])
						{
							case "ending":
//								fetch.endingsoon({limit:20});
							break;
							case "finished":
//								fetch.finished({limit:20});
							break;
							case "starting":
//								fetch.planned({limit:20});
							break;
							case "near":
//								fetch.near({limit:20});
							break;
						}
					}
				}
			}
		}
	});

// wait for images to load before performing any data requests?
		$(window).load(function() {
			ctrack.check_hash();
			ctrack.display_hash(); // this will display view=main or whatever page is requsted
		});

}

