// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var fetch=exports;

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")

var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")


var refry=require("../../dstore/js/refry.js")
//var iati_xml=require("../../dstore/js/iati_xml.js")

//var fetch=require("./fetch.js")



fetch.get_today=function()
{
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    return today;
}

fetch.get_nday=function(n)
{
	var now = new Date(n*1000*60*60*24);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var nday = now.getFullYear() + "-" + (month) + "-" + (day);
    return nday;
}

fetch.ajax=function(dat,callback)
{
// we may queue a bunch of requests, this makes us wait for the last one before updating the view
	ctrack.display_wait+=1;
	
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.q + "?callback=?",
	  data: dat,
	  success: callback
	});
}

fetch.endingsoon=function(args)
{
	args=args || {};
	
	var today=fetch.get_today();
    
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
			v.title=v.title || v.aid;
			v.date=fetch.get_nday(v.day_end);

			v.activity=v.aid;

			s.push( plate.replace("{ctbox1table_data}",v) );
		}

//		ctrack.chunk("active_projects",data["total-count"]);
		ctrack.chunk("ctbox1table_datas",s.join(""));

		ctrack.display();

	};
	
	fetch.ajax(dat,callback);
}

fetch.finished=function(args)
{
	args=args || {};
	
	var today=fetch.get_today();
    
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

			v.title=v.title || v.aid;
			v.date=fetch.get_nday(v.day_end);

			v.activity=v.aid;

			s.push( plate.replace("{ctbox2table_data}",v) );
		}

//		ctrack.chunk("finished_projects",data["total-count"]);
		ctrack.chunk("ctbox2table_datas",s.join(""));

		ctrack.display();

	};

	fetch.ajax(dat,callback);
}


fetch.planned=function(args)
{
	args=args || {};
	
	var today=fetch.get_today();
    
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

			v.title=v.title || v.aid;
			v.date=fetch.get_nday(v.day_start);
			
			v.activity=v.aid;

			s.push( plate.replace("{ctbox3table_data}",v) );
		}

//		ctrack.chunk("planned_projects",data["total-count"]);
		ctrack.chunk("ctbox3table_datas",s.join(""));

		ctrack.display();

	};
	
	fetch.ajax(dat,callback);
}

fetch.stats=function(args)
{
	args=args || {};
	
	var today=fetch.get_today();
    
	var f1=function(){
		var dat={
				"from":"activities,country",
				"select":"stats",
				"country_code":(args.country || ctrack.args.country)
			};
		
		var callback=args.callback || function(data){

			console.log("activity stats1");
			console.log(data);
			
			ctrack.chunk("total_projects",data.rows[0]["COUNT(*)"]);
			ctrack.chunk("numof_publishers",data.rows[0]["COUNT(DISTINCT reporting_org)"]);

			ctrack.display();

		};
	
		fetch.ajax(dat,callback);
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
			
			ctrack.chunk("active_projects",counts[2]||0);
			ctrack.chunk("finished_projects",(counts[3]||0)+(counts[4]||0));
			ctrack.chunk("planned_projects",counts[1]||0);

console.log(ctrack.chunks);
			

		ctrack.display();

		};
	
		fetch.ajax(dat,callback);
	};
	
	f2();


	
	var f3=function(){
		var today=fetch.get_today();
//		var tonum=iati_xml.isodate_to_number(today);
		var tonum=(new Date()).getTime()/(1000*60*60*24);

		
		var dat={
				"from":"activities,country",
				"limit":-1,
				"day_end_gteq":today,
				"day_end_lt":tonum+32,
				"country_code":(args.country || ctrack.args.country)
			};
		
		var callback=args.callback || function(data){
			
			console.log("fetch endingsoon : "+today);
			console.log(data);		
			ctrack.chunk("ending_soon",data.rows.length);

			ctrack.display();

		};

		fetch.ajax(dat,callback);
	}
	f3();

	var f4=function(){
		var today=fetch.get_today();
//		var tonum=iati_xml.isodate_to_number(today);
		var tonum=(new Date()).getTime()/(1000*60*60*24);

		
		var dat={
				"from":"activities,country",
				"limit":-1,
				"day_start_gteq":today,
				"day_start_lt":tonum+32,
				"country_code":(args.country || ctrack.args.country)
			};
		
		var callback=args.callback || function(data){
			
			console.log("fetch startingsoon : "+today);
			console.log(data);		
			ctrack.chunk("starting_soon",data.rows.length);

			ctrack.display();

		};

		fetch.ajax(dat,callback);
	}
	f4();

}


