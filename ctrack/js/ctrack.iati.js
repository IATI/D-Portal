// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// data cleanup


var ctrack=ctrack || exports;

ctrack.iati={};
ctrack.iati.totext=function(v)
{
	if     ( typeof v == "string") { return v; }
	else if( typeof v == "object") { return ctrack.iati.totext( v.text ); } // text turns up in type? sometimes?
	return "";
}

ctrack.iati.fill_text=function(vi,vo,ss)
{
	for(var i=0;i<ss.length;i++)
	{
		vo[ ss[i] ] = ctrack.iati.totext ( vi[ ss[i] ] );
	}
}

ctrack.iati.array_status=[
	"Pipeline",
	"Implementation",
	"Completion",
	"Post",
	"Cancelled"];
ctrack.iati.lookup_status=function(n)
{
	return ctrack.iati.array_status[n] || "N/A";
}


ctrack.iati.clean_activity=function(dirtyact)
{
	var act={};
	
	if( dirtyact["iati-activity"] ) { dirtyact=dirtyact["iati-activity"]; } // remove wrapping
	
	ctrack.iati.fill_text(dirtyact,act,[
		"title",
		"description",
		"reporting-org"
		]);
		
	act["status-code"]=Number( dirtyact["activity-status"] && dirtyact["activity-status"].code || -1 ) ;
	act["status"]= ctrack.iati.lookup_status( act["status-code"] );

	act["start-date"]=dirtyact["start-actual"] || dirtyact["start-planned"];
	act["end-date"]=dirtyact["end-actual"] || dirtyact["end-planned"];
	
	act.id=dirtyact["iati-identifier"];

	
	return act;
}

ctrack.iati.clean_activities=function(dirtyacts)
{
	var acts=[];
	
	for(var i=0;i<dirtyacts.length;i++)
	{
		acts[i]=ctrack.iati.clean_activity(dirtyacts[i]);
	}
	
	return acts;
}
