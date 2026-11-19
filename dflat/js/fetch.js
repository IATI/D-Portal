// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const fetch={}
export default fetch

import * as fs   from "fs"
import * as path from "path"

import xson      from "./xson.js"
import jml       from "./jml.js"
import stringify from "json-stable-stringify"
import fetch_util from "./fetch_util.js"

const pfs = fs.promises


let download=async function(url,dir)
{
	let text=await fetch_util.http_getbody(url)
	let basename=path.basename(url)
	let filename=path.join(dir||"",basename)
	await pfs.writeFile(filename,text);
}

fetch.all=async function(opts)
{
	await fetch.xsd()
	await fetch.codelists(opts)
	await fetch.codemap()
	await fetch.database()
}


fetch.xsd_xpaths=function(tree,root)
{
	var paths={}
	
	var amap={}
	var emap={}
	var tmap={}
	
	amap["xml:lang"]={0:"xsd:attribute",name:"xml:lang",type:"xsd:string"}
	
	var es=jml.find_xpath(tree,"/schema/element",true)
	for(var ei=0;ei<es.length;ei++)
	{
		var ev=es[ei]
		emap[ev.name]=ev
	}

	var ts=jml.find_xpath(tree,"/schema/complexType",true)
	for(var ti=0;ti<ts.length;ti++)
	{
		var tv=ts[ti]
		tmap[tv.name]=tv // {0:"element",1:[ tv ]}
	}
	
	var as=jml.find_xpath(tree,"/schema/attribute",true)
	for(var ai=0;ai<as.length;ai++)
	{
		var av=as[ai]
		amap[av.name]=av
	}
	
	for(var tn in tmap)
	{
		var tv=tmap[tn]
		var as=jml.find_xpath(tv,"/complexType/complexContent/extension",true)
		for(var ai=0;ai<as.length;ai++)
		{
			var av=as[ai]
			if( tmap[av.base] )
			{
				tv[1]=[].concat(av[1],tmap[av.base][1])
			}
		}
	}

	
	var pathorder=[]
	var parse
	parse=function(e,root)
	{
		var path=root
		
		if(e.name)
		{
			path=path+"/"+e.name
		}

		paths[path] = e
		pathorder.push(path)
		
		var as=[].concat(
				jml.find_xpath(e,"/element/complexType/simpleContent/extension/attribute",true),
				jml.find_xpath(e,"/element/complexType/complexContent/extension/attribute",true),
				jml.find_xpath(e,"/element/complexType/attribute",true)
			)
		for(var ai=0;ai<as.length;ai++)
		{
			var av=as[ai]
			if(av.ref)
			{
				paths[path+"@"+av.ref]=amap[ av.ref ] || {}
				pathorder.push(path+"@"+av.ref)
			}
			else
			if(av.name)
			{
				paths[path+"@"+av.name]=av
				pathorder.push(path+"@"+av.name)
			}
		}

		var cs=[].concat(
				jml.find_xpath(e,"/element/complexType/sequence/element",true)
			)
		for(var ci=0;ci<cs.length;ci++)
		{
			var cv=cs[ci]

			if( cv.type &&  tmap[cv.type] )
			{
				var e=Object.assign({},cv)
				e[1]=[tmap[cv.type]]
				parse(e,path)
			}
			else
			if(cv.ref)
			{

				var e=Object.assign({},emap[cv.ref],cv)
				e[1]=[].concat( emap[cv.ref][1] , cv[1] )
				if(e.type && tmap[e.type])
				{
					e[1]=e[1].concat([tmap[e.type]])
				}
				parse(e,path)
			}
			else
			if(cv.name)
			{
				parse(cv,path)
			}
		}
	}

	if( emap[root] )
	{
		parse( emap[root] ,"" )
	}
	
	for( var idx in pathorder )
	{
		let n=pathorder[idx]
		let p=paths[n]
		p.order_of_element=(idx*1)+1 // remember order of parsing
	}
	
	return paths
}

