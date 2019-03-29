// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var xson=exports;


xson.walk=function(it,cb)
{
	if(!it){ return }

	var walk
	walk=function(it,nn)
	{
		if( cb(it,nn) ) { return }
		for(var n of Object.keys(it).sort() ) // force order
		{
			var v=it[n]
			if(Array.isArray(v))
			{
				for(var i=0;i<v.length;i++)
				{
					if( typeof v[i] === 'object' ) // may be string
					{
						walk( v[i] , nn.concat([n]) )
					}
				}
			}
		}
	}
	walk(it,[])
}

xson.pairs=function(it,cb)
{
	xson.walk(it,function(it,nn){
		for(var n of Object.keys(it).sort() ) // force order
		{
			var v=it[n]
			var aa=nn.concat([n])
			if(!Array.isArray(v))
			{
				if( cb( v , aa ) ) { return }
			}
			else
			{
				if( typeof v[0] !== 'object' )
				{
					for(var i=0;i<v.length;i++)
					{
						if( cb( v , aa ) ) { return }
					}
				}
			}
		}
	})
}
