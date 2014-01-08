

ctrack.setup_html=function()
{

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
	
	ctrack.htmlchunk("today",ctrack.get_today());

	ctrack.htmlall=function(n)
	{
		ctrack.htmlchunk("total_projects",d["active_projects"]+d["finished_projects"]+d["planned_projects"]);

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
 
	ctrack.fetch_endingsoon({limit:5});
	ctrack.fetch_finished({limit:5});
	ctrack.fetch_planned({limit:5});

	ctrack.fetch_endingsoon({limit:5,country:"np",callback:function(data){
			
			console.log("fetch endingsoon NP ");
			console.log(data);
			
			var s=[];
			for(i=0;i<data["iati-activities"].length;i++)
			{
				var v=data["iati-activities"][i];
				v.num=i+1;
				v.date=v["end-actual"] || v["end-planned"];
				v.country="Nepal"

				s.push( ctrack.plate.chunk("ctneartable_data",v) );
			}

			ctrack.htmlchunk("ctneartable_datas",s.join(""));

			ctrack.div.main.html( ctrack.htmlall("bodytest") );

		}});


//this one takes a loooooooong time...
//	ctrack.fetch_stats({});

}