fetch.xsd=async function()
{
// mkae sure dirs exist	
	pfs.mkdir("json").catch(e=>{})
	pfs.mkdir("fetched").catch(e=>{})

	var schemas={
		"iati-activities-schema.xsd":true,
		"iati-common.xsd":true,
		"iati-organisations-schema.xsd":true,
		"iati-registry-record-schema.xsd":true,
		"xml.xsd":true,
	}
	
	var scodes={
		"codelist.xsd":true,
		"iati-common.xsd":true,
		"xml.xsd":true,
	}
	

	console.log("downloading codelist mapping.xsd")
	await download("https://raw.githubusercontent.com/IATI/IATI-Codelists/version-2.03/mapping.xml","fetched")

	console.log("downloading codelist.xsd")
	await download("https://raw.githubusercontent.com/IATI/IATI-Codelists/version-2.03/codelist.xsd","fetched")

	for(var n in schemas )
	{
		console.log("downloading "+n)
		await download("https://raw.githubusercontent.com/IATI/IATI-Schemas/version-2.03/"+n,"fetched")
	}
	 
	var tree
	for(var n in schemas )
	{
		console.log("parsing "+n)
		var xml=await pfs.readFile("fetched/"+n,{ encoding: 'utf8' })
		var branch=jml.from_xml(xml)
		if(!tree)
		{
			tree=branch // start tree
		}
		else
		{
			for(var i=0;i<branch[1].length;i++) // merge all branches
			{
				tree[1].push( branch[1][i] )
			}
		}
	}
	await pfs.writeFile("json/iati.xsd.json",stringify(tree,{space:" ",cmp:jml.cmp}));

/*
	var paths=fetch.xsd_xpaths(tree,"iati-activities",true)
	for(var n in paths)
	{
		console.log(n)
	}

	var paths=fetch.xsd_xpaths(tree,"iati-organisations",true)
	for(var n in paths)
	{
		console.log(n)
	}
*/

	tree=undefined
	for(var n in scodes )
	{
		console.log("parsing "+n)
		var xml=await pfs.readFile("fetched/"+n,{ encoding: 'utf8' })
		var branch=jml.from_xml(xml)
		if(!tree)
		{
			tree=branch // start tree
		}
		else
		{
			for(var i=0;i<branch[1].length;i++) // merge all branches
			{
				tree[1].push( branch[1][i] )
			}
		}
	}
	await pfs.writeFile("json/codelist.xsd.json",stringify(tree,{space:" ",cmp:jml.cmp}));

/*	var paths=fetch.xsd_xpaths(tree,"codelists",true)
	for(var n in paths)
	{
		console.log(n)
	}
*/

}

fetch.codelist_filenames_1={
	"ActivityDateType.xml":true,
	"ActivityStatus.xml":true,
	"BudgetStatus.xml":true,
	"BudgetType.xml":true,
	"DocumentCategory.xml":true,
	"GazetteerAgency.xml":true,
	"OrganisationRole.xml":true,
	"RelatedActivityType.xml":true,
	"TransactionType.xml":true,
}

fetch.codelist_filenames_2={
	"ActivityScope.xml":true,
	"AidType-category.xml":true,
	"AidType.xml":true,
	"AidTypeVocabulary.xml":true,
	"BudgetIdentifier.xml":true,
	"BudgetIdentifierSector-category.xml":true,
	"BudgetIdentifierSector.xml":true,
	"BudgetIdentifierVocabulary.xml":true,
	"BudgetNotProvided.xml":true,
	"CRSAddOtherFlags.xml":true,
	"CRSChannelCode.xml":true,
	"CollaborationType.xml":true,
	"ConditionType.xml":true,
	"ContactType.xml":true,
	"Country.xml":true,
	"Currency.xml":true,
	"DescriptionType.xml":true,
	"DisbursementChannel.xml":true,
	"DocumentCategory-category.xml":true,
	"EarmarkingCategory.xml":true,
//	"FileFormat.xml":true, // external cruft
	"FinanceType-category.xml":true,
	"FinanceType.xml":true,
	"FlowType.xml":true,
	"GeographicExactness.xml":true,
	"GeographicLocationClass.xml":true,
	"GeographicLocationReach.xml":true,
	"GeographicVocabulary.xml":true,
	"GeographicalPrecision.xml":true,
	"HumanitarianScopeType.xml":true,
	"HumanitarianScopeVocabulary.xml":true,
	"IATIOrganisationIdentifier.xml":true,
	"IndicatorMeasure.xml":true,
	"IndicatorVocabulary.xml":true,
	"Language.xml":true,
	"LoanRepaymentPeriod.xml":true,
	"LoanRepaymentType.xml":true,
	"LocationType-category.xml":true,
	"LocationType.xml":true, // external cruft
	"OrganisationIdentifier.xml":true,
	"OrganisationRegistrationAgency.xml":true,
	"OrganisationType.xml":true,
	"OtherIdentifierType.xml":true,
	"PolicyMarker.xml":true,
	"PolicyMarkerVocabulary.xml":true,
	"PolicySignificance.xml":true,
	"PublisherType.xml":true,
	"Region.xml":true,
	"RegionVocabulary.xml":true,
	"ResultType.xml":true,
	"ResultVocabulary.xml":true,
	"Sector.xml":true,
	"SectorCategory.xml":true,
	"SectorVocabulary.xml":true,
	"TagVocabulary.xml":true,
	"TiedStatus.xml":true,
	"VerificationStatus.xml":true,
	"Version.xml":true,
	"UNSDG-Goals.xml":true,
	"UNSDG-Targets.xml":true,
}

