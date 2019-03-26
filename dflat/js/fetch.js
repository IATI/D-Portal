// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var fetch=exports;

var pfs=require("pify")( require("fs") )
var jml=require("./jml.js")
var stringify = require('json-stable-stringify');


fetch.all=async function()
{
	await fetch.xsd()
}

fetch.xsd=async function()
{
	const download = require('download')
	const xpathParser = require("pify")(require('xml2xpath'));
	
	var schemas={
		"iati-activities-schema.xsd":true,
		"iati-common.xsd":true,
		"iati-organisations-schema.xsd":true,
		"iati-registry-record-schema.xsd":true,
		"xml.xsd":true,
	}
	
	pfs.mkdir("fetched").catch(e=>{})
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

	pfs.mkdir("json").catch(e=>{})
	await pfs.writeFile("json/iati.xsd.json",stringify(tree,{space:" ",cmp:jml.cmp}));
	
	jml.walk_xpath(tree,(it,path)=>{
			console.log(path)
		})
}
