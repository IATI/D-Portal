

var ctrack=ctrack || exports;

ctrack.get_today=function()
{
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    return today;
}

ctrack.get_nday=function(n)
{
	var now = new Date(n*1000*60*60*24);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var nday = now.getFullYear() + "-" + (month) + "-" + (day);
    return nday;
}

ctrack.fetch_endingsoon=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var dat={
			"from":"activities,recipient_country",
			"limit":args.limit || 5,
			"orderby":"day_end",
			"status_code":"2",
			"day_end_gt":today,
			"recipient_country_code":(args.country || ctrack.args.country)
		};
	
	var callback=args.callback || function(data){
		
//		ctrack.div.main.html( ctrack.plate.chunk("preparing",{})  );

		console.log("fetch endingsoon : "+today);
		console.log(data);
		
		var s=[];
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			v.num=i+1;
			
/*
			var tot=0;
			for(n=0;n<v.budgets.length;n++)
			{
				tot+=Number(v.budgets[n].value.amount);
			}
			v.amount=tot;
*/

			v.date=ctrack.get_nday(v.day_end);

			v.activity=v.aid;

			s.push( ctrack.plate.chunk("ctbox1table_data",v) );
		}

//		ctrack.htmlchunk("active_projects",data["total-count"]);
		ctrack.htmlchunk("ctbox1table_datas",s.join(""));

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + "/q?callback=?",
	  data: dat,
	  success: callback
	});

}

ctrack.fetch_finished=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var dat={
			"from":"activities,recipient_country",
			"limit":args.limit || 5,
			"orderby":"day_end-",
			"status_code":"3|4",
			"day_end_lt":today,
			"recipient_country_code":(args.country || ctrack.args.country)
		};
	
	var callback=args.callback || function(data){

		console.log("fetch finshed : "+today);
		console.log(data);
		
		var s=[];
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			v.num=i+1;

			v.date=ctrack.get_nday(v.day_end);

			v.activity=v.aid;

			s.push( ctrack.plate.chunk("ctbox2table_data",v) );
		}

//		ctrack.htmlchunk("finished_projects",data["total-count"]);
		ctrack.htmlchunk("ctbox2table_datas",s.join(""));

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + "/q?callback=?",
	  data: dat,
	  success: callback
	});

}


ctrack.fetch_planned=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var dat={
			"from":"activities,recipient_country",
			"limit":args.limit || 5,
			"orderby":"day_start",
			"status_code":1,
			"day_start_gt":today,
			"recipient_country_code":(args.country || ctrack.args.country)
		};
	
	var callback=args.callback || function(data){

		console.log("fetch planned : "+today);
		console.log(data);
		
		var s=[];
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			v.num=i+1;

			v.date=ctrack.get_nday(v.day_start);
			
			v.activity=v.aid;

			s.push( ctrack.plate.chunk("ctbox3table_data",v) );
		}

//		ctrack.htmlchunk("planned_projects",data["total-count"]);
		ctrack.htmlchunk("ctbox3table_datas",s.join(""));

		ctrack.div.main.html( ctrack.htmlall("bodytest") );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + "/q?callback=?",
	  data: dat,
	  success: callback
	});

}

ctrack.fetch_stats=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var f1=function(){
		var dat={
				"from":"activities,recipient_country",
				"select":"stats",
				"recipient_country_code":(args.country || ctrack.args.country)
			};
		
		var callback=args.callback || function(data){

			console.log("activity stats1");
			console.log(data);
			
			ctrack.htmlchunk("total_projects",data.rows[0]["COUNT(*)"]);
			ctrack.htmlchunk("numof_publishers",data.rows[0]["COUNT(DISTINCT reporting_org)"]);

			ctrack.div.main.html( ctrack.htmlall("bodytest") );

		};
			
		$.ajax({
		  dataType: "json",
		  url: ctrack.args.datastore + "/q?callback=?",
		  data: dat,
		  success: callback
		});
	};

	f1();

	var f2=function(){
		var dat={
				"from":"activities,recipient_country",
				"select":"stats",
				"groupby":"status_code",
				"recipient_country_code":(args.country || ctrack.args.country)
			};
		
		var callback=args.callback || function(data){

			console.log("activity stats2");
			console.log(data);
				
			var counts={};
			for(i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				
				var code=v["MAX(status_code)"];
				var count=v["COUNT(*)"];
				
				counts[code]=count;
			}
			
			ctrack.htmlchunk("active_projects",counts[2]||0);
			ctrack.htmlchunk("finished_projects",(counts[3]||0)+(counts[4]||0));
			ctrack.htmlchunk("planned_projects",counts[1]||0);

//			ctrack.div.main.html( ctrack.htmlall("bodytest") );

		};
			
		$.ajax({
		  dataType: "json",
		  url: ctrack.args.datastore + "/q?callback=?",
		  data: dat,
		  success: callback
		});
	};
	
	f2();

}


ctrack.fetch_activity=function(args)
{
	return;

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