fetch.codelist_filenames_3={
	"UNSDG-Indicators.xml":true,
}


// The code lists change as IATI updates them, so "dflat fetch codelists" fetches
// only them, into json/codelists.json, for a nightly job to run. Everything else
// "dflat fetch" writes comes from the 2.03 schema, which does not change.

// { filename: url } for every code list
fetch.codelist_urls=function()
{
	const urls={}
	for(const filename in fetch.codelist_filenames_1 ) { urls[filename]="https://raw.githubusercontent.com/IATI/IATI-Codelists/version-2.03/xml/"+filename }
	for(const filename in fetch.codelist_filenames_2 ) { urls[filename]="https://raw.githubusercontent.com/IATI/IATI-Codelists-NonEmbedded/master/xml/"+filename }
	for(const filename in fetch.codelist_filenames_3 ) { urls[filename]="https://codelists.codeforiati.org/api/xml/"+filename }
	return urls
}

// Download every code list, check them, and only then write json/codelists.json.
// Any failure throws and writes nothing, so the previous file stays as it is.
// opts.force skips the checks that compare with the last fetch, for when a
// list has genuinely lost codes.
fetch.codelists=async function(opts)
{
	opts=opts||{}
	const urls=fetch.codelist_urls()
	const xmls={}
	for(const filename in urls)
	{
		console.log("downloading "+filename)
		xmls[filename]=await fetch_util.http_getbody(urls[filename])
	}

	const parsed=fetch.parse_codelists(xmls)
	const codes=fetch.codelists_to_codes(parsed.codelists)
	let problems=parsed.problems
	if(!opts.force)
	{
		problems=problems.concat( fetch.compare_codelists(codes,read_previous_codes()) )
	}
	if(problems.length>0)
	{
		throw new Error("fetched code lists failed their checks, nothing was written:\n  "+problems.join("\n  ")+
			"\nIf a list has genuinely lost codes, \"dflat fetch codelists --force\" skips the checks that compare with the last fetch")
	}

	fetch_util.write_files("json",{
		"codelists.json" : stringify(codes,{space:" "}),
	})
}

// json/codelists.json from the last fetch, or undefined if there is none yet
const read_previous_codes=function()
{
	try{
		return JSON.parse( fs.readFileSync("json/codelists.json","utf8") )
	}catch(e){
		if(e.code=="ENOENT")
		{
			return undefined
		}
		throw e
	}
}

// a code list may lose a few codes from one fetch to the next, but not more than this
fetch.codelists_min_fraction=0.9

// codes and previous are the lookup tables in json/codelists.json, previous may
// be undefined. Returns a problem for every list from the last fetch that is
// now missing, or has lost more than a little of its codes, counting the codes
// that have an English name. The file keeps no plain list of codes. The English
// names are the most complete table, since a name with no language counts as
// English, and they are what the site shows, so losing them is what matters.
fetch.compare_codelists=function(codes,previous)
{
	const problems=[]
	const before=( previous && previous["en-name"] ) || {}
	const now=codes["en-name"] || {}
	for(const listname in before)
	{
		const count_before=Object.keys(before[listname]).length
		const count_now=now[listname] ? Object.keys(now[listname]).length : 0
		if( count_now==0 )
		{
			problems.push(listname+" is missing, it had "+count_before+" codes")
		}
		else
		if( count_now < count_before*fetch.codelists_min_fraction )
		{
			problems.push(listname+" fell from "+count_before+" to "+count_now+" codes")
		}
	}
	return problems
}

