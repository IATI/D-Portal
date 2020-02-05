// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var savi=exports;

var xson=require("./xson.js")


var encodeURIComponent=function(str)
{
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

var commafy=function(s) { return (""+parseFloat(s)).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };




savi.plated=require("plated").create({},{pfs:{}}) // create a base instance for inline chunks with no file access

savi.chunks={}
savi.plate=function(str){ return savi.plated.chunks.replace(str,savi.chunks) }

savi.plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/savi.html', 'utf8'), savi.chunks )
savi.plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/savi.css',  'utf8'), savi.chunks )


savi.opts={}
savi.opts.test=false

savi.start=function(opts){

	// running in browser
	if(typeof window !== 'undefined')
	{
		window.$ = window.jQuery = require("jquery")
		require("stupid-table-plugin")
	}

	for(var n in opts) { savi.opts[n]=opts[n] } // copy opts
	$(savi.start_loaded)
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
		if(aid!="") { aid="&aid="+aid }
		iati=await fetch("http://d-portal.org/q.json?from=xson&root=/iati-activities/iati-activity"+aid,ropts)
		iati=await iati.json()
		aid=true
	}
	else
	if(pid!==null)
	{
		if(pid!="") { pid="&pid="+pid }
		iati=await fetch("http://d-portal.org/q.json?from=xson&root=/iati-organisations/iati-organisation"+pid,ropts)
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

	if(aid)
	{
		$("body").empty().append(savi.plate('<div>{iati./iati-activities/iati-activity:iati-activity}</div>')) // fill in the base body
	}
	else
	if(pid)
	{
		$("body").empty().append(savi.plate('<div>{iati./iati-organisations/iati-organisation:iati-organisation}</div>')) // fill in the base body
	}

// apply javascript to rendered html	

// give your table the class of sortable and they will sortable
	$("table.sortable").stupidtable()

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
				let na=n.replace(/(\w+):/g,"") // remove namespace if it exists
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
						if(m) // check it was a valid codelist
						{
							it[n+"-description"]=m[v] || v
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
		}

	})
	
	let subents=function(act)
	{
		if( (!act["@dataset"]) && (act["@dstore:slug"]) ) // d-portal dataset hack
		{
			act["@dataset"]=act["@dstore:slug"]
		}

		
// explicit dates based on @type
		if(act["/activity-date"])
		{
			for( let date of act["/activity-date"] )
			{
				let n=Number(date["@type"])||0
				act["/activity-date-"+n]=date
			}
		}
// budgets
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
				for( let budget of act[bname] )
				{
					if("/value" in budget)
					{
						budget["/value-human"]=commafy(budget["/value"])

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
									if("/value" in line)
									{
										line["/value-human"]=commafy(line["/value"])
									}
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
// split transactions on /transaction-type@code
		if(act["/transaction"])
		{
			let tosort=[]
			tosort.push( act["/transaction"] )
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
					}
					act["/transaction-"+code].push( transaction )
				}
				if("/value" in transaction)
				{
					transaction["/value-human"]=commafy(transaction["/value"])
				}
			}
			for( let tab of tosort )
			{
				tab.sort(function(a,b){
					let an=a["/transaction-date@iso-date"]||""
					let bn=b["/transaction-date@iso-date"]||""
					return an.localeCompare(bn)
				})
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

	return iati_xson // we tweaked and added values in preperation for display
}
