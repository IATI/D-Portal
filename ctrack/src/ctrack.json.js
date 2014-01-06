


ctrack.iatidata={};
ctrack.iatidata.totext=function(v)
{
	if     ( typeof v == "string") { return v; }
	else if( typeof v == "object") { return ctrack.iatidata.totext( v.text ); } // text turns up in type? sometimes?
	return "";
}

ctrack.iatidata.fill=function(vi,vo,ss)
{
	for(var i=0;i<ss.length;i++)
	{
		vo[ ss[i] ] = ctrack.iatidata.totext ( vi[ ss[i] ] );
	}
}


ctrack.fetch=function(args)
{
	var api="/api/1/access/activity";//.json";	
	var dat={
			"recipient-country":ctrack.args.country
		};
	
	var callback=function(data){
		
		console.log(data);
		
		var a=data["iati-activities"];
		var d=[];
		for(var i=0;i<a.length;i++)
		{
			var v=a[i]["iati-activity"];
			var t={};
			
			t.num=i;
			ctrack.iatidata.fill(v,t,["description"]);

			d.push(t);
		}
		
		ctrack.div.main.html( ctrack.plate.chunk_array("dump_act",d)  );

	};
		
	$.ajax({
	  dataType: "json",
	  url: ctrack.args.datastore + api + "?callback=?",
	  data: dat,
	  success: callback
	});

}

