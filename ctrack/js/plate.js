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


// is caching worthwhile?
plate.preps={};
plate.prepare_cache=function(str)
{
	if( plate.preps[str] )
	{
		return plate.preps[str];
	}
	var ar=plate.prepare(str);
	plate.preps[str]=ar;
	return ar;
}
	
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
			for(var j=2;j<av.length;j++)
			{
				ar.push("}"+av[2]); // missing close so just leave it as it is
			}
		}
		else
		{
			ar.push("{"+aa[i]); // missing close so just leave it as it is
		}
	}
	return ar;
}

plate.lookup=function(str,dat)
{
	if( dat[str]!=undefined ) // check the local data first (data only used in this lookup)
	{
		return dat[str];
	}
	if( ctrack.args.chunks[str]!=undefined ) // then check args chunks (data used in all lookups)
	{
		return ctrack.args.chunks[str];
	}
	if( ctrack.chunks[str]!=undefined ) // then check global chunks as well (data used in all lookups)
	{
		return ctrack.chunks[str];
	}
	return "{"+str+"}"; // put the squiglys back
}

plate.chunk=function(str,dat)
{
	return plate.replace( ctrack.chunks[str] ,dat);
}

plate.recurse_chunk=function(str,dat)
{
	return plate.recurse_replace( ctrack.chunks[str] ,dat);
}

plate.chunks=function(str,dat)
{
	return plate.replaces( ctrack.chunks[str] ,dat);
}

plate.replace=function(str,dat)
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
			r.push( plate.lookup( v,dat ) );
		}
		else
		{
			r.push(v);
		}
	}

	return r.join("");
}

// repeat untill all things that can expand, have expanded
plate.recurse_replace=function(str,arr)
{
	var check="";
	var sanity=0;
	while( str != check) //nothing changed on the last iteration so we are done
	{
		check=str;
		str=plate.replace(str,arr);
		sanity++;
		if(sanity>100) { break; }
	}
	
	return str;
}

// perform replace on an array of strings?
plate.replaces=function(str,arr)
{
	var r=[];
	for(var i=0;i<arr.length;i++)
	{
		r.push( plate.replace(str,arr[i]) );
	}

	return r.join("");

}

