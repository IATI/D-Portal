// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cronos=exports;

const assert = require('assert')
const path = require('path')

var fs=require('fs')
var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var stringify = require('json-stable-stringify');

/*#js.dflat.pull

*/
cronos.pull = function(){



}

/*#js.dflat.help

*/
cronos.help = function(){
	console.log(
`
>	dflat cronos

Manage a git repo of historical data.

`)


}

