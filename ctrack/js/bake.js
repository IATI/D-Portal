// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var fs = require("fs");

var plate=require("./plate.js");

try { fs.mkdirSync("json"); } catch(e){}

var chunks={
	"text/eng.txt" : "json/eng.json",
	"text/fra.txt" : "json/fra.json",
	"text/base.html" : "json/chunks.json"
	}
for( var n in chunks )
{
	var v=chunks[n];
	fs.writeFileSync(v,JSON.stringify(
			plate.fill_chunks(
				fs.readFileSync(n,'utf8')
			)
		)
	);
	console.log("Parsed "+n+" into "+v);
}
