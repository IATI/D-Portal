// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var tongue=exports;

var wait=require('wait.for');
var util=require('util');
var csv=require('csv');
var fs = require('fs');

var plate=require("./plate.js");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


var build_csv=function(rows,head)
{
	var r=[];

	r.push(	head.join(",")+"\n" );
	for(var i=0;i<rows.length;i++)
	{
		var v=rows[i];
		var t=[];
		head.forEach(function(n){
			var s=""+v[n];
			if("string" == typeof s) // may need to escape
			{
				if(s.split(",")[1] || s.split("\n")[1] ) // need to escape
				{
					s="\""+s.split("\"").join("\"\"")+"\""; // wrap in quotes and double quotes in string
				}
			}
			t.push( s );
		});
		r.push(	t.join(",")+"\n" );
	}

	return r.join("");
}
			
// export a csv file containing all known chunks in all used languages
tongue.export=function(filename)
{
	var rows=[];
	var head=[];

	head.push("id");
	head.push("eng");
	head.push("fra");

	var eng=plate.fill_chunks( fs.readFileSync("text/eng.txt",'utf8') );
	var fra=plate.fill_chunks( fs.readFileSync("text/fra.txt",'utf8') );

	for(var n in eng)
	{
		rows.push({
			id:n,
			eng:eng[n],
			fra:fra[n]
		});
	}

//ls(rows);

	fs.writeFileSync(filename,build_csv(rows,head));
}


// replace chunks in lang.txt files with chunks stored in a csv file
tongue.import=function(filename)
{
	wait.launchFiber(function()
	{
		var lines=wait.for( function(cb){ csv().from.string( fs.readFileSync(filename,'utf8') ).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node!

//		ls(lines);

		var eng=plate.fill_chunks( fs.readFileSync("text/eng.txt",'utf8') );
		var fra=plate.fill_chunks( fs.readFileSync("text/fra.txt",'utf8') );

		var head={};
		for(var i=0;i<lines[0].length;i++)
		{
			var v=lines[0][i];
			head[ v.trim() ]=i;
		}

		for(var i=1;i<lines.length;i++)
		{
			var v=lines[i];
			var id=v[ head.id ];
			var t_eng=v[ head.eng ];
			var t_fra=v[ head.fra ];
			if(id)
			{
				if(t_eng&&t_eng.length>0)
				{
					eng[id]=t_eng;
				}
				if(t_fra&&t_fra.length>0)
				{
					fra[id]=t_fra;
				}
			}
		}

		fs.writeFileSync("text/eng.txt",plate.out_chunks(eng));
		fs.writeFileSync("text/fra.txt",plate.out_chunks(fra));

	});
}

