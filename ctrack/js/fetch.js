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

fetch.donor_activities=function(args)
{
	var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
			return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

	args=args || {};

	var funder=args.funder || "gb";

	var dat={
			"from":"act,country",
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
	ctrack.chunk("donor_activities_datas","{spinner}");
	fetch.ajax(dat,callback);
}

fetch.donors_top=function(args)
{


}

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
	ctrack.chunk("table_sectors_rows","{spinner}");
	
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
				"from":"trans,country,sector",
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
				"from":"budget,country,sector",
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
	ctrack.chunk("table_districts_rows","{spinner}");
	
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
				"from":"trans,country,location",
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
				"from":"budget,country,location",
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
