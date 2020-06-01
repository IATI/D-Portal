// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var exchange=exports;


var old_usd=require('../../dstore/json/usd_year.json')
var old_xdr=require('../../dstore/json/xdr_month.json')


var min_month= 9999*12
var max_month=-9999*12
var xdr_months=[] // number of months since epoch of 1970-01-01 which is considered month 0

for( const ms in old_xdr )
{
	let sy=parseInt( ms.substring(0,4) , 10 ) || 1970
	let sm=parseInt( ms.substring(5,7) , 10 ) || 1
	let m=((sy-1970)*12)+sm-1
	
	let it=old_xdr[ms]
	if( it && it.XDR ) // valid data
	{
		xdr_months[m]=it
		if(m<min_month) { min_month=m }
		if(m>max_month) { max_month=m }
	}	
}

xdr_months[min_month-1]={} // make sure all currencies have a starting value
for( let mi=min_month ; mi<=max_month ; mi++ )
{
	for( const n in xdr_months[mi] )
	{
		if( xdr_months[min_month-1][n] === undefined )
		{
			xdr_months[min_month-1][n] = xdr_months[mi][n]
		}
	}
}
min_month=min_month-1

console.log( xdr_months )
console.log( max_month )
console.log( min_month )

exchange.by_monthly_average=function(value,to_currency,from_currency,isodate)
{
	value=Number(value||0)||0
	to_currency=(to_currency||"USD").toUpperCase()
	from_currency=(from_currency||"USD").toUpperCase()

	let sy=parseInt( isodate.substring(0,4) , 10 ) || 1970
	let sm=parseInt( isodate.substring(5,7) , 10 ) || 1
	let m=((sy-1970)*12)+sm-1
	if(m<min_month) { m=min_month }
	if(m>max_month) { m=max_month }
	
	let fx,tx
	for( let i=0 ; i < (max_month-min_month) ; i++ ) // search for value in case we are in a gap
	{
		var xm=xdr_months[m-i]
		if(xm)
		{
			if( (tx==undefined) && (xm[to_currency  ]!==undefined) ) { tx = xm[to_currency  ] }
			if( (fx==undefined) && (xm[from_currency]!==undefined) ) { fx = xm[from_currency] }
		}
		if((fx!==undefined)&&(tx!=undefined)) { break } // found best values
	}
	
	if((fx!==undefined)&&(tx!=undefined)&&(fx!=0)&&(tx!=0)) // sanity
	{
		return ( Math.round( value*fx/tx * 100 ) / 100 )
	}

}
