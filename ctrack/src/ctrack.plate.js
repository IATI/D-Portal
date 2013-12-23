
ctrack.plate={};

ctrack.plate.preps={};

ctrack.plate.prepare=function(str)
{
	if( ctrack.plate.preps[str] )
	{
		return ctrack.plate.preps[str];
	}
	
	var aa=str.split("{");
	var ar=[];
	
	ar.push(aa[0]);
	for(i=1;i<aa.length;i++)
	{
		ar.push("{"); // this string is used to mark the following string as something to replace
		var av=aa[i].split("}");
		for(i=0;i<av.length;i++)
		{
			ar.push(av[i]);
		}
	}
	ctrack.plate.preps[str]=ar;
	return ar;
}

ctrack.plate.lookup=function(str,dat)
{
	if( dat[str] )
	{
		return dat[str];
	}
	return "{"+str+"}"; // put the squiglys back
}

ctrack.plate.chunk=function(str,dat)
{
	return ctrack.plate.replace( ctrack.chunks[str] ,dat);
}

ctrack.plate.replace=function(str,dat)
{
	var aa=ctrack.plate.prepare(str);
	
	var r=[];
	
	for(i=0;i<aa.length;i++)
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

