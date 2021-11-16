// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cronos=exports;

const assert = require('assert')
const path = require('path')
var shell = require('shelljs')

var pfs=require("pify")( require("fs") )
var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var stringify = require('json-stable-stringify');


const JSON5 = require('json5')

/*#js.dflat.update

*/
cronos.update = async function(argv){

	console.log("CRONOS : "+argv.cronos)
	
	let json_name = path.join(argv.cronos , "cronos.json" )
	let json_data = await pfs.readFile(json_name,{ encoding: 'utf8' })
	let config = JSON5.parse(json_data) // sloppy json parse for handwritten files

	console.log(stringify(config))

	shell.cd(argv.cronos) // our working chronos directory

	if(!shell.which("git"))
	{
		shell.echo("ERROR we requires git to be available")
		shell.exit(1)
	}
	

	if(!shell.test('-d', ".git"))
	{
		shell.echo("cronos.json must exist in the root of a git repository as we will be adding data files into one of its git branches")
		shell.exit(1)
	}


	for( let idx in config.q )
	{
		let q=config.q[idx]

		shell.echo("")
		shell.echo("checking q"+idx+" : "+(q.title||"UNKNOWN"))
		shell.echo("")

		shell.exec("git clean -f -d") // remove junk
		shell.exec("git checkout q"+idx) // make sure we have copy from remote
		shell.exec("git checkout master") // and back to master

//		if( shell.exec("git branch -a").grep("remotes/origin/q"+idx).code!=0 )
		if( shell.exec("git rev-parse --verify q"+idx).code !== 0 )
		{
			shell.echo("")
			shell.echo("creating branch q"+idx)
			shell.echo("")
			
			shell.rm("-rf","q"+idx)
			shell.exec("git clone --no-checkout --reference . . q"+idx)
			shell.cd("q"+idx)
			shell.exec("git checkout --orphan q"+idx)
		}
		else
		{
			shell.echo("")
			shell.echo("cloning branch q"+idx)
			shell.echo("")

			shell.rm("-rf","q"+idx)
			shell.exec("git clone --reference . --branch q"+idx+" . q"+idx)
			shell.cd("q"+idx)
		}


		shell.echo("")
		shell.echo("fetching data q"+idx+" : "+(q.title||"UNKNOWN"))
		shell.echo("")
		
		shell.mkdir("downloads")
		shell.mkdir("xml")
		shell.exec("wget \""+q.xml+"\" -O downloads/activities.xml")

		shell.echo("")
		shell.echo("processing data q"+idx+" : "+(q.title||"UNKNOWN"))
		shell.echo("")

		shell.exec("node ../../js/cmd.js packages-parse activities --dir .")
		
		shell.rm("*.xml") // remove old xml files		
		shell.cp("xml/activities/*.xml",".") // copy all files

		shell.rm("-rf","downloads") // make sure
		shell.rm("-rf","logs")
		shell.rm("-rf","xml")
		shell.rm("-rf","json")

		shell.exec("git add *.xml")
		shell.exec("git clean -f -d") //remove junk
		shell.exec("git add .") // auto delete removed files
		shell.exec("git commit -m.")

		shell.exec("git push --set-upstream origin q"+idx)


		shell.cd("..")

	}

	shell.echo("")
	shell.echo("pushing all updates to github")
	shell.echo("")

	shell.exec("git push --all")

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

