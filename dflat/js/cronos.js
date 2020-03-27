// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cronos=exports;

const assert = require('assert')
const path = require('path')

var pfs=require("pify")( require("fs") )
var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var stringify = require('json-stable-stringify');


const JSON5 = require('json5')

/*#js.dflat.pull

*/
cronos.pull = async function(argv){

	console.log("CRONOS : "+argv.cronos)
	
	let json_name = path.join(argv.cronos , "cronos.json" )
	let json_data = await pfs.readFile(json_name,{ encoding: 'utf8' })
	let config = JSON5.parse(json_data) // sloppy json parse for handwritten files

	console.log(stringify(config))

/*

# init

git clone --no-checkout --reference . . q0 && cd q0 && git checkout --orphan q0


# pull

rm -rf q0 && git clone --reference . --branch q0 . q0


# update

cd q0
mkdir downloads && mkdir packages && wget http://d-portal.org/q.xml?title_like=%25COVID-19%25 -O downloads/activities.xml

../../dflat packages activities --dir cronos/q0
cp activities/*.xml .
rm -rf downloads && rm -rf packages && rm -rf activities && rm -rf reporting-orgs


# push

cd q0
git add *.xml && git push --set-upstream origin q0
cd ..
git push --all

*/




}

/*#js.dflat.help

*/
cronos.help = async function(argv){
	console.log(
`
>	dflat cronos

Manage a git repo of historical data.

`)


}

