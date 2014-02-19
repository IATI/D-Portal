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
			d[n]=ctrack.plate.chunk(n,d);
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

	ctrack.htmlall=function(n)
	{

		chunk("ctend");
		chunk("ctplan");
		chunk("ctabout");
		chunk("ctlogo");
		chunk("ctembed");
		
		chunk("ctactive");
		chunk("ctactivities");
		chunk("ctpublishers");
		chunk("ctbox2");
		chunk("ctbox2table");
		chunk("ctbox2more");
		chunk("ctbox3");
		chunk("ctbox3table");
		chunk("ctbox3more");
		chunk("ctbox2more");
		chunk("ctnearhead");
		chunk("ctneartable");
		chunk("ctnearmore");
		chunk("ctfootboxes");

		chunk("ctnav");
		chunk("cthead");
		chunk("ctbox1");
		chunk("ctbox1table");
		chunk("ctbox1more");
		chunk("ctboxes");
		chunk("ctnear");
		chunk("ctfooter");
		chunk("ctfind");
//		chunk("bodytest");
		
		if(n)
		{
			return chunk(n);
		}
	}
 
	ctrack.div.main.html( ctrack.htmlall("bodytest") );
 
	ctrack.fetch_near=function(args)
	{
		args=args || {};
		
		args.limit=args.limit || 5;
		args.country="bd";//args.country || "np";		
		args.callback=args.callback || function(data){
			
			console.log("fetch endingsoon NP ");
			console.log(data);
			
			var s=[];
			for(i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				v.num=i+1;
				v.date=ctrack.get_nday(v.day_end);
				v.country="Nepal"
				v.activity=v.aid;
				s.push( ctrack.plate.chunk("ctneartable_data",v) );
			}

			ctrack.htmlchunk("ctneartable_datas",s.join(""));

			ctrack.div.main.html( ctrack.htmlall("bodytest") );

		};
		
		ctrack.fetch_endingsoon(args);
	};

	ctrack.fetch_endingsoon({limit:5});
	ctrack.fetch_finished({limit:5});
	ctrack.fetch_planned({limit:5});
	ctrack.fetch_near({limit:5});
	ctrack.fetch_stats({});

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
							ctrack.div.main.html( ctrack.htmlall("bodytest") );
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

