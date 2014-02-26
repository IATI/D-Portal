// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var plate=exports;

var ctrack=require("./ctrack.js")
//var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

plate.chunks=[];

// break a string into chunks ( can be merged and overried other chunks )
plate.fill_chunks=function(str,chunks)
{
	var chunks=chunks || {};

	var chunk;
	str.split("\n").forEach(function(l){
			if(l[0]=="#")
			{
				if(l[1]!="#")
				{
					var name=l.substring(1).replace(/\s+/g, " ").split(" ")[0];
					if(name)
					{
						chunk=chunks[name];
						if(!chunk) // create
						{
							chunk=[];
							chunks[name]=chunk;				
						}
						else
						if( "string" == typeof chunk ) // upgrade from string
						{
							chunk=[];
							chunk[0]=chunks[name];
							chunks[name]=chunk;
						}
					}
				}
			}
			else
			if(chunk)
			{
				chunk.push(l);
			}
		});

	for( n in chunks )
	{
		if( "object" == typeof chunks[n] ) // join arrays
		{
			chunks[n]=chunks[n].join("\n");
		}
	}

	return chunks;
}

// break a string on {data} ready to replace
plate.prepare=function(str)
{
	if(!str) { return undefined; }

	var aa=str.split("{");
	var ar=[];
	
	ar.push(aa[0]);
	for(var i=1;i<aa.length;i++)
	{
		var av=aa[i].split("}");
		if(av.length>=2)
		{
			ar.push("{"); // this string is used to mark the following string as something to replace
			ar.push(av[0]);
			ar.push(av[1]);
			for(var j=2;j<av.length;j++) // multipl close tags?
			{
				ar.push("}"+av[2]); // then missing open so just leave it as it was
			}
		}
		else
		{
			ar.push("{"+aa[i]); // missing close so just leave it as it was
		}
	}
	return ar;
}



plate.namespaces=[]; // array of public namespaces to lookup in

// add this dat into the namespaces that we also check when filling in chunks
plate.push_namespace=function(dat)
{
	plate.namespaces.push(dat);
}

// lookup a str in dat or namespace
plate.lookup=function(str,dat)
{
	var r;
	if(dat) { r=plate.lookup_single(str,dat); if(r!==undefined) { return r; } } // check dat first
	for(var i=0;i<plate.namespaces.length;i++)
	{
		r=plate.lookup_single(str,plate.namespaces[i]); if(r!==undefined) { return r; } // then look in all namespaces
	}
}
// lookup only in dat
plate.lookup_single=function(str,dat)
{
	if( dat[str] !== undefined ) // simple check
	{
		return dat[str];
	}
	//todo add sub array . notation split and lookup
}

// replace once only, using dat and any added namespaces
plate.replace_once=function(str,dat)
{
	var aa=plate.prepare(str);
	
	if(!aa) { return str; }
	
	var r=[];
	
	for(var i=0;i<aa.length;i++)
	{
		var v=aa[i];
		if( v=="{" ) // next string should be replaced
		{
			i++;
			v=aa[i];
			var d=plate.lookup( v,dat );
			if( d == undefined )
			{
				r.push( "{"+v+"}" );
			}
			else
			{
				r.push( d );
			}
		}
		else
		{
			r.push(v);
		}
	}

	return r.join("");
}

// repeatedly replace untill all things that can expand, have expanded, or we ran out of sanity
plate.replace=function(str,arr)
{
	var check="";
	var sanity=100;
	while( str != check) //nothing changed on the last iteration so we are done
	{
		check=str;
		str=plate.replace_once(str,arr);
		if(--sanity<0) { break; }
	}
	
	return str;
}


