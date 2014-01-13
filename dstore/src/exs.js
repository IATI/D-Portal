//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var exs=exports;
if(typeof exs  === "undefined") { exs ={}; }
required["exs"]=exs;

var util=require('util');
var fs = require('fs');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var years=[];

// import the CSV, just call once on intialization
exs.load_csv=function()
{
	var csv=fs.readFileSync( __dirname + '/exs.csv', "utf8");
	var lines=csv.split("\n");
	var head;
	lines.map(function(line){
		var cs=line.split(",");
		if(head)
		{
			var v={}
			for(var i=0;i<head.length;i++)
			{
				var n=head[i];
				if(cs[i]=="")
				{
				}
				else
				{
					v[n]=Number(cs[i]);
				}
			}
			years.push(v);
		}
		else
		{
			head=cs;
		}
	})
	
//	console.log(years);
}

// exchange at the given years rate into usd
exs.exchange_year=function(year,ex,val)
{
	val=val || 1; // default of 1
	ex=ex.toUpperCase();
	var last;
	var ret;
	years.map(function(v){
		if(ret) { return; }
		if(v[ex]) // currency is available
		{
			if(v.year<=year) // aim for the right year or a future year
			{
				ret=v;
			}
			last=v; // remember
		}
	});
	ret=ret || last; // but try a previous year as a last resort
	if(ret)
	{
		return val/last[ex];
	}
}

// load the exchange rates from a csv
exs.load_csv();
