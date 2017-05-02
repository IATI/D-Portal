// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var iati_xml=exports;

var util=require('util');

var refry=require('./refry');
var exs=require('./exs');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var tonumber=function(v)
{
	var n=Number(v);
	if(("number" == typeof n)&&(n==n)) // number and not nan
	{
		return n;
	}
	return undefined;
}


// convert isodate string to a number (days since 1970-01-01)
// can convert to unix time by multiplying by number of seconds in a day (60*60*24)
iati_xml.isodate_to_number=function(s)
{
	if(typeof s === "string")
	{
		s=s.trim();
		var sb=/([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(s);
		if( sb && sb.length==4 ) // valid date string
		{
			var year=parseInt(sb[1]);
			var month=parseInt(sb[2])-1;
			var day=parseInt(sb[3]);
			var r=Date.UTC(year,month,day)/(1000*60*60*24);
			
			return r;
		}
//		ls({faildate:s})
		
		return null;
	}
}

iati_xml.get_isodate=function(it,name)
{
	var t=it;
	if(name) t=refry.tag(t,name);
	if(t){
		if(t["iso-date"]){t=t["iso-date"]; return t;}
		if(t[1] && t[1][0]) return t[1][0]; // failed to provide an isodate, use the value?
	}
	return null;
};
iati_xml.get_isodate_number=function(it,name)
{
	var t=iati_xml.get_isodate(it,name);
	if(t){
		return iati_xml.isodate_to_number(t);
	}
	return null;
}
iati_xml.get_isodate_year=function(it,name)
{
	var t=iati_xml.get_isodate(it,name); // parseint will get the first number and ignore the -
	if(t){
		return parseInt(t);
	}
	return null;
}

iati_xml.get_value=function(it,name)
{
	var t=refry.tagval(it,name);
	if(t){
		t=t.split(",").join(""); // should we remove commas?
		return tonumber(t);
	}
	return null;
}

iati_xml.get_value_year=function(it,name)
{
	var t=it;
	if(name) t=refry.tag(t,name);
	if(t){
		if(t["value-date"]){
			return parseInt(t["value-date"]); // parseint will get the first number and ignore the -
		}
	}
	return null;
}

iati_xml.get_value_yearmonth=function(it,name)
{
	var t=it;
	if(name) t=refry.tag(t,name);
	if(t){
		if(t["value-date"]){
			var s=t["value-date"].trim();
			s=s.replace("-","");
			s=s.substring(0,6);
			return parseInt(s,10); // yyyymm
		}
	}
	return null;
}

iati_xml.get_value_currency=function(it,name)
{
	var t=it;
	if(name) t=refry.tag(t,name);
	if(t){
		if(t["currency"]){
			return t["currency"];
		}
	}
	return null;
}

iati_xml.get_ex=function(it,name,ex,cur)
{
	var cur=cur||"USD"; // default currency
	var ym=iati_xml.get_value_yearmonth(it,name) || 201001; // pick a default yearmonth?
	if(ym<199001) { ym=199001; } // deal with bad year formats
	
	var x=iati_xml.get_value_currency(it,name) || cur;
	var v=iati_xml.get_value(it,name);
	if("number"==typeof v) { return exs.exchange_yearmonth(ex,ym,x,v); }
}

iati_xml.get_code=function(it,name)
{
	var t=it;
	if(name) t=refry.tag(t,name);
	if(t){
		if(t["code"]){t=t["code"]; return t;}
	}
	return null;
}

iati_xml.get_aid=function(it)
{
	var id=refry.tagval(it,"iati-identifier") || refry.tagval(it,"organisation-identifier");
	if(id) { id=id.trim(); }
	return id;
}
