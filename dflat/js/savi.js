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
	let savi_frankenstein=require('../json/test_1.json')
	
	xson.walk( savi_frankenstein , (it,nn,idx)=>{
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
					it[na]=v
				}
			}
			let cm=codemap[nb+n]
			if(cm) // we have a code to map
			{
				if(!cm.condition) // only the simple codemaps
				{
					let m=codelists["en-name"][cm.codelist]
					if(m) // check it was a valid codelist
					{
						it[n+"-name"]=m[v] || v
					}
				}
			}

		}
	})

	console.log(savi_frankenstein)

// test render
	$("html").prepend(savi.plate('<style>{css}</style>')) // load our styles
	savi.chunks.frankenstein=savi_frankenstein
	$("body").empty().append(savi.plate('{body}')) // fill in the base body

// apply javascript to rendered html	

// give your table the class of sortable and they will sortable
	console.log( $("table.sortable") )
	$("table.sortable").stupidtable()

}
