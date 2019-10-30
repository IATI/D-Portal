// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var savi=exports;

var xson=require("./xson.js")

// running in browser
if(typeof window !== 'undefined')
{
	window.$ = window.jQuery = require("jquery")
	require("stupid-table-plugin")
}

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
	for(var n in opts) { savi.opts[n]=opts[n] } // copy opts
	$(savi.start_loaded)
}

savi.start_loaded=function(){

	let codelists=require('../json/codelists.json')
	let codemap=require('../json/codemap.json')

// prepare test page
	let iati_xson=require('../json/test_1.json')
	
	xson.walk( iati_xson , (it,nn,idx)=>{
		let nb=nn.join("")

		for(let n of Object.keys(it)) // this caches the keys so we can modify
		{
			let v=it[n]
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
	})
	
	if(iati_xson["/iati-activities/iati-activity"])
	{
		for( let act of iati_xson["/iati-activities/iati-activity"] )
		{
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
			if(act["/budget"])
			{
				let tosort=[]
				tosort.push( act["/budget"] )
				for( let budget of act["/budget"] )
				{
					if("/value" in budget)
					{
						budget["/value-human"]=commafy(budget["/value"])
					}
				}
				for( let tab of tosort )
				{
					tab.sort(function(a,b){
						let an=a["/period-start@iso-date"]||""
						let bn=b["/period-start@iso-date"]||""
						return a-b
					})
				}
			}
// split transacions on /transaction-type@code
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
						return a-b
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
						return a-b
					})
				}
			}
		}
	}



	console.log(iati_xson)

// test render
	$("html").prepend(savi.plate('<style>{css}</style>')) // load our styles
	savi.chunks.frankenstein=iati_xson
	$("body").empty().append(savi.plate('{body}')) // fill in the base body

// apply javascript to rendered html	

// give your table the class of sortable and they will sortable
//	$("table.sortable").stupidtable()

}
