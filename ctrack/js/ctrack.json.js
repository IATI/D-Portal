// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


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

ctrack.fetch=function(dat,callback)
{
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.dstore + "/q?callback=?",
	  data: dat,
	  success: callback
	});
}

ctrack.fetch_endingsoon=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var dat={
			"from":"activities,country",
			"limit":args.limit || 5,
			"orderby":"day_end",
			"status_code":"2",
//			"day_end_gt":today,
			"day_end_gt":0, // ignore missing end dates
			"country_code":(args.country || ctrack.args.country)
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

		ctrack.update_hash({"view":"main"});

	};
	
	ctrack.fetch(dat,callback);
}

ctrack.fetch_finished=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var dat={
			"from":"activities,country",
			"limit":args.limit || 5,
			"orderby":"day_end-",
			"status_code":"3|4",
//			"day_end_lt":today,
			"country_code":(args.country || ctrack.args.country)
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

		ctrack.update_hash({"view":"main"});

	};

	ctrack.fetch(dat,callback);
}


ctrack.fetch_planned=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var dat={
			"from":"activities,country",
			"limit":args.limit || 5,
			"orderby":"day_start",
			"status_code":1,
//			"day_start_gt":today,
			"country_code":(args.country || ctrack.args.country)
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

		ctrack.update_hash({"view":"main"});

	};
	
	ctrack.fetch(dat,callback);
}

ctrack.fetch_stats=function(args)
{
	args=args || {};
	
	var today=ctrack.get_today();
    
	var f1=function(){
		var dat={
				"from":"activities,country",
				"select":"stats",
				"country_code":(args.country || ctrack.args.country)
			};
		
		var callback=args.callback || function(data){

			console.log("activity stats1");
			console.log(data);
			
			ctrack.htmlchunk("total_projects",data.rows[0]["COUNT(*)"]);
			ctrack.htmlchunk("numof_publishers",data.rows[0]["COUNT(DISTINCT reporting_org)"]);

			ctrack.update_hash({"view":"main"});

		};
	
		ctrack.fetch(dat,callback);
	};

	f1();

	var f2=function(){
		var dat={
				"from":"activities,country",
				"select":"stats",
				"groupby":"status_code",
				"country_code":(args.country || ctrack.args.country)
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

			ctrack.update_hash({"view":"main"});

		};
	
		ctrack.fetch(dat,callback);
	};
	
	f2();

}


ctrack.fetch_activity=function(args)
{

	var dat={
			"aid":args.activity,
			"select":"xml"
		};
	
	var callback=args.callback || function(data){
		
		ctrack.div.main.html( ctrack.plate.chunk("preparing",{})  );

		console.log(data);
		
//		var acts=ctrack.iati.clean_activities( data["rows"] );
//console.log(acts);

//		ctrack.div.main.html( ctrack.plate.chunk("dump_act_xml",data["rows"][0]) );

		ctrack.htmlchunk("xml",data["rows"][0].xml);
		ctrack.update_hash({"view":"act"});
		
	};
		
	ctrack.fetch(dat,callback);

}

ctrack.fetch_near=function(args)
{
	args=args || {};
	
//	args.limit=args.limit || 5;
//	args.country="bd";//args.country || "np";		

	var dat={
			"from":"activities,country",
			"limit":args.limit || 5,
			"orderby":"day_end",
			"status_code":"2",
//			"day_end_gt":today,
			"day_end_gt":0, // ignore missing end dates
			"country_code_nteq":(args.country || ctrack.args.country)
		};

	var callback=args.callback || function(data){
		
		console.log("fetch endingsoon ");
		console.log(data);
		
		var s=[];
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			v.num=i+1;
			v.date=ctrack.get_nday(v.day_end);
			v.country=ctrack.codes.country[v.country_code];
			v.activity=v.aid;
			s.push( ctrack.plate.chunk("ctneartable_data",v) );
		}

		ctrack.htmlchunk("ctneartable_datas",s.join(""));

		ctrack.update_hash({"view":"main"});

	};
	
	ctrack.fetch(dat,callback);
};

ctrack.donors_data=[];
ctrack.fetch_donors=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	ctrack.donors_data={};
	
	var display=function()
	{
		var s=[];
		var a=[];
		for(var n in ctrack.donors_data) { a.push( ctrack.donors_data[n] ); }
		a.sort(function(a,b){return (b.order-a.order)});
		a.forEach(function(v){
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}
			v.donor=ctrack.codes.country[v.funder] || v.funder;
			s.push( ctrack.plate.chunk("table_donors_row",v) );
		});
		ctrack.htmlchunk("table_donors_rows",s.join(""));
		ctrack.update_hash({"view":"donors"});
	};
	
	var fadd=function(d)
	{
		var it=ctrack.donors_data[d.funder];
		if(!it) { it={}; ctrack.donors_data[d.funder]=it; }
		
		for(var n in d)
		{
			it[n]=d[n];
		}
	}

	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"transactions,country",
				"limit":args.limit || 100,
				"select":"funder,sum_of_percent_of_usd",
				"funder_not_null":"",
				"groupby":"funder",
				"orderby":"funder",
				"code":"D|E",
				"day_gteq":year+"-01-01","day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		var callback=function(data){
			console.log("fetch transactions donors "+year);
			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.funder=v.funder;
				d["t"+year]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				if(year==2012)
				{
					d.crs=commafy(""+Math.floor(v.sum_of_percent_of_usd));
					d.order=v.sum_of_percent_of_usd;
				}
				fadd(d);
			}
			console.log(ctrack.donors_data);
			
			display();
		};
		ctrack.fetch(dat,callback);
	});
	
	var years=[2014,2015];
	years.forEach(function(year)
	{
		var dat={
				"from":"budgets,country",
				"limit":args.limit || 100,
				"select":"funder,sum_of_percent_of_usd",
				"funder_not_null":"",
				"groupby":"funder",
				"orderby":"funder",
				"day_end_gteq":year+"-01-01","day_end_lt":(parseInt(year)+1)+"-01-01","day_length_lt":370,
				"country_code":(args.country || ctrack.args.country)
			};
		var callback=function(data){
			
			console.log("fetch budget donors "+year);			
			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.funder=v.funder;
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				fadd(d);
			}
			console.log(ctrack.donors_data);
			
			display();
		};
		ctrack.fetch(dat,callback);
	});
};
