// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// data cleanup

const iati={}
export default iati

iati.totext=function(v)
{
	if     ( typeof v == "string") { return v; }
	else if( typeof v == "object") { return iati.totext( v.text ); } // text turns up in type? sometimes?
	return "";
}

iati.fill_text=function(vi,vo,ss)
{
	for(var i=0;i<ss.length;i++)
	{
		vo[ ss[i] ] = iati.totext ( vi[ ss[i] ] );
	}
}

iati.array_status=[
	"Pipeline",
	"Implementation",
	"Completion",
	"Post",
	"Cancelled"];
iati.lookup_status=function(n)
{
	return iati.array_status[n] || "N/A";
}


iati.clean_activity=function(dirtyact)
{
	var act={};
	
	if( dirtyact["iati-activity"] ) { dirtyact=dirtyact["iati-activity"]; } // remove wrapping
	
	iati.fill_text(dirtyact,act,[
		"title",
		"description",
		"reporting-org"
		]);
		
	act["status-code"]=Number( dirtyact["activity-status"] && dirtyact["activity-status"].code || -1 ) ;
	act["status"]= iati.lookup_status( act["status-code"] );

	act["start-date"]=dirtyact["start-actual"] || dirtyact["start-planned"];
	act["end-date"]=dirtyact["end-actual"] || dirtyact["end-planned"];
	
	act.id=dirtyact["iati-identifier"];

	
	return act;
}

iati.clean_activities=function(dirtyacts)
{
	var acts=[];
	
	for(var i=0;i<dirtyacts.length;i++)
	{
		acts[i]=iati.clean_activity(dirtyacts[i]);
	}
	
	return acts;
}