// xmls is { filename: xml text }. Returns { codelists, problems }: codelists
// keyed by each list's name, and a problem for any file that is not a code
// list with at least one code in it, or has the same name as another file.
fetch.parse_codelists=function(xmls)
{
	const codelists={}
	const filenames={} // the file each list came from
	const problems=[]
	for(const filename in xmls)
	{
		let it
		try{
			it=xson.compact(xson.from_xml(xmls[filename]))
		}catch(e){
			problems.push(filename+" is not valid xml")
			continue
		}
		// compact folds a list with only one code into the list itself, which
		// used to drop that code, so put it back into a list of one
		const prefix="/codelist/codelist-items/codelist-item"
		if( !it[prefix] && it[prefix+"/code"]!==undefined )
		{
			const item={}
			for(const k in it)
			{
				if( k.startsWith(prefix+"/") || k.startsWith(prefix+"@") )
				{
					item[ k.substring(prefix.length) ]=it[k]
					delete it[k]
				}
			}
			it[prefix]=[item]
		}
		const listname=it["/codelist@name"]
		const items=it[prefix]
		if( !listname || !items || items.length==0 )
		{
			problems.push(filename+" is not a code list with codes in it")
			continue
		}
		if( codelists[listname] )
		{
			problems.push(filename+" has the same name, "+listname+", as "+filenames[listname])
			continue
		}
		codelists[listname]=it
		filenames[listname]=filename
	}
	return { codelists:codelists, problems:problems }
}

// turn parsed code lists into the lookup tables in json/codelists.json
fetch.codelists_to_codes=function(codelists)
{
	let codes={}
	for(let listname in codelists)
	{
		let list=codelists[listname]["/codelist/codelist-items/codelist-item"]
		if(list)
		{
			for( let c of list )
			{
				let code=c["/code"]
				let withdrawn=(c["@status"]=="withdrawn")
				if(withdrawn)
				{
					codes["withdrawn"]=codes["withdrawn"] || {}
					codes["withdrawn"][listname]=codes["withdrawn"][listname] || {}
					codes["withdrawn"][listname][code] = true
				}
				let url=c["/url"]
				if(url)
				{
					url=url.trim()
					codes["url"]=codes["url"] || {}
					codes["url"][listname]=codes["url"][listname] || {}
					codes["url"][listname][code] = url
				}
				if( code )
				{
					code=code.toUpperCase() // force upper for all codes as they tend to mix with numbers
					let index=0
					let done=false
					let lang="en"
					while(!done)
					{
						let narr=c["/name/narrative"]
						let name=""
						if( Array.isArray(narr) )
						{
							if( ! narr[index] ) { break }
							name=narr[index][""]
							lang=narr[index]["@xml:lang"] || "en"
							lang=lang.toLowerCase()
						}
						else
						{
							name=narr
							done=true
						}
						if( name )
						{
							codes[lang+"-name"]=codes[lang+"-name"] || {}
							codes[lang+"-name"][listname]=codes[lang+"-name"][listname] || {}
							codes[lang+"-name"][listname][ code ] = name
						}
						index++
					}
					index=0
					done=false
					lang="en"
					while(!done)
					{
						let narr=c["/description/narrative"]
						let description=""
						if( Array.isArray(narr) )
						{
							if( ! narr[index] ) { break }
							description=narr[index][""]
							lang=narr[index]["@xml:lang"] || "en"
							lang=lang.toLowerCase()
						}
						else
						{
							description=narr
							done=true
						}
						if( description )
						{
							codes[lang+"-description"]=codes[lang+"-description"] || {}
							codes[lang+"-description"][listname]=codes[lang+"-description"][listname] || {}
							codes[lang+"-description"][listname][ code ] = description
						}
						index++
					}
				}
			}
		}
	}
	return codes
}

