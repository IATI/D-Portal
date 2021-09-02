// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var savi=exports;

var xson=require("./xson.js")

var stringify = require('json-stable-stringify')

var exchange = require("./exchange.js")


/*
var encodeURIComponent=function(str)
{
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}
*/

var commafy=function(s) { return (""+parseFloat(s)).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

var saneid=function(insaneid)
{
	return insaneid.trim().toLowerCase().replace(/\W+/g," ").trim().replace(" ","-")
}

// work out an integer percentage from a start and end date compared to today
var date_range_to_percent=function(sd,ed)
{
	let percent=0
	let st=(new Date(sd+"T00:00:00+0000")).getTime()/1000
	let et=(new Date(ed+"T00:00:00+0000")).getTime()/1000
	let nt=(new Date()).getTime()/1000
	if(nt<=st) { percent=0 }
	else
	if(nt>=et) { percent=100 }
	else
	if( (nt>st) && (et!=et) ) { percent=50 } // after start time but do not know end time
	else
	if( (nt<et) && (st!=st) ) { percent=50 } // before end time but do not know start time
	else
	if( (st==st) && (et==et) && (et>st) ) // NaN and sanity test
	{
		percent=Math.floor( 100 * (nt-st) / (et-st) )
		if(percent<0) { percent=0 }
		else
		if(percent>100) { percent=100 }
	}
	return percent
}


// auto exchange a /value /value@value-date and /value@currency into the main currencies 
// and create human readable versions of the values
var create_human_values=function(it)
{

	let value=it["/value"]
	let isodate=it["/value@value-date"]
	let currency=it["/value@currency"]
	
	if(isodate===undefined){return}
	if(currency===undefined){return}

// exchange
	if(value!==undefined)
	{
		for( const c of ( [ "usd","eur","gbp","cad", ] ) )
		{
			
			it["/value-"+c] = exchange.by_monthly_average(value,c,currency,isodate)
		}
	}

// commafy
	for( const p of ( [ "","-usd","-eur","-gbp","-cad", ] ) )
	{
		if( it["/value"+p] !== undefined )
		{
			it["/value"+p+"-human"]=commafy( it["/value"+p] )
		}
	}

}


savi.plated=require("plated").create({},{pfs:{}}) // create a base instance for inline chunks with no file access

savi.chunks={}
savi.plate=function(str){ return savi.plated.chunks.replace(str,savi.chunks) }

savi.plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/savi.html', 'utf8'), savi.chunks )
savi.plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/savi.css',  'utf8'), savi.chunks )

savi.plated.chunks.format_chunks( savi.chunks )

savi.chunks["origin"]="http://d-portal.org"

savi.opts={}
savi.opts.test=false

savi.start=function(opts){

	// running in browser
	if(typeof window !== 'undefined')
	{
		window.$ = window.jQuery = require("jquery")
		require("stupid-table-plugin")

		window.Chartist = require("chartist")
		window.moment = require("moment")
	}

	for(var n in opts) { savi.opts[n]=opts[n] } // copy opts
	
	if( savi.opts.embeded )
	{
//		console.log("LIVE FIXUP ONLY")
		$(savi.fixup) // apply live js to static webpage
	}
	else
	{
		$(savi.start_loaded) // load and display some data
	}
}

savi.start_loaded=async function(){

	const dflat=require('./dflat.js')

// prepare test page
	let iati=null

	let urlParams = new URLSearchParams(window.location.search);
	let aid = urlParams.get('aid');
	let pid = urlParams.get('pid');

	let ropts={mode:"cors"}
	if(aid!==null)
	{
		if(aid!="") { aid="&aid="+encodeURIComponent(aid) }
		iati=await fetch("http://d-portal.org/q.json?from=xson&root=/iati-activities/iati-activity"+aid,ropts)
//		iati=await fetch("/q.json?from=xson&root=/iati-activities/iati-activity"+aid,ropts)
		iati=await iati.json()
		aid=true
	}
	else
	if(pid!==null)
	{
		if(pid!="") { pid="&pid="+encodeURIComponent(pid) }
		iati=await fetch("http://d-portal.org/q.json?from=xson&root=/iati-organisations/iati-organisation"+pid,ropts)
//		iati=await fetch("/q.json?from=xson&root=/iati-organisations/iati-organisation"+pid,ropts)
		iati=await iati.json()
		pid=true
	}
	else
	{
		iati=require('../json/test_1.json')
		aid=true
	}
	
	dflat.clean(iati) // clean this data
	
	savi.prepare(iati) // prepare for display

// test render
	$("html").prepend(savi.plate('<style>{savi-page-css}{savi-css}</style>')) // load our styles
	savi.chunks.iati=iati

	console.log( savi.chunks.iati ) // to help debuging

	$("body").empty()
	if(aid)
	{
		$("body").append(savi.plate('<div>{iati./iati-activities/iati-activity:iati-activity}</div>')) // fill in the base body
	}
	else
	if(pid)
	{
		$("body").append(savi.plate('<div>{iati./iati-organisations/iati-organisation:iati-organisation}</div>')) // fill in the base body
	}
	$("body").append(savi.plate('{theme_button}'))

// apply javascript to rendered html	

	savi.fixup()
}

savi.fixup=function(){

// give your table the class of sortable and they will sortable
	$("table.sortable").stupidtable()

// give your json chart data the class of showchart and it will be converted to a chart
	$(".showchart").each(function(idx)
	{
		var Chartist=require("chartist")

		var d=eval( " (function(){return (" + $(this).find("script").html() + ") })(); " )

		var chart = new (Chartist[d.chart])( this, {
		  series: d.series,
		}, d.options );

	})

// give your json chart data the class of showcharts and it will be converted to multiple charts
	$(".showcharts").each(function(idx)
	{
		var Chartist=require("chartist")

		var d=eval( " (function(){return (" + $(this).find("script").html() + ") })(); " )

		var p=$(this)
		for(var i=0;i<(d.parents||2);i++) { p=p.parent() } // step upwards a little to find base element

		var series=[]
		// find each series data within this base element
		p.find(".showchart").each(function(idx)
		{
			var s=eval( " (function(){return (" + $(this).find("script").html() + ") })(); " )
			series.push(s.series[0])
		})
		
		var chart = new (Chartist[d.chart])( this, {
		  series: series,
		}, d.options );

	})

}

// get graph data from a budget list
savi.get_data_budgets=function(list,name)
{
	let currency
	let dall=[]
	for(let it of list)
	{
		let it_date1=it["/period-start@iso-date"]
		let it_date2=it["/period-end@iso-date"]
		let it_value=it["/value"]
		let it_currency=it["/value@currency"]

		if( (it_date1===undefined) || (it_date2===undefined) || (it_value===undefined) || (it_currency===undefined) ) { return } // giveup

		let it_number=parseFloat((""+it_value).split(",").join("")) // deal with bad , in number

		if(it_number===undefined) { return } // giveup

		if(!currency) { currency=it_currency } // remember

		if(currency!=it_currency) { return } // all currency must match or we can not graph it so give up here

		let d1={}
		d1.x=(new Date( it_date1+"T00:00:00.000Z" )).getTime() / 1000
		d1.y=0
		dall.push(d1)

		let d2={}
		d2.x=(new Date( it_date2+"T00:00:00.000Z" )).getTime() / 1000
		d2.y=it_number
		dall.push(d2)
	}
	dall.sort(function(a,b){return a.x-b.x})

// now we can merge x duplicates and calculate accumulative y values

	let data=[]
	for(let d of dall)
	{
		let o=data[data.length-1]
		if(o)
		{
			if(o.x>=(d.x-(60*60*24*2))) // within a couple of days
			{
				o.y+=d.y // add to last
				o.x=d.x // latest date
			}
			else
			{
				d.y+=o.y // next
				data.push(d)
			}
		}
		else
		{
			data.push(d) // first
		}
	}
	return {series:data,currency:currency,name:saneid(name)}
}
// get graph data from a transaction list
savi.get_data_transactions=function(list,name)
{
	let currency
	let dall=[]
	for(let it of list)
	{
		let it_date=it["/transaction-date@iso-date"]
		let it_value=it["/value"]
		let it_currency=it["/value@currency"]

		if( (it_date===undefined) || (it_value===undefined) || (it_currency===undefined) ) { return } // giveup

		let it_number=parseFloat((""+it_value).split(",").join("")) // deal with bad , in number

		if(it_number===undefined) { return } // giveup

		if(!currency) { currency=it_currency } // remember

		if(currency!=it_currency) { return } // all currency must match or we can not graph it so give up here

		let d={}
		d.x=(new Date( it_date+"T00:00:00.000Z" )).getTime() / 1000
		d.y=it_number
		
		dall.push(d)
	}
	dall.sort(function(a,b){return a.x-b.x})

// now we can merge x duplicates and calculate accumulative y values

	let data=[]
	for(let d of dall)
	{
		let o=data[data.length-1]
		if(o)
		{
			if(o.x==d.x) // same time
			{
				o.y+=d.y // add to last
			}
			else
			{
				d.y+=o.y // next
				data.push(d)
			}
		}
		else
		{
			data.push(d) // first
		}
	}

	return {series:data,currency:currency,name:saneid(name)}
}

savi.prepare=function(iati_xson){

	let codelists=require('../json/codelists.json')
	let codemap=require('../json/codemap.json')
	
	xson.walk( iati_xson , (it,nn,idx)=>{
		let nb=nn.join("")

		let found_code=null
		let found_vocabulary=null

		for(let n of Object.keys(it)) // this caches the keys so we can modify
		{
			let v=it[n]

			if(n.endsWith("@code"))       { found_code=n }
			if(n.endsWith("@vocabulary")) { found_vocabulary=n }

			if(!Array.isArray(v)) // only rename if not an array
			{
				if(n=="") { it.text=v }
				let na=n.replace(/([a-zA-Z0-9_\-]+):/g,"") // remove namespace if it exists
				if( (na!=n) && (!it[na]) ) // safe to include without namespace
				{
//					console.log("map "+n+" -> "+na)
					it[na]=v
				}
			}
			let cms=codemap[nb+n]
			if(cms) // we have a code to map
			{
				for( let i=0 ; i<cms.length ; i++ )
				{
					let active=false
					let cm=cms[i]
					if(cm.condition) // deal with conditions
					{
						var m=cm.condition.match(/@(\w+).*'(\d+)'/) // hack match
						if(m && m[0] && m[1] && m[2] )
						{
							if( it[ "@"+m[1] ] == m[2] )
							{
								active=true
							}
							if(cm.condition.split(" or ").length>1) // the missing case
							{
								if( ! it["@"+m[1]] ) // not exist
								{
									active=true
								}
							}
						}
					}
					else // no condition
					{
						active=true
					}
					if(active)
					{
						v=(v).toString().trim().toUpperCase() // sanity, trim and uppercase all codes
						let m=codelists["en-name"][cm.codelist]
						if(m) // check it was a valid codelist
						{
							it[n+"-name"]=m[v] || v
//console.log(nb+n+" : "+cm.condition+" : "+cm.codelist+" : "+v+" : "+m[v])
						}
						m=codelists["en-description"][cm.codelist]
						if(m&&m[v]) // check it was a valid codelist and the code exists and it has a description
						{
							it[n+"-description"]=m[v]
						}
						m=codelists["url"][cm.codelist]
						if(m&&m[v]) // check it was a valid codelist and the code exists and it has a url
						{
							it[n+"-url"]=m[v]
						}
						m=codelists["withdrawn"][cm.codelist]
						if(m&&m[v]) // check it was a valid codelist and the code exists and it has been withdrawn
						{
							it[n+"-withdrawn"]=m[v]
						}
					}
				}
			}

		}
// expand @vocabulary @code pairs, this is a common design choice and this helps treat the vocabs as special
		if( found_code && found_vocabulary )
		{
			let n=it[ found_code+"-name" ]
			let d=it[ found_code+"-description" ]
			let u=it[ found_code+"-url" ]
			let w=it[ found_code+"-withdrawn" ]
			let c=it[ found_code ]
			let v=it[ found_vocabulary ]
			it[ found_code+"-"+v ]=c
			if(n)
			{
				it[ found_code+"-"+v+"-name" ]=n
			}
			if(d)
			{
				it[ found_code+"-"+v+"-description" ]=d
			}
			if(w) // codes probably do not have a url but just in case
			{
				it[ found_code+"-"+v+"-withdrawn" ]=w
			}
		}

	})
	
	let subents=function(act)
	{

// split location into longitude and latitude

		if(act["/location"])
		{
			for( let location of act["/location"] )
			{
				if( location["/point/pos"] )
				{
					let aa=location["/point/pos"].trim().split(/\s+/)
					let f1=parseFloat(aa[0])
					let f2=parseFloat(aa[1])
					if( (!isNaN(f1)) && (!isNaN(f2)) )
					{
						location["/point/pos@latitude"]=f1
						location["/point/pos@longitude"]=f2
					}
				}
			}
		}


// explicit dates based on @type
		if(act["/activity-date"])
		{
			for( let date of act["/activity-date"] )
			{
				let n=Number(date["@type"])||0
				act["/activity-date-"+n]=date
			}
			
			let sd=	( act["/activity-date-2"] && act["/activity-date-2"]["@iso-date"] ) ||
					( act["/activity-date-1"] && act["/activity-date-1"]["@iso-date"] ) || ""
			let ed=	( act["/activity-date-4"] && act["/activity-date-4"]["@iso-date"] ) ||
					( act["/activity-date-3"] && act["/activity-date-3"]["@iso-date"] ) || ""
			act["/activity-date-percent"]=date_range_to_percent(sd,ed)
		}
// budgets
		let names=[]
		let tosort=[]
		let tosort2=[]
		for(let bname of
			[
				"/budget",
				"/planned-disbursement",
				"/recipient-org-budget",
				"/recipient-region-budget",
				"/recipient-country-budget",
				"/total-budget",
				"/total-expenditure",
			])
		{
			if(act[bname])
			{
				tosort.push( act[bname] )
				names.push(bname)
				for( let budget of act[bname] )
				{
					if("/value" in budget)
					{
						create_human_values(budget)

						for(let lname of
							[
								"/budget-line",
								"/expense-line",
							])
						{
							if(budget[lname])
							{
								tosort2.push( budget[lname] )
								for( let line of budget[lname] )
								{
								create_human_values(line)
								}
							}
						}

					}
				}
			}
		}
		for( let tab of tosort )
		{
			tab.sort(function(a,b){
				let an=a["/period-start@iso-date"]||""
				let bn=b["/period-start@iso-date"]||""
				return an.localeCompare(bn)
			})
		}
		for( let tab of tosort2 )
		{
			tab.sort(function(a,b){
				let an=Number(a["/value"])||0
				let bn=Number(b["/value"])||0
				return bn-an
			})
		}
		for( let name of names )
		{
			let d=savi.get_data_budgets(act[name],name)
			if(d)
			{
				act[name+"-data"]=d
			}
		}

// split transactions on /transaction-type@code
		if(act["/transaction"])
		{
			let names=[]
			let tosort=[]
			tosort.push( act["/transaction"] )
			names.push( "/transaction" )
			for( let transaction of act["/transaction"] )
			{
				let code=Number(transaction["/transaction-type@code"])
				if(code)
				{
					if(! act["/transaction-"+code] )
					{
						let transactions=[]
						act["/transaction-"+code]=transactions
						tosort.push( transactions )
						names.push( "/transaction-"+code )
					}
					act["/transaction-"+code].push( transaction )
				}
				create_human_values(transaction)
			}
			for( let tab of tosort )
			{
				tab.sort(function(a,b){
					let an=a["/transaction-date@iso-date"]||""
					let bn=b["/transaction-date@iso-date"]||""
					return an.localeCompare(bn)
				})
			}
			for( let name of names )
			{
				let d=savi.get_data_transactions(act[name],name)
				if(d)
				{
					act[name+"-data"]=d
				}
			}
		}
// split sectors on @vocabulary
		if(act["/sector"])
		{
			let tosort=[]
			tosort.push( act["/sector"] )
			for( let sector of act["/sector"] )
			{
				let vocabulary=Number(sector["@vocabulary"]) || 1
				if(! act["/sector-"+vocabulary] )
				{
					let sectors=[]
					act["/sector-"+vocabulary]=sectors
					tosort.push( sectors )
				}
				act["/sector-"+vocabulary].push( sector )
			}
			for( let tab of tosort )
			{
				tab.sort(function(a,b){
					let an=Number(a["@percentage"])||0
					let bn=Number(b["@percentage"])||0
					return bn-an
				})
			}
		}
// split regions on @vocabulary
		if(act["/recipient-region"])
		{
			let tosort=[]
			tosort.push( act["/recipient-region"] )
			for( let region of act["/recipient-region"] )
			{
				let vocabulary=Number(region["@vocabulary"]) || 1
				if(! act["/recipient-region-"+vocabulary] )
				{
					let regions=[]
					act["/recipient-region-"+vocabulary]=regions
					tosort.push( regions )
				}
				act["/recipient-region-"+vocabulary].push( region )
			}
			for( let tab of tosort )
			{
				tab.sort(function(a,b){
					let an=Number(a["@percentage"])||0
					let bn=Number(b["@percentage"])||0
					return bn-an
				})
			}
		}
// sort countries
		if(act["/recipient-country"])
		{
			let tosort=[]
			tosort.push( act["/recipient-country"] )
			for( let tab of tosort )
			{
				tab.sort(function(a,b){
					let an=Number(a["@percentage"])||0
					let bn=Number(b["@percentage"])||0
					return bn-an
				})
			}
		}
// split results on @type
		if(act["/result"])
		{
			let results_tosort=[]
			let indicators_tosort=[]
			let periods_tosort=[]
			let baseline_tosort=[]
			for( let result of act["/result"] )
			{
				let type=Number(result["@type"]) || 1
				let name="/result-"+type
				if( ! act[name] ) { act[name]=[] ; results_tosort.push( act[name] ) }
				act[name].push( result )

				if( result["/indicator"] )
				{
					indicators_tosort.push( result["/indicator"] )
					for( let indicator of result["/indicator"] )
					{
						if( indicator["/baseline"] )
						{
							baseline_tosort.push( indicator["/baseline"] )
						}
						if( indicator["/period"] )
						{
							periods_tosort.push( indicator["/period"] )
							for( let period of indicator["/period"] )
							{
								let sd=period["/period-start@iso-date"]||""
								let ed=period["/period-end@iso-date"]||""
								period["/period-percent"]=date_range_to_percent(sd,ed)

								if( period["/actual"] )
								{
									if( ! indicator["/actual"] )
									{
										indicator["/actual"]=[]
										periods_tosort.push( indicator["/actual"] )
									}
									for( let actual of period["/actual"] ) // copy period down
									{
										indicator["/actual"].push(actual)
										actual["/period-start@iso-date"]=period["/period-start@iso-date"]
										actual["/period-end@iso-date"]=period["/period-end@iso-date"]
										actual["/period-percent"]=period["/period-percent"]
									}
								}

								if( period["/target"] )
								{
									if( ! indicator["/target"] )
									{
										indicator["/target"]=[]
										periods_tosort.push( indicator["/target"] )
									}
									for( let target of period["/target"] ) // copy period down
									{
										indicator["/target"].push(target)
										target["/period-start@iso-date"]=period["/period-start@iso-date"]
										target["/period-end@iso-date"]=period["/period-end@iso-date"]
										target["/period-percent"]=period["/period-percent"]
									}
								}
							}
						}
						indicator["/facet"]=[]
						let facetmap={}
						let facetget=function(it)
						{
							let key={}
							let str=""
							
							if( it["/dimension"] ) { key["/dimension"]=it["/dimension"] }
							if( it["/location"] ) { key["/location"]=it["/location"] }
							str=stringify(key,{space:" "})

							if( facetmap[str] !== undefined ) // already available
							{
								return facetmap[str]
							}
							
							let facet={}
							let idx=indicator["/facet"].length
							facetmap[str]=idx
							indicator["/facet"][idx]=facet
							
							if( it["/dimension"] )
							{
								facet["/dimension"]=it["/dimension"]
							}
							if( it["/location"] )
							{
								facet["/location"]=it["/location"]
							}
							for( let n in indicator )
							{
								if(n.startsWith("@measure"))
								{
									facet[n]=indicator[n]
								}
							}
							return idx
						}
						for( let baseline of ( indicator["/baseline"] || [] ) )
						{
							let idx=facetget(baseline)
							let it=indicator["/facet"][idx]
							if( ! it["/baseline"] )
							{
								it["/baseline"]=[]
								baseline_tosort.push( it["/baseline"] )
							}
							it["/baseline"].push(baseline)
						}
						for( let actual of ( indicator["/actual"] || [] ) )
						{
							let idx=facetget(actual)
							let it=indicator["/facet"][idx]
							if( ! it["/actual"] )
							{
								it["/actual"]=[]
								periods_tosort.push( it["/actual"] )
							}
							it["/actual"].push(actual)
						}
						for( let target of ( indicator["/target"] || [] ) )
						{
							let idx=facetget(target)
							let it=indicator["/facet"][idx]
							if( ! it["/target"] )
							{
								it["/target"]=[]
								periods_tosort.push( it["/target"] )
							}
							it["/target"].push(target)
						}
						if( indicator["/facet"].length==0 ) // delete if empty
						{
							delete indicator["/facet"]
						}
						else // merge baseline , actual , target into one array
						{
							for( let facet of indicator["/facet"] )
							{
								facet["/value"]=[]
								periods_tosort.push( facet["/value"] )
								
								let find_facet_baseline=function(ds)
								{
									if( ! facet["/baseline"] ) { return }
									let y=parseInt( ds.substring(0,4) )
									let best
									let dist
									for( let baseline of facet["/baseline"] )
									{
										let d=y
										if( baseline["@year"] )
										{
											d=parseInt( baseline["@year"] )-y
										}
										else
										if( baseline["@iso-date"] )
										{
											d=parseInt( baseline["@iso-date"].substring(0,4) )-y
										}
										d=d*d
										if( (!best) || (d<dist) )
										{
											best=baseline
											dist=d
										}
									}
									return best
								}

								let find_facet_value=function(ds,de)
								{
									if( ! facet["/value"] ) { return }
									for( let value of facet["/value"] )
									{
										if	(
												( ds == value["/period-start@iso-date"] )
												&&
												( de == value["/period-end@iso-date"] )
											)
										{
											return value
										}
									}
								}

								let create_facet_value=function(v)
								{
									let it={}
									facet["/value"].push(it)

									if( v["/dimension"] ) { it["/dimension"]=v["/dimension"] }
									if( v["/location"] ) { it["/location"]=v["/location"] }

									it["/period-start@iso-date"] = v["/period-start@iso-date"]
									it["/period-end@iso-date"] = v["/period-end@iso-date"]

									it["/period-percent"] = v["/period-percent"]
									
									return it
								}

								for( let actual of ( facet["/actual"] || [] ) )
								{
									let it=find_facet_value( actual["/period-start@iso-date"] , actual["/period-end@iso-date"] )
									if(!it) { it=create_facet_value(actual) }
									it["@actual"]=actual["@value"]
								}
								for( let target of ( facet["/target"] || [] ) )
								{
									let it=find_facet_value( target["/period-start@iso-date"] , target["/period-end@iso-date"] )
									if(!it) { it=create_facet_value(target) }
									it["@target"]=target["@value"]
								}
								for( let value of ( facet["/value"] || [] ) )
								{
									let it = find_facet_baseline( value["/period-start@iso-date"] )
									if(it)
									{
										value["@baseline"]=it["@value"]
										value["@baseline-year"]=it["@year"]
									}
									let s=parseFloat(value["@baseline"])||0
									let e=parseFloat(value["@target"])
									let n=parseFloat(value["@actual"])
									
									if( ( value["@ascending"]==0 ) && ( value["@baseline"] === undefined ) && (!isNaN(e)) )
									{
										s=e+1 // baseline hack when missing and value should go down
									}
									
									if( (!isNaN(s)) && (!isNaN(e)) && (!isNaN(n)) ) // NaN and sanity test
									{
										if(e==n) // target==actual
										{
											value["@percent"]=100
										}
										else
										if(e==s) // if baseline==target then it is always 0% if the 100% check above fails
										{
											value["@percent"]=0
										}
										else
										{
											value["@percent"]=Math.floor( 100 * (n-s) / (e-s) )
/* With a correct baseline, we do not need to know this
											if(indicator["@ascending"]==0)
											{
												value["@percent"]=-value["@percent"]
											}
*/
										}
										if(value["@percent"]<=0) { value["@percent"]=0 }
										else
										if(value["@percent"]>100) { value["@percent"]=100 }
										
									}
								}
								if( facet["/value"].length==0 ) // delete if empty
								{
									delete facet["/value"]
								}
//								delete facet["/baseline"]
//								delete facet["/target"]
//								delete facet["/actual"]
							}
						}
					}
				}
			}
			for( let tab of results_tosort )
			{
				tab.sort(function(a,b){
					let an=( a["/title/narrative"] && a["/title/narrative"][0] && a["/title/narrative"][0][""] ) || ""
					let bn=( b["/title/narrative"] && b["/title/narrative"][0] && b["/title/narrative"][0][""] ) || ""
					return an.localeCompare(bn)
				})
			}
			for( let tab of indicators_tosort )
			{
				tab.sort(function(a,b){
					let an=( a["/title/narrative"] && a["/title/narrative"][0] && a["/title/narrative"][0][""] ) || ""
					let bn=( b["/title/narrative"] && b["/title/narrative"][0] && b["/title/narrative"][0][""] ) || ""
					return an.localeCompare(bn)
				})
			}
			for( let tab of baseline_tosort )
			{
				tab.sort(function(a,b){
					let an=a["@iso-date"]||""
					let bn=b["@iso-date"]||""
					return an.localeCompare(bn)
				})
			}
			for( let tab of periods_tosort )
			{
				tab.sort(function(a,b){
					let an=a["/period-start@iso-date"]||""
					let bn=b["/period-start@iso-date"]||""
					return an.localeCompare(bn)
				})
			}
		}
	}

	if(iati_xson["/iati-activities/iati-activity"])
	{
		for( let act of iati_xson["/iati-activities/iati-activity"] )
		{
			subents(act)
		}
	}
	if(iati_xson["/iati-organisations/iati-organisation"]) // orgfiles
	{
		for( let act of iati_xson["/iati-organisations/iati-organisation"] )
		{
			subents(act)
		}
	}

	return iati_xson // we tweaked and added values in preparation for display
}

// handle the /savi url space
savi.serv = async function(req,res,next){

	var express = require('express');
	var serve_html = express.static(__dirname+"/../html",{'index': ['savi.html']})

	// serv up static files
	serve_html(req,res,next)

};
