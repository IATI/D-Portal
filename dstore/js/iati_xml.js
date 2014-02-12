//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var iati_xml=exports;
if(typeof iati_xml  === "undefined") { iati_xml ={}; }
required["iati_xml"]=iati_xml;

var util=require('util');

var refry=require('./refry');
var exs=require('./exs');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


// convert isodate string to a number (days since 1970-01-01)
// can convert to unix time by multiplying by number of seconds in a day (60*60*24)
iati_xml.isodate_to_number=function(s)
{
	if(s)
	{
		var aa=s.split("-");
		var year=parseInt(aa[0]||0)||0;
		var month=(parseInt(aa[1]||1)||1)-1;
		var day=parseInt(aa[2]||0)||0;
		var num=Date.UTC(year,month,day)/(1000*60*60*24);
		
		return num;
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

iati_xml.get_value=function(it,name)
{
	var t=refry.tagval(it,name);
	if(t){
		t=t.split(",").join(""); // should we remove commas?
		return Number(t);
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

iati_xml.get_usd=function(it,name,default_currency)
{
	var y=iati_xml.get_value_year(it,name) || 2010; // pick a default year?
	if(y<1990) { y=1990; } // deal with bad year formats
	
	var x=iati_xml.get_value_currency(it,name) || default_currency || "USD";
	var v=iati_xml.get_value(it,name);
	if("number"==typeof v) { return exs.exchange_year(y,x,v); }
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
	var id=refry.tagval(it,"iati-identifier");
	if(id) { id=id.trim(); }
	return id;
}
