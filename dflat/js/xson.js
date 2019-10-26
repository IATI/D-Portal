// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var xson=exports;

var jml = require("./jml.js");

// parse the xml string into a jml structure
// it is assumed every element can be multiple so is put in an array
xson.to_jml=function(data)
{
	var walk
	walk=function(it,out)
	{
		for(const n of Object.keys(it).sort() ) // force order
		{
			let v=it[n]
			if( Array.isArray(v) )
			{
				if(v.length==1 && "string" == typeof v[0])
				{
					let o=jml.manifest_xpath(out,n)
					o[1].push(v[0])
				}
				else
				{
					let aa=n.split("/")
					let ln=aa.pop()
					let an=aa.join("/")
					let o=jml.manifest_xpath(out,an)
					for( let i=0 ; i<v.length ; i++ )
					{
						let it={0:ln,1:[]}
						o[1].push(it)
						walk( v[i] , it )
					}
				}
			}
			else
			if( "object" == typeof v )
			{
				let o=jml.manifest_xpath(out,n)
				walk( v , o )
			}
			else
			{
				let aa=n.split("@")
				if(aa.length==2)
				{
					let o=jml.manifest_xpath(out,aa[0])
					o[ aa[1] ]=v
				}
				else
				{
					let o=jml.manifest_xpath(out,n)
					o[1].push(v)
				}
			}
		}
	}
	let out={0:"",1:[]}
	walk(data,out)
	return out[1][0]
}

// parse the xml string into a jml structure
// it is assumed every element can be multiple so is put in an array
xson.from_xml=function(data)
{
	if(typeof data=="string")
	{
		data=jml.from_xml(data)
	}
// else assume it is already parsed jml
	
	var flat={}

	var pretrim=function(s,b)
	{
		if( b && s.startsWith(b) )
		{
			s=s.substr(b.length)
		}
		return s
	}

	var store=function(op,n,v)
	{
//		console.log(n+" = "+v)
		var tn=pretrim(n,op.trim)
		op.store[tn]=v
	}
	
	var dump
	var dump_attr=function(it,op)
	{
		for(var name in it)
		{
			if( (name!="0") && (name!="1") )
			{
				store(op,op.name+"@"+name,it[name])
			}
		}
		if( Array.isArray(it[1]) && (it[1].length==1) && (typeof it[1][0] == "string") )
		{
			store(op,op.name,it[1][0])
		}
	}

	dump=function(it,op)
	{
		if(typeof it === 'string')
		{
			return
		}

		if(Array.isArray(it))
		{
			for(var i=0;i<it.length;i++)
			{
				dump(it[i],op)
			}
			return
		}
		
		var np=Object.assign({},op)
		np.name=op.root+"/"+it[0]
		np.root=np.name
		
		var n=pretrim( np.name , np.trim ) // trim

		op.store[ n ]=op.store[ n ] || []
		np.store={}
		np.trim=np.name
		op.store[ n ].push(np.store)
		
		dump_attr(it,np)
		if(it[1]) { dump(it[1],np) }

	}
	dump(data,{root:"",store:flat})

	return flat
}



xson.walk=function(it,cb)
{
	if(!it){ return }

	var walk
	walk=function(it,nn,idx)
	{
		if( cb(it,nn,idx) ) { return }
		for(var n of Object.keys(it).sort() ) // force order
		{
			var v=it[n]
			if(Array.isArray(v))
			{
				for(var i=0;i<v.length;i++)
				{
					if( typeof v[i] === 'object' ) // may be string
					{
						walk( v[i] , nn.concat([n]) , i )
					}
				}
			}
		}
	}
	walk(it,[],0)
}

xson.all=function(it,cb)
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

xson.compact=function(it)
{
	var walk
	walk=function(it)
	{
		let done=false
		while( !done ) // flaten arrays
		{
			let del_it={}
			let add_it={}
			for( let n in it )
			{
				let v=it[n]
				if( Array.isArray(v) )
				{
					if( v.length==1)
					{
						del_it[ n ]=true
						for( let nn in v[0] )
						{
							let vv=v[0][nn]
							add_it[ n+nn ]=vv
						}
					}
				}
			}
			done=true
			for( let n in del_it )
			{
				done=false
				delete it[n]
			}
			for( let n in add_it )
			{
				done=false
				it[n] = add_it[n]
			}
		}

		for( let n in it ) // recurse
		{
			let v=it[n]
			if( Array.isArray(v) )
			{
				for( let i=0 ; i<v.length ; i++ )
				{
					walk( v[i] )
				}
			}
			else
			if( "object" == typeof v )
			{
				walk( v )
			}
		}
		
	}
	walk(it)
	
	return it
}


// build full xpath value frequency stats for this xson
xson.xpath_stats=function(it)
{
	stats={}

	xson.all(it,function(value,path){
		let xpath=path.join("")
		if( ! stats[ xpath ] ) { stats[ xpath ]={} }
		stats[ xpath ][ value ] =  ( stats[ xpath ][ value ] || 0 ) + 1
	})

	return stats
}
