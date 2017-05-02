// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var iati_cook=exports;

var util=require('util');

var codes=require('../json/iati_codes');

var iati_xml=require('./iati_xml');
var refry=require('./refry');
var exs=require('./exs');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


















// !!! ALL THIS CODE IS NOW DISABLED !!!























// cook the data inside this activity
// make sure that all default values are copied into the places they should be applied
// some values are also unified if it makes sense, eg planed/actual dates are diplicated to the other if only one exists
// and end dates are added if only a start date is given
// some blank tags are added so you can be sure that a given tag always exists in each activity
// some codes are expanded into text in the tag contents
// finally sort the tag order for easy display by CSS
//
// After being cooked this activity is then easier to deal with than a raw one
iati_cook.activity=function(act)
{
	var activity_date={};
	refry.tags(act,"activity-date",function(it){
		activity_date[it.type]=it;
		var d=iati_xml.get_isodate(it,"activity-date"); // sometimes iso-date is missing, use content if a valid format?
		if( ( typeof d === 'string' ) && (null!==iati_xml.isodate_to_number(d))  ) // might not be a string (child tags?)
		{
			it["iso-date"]=d.trim();
		}
		else
		{
			delete it["iso-date"];
		}
	});
//ls(activity_date);

// convert any 201 codes to old style...
	if(activity_date["1"]) { activity_date["1"].type="start-planned"; activity_date["start-planned"]=activity_date["1"]; }
	if(activity_date["2"]) { activity_date["2"].type="start-actual";  activity_date["start-actual"] =activity_date["2"]; }
	if(activity_date["3"]) { activity_date["3"].type="end-planned";   activity_date["end-planned"]  =activity_date["3"]; }
	if(activity_date["4"]) { activity_date["4"].type="end-actual";    activity_date["end-actual"]   =activity_date["4"]; }
	
// if we have any actifity dates, then force a start-actual to something
	if( ! activity_date["start-actual"] || !activity_date["start-actual"]["iso-date"])
	{
		var d=undefined; // avoid scope bug
		var t=undefined;
//		t=activity_date["end-planned"]; 	if( t && t["iso-date"] ) { d=t["iso-date"]; }
//		t=activity_date["end-actual"]; 		if( t && t["iso-date"] ) { d=t["iso-date"]; }
		t=activity_date["start-planned"]; 	if( t && t["iso-date"] ) { d=t["iso-date"]; }
		if(d)
		{
			if(activity_date["start-actual"])
			{
				activity_date["start-actual"]["iso-date"]=d;
			}
			else
			{
				act[1].push({0:"activity-date","type":"start-actual","iso-date":d});
			}
//			ls("INSERT start-actual");
//			ls(act[1]);
		}
	}

// if we have any activity dates, then force an end-actual to something
	if( ! activity_date["end-actual"] || !activity_date["end-actual"]["iso-date"] )
	{
		var d=undefined; // fix scope bug
		var t=undefined;
//		t=activity_date["start-planned"]; 	if( t && t["iso-date"] ) { d=t["iso-date"]; }
//		t=activity_date["start-actual"]; 	if( t && t["iso-date"] ) { d=t["iso-date"]; }
		t=activity_date["end-planned"]; 	if( t && t["iso-date"] ) { d=t["iso-date"]; }
		if(d)
		{
			if(activity_date["end-actual"])
			{
				activity_date["end-actual"]["iso-date"]=d;
			}
			else
			{
				act[1].push({0:"activity-date","type":"end-actual","iso-date":d});
			}
//			ls("INSERT end-actual");
		}
	}

// check the start/end date against today to see if project is planned,active or finished
// then force code into the activity status which is often wrong...
	var activity_date={};
	refry.tags(act,"activity-date",function(it){
		activity_date[it.type]=it
	});
	
	var status_code;

	var date_start=activity_date["start-actual"] && activity_date["start-actual"]["iso-date"];
	var date_end=activity_date["end-actual"] && activity_date["end-actual"]["iso-date"];

	var today=Math.floor( Date.now() / ( 24*60*60*1000 ) );
	if(date_start)
	{
		var day=iati_xml.isodate_to_number(date_start);
		if( day > today )
		{
			status_code=1; // not started yet
		}
		else
		{
			status_code=2; // active
			if(date_end)
			{
				var day=iati_xml.isodate_to_number(date_end);
				if( day < today )
				{
					status_code=3; // finished
				}
			}
		}
	}
	else // no startdate just check end date
	{
			if(date_end)
			{
				var day=iati_xml.isodate_to_number(date_end);
				if( day < today )
				{
					status_code=3; // finished
				}
			}
	}

	refry.tags(act,"activity-status",function(it){
		if( status_code && (it.code!=5) ) // if not canceled or missing
		{
			it.code=status_code // then replace code with what we worked out above
			it[1]=[ codes.activity_status[it.code] ];
		}
	});


// from now on we can ignore start-planned and end-planned and just use start-actual end-actual
// if you care about this then go back to the original XML data...

/*

	var activity_date={};
	refry.tags(act,"activity-date",function(it){
		activity_date[it.type]=it
	});
	if( activity_date["start-actual"] && activity_date["end-actual"] )
	{
		if( activity_date["start-actual"]["iso-date"] && activity_date["end-actual"]["iso-date"] )
		{
		}
		else
		{
			ls(activity_date);
		}
	}
	else
	{
		ls(activity_date);
	}

*/

// force a currency attr on all values
	refry.tags(act,"value",function(it){
		it.currency = ( it.currency || act["default-currency"] || "USD" ).toUpperCase() ;
	});

// force a vocabulary of DAC on all sectors with no vocabulary
	refry.tags(act,"sector",function(it){
		it.vocabulary = ( it.vocabulary || "DAC" ).toUpperCase() ;
	});



//


	refry.tags(act,"transaction",function(it){iati_cook.transaction(act,it);});
	refry.tags(act,"budget",function(it){iati_cook.budget(act,it);});
	refry.tags(act,"planned-disbursement",function(it){iati_cook.budget(act,it);});
}

iati_cook.transaction=function(act,it)
{
// the following fixes the transaction-date to use value-date if transaction-date is missing
	var isodate;
	refry.tags(it,"transaction-date",function(it){
		isodate=it["iso-date"];
	});
	if(!isodate) // there is no transaction-date
	{
		refry.tags(it,"value",function(it){
			isodate=it["value-date"]
		});
		if(isodate) // we found a value date we can use
		{
			refry.tags(it,"transaction-date",function(it){ // first try to update a pre existing transaction date
				it["iso-date"]=isodate;
				isodate=false;
			});
			if(isodate) // update failed
			{
				it[1].push({0:"transaction-date","iso-date":isodate}); // so insert a transaction date using this value
			}
		}
	}
}

// this function also cooks planned-disbursement as they seem to be the same
iati_cook.budget=function(act,it)
{
}

// disable all cooking of XML, this was a bad idea in the beginning and is now removed.

iati_cook.activity=function(act){};
iati_cook.transaction=function(act,it){};
iati_cook.budget=function(act,it){};


