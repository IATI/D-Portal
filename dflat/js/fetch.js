// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var fetch=exports;

var dflat=require("./dflat.js")

var pfs=require("pify")( require("fs") )
var jml=require("./jml.js")
var stringify = require('json-stable-stringify');


fetch.all=async function()
{
//	await fetch.xsd()
//	await fetch.codelist()
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

	tmap["documentLinkResultBase"]=tmap["documentLinkBase"] // bad schema is bad, just hack it

//need to merge this one we are missing the country part with this hack	
	tmap["documentLinkWithReceipientCountry"]=tmap["documentLinkBase"]

	
	var parse
	parse=function(e,root)
	{
		var path=root
		
		if(e.name)
		{
			path=path+"/"+e.name
		}

		paths[path] = e
		
		var as=jml.find_xpath(e,"/element/complexType/simpleContent/extension/attribute",true)
		for(var ai=0;ai<as.length;ai++)
		{
			var av=as[ai]
			if(av.ref)
			{
				paths[path+"@"+av.ref]=amap[ av.ref ] || {}
			}
			else
			if(av.name)
			{
				paths[path+"@"+av.name]=av
			}
		}

		var as=jml.find_xpath(e,"/element/complexType/attribute",true)
		for(var ai=0;ai<as.length;ai++)
		{
			var av=as[ai]
			if(av.ref)
			{
				paths[path+"@"+av.ref]=amap[ av.ref ] || {}
			}
			else
			if(av.name)
			{
				paths[path+"@"+av.name]=av
			}
		}

		var cs=jml.find_xpath(e,"/element/complexType/sequence/element",true)
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
	
	return paths
}

fetch.xsd=async function()
{
	const download = require('download')
	const xpathParser = require("pify")(require('xml2xpath'));

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

fetch.codelist_filenames={}

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
for(var n in fetch.codelist_filenames_1){fetch.codelist_filenames[n]=true}

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
//	"LocationType.xml":true, // external cruft
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
}
for(var n in fetch.codelist_filenames_2){fetch.codelist_filenames[n]=true}


fetch.codelist=async function()
{
	const download = require('download')

	for(var n in fetch.codelist_filenames_1 )
	{
		console.log("downloading "+n)
		await download("https://raw.githubusercontent.com/IATI/IATI-Codelists/version-2.03/xml/"+n,"fetched")
	}

	for(var n in fetch.codelist_filenames_2 )
	{
		console.log("downloading "+n)
		await download("https://raw.githubusercontent.com/IATI/IATI-Codelists-NonEmbedded/master/xml/"+n,"fetched")
	}

	var codelists={}
	for(var n in fetch.codelist_filenames )
	{
		console.log("parsing "+n)
		var data=await pfs.readFile("fetched/"+n,{ encoding: 'utf8' })
		var it=dflat.xml_to_json(data)
		var name=it["/codelist@name"]
		codelists[name]=it
	}
	await pfs.writeFile("json/codelists.json",stringify(codelists,{space:" "}));

	console.log("parsing codelist mapping.xml")

	var data=await pfs.readFile("fetched/mapping.xml",{ encoding: 'utf8' })
	var tree=jml.from_xml(data)
	
	var codemap=[]
	var code={}
	jml.walk_xpath(tree,(it,path)=>{
		if( path=="/mappings/mapping" ) // new map
		{
			code={}
			codemap.push(code)
		}
		else
		if( path=="/mappings/mapping/path" )
		{
			var s=it[1][0] // string
			code.path=s
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
		"xsd:boolean":							"int",
		"xsd:nonNegativeInteger":				"int",
		"xsd:positiveInteger":					"int",
		"xsd:decimal":							"number",
		"currencyType":							"number",
		"xsd:date":								"number",
		"xsd:dateTime":							"number",
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

	await pfs.writeFile("json/database.json",stringify(database,{space:" "}));

}
