

ctrack.fetch=function(args)
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

