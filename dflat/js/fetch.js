// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var fetch=exports;

var pfs=require("pify")( require("fs") )
var jml=require("./jml.js")
var stringify = require('json-stable-stringify');


fetch.all=async function()
{
	await fetch.xsd()
	await fetch.codelist()
}


fetch.xsd_xpaths=function(tree,root)
{
	var paths={}
	
	var emap={}
	var es=jml.find_xpath(tree,"/schema/element",true)
	for(var ei=0;ei<es.length;ei++)
	{
		var ev=es[ei]
		emap[ev.name]=ev
	}
	
	var parse
	parse=function(e,root,p)
	{
		var path=root+"/"+e.name
		paths[path]=e

		var as=jml.find_xpath(e,"/element/complexType/simpleContent/extension/attribute",true)
		for(var ai=0;ai<as.length;ai++)
		{
			var av=as[ai]
			if(av.name)
			{
				paths[path+"@"+av.name]=av
			}
			else
			if(av.ref)
			{
				paths[path+"@"+av.ref]=emap[ av.ref ] || {}
			}
		}

		var as=jml.find_xpath(e,"/element/complexType/attribute",true)
		for(var ai=0;ai<as.length;ai++)
		{
			var av=as[ai]
			if(av.name)
			{
				paths[path+"@"+av.name]=av
			}
		}

		var cs=jml.find_xpath(e,"/element/complexType/sequence/element",true)
		for(var ci=0;ci<cs.length;ci++)
		{
			var cv=cs[ci]
			if(cv.name)
			{
				parse(cv,path)
			}
			else
			if(cv.ref)
			{
				var e=emap[ cv.ref ]
				parse(e,path)
			}
		}
	}

	if( emap[root] )
	{
		parse( emap[root] ,"" )
	}

//	parse( emap["iati-activities"] ,"" )
//	parse( emap["iati-organisations"] ,"" )
//	parse( emap["codelists"] ,"" )
	
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
	"FileFormat.xml":true,
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
	"LocationType.xml":true,
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

}
