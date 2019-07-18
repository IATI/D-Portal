// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var download=exports;

var dflat=require("./dflat.js")

var pfs=require("pify")( require("fs") )
var jml=require("./jml.js")
var xson=require("./xson.js")
var stringify = require('json-stable-stringify');


dfetch.download_all=async function()
{
	await dfetch.download_meta()
	await dfetch.download_data()
}


dfetch.download_meta=async function()
{
	const download = require('download')

}


dfetch.download_data=async function()
{
	const download = require('download')

}