// json/codemap.json: which code list each field uses, from the 2.03 schema's
// mapping.xml, downloaded by fetch.xsd
fetch.codemap=async function()
{
	console.log("parsing codelist mapping.xml")

	var data=await pfs.readFile("fetched/mapping.xml",{ encoding: 'utf8' })
	var tree=jml.from_xml(data)
	
	var codemap={}
	var code={}
	jml.walk_xpath(tree,(it,path)=>{
		if( path=="/mappings/mapping" ) // new map
		{
			code={}
		}
		else
		if( path=="/mappings/mapping/path" )
		{
			var s=it[1][0] // string
			s=s.split("//").join("/") // fix the wildcard paths provided here
			s=s.split("/@").join("@") // to match the explicit paths we are using
			if( s.startsWith("/iati-activity") )
			{
				s="/iati-activities"+s
			}
			if( s.startsWith("/iati-organisation") )
			{
				s="/iati-organisations"+s
			}
			if( s.endsWith("/text()") )
			{
				s=s.substring( 0, s.indexOf( "/text()" ) )
			}
//			code.path=s
			codemap[s]=codemap[s] || []
			codemap[s].push(code)
		}
		else
		if( path=="/mappings/mapping/codelist" )
		{
			code.codelist=it["ref"] // string
		}
		else
		if( path=="/mappings/mapping/condition" )
		{
			var s=it[1][0] // string
			code.condition=s
		}


	})

// hax
codemap["/iati-activities/iati-activity/country-budget-items/budget-item@vocabulary"]
	=	codemap["/iati-activities/iati-activity/country-budget-items@vocabulary"]

codemap["/iati-activities/iati-activity@version"]
	=	codemap["/iati-activities@version"]

	await pfs.writeFile("json/codemap.json",stringify(codemap,{space:" "}));

}


