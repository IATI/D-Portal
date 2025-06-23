// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const exs={}
export default exs

import freechange from "freechange/month.js"


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// only ask for monthly values so as not to produce needless bloat


// exchange at the given years rate from ex currency into exto currency
exs.exchange_year=function(exto,yearmonth,ex,val)
{
	return exs.exchange_yearmonth(exto,yearmonth,ex,val)
}



// exchange at the given years rate from ex currency into exto currency
exs.exchange_yearmonth=function(exto,yearmonth,ex,val)
{
	var s=""+yearmonth
	var y=s.substring(0, 4)
	var m=s.substring(4, 6)
	var d=s.substring(6, 8)
	var ymd=y
	if(m)
	{
		ymd=ymd+"-"+m
		if(d)
		{
			ymd=ymd+"-"+d
		}
	}
	ymd=ymd||"2010"
//	console.log(yearmonth+" ? "+ymd)

	return freechange.by_date(val,ex,exto,ymd)
}


// exchange at the given years rate from ex currency into exto currency
exs.exchange=function(exto,yearmonth,ex,val)
{
	return freechange.by_date(val,ex,exto,yearmonth)
}