fetch.activity=function(args)
{

	var dat={
			"aid":args.activity,
			"select":"jml"
		};
	
	var callback=args.callback || function(data){
		
		ctrack.div.master.html( plate.replace("{preparing}")  );

		console.log(data);
		
//		var acts=ctrack.iati.clean_activities( data["rows"] );
//console.log(acts);

		if(data["rows"][0])
		{
			ctrack.chunk("xml", refry.json( data["rows"][0].jml ) );
		}
		else
		{
			ctrack.chunk("xml","{missing_data}");
		}
		console.log("showing activity");
		ctrack.display();
		
	};
		
	fetch.ajax(dat,callback);

}

fetch.heatmap=function(args)
{
	args=args || {};
	
//	args.limit=args.limit || 5;
//	args.country="bd";//args.country || "np";		

	var dat={
			"select":"count,round1_longitude,round1_latitude",
			"from":"activities,country,location",
			"limit":args.limit || 5,
			"orderby":"1-",
			"groupby":"2,3",
			"country_code":(args.country || ctrack.args.country)
		};

	var callback=args.callback || function(data){
		
		console.log("fetch heatmap ");
		console.log(data);
		
		ctrack.map.heat=undefined;
		var donemain=false;
		for(i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			if( ("number"== typeof v.round1_longitude) && ("number"== typeof v.round1_latitude) )
			{
				if(!donemain)
				{
					ctrack.map.heat=[];
					donemain=true;
					ctrack.map.lat=v.round1_latitude;
					ctrack.map.lng=v.round1_longitude;
				}
				ctrack.map.heat.push({
					lat:v.round1_latitude,
					lng:v.round1_longitude,
					wgt:v.count
				});
			}
		}

		ctrack.display();

	};
	
	fetch.ajax(dat,callback);
};

fetch.donor_transactions=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	var year=args.year || 2012;
	var funder=args.funder || "gb";

	var dat={
			"from":"transactions,country",
			"limit":args.limit || -1,
			"select":"sum_of_percent_of_usd,aid,funder,title",
			"funder_not_null":"",
			"funder":funder,
			"groupby":"aid",
			"orderby":"1-",
			"code":"D|E",
			"day_gteq":year+"-01-01","day_lt":(parseInt(year)+1)+"-01-01",
			"country_code":(args.country || ctrack.args.country)
		};
	var callback=function(data){
		console.log("fetch donor_transactions "+year);
		console.log(data);

		var total=0;
		var s=[];
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.funder=v.funder;
			d.aid=v.aid;
			d.title=v.title || v.aid;
			d.amount=commafy(""+Math.floor(v.sum_of_percent_of_usd));
			total+=v.sum_of_percent_of_usd;

			s.push( plate.replace("{donor_transactions_data}",d) );
		}
		
		ctrack.chunk("alerts","");
		if( iati_codes.crs_no_iati[funder] )
		{
			ctrack.chunk("alerts","{alert_no_iati}");
		}

		ctrack.chunk("donor",iati_codes.crs_funders[funder] || iati_codes.country[funder] || funder );
		ctrack.chunk("year",year);
		ctrack.chunk("total",commafy(""+Math.floor(total)));

		ctrack.chunk("donor_transactions_datas",s.join(""));
		ctrack.display();
	};
	fetch.ajax(dat,callback);
}

fetch.donor_budgets=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	var year=args.year || 2012;
	var funder=args.funder || "gb";

	var dat={
			"from":"budgets,country",
			"limit":args.limit || -1,
			"select":"sum_of_percent_of_usd,aid,funder,title",
			"funder_not_null":"",
			"funder":funder,
			"groupby":"aid",
			"orderby":"1-",
			"priority":1, // has passed some validation checks serverside
			"day_end_gteq":year+"-01-01","day_end_lt":(parseInt(year)+1)+"-01-01",
			"country_code":(args.country || ctrack.args.country)
		};
	var callback=function(data){
		console.log("fetch donor_budgets "+year);
		console.log(data);

		var total=0;
		var s=[];
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.funder=v.funder;
			d.aid=v.aid;
			d.title=v.title || v.aid;
			d.amount=commafy(""+Math.floor(v.sum_of_percent_of_usd));
			total+=v.sum_of_percent_of_usd;

			s.push( plate.replace("{donor_budgets_data}",d) );
		}

		ctrack.chunk("alerts","");
		if( iati_codes.crs_no_iati[funder] )
		{
			ctrack.chunk("alerts","{alert_no_iati}");
		}

		ctrack.chunk("donor",iati_codes.crs_funders[funder] || iati_codes.country[funder] || funder );
		ctrack.chunk("year",year);
		ctrack.chunk("total",commafy(""+Math.floor(total)));

		ctrack.chunk("donor_budgets_datas",s.join(""));
		ctrack.display();
	};
	fetch.ajax(dat,callback);
}

