// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_stats=exports;


var wait=require("wait.for");

var fs = require('fs');
var util=require("util");
var json_stringify = require('json-stable-stringify')
	

var dstore_db=require('./dstore_db');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


// handle a cache download/import cmd line request
// cache is just a directory containing downloaded xml files
// so we can two step the download - import process
dstore_stats.cmd = function(argv){

	var day=Math.floor((new Date())/8.64e7);
	var filename=argv._[1]
	var stats={}
	
	if(filename) // try and load in previous stats from this file
	{
		if(fs.existsSync(filename))
		{
			stats=JSON.parse( fs.readFileSync(filename).toString() )
		}
	}
	
	stats.tables={}
	for(var tname in dstore_db.tables)
	{
		if(tname!="jml") // ignore jml it is a just a big dumb data cache
		{
			var v=dstore_db.tables[tname]
			var tab=[]
			stats.tables[tname]=tab
			for(var i=0;i<v.length;i++)
			{
				if(v[i].name)
				{
					tab[tab.length]=v[i].name
				}
			}
		}
	}
	
	stats.count=stats.count || {}
	stats.distinct=stats.distinct || {}
	for(var tname in stats.tables)
	{
console.log("TABLE "+tname)

		stats.count[tname]=stats.count[tname] || {}

		var q="SELECT COUNT(*) AS num FROM "+tname+" ; "
		var v={}
		var rows=wait.for(dstore_db.query,q,v);
console.log(rows[0].num+" == "+q)
		stats.count[tname][day]=rows[0].num

		stats.distinct[tname]=stats.distinct[tname] || {}
		for(var i=0;i<stats.tables[tname].length;i++)
		{
			var vname=stats.tables[tname][i]

			stats.distinct[tname][vname]=stats.distinct[tname][vname] || {}
			var q="SELECT COUNT(DISTINCT "+vname+") AS num FROM "+tname+" ; "
			var v={}
			var rows=wait.for(dstore_db.query,q,v);
console.log(rows[0].num+" == "+q)
			stats.distinct[tname][vname][day]=rows[0].num
		}
	}
	
	if(filename) // write out new stats
	{
		fs.writeFileSync(filename, json_stringify(stats,{ space: ' ' }) )
	}
	else // dump to commandline
	{
		console.log( json_stringify(stats,{ space: ' ' }) )
	}

};

