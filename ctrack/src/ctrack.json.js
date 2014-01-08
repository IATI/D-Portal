

http://wet.hopto.org:5000/api/1/access/activity.db.json?limit=5&recipient-country=BD&end-date__sort=asc&end-date__gt=2014-01-01

ctrack.fetch_endingsoon=function(args)
{
	args=args || {};
	var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    
   	var api="/api/1/access/activity.db.json";	
	var dat={
			"limit":args.limit || 5,
			"end-date__sort":"asc",
			"end-date__gt":today,
			"recipient-country":ctrack.args.country
		};
	
	var callback=function(data){
		
//		ctrack.div.main.html( ctrack.plate.chunk("preparing",{})  );

		console.log(today);
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

			v.amount=v["end-actual"];

			s.push( ctrack.plate.chunk("ctbox1table_data",v) );
		}
		ctrack.htmlchunk("ctbox1table_datas",s.join(""));
		ctrack.htmlchunk("ctbox1table");
		ctrack.htmlchunk("bodytest");
		
		ctrack.div.main.html( ctrack.htmldata.bodytest );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}

ctrack.fetch_test=function(args)
{
	var api="/api/1/access/activity";//.json";	
	var dat={
			"recipient-country":ctrack.args.country
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

