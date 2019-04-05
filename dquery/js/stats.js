// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var stats=exports;

var util=require('util');
var ls=function(a) { console.log(util.inspect(a,{depth:null})); }



var monitor = require("pg-monitor");
var pgopts={
};
if(process.env.DSTORE_DEBUG){ monitor.attach(pgopts); }
var pgp = require("pg-promise")(pgopts);


// create or return the db object
stats.db = function(){
	if(!stats.pg_db)
	{
		stats.pg_db = pgp(global.argv.pgro);
	}
	return stats.pg_db;
};


var serve_html = require('serve-static')(__dirname+'/../html', {'index': ['index.html', 'index.htm']})




stats.cmd = function(argv){

	var day=Math.floor((new Date())/8.64e7);
	var filename=argv._[1]
	var ret={}
	
	if(filename) // try and load in previous stats from this file
	{
		if(fs.existsSync(filename))
		{
			ret=JSON.parse( fs.readFileSync(filename).toString() )
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
}