fetch.database=async function()
{
	var typelookup={
		"textRequiredType":						"null",
		"documentLinkBase":						"null",
		"documentLinkResultBase":				"null",
		"descriptionBase":						"null",
		"resultLocationBase":					"null",
		"aidTypeBase":							"null",
		"documentLinkWithReceipientCountry":	"null",
		"xsd:int":								"int",
		"xsd:boolean":							"bool",
		"xsd:nonNegativeInteger":				"uint",
		"xsd:positiveInteger":					"uint",
		"xsd:decimal":							"number",
		"currencyType":							"number",
		"xsd:date":								"date",
		"xsd:dateTime":							"time",
		"xsd:string":							"text",
		"xsd:anyURI":							"text",
		"xsd:NMTOKEN":							"text",
	}
	
	var database={paths:{}}
	
	var data=await pfs.readFile("json/iati.xsd.json",{ encoding: 'utf8' })
	var tree=JSON.parse(data)
	for(var basen in {"iati-activities":true,"iati-organisations":true})
	{
		var paths=fetch.xsd_xpaths(tree,basen,true)
		for(var n in paths)
		{
			var it=paths[n]
			
			var store_path=function(xtype)
			{
				var type="null"
				if(xtype) { type=typelookup[xtype] } // convert
				var d={type:type}
				if(it.use=="required")        { d.required=true }
				if(it.maxOccurs=="unbounded") { d.multiple=true }
				if(it.minOccurs=="1")         { d.required=true }
				d.orderby=it.order_of_element || 0
				database.paths[n]=d

				if(typeof type=="undefined")
				{
					console.log("unkonwn type "+xtype+" : "+n)
				}
			}
			
			if(it.type)
			{
				store_path(it.type)
			}
			else
			if(it[1])
			{
				
				var sub=jml.find_xpath(it,"/element/complexType/simpleContent/extension",true)
//console.log(n+" ? "+sub)
//jml.walk_xpath(it,(it,path)=>{console.log(path)},true)
				if( sub[0] && sub[0].base )
				{
					store_path(sub[0].base)
				}
				else
				{
					store_path()
				}
			}
			else
			{
				store_path()
			}
		}
	}


// hacky fixups for what looks like bad xsd data?
	database.paths["/iati-organisations/iati-organisation/organisation-identifier"].type="text"

// copy root attributes down a level and into a namespace	
	for( let path in database.paths )
	{
		let aa
		aa=path.split("/iati-activities@")
		if( aa[0]=="" && aa[1])
		{
			let it={}
			database.paths["/iati-activities/iati-activity@iati-activities:"+aa[1]]=it
			for( let n in database.paths[path] ) { it[n]=database.paths[path][n] }
		}

		aa=path.split("/iati-organisations@")
		if( aa[0]=="" && aa[1])
		{
			let it={}
			database.paths["/iati-organisations/iati-organisation@iati-organisations:"+aa[1]]=it
			for( let n in database.paths[path] ) { it[n]=database.paths[path][n] }
		}
	}
	

/*
	database.structures={}
	
	var basename =function(path) { return (path.substr(path.lastIndexOf('/') + 1)) }
	var cleanname=function(name) { return name.replace(/[\W_]+/g,"_") }

	for(var pn in database.paths)
	{
		var pv=database.paths[pn]
		
		if(pv.multiple) // these need a table
		{
			var name=(basename(pn))
			database.structures[name]=database.structures[name] || {}
			database.structures[name].paths=database.structures[name].paths || {}
			database.structures[name].paths[pn]=true
		}
	}

	for(var pn in database.paths)
	{
		var test=(pn)
		var pv=database.paths[pn]
		var table
		for(var tn in database.structures)
		{
			var idx=test.indexOf("/"+tn+"/")
			if( idx<0 ) { idx=test.indexOf("/"+tn+"@") }
			if( idx>=0 )
			{
				table=tn
				test=test.substring(idx+tn.length+1)
			}
		}
		if(table)
		{
			database.structures[table].columns=database.structures[table].columns || {}
			var name=test.substring(1)
			
			database.structures[table].columns[name]=database.structures[table].columns[name] || {}
//			database.structures[table].columns[name].paths=database.structures[table].columns[name].paths || {}
//			database.structures[table].columns[name].paths[pn]=true

			Object.assign(database.structures[table].columns[name],database.paths[pn])
		}
	}

	for(var tn in database.structures)
	{
		var tv=database.structures[tn]
		for(var pn in tv.paths )
		{
			var pv=database.paths[pn]
			if(pv.type=="text") // we need to include a text column
			{
				tv.columns=tv.columns || {}
				tv.columns["text"]={type:"text"}
			}
			break // only do once
		}
	}
*/


	database.tree={}

	var get_example_value=function(it)
	{
		if(it.type=="text")
		{
			return "text"
		}
		if(it.type=="int")
		{
			return -1
		}
		if(it.type=="uint")
		{
			return 1
		}
		if(it.type=="bool")
		{
			return 0
		}
		if(it.type=="number")
		{
			return 1.1
		}
		if(it.type=="date")
		{
			return "1970-01-01"
		}
		if(it.type=="time")
		{
			return "1970-01-01T00:00:00"
		}
	}
	
	var stack_fill
	stack_fill=function(top)
	{
		var trim=function(s)
		{
			if(s.startsWith(top.path))
			{
				s=s.substr(top.path.length)
			}
			return s
		}
		for(var pn in database.paths )
		{
			var pv=database.paths[pn]
			
			if( pn.startsWith(top.path) )
			{
				var insert=true
				for(var tn in top.data)
				{
					var tv=top.data[tn]
					if( typeof tv == "object" )
					{
						if( trim(pn).startsWith(tn) )
						{
							insert=false
							break
						}
					}
				}
				if(insert)
				{
					if(pv.multiple && top.path!=pn )
					{
						var aa=[]
						top.data[trim(pn)]=aa
						for(var i=0;i<1;i++)
						{
							aa[i]={}
							stack_fill({ path:pn , data:aa[i] })
						}
					}
					else
					if(pv.type!="null")
					{
						top.data[trim(pn)]=get_example_value(pv)
					}
				}
			}
		}
		
	}
	stack_fill({ path:"" , data:database.tree })

// shrink arrays with only one member in an object	
	var walk
	walk=function(it)
	{
		children={}
		for(var n in it)
		{
			if(typeof(it[n])=="object")
			{
				children[n]=true
			}
		}
		for(var cn in children)
		{
			var aa=it[cn]
			var name
			var count=0
			for(var n in aa[0])
			{
				count++
				name=n
				if(typeof aa[0][n] =="object") // disable this if it cascades
				{
					count++
				}
			}
			if( count==1 && name!==undefined ) // compress
			{
				var bb=[]
				for( var i=0 ; i<aa.length ; i++ )
				{
					bb[i]=aa[i][name]
				}
				delete it[cn] // remove and
				it[cn+name]=bb // replace
			}
			else
			{
				for( var i=0 ; i<aa.length ; i++ )
				{
					walk( aa[i] )
				}
			}
		}
	}
//	walk(database.tree)
	
//	database.jpath={}

	xson.all(database.tree,(v,nn)=>{
		var xpath = nn.join("")
		var jpath = '{"'+nn.join('","')+'"}'
				
//		database.jpath[jpath]=xpath
		
		var p=database.paths[xpath]
		if(p)
		{
			p.jpath=nn
		}

	})

	await pfs.writeFile("json/database.json",stringify(database,{space:" "}));

}