fetch.donor_activities=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	var funder=args.funder || "gb";

	var dat={
			"from":"activities,country",
			"limit":args.limit || -1,
			"select":"title,aid,funder,commitment,spend,reporting_org",
			"funder_not_null":"",
			"funder":funder,
			"status_code":"2",
			"groupby":"aid",
			"orderby":"commitment-",
			"country_code":(args.country || ctrack.args.country)
		};
	var callback=function(data){
		console.log("fetched donor_activities ");
		console.log(data);

		var s=[];
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.funder=v.funder;
			d.aid=v.aid;
			d.title=v.title || v.aid;

			d.reporting_org=v.reporting_org;
			d.commitment=commafy(""+Math.floor(v.commitment));
			d.spend=commafy(""+Math.floor(v.spend));
			d.pct=0;
			if(v.commitment && (v.commitment!=0) )
			{
				d.pct=Math.floor(100*v.spend/v.commitment)
				if(d.pct<0){d.pct=0;}
				if(d.pct>100){d.pct=100;}
			}

			s.push( plate.replace("{donor_activities_data}",d) );
		}

		ctrack.chunk("alerts","");
		if( iati_codes.crs_no_iati[funder] )
		{
			ctrack.chunk("alerts","{alert_no_iati}");
		}

		ctrack.chunk("donor",iati_codes.crs_funders[funder] || iati_codes.country[funder] || funder );

		ctrack.chunk("donor_activities_datas",s.join(""));
		ctrack.display();
	};
	fetch.ajax(dat,callback);
}

fetch.donors_top=function(args)
{
	args=args || {};
	var limit=args.limit || 5;

	var list=[];
// insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.usd=crs[n];
		list.push(d);
	}
	list.sort(function(a,b){
		return ( (b.usd||0)-(a.usd||0) );
	});

//	var total=0; list.forEach(function(it){total+=it.usd;});
	var top=list[0].usd;
	var s=[];
	for( var i=0; i<limit ; i++ )
	{
		var v=list[i];
		if(v)
		{
			v.pct=Math.floor(100*v.usd/top)
			v.donor=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			s.push( plate.replace("{chunkmoney_row}",v) );
		}
	}

	ctrack.chunk("chunkmoney_rows",s.join(""));
		ctrack.display();

}

fetch.donors=function(args)
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
		a.sort(function(a,b){
			if(b.order==a.order)
			{
				return ( (b.t2012||0) - (a.t2012||0) );
			}
			return ( (b.order||0)-(a.order||0) );
		});
		a.forEach(function(v){
			if(!v.crs){v.crs="0";}
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}

			if( iati_codes.crs_no_iati[v.funder] )
			{
				v.t2012="-";
				v.t2013="-";
				v.t2014="-";
				v.b2014="-";
				v.b2015="-";
			}

			v.donor=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			s.push( plate.replace("{table_donors_row}",v) );
		});
		ctrack.chunk("table_donors_rows",s.join(""));
		ctrack.display();
	};
	
	var fadd=function(d)
	{
		var it=ctrack.donors_data[d.funder];
		if(!it) { it={}; ctrack.donors_data[d.funder]=it; }
		
		for(var n in d)
		{
			if(d[n])
			{
				it[n]=d[n];
			}
		}
	}

// insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.crs=commafy(""+Math.floor(crs[n]));
		d.order=crs[n];
		fadd(d);
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
				fadd(d);
			}
			console.log(ctrack.donors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
	
	var years=[2014,2015];
	years.forEach(function(year)
	{
		var dat={
				"from":"budgets,country",
				"limit":args.limit || 100,
				"select":"funder,sum_of_percent_of_usd",
				"priority":1, // has passed some validation checks serverside
				"funder_not_null":"",
				"groupby":"funder",
				"day_end_gteq":year+"-01-01","day_end_lt":(parseInt(year)+1)+"-01-01",
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
		fetch.ajax(dat,callback);
	});
};



fetch.sectors=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	ctrack.sectors_data={};
	
	var display=function()
	{
		var s=[];
		var a=[];
		for(var n in ctrack.sectors_data) { a.push( ctrack.sectors_data[n] ); }
		a.sort(function(a,b){return (b.order-a.order)});
		a.forEach(function(v){
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}
			v.sector=v.group;
			s.push( plate.replace("{table_sectors_row}",v) );
		});
		ctrack.chunk("table_sectors_rows",s.join(""));
		ctrack.display();
	};
	
	var fadd=function(d)
	{
		var it=ctrack.sectors_data[d.group];
		if(!it) { it={}; ctrack.sectors_data[d.group]=it; }
		
		for(var n in d)
		{
			it[n]=d[n];
		}
	}

	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"transactions,country,sector",
				"limit":args.limit || 100,
				"select":"sector_group,sum_of_percent_of_usd",
				"groupby":"sector_group",
				"code":"D|E",
				"day_gteq":year+"-01-01","day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		var callback=function(data){
			console.log("fetch transactions sectors "+year);
			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.group=v.sector_group;
				d["t"+year]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				if(year==2012)
				{
					d.crs=commafy(""+Math.floor(v.sum_of_percent_of_usd));
					d.order=v.sum_of_percent_of_usd;
				}
				fadd(d);
			}
			console.log(ctrack.sectors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
	
	var years=[2014,2015];
	years.forEach(function(year)
	{
		var dat={
				"from":"budgets,country,sector",
				"limit":args.limit || 100,
				"select":"sector_group,sum_of_percent_of_usd",
				"groupby":"sector_group",
				"priority":1, // has passed some validation checks serverside
				"day_end_gteq":year+"-01-01","day_end_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		var callback=function(data){
			
			console.log("fetch budget sectors "+year);			
			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.group=v.sector_group;
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				fadd(d);
			}
			console.log(ctrack.sectors_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
};




fetch.districts=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	ctrack.districts_data={};
	
	var display=function()
	{
		var s=[];
		var a=[];
		for(var n in ctrack.districts_data) { a.push( ctrack.districts_data[n] ); }
		a.sort(function(a,b){return (b.order-a.order)});
		a.forEach(function(v){
			if(!v.t2012){v.t2012="0";}
			if(!v.t2013){v.t2013="0";}
			if(!v.t2014){v.t2014="0";}
			if(!v.b2014){v.b2014="0";}
			if(!v.b2015){v.b2015="0";}
			s.push( plate.replace("{table_districts_row}",v) );
		});
		ctrack.chunk("table_districts_rows",s.join(""));
		ctrack.display();
	};
	
	var fadd=function(d)
	{
		var it=ctrack.districts_data[d.location];
		if(!it) { it={}; ctrack.districts_data[d.location]=it; }
		
		for(var n in d)
		{
			it[n]=d[n];
		}
	}

	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"transactions,country,location",
				"limit":args.limit || 100,
				"select":"location_name,sum_of_percent_of_usd",
				"groupby":"location_name",
				"location_code":"adm2",
				"code":"D|E",
				"day_gteq":year+"-01-01","day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		var callback=function(data){
			console.log("fetch transactions districts "+year);
			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.location=v.location_name;
				d["t"+year]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				if(year==2012)
				{
					d.crs=commafy(""+Math.floor(v.sum_of_percent_of_usd));
					d.order=v.sum_of_percent_of_usd;
				}
				fadd(d);
			}
			console.log(ctrack.districts_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
	
	var years=[2014,2015];
	years.forEach(function(year)
	{
		var dat={
				"from":"budgets,country,location",
				"limit":args.limit || 100,
				"select":"location_name,sum_of_percent_of_usd",
				"groupby":"location_name",
				"priority":1, // has passed some validation checks serverside
				"location_code":"adm2",
				"day_end_gteq":year+"-01-01","day_end_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country)
			};
		var callback=function(data){
			
			console.log("fetch budget districts "+year);			
			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.location=v.location_name;
				d["b"+year]=commafy(""+Math.floor(v.sum_of_percent_of_usd));
				fadd(d);
			}
			console.log(ctrack.districts_data);
			
			display();
		};
		fetch.ajax(dat,callback);
	});
};
