

http://wet.hopto.org:5000/api/1/access/activity.db.json?limit=5&recipient-country=BD&end-date__sort=asc&end-date__gt=2014-01-01

ctrack.get_today=function()
{
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
//    return today;
    return "2013-01-01"
}

ctrack.fetch_endingsoon=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
   	var api="/api/1/access/activity.db.json";	
	var dat={
			"limit":args.limit || 5,
			"end-date__sort":"asc",
			"end-date__gt":today,
			"recipient-country":args.country || ctrack.args.country
		};
	
	var callback=args.callback || function(data){
		
//		ctrack.div.main.html( ctrack.plate.chunk("preparing",{})  );

		console.log("fetch endingsoon : "+today);
		console.log(data);
		
		var s=[];
		for(i=0;i<data["iati-activities"].length;i++)
		{
			var v=data["iati-activities"][i];
			v.num=i+1;
			
/*
			var tot=0;
			for(n=0;n<v.budgets.length;n++)
			{
				tot+=Number(v.budgets[n].value.amount);
			}
			v.amount=tot;
*/

			v.date=v["end-actual"] || v["end-planned"];

			v.activity=v["iati-identifier"];

			s.push( ctrack.plate.chunk("ctbox1table_data",v) );
		}

		ctrack.htmlchunk("active_projects",data["total-count"]);
		ctrack.htmlchunk("ctbox1table_datas",s.join(""));

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}

ctrack.fetch_finished=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
   	var api="/api/1/access/activity.db.json";	
	var dat={
			"limit":args.limit || 5,
			"end-date__sort":"desc",
			"end-date__lt":today,
			"recipient-country":args.country || ctrack.args.country
		};
	
	var callback=args.callback || function(data){

		console.log("fetch finshed : "+today);
		console.log(data);
		
		var s=[];
		for(i=0;i<data["iati-activities"].length;i++)
		{
			var v=data["iati-activities"][i];
			v.num=i+1;

			v.date=v["end-actual"] || v["end-planned"];

			v.activity=v["iati-identifier"];

			s.push( ctrack.plate.chunk("ctbox2table_data",v) );
		}

		ctrack.htmlchunk("finished_projects",data["total-count"]);
		ctrack.htmlchunk("ctbox2table_datas",s.join(""));

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}


ctrack.fetch_planned=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
   	var api="/api/1/access/activity.db.json";	
	var dat={
			"limit":args.limit || 5,
			"start-date__sort":"asc",
			"start-date__gt":today,
			"recipient-country":args.country || ctrack.args.country
		};
	
	var callback=args.callback || function(data){

		console.log("fetch planned : "+today);
		console.log(data);
		
		var s=[];
		for(i=0;i<data["iati-activities"].length;i++)
		{
			var v=data["iati-activities"][i];
			v.num=i+1;

			v.date=v["start-actual"] || v["start-planned"];
			
			v.activity=v["iati-identifier"];

			s.push( ctrack.plate.chunk("ctbox3table_data",v) );
		}

		ctrack.htmlchunk("planned_projects",data["total-count"]);
		ctrack.htmlchunk("ctbox3table_datas",s.join(""));

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}

ctrack.fetch_stats=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
   	var api="/api/1/access/activity.stats.json";	
	var dat={
			"limit":10000,
			"recipient-country":args.country || ctrack.args.country
		};
	
	var callback=args.callback || function(data){

		console.log("activity stats");
		console.log(data);
		
		ctrack.htmlchunk("numof_publishers",data["counts"]["reporting_org_id"]);

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}


ctrack.fetch_activity=function(args)
{
	var api="/api/1/access/activity.db.json";	
	var dat={
			"iati-identifier":args.activity
		};
	
	var callback=function(data){
		
		ctrack.div.main.html( ctrack.plate.chunk("preparing",{})  );

		console.log(data);
		
		var acts=ctrack.iati.clean_activities( data["iati-activities"] );
console.log(acts);
		ctrack.div.main.html( ctrack.plate.chunks("dump_act",acts)  );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}

