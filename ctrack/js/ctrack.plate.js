// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var ctrack=ctrack || exports;

ctrack.plate={};

// is caching worthwhile?
ctrack.plate.preps={};
ctrack.plate.prepare_cache=function(str)
{
	if( ctrack.plate.preps[str] )
	{
		return ctrack.plate.preps[str];
	}
	var ar=ctrack.plate.prepare(str);
	ctrack.plate.preps[str]=ar;
	return ar;
}
	
ctrack.plate.prepare=function(str)
{
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

ctrack.plate.lookup=function(str,dat)
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

ctrack.plate.chunk=function(str,dat)
{
	return ctrack.plate.replace( ctrack.chunks[str] ,dat);
}

ctrack.plate.recurse_chunk=function(str,dat)
{
	return ctrack.plate.recurse_replace( ctrack.chunks[str] ,dat);
}

ctrack.plate.chunks=function(str,dat)
{
	return ctrack.plate.replaces( ctrack.chunks[str] ,dat);
}

ctrack.plate.replace=function(str,dat)
{
	var aa=ctrack.plate.prepare(str);
	
	var r=[];
	
	for(var i=0;i<aa.length;i++)
	{
		var v=aa[i];
		if( v=="{" ) // next string should be replaced
		{
			i++;
			v=aa[i];
			r.push( ctrack.plate.lookup( v,dat ) );
		}
		else
		{
			r.push(v);
		}
	}

	return r.join("");
}

// repeat untill all things that can expand, have expanded
ctrack.plate.recurse_replace=function(str,arr)
{
	var check="";
	var sanity=0;
	while( str != check) //nothing changed on the last iteration so we are done
	{
		check=str;
		str=ctrack.plate.replace(str,arr);
		sanity++;
		if(sanity>100) { break; }
	}
	
	return str;
}

// perform replace on an array of strings?
ctrack.plate.replaces=function(str,arr)
{
	var r=[];
	for(var i=0;i<arr.length;i++)
	{
		r.push( ctrack.plate.replace(str,arr[i]) );
	}

	return r.join("");

}

