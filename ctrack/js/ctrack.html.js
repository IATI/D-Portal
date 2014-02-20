// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var ctrack=ctrack || exports;

ctrack.setup_html=function(args)
{
	ctrack.args=args;

	ctrack.div={};

	ctrack.div.master=$(ctrack.args.master);
	ctrack.div.main=$("<div class=\"ctrack_main\"></div>");
	
	ctrack.div.master.empty();
	ctrack.div.master.append(ctrack.div.main);
	
//	ctrack.div.main.html( ctrack.plate.chunk("chunk1",{test:"TESTING"})  );

	ctrack.div.main.html( ctrack.plate.chunk("loading",{})  );
	
//	ctrack.fetch({});

	var d={};
	var chunk=function(n,s){
		if(s!=undefined)
		{
			d[n]=s;
		}
		else
		{
			d[n]=ctrack.plate.recurse_chunk(n,d);
		}
		return d[n]
	}
	ctrack.htmldata=d;
	ctrack.htmlchunk=chunk;
	
	ctrack.htmlchunk("ctbox1table_datas","<tr><td>Loading...</td></tr>");
	ctrack.htmlchunk("active_projects",0);

	ctrack.htmlchunk("ctbox2table_datas","<tr><td>Loading...</td></tr>");
	ctrack.htmlchunk("finished_projects",0);

	ctrack.htmlchunk("ctbox3table_datas","<tr><td>Loading...</td></tr>");
	ctrack.htmlchunk("planned_projects",0);
	
	ctrack.htmlchunk("ctneartable_datas","<tr><td>Loading...</td></tr>");

	ctrack.htmlchunk("numof_publishers",0);
	ctrack.htmlchunk("total_projects",0);
	
	ctrack.htmlchunk("today",ctrack.get_today());
 
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
		if( !ctrack.view_done[name] )
		{
			ctrack.view_done[name]=true;			
			if( name=="main" )
			{
				ctrack.fetch_endingsoon({limit:5});
				ctrack.fetch_finished({limit:5});
				ctrack.fetch_planned({limit:5});
				ctrack.fetch_near({limit:5});
				ctrack.fetch_stats({});
			}
			else
			if( name=="donors" )
			{
				ctrack.fetch_donors();
			}
			else
			if( name=="sectors" )
			{
				ctrack.fetch_sectors();
			}
			else
			if( name=="districts" )
			{
				ctrack.fetch_districts();
			}
		}
	}


	ctrack.hash={"view":"main"};
	ctrack.update_hash=function(h)
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
			ctrack.div.main.html( ctrack.htmlchunk( "view_"+l.view ) );
			iati_activity_clean_and_sort();
			
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
   			}

		}
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

/*
					if(s=="about") // test
					{
						event.preventDefault();
						ctrack.fetch_activity({activity:"44000-P119917"});
					}
*/
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
						if(aa[1]=="activity")
						{
							var s=$(this).attr("activity");
							console.log(s);
							ctrack.fetch_activity({activity:s});
						}
						else
						if(aa[2]=="more")
						{
							switch(aa[1])
							{
								case "ending":
									ctrack.fetch_endingsoon({limit:20});
								break;
								case "finished":
									ctrack.fetch_finished({limit:20});
								break;
								case "starting":
									ctrack.fetch_planned({limit:20});
								break;
								case "near":
									ctrack.fetch_near({limit:20});
								break;
							}
						}
					}
				}
			}
		});


}

