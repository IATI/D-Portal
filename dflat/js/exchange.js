// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const exchange={}
export default exchange

import freechange from "freechange/month.js"


exchange.by_monthly_average=function(value,to_currency,from_currency,isodate)
{
	isodate=isodate || "2020-01-01"
	value=Number(value||0)||0
	to_currency=(to_currency||"USD").toUpperCase()
	from_currency=(from_currency||"USD").toUpperCase()
	
	return freechange.by_date(value,from_currency,to_currency,isodate)
}
