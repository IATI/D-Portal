// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var ctrack=exports;

var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var savi=require("./savi.js")

// export savi
ctrack.savi_fixup=savi.fixup;

ctrack.setup=function(args)
{
	args.tongue=args.tongue || "eng"; // english

	ctrack.args=args;
	
	ctrack.crumbs=[];
	ctrack.setcrumb=function(idx)
	{
console.log("bfore"+ctrack.crumbs.length);
		var it={};
		ctrack.crumbs=ctrack.crumbs.slice(0,idx);
		ctrack.crumbs[idx]=it;
		it.hash=ctrack.last_hash;
		it.view=ctrack.last_view;
		
		for(var i=0;i<idx-1;i++)
		{
		}
		
console.log("after"+ctrack.crumbs.length);
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

	var tongues={
		"fra":require("../json/fra.json"),
		"spa":require("../json/spa.json")
	};
	var tongue=tongues[ args.tongue ];
	if(tongue){plate.push_namespace(tongue);}
	plate.push_namespace(require("../json/eng.json")); // english fallback
	plate.push_namespace(require("../json/chunks.json"));

// set or get a chunk in the ctrack namespace
	ctrack.chunk=function(n,s){
		if( s !== undefined )
		{
			ctrack.chunks[n]=s;
		}
		return ctrack.chunks[n];
	}


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

	ctrack.chunk("ctbox1table_datas","{loading}");
	ctrack.chunk("active_projects",0);

	ctrack.chunk("ctbox2table_datas","{loading}");
	ctrack.chunk("finished_projects",0);

	ctrack.chunk("ctbox3table_datas","{loading}");
	ctrack.chunk("planned_projects",0);
	
	ctrack.chunk("ctneartable_datas","{loading}");

	ctrack.chunk("donor_transactions_datas","{loading}");
	ctrack.chunk("donor_budgets_datas","{loading}");

	ctrack.chunk("numof_publishers",0);
	ctrack.chunk("total_projects",0);
	
	ctrack.chunk("today",fetch.get_today());
 
	ctrack.hash={};
	ctrack.hash_split=function(q,v)
	{
		if(q[0]=="#") { q=q.substring(1);}
		v=v || ctrack.hash;
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
		if( name.indexOf("main") == 0 ) // only fetch the main once?
		{
			if( !ctrack.view_done[name] )
			{
				ctrack.view_done[name]=true;			
				fetch.endingsoon({limit:5});
				fetch.finished({limit:5});
				fetch.planned({limit:5});
				fetch.heatmap({limit:300});
				fetch.stats({});
			}
			ctrack.setcrumb(0);
		}
		else
		if( name.indexOf("donors") == 0 )
		{
			if( !ctrack.view_done[name] )
			{
				ctrack.view_done[name]=true;			
				fetch.donors();
			}
			ctrack.setcrumb(1);
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
		}
		else
		if( name.indexOf("donor_transactions") == 0 )
		{
			fetch.donor_transactions({year:ctrack.hash.year,funder:ctrack.hash.funder});
			ctrack.setcrumb(2);
		}
		else
		if( name.indexOf("donor_budgets") == 0 )
		{
			fetch.donor_budgets({year:ctrack.hash.year,funder:ctrack.hash.funder});
			ctrack.setcrumb(2);
		}
		else
		if( name.indexOf("donor_activities") == 0 )
		{
			fetch.donor_activities({funder:ctrack.hash.funder});
			ctrack.setcrumb(2);
		}
		else
		if( name.indexOf("act") == 0 )
		{
			fetch.activity({activity:ctrack.hash.aid});
			ctrack.setcrumb(3);
		}
	}


	ctrack.hash={"view":"main"};
	ctrack.display_wait=0;
	ctrack.update_hash=function(h)
	{
		for(var n in h)
		{
			ctrack.hash[n]=h[n];
		}

		ctrack.display_wait--;

		if(ctrack.display_wait<=0)
		{
			ctrack.display_wait=0;
			ctrack.change_hash(h);
		}
	}
	ctrack.change_hash=function(h)
	{
		for(var n in h)
		{
			ctrack.hash[n]=h[n];
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
			ctrack.last_hash=h;
			var l=ctrack.hash_split(h);
			
			if(ctrack.last_view!=l.view) // scroll up when changing views
			{
				ctrack.last_view=l.view;
				$("html, body").bind("scroll mousedown DOMMouseScroll mousewheel keyup", function(){
					$('html, body').stop();
				});
				$('html, body').animate({ scrollTop:120 }, 'slow', function(){
					$("html, body").unbind("scroll mousedown DOMMouseScroll mousewheel keyup");
				})
				
				ctrack.prepare_view(l.view);
console.log("new view");
   			}

			ctrack.show_crumbs();
			ctrack.div.master.html( plate.replace( "{view_"+l.view+"}" ) );
		}
// these need to be hooks
console.log("fixing view with js");
		savi.fixup();
		display_ctrack_map();
	};
	$(window).bind( 'hashchange', function(e) { ctrack.check_hash(); } );
	ctrack.check_hash();
	ctrack.display_hash();



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
								fetch.endingsoon({limit:20});
							break;
							case "finished":
								fetch.finished({limit:20});
							break;
							case "starting":
								fetch.planned({limit:20});
							break;
							case "near":
								fetch.near({limit:20});
							break;
						}
					}
				}
			}
		}
	});

}

