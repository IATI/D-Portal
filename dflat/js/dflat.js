// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dflat=exports;

var util=require('util');

var entities = require("entities");

var jml = require("./jml.js");
var xson = require("./xson.js");

var database = require("../json/database.json");
let codemap = require('../json/codemap.json')

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// trim white space and force lowercase and replace any non alpha or numeric or _ chars with -
dflat.saneid=function(insaneid)
{
	return insaneid.trim().toLowerCase().replace(/\W+/g,"-")
}


// parse the xml string into a flat structure
dflat.xml_to_xson=function(data)
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
		if(typeof v === 'string')
		{
			v=v.trim()
			v=v.replace("\r\n","\n") // convert CRLF
			v=v.replace("\r","\n") // convert CR
		}
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
/*
if(np.name=="/iati-activities/iati-activity/iati-identifier")
{
console.log(it)
}
else
if(np.name=="/iati-activities/iati-activity/transaction")
{
process.stdout.write(".")
}
*/
		var info = database.paths[ np.name ]

		if( info && info.multiple ) // can there be multiples?
		{
			var n=pretrim( np.name , np.trim ) // trim

			op.store[ n ]=op.store[ n ] || []
			np.store={}
			np.trim=np.name
			op.store[ n ].push(np.store)
		}
		
		dump_attr(it,np)
		if(it[1]) { dump(it[1],np) }

	}
	dump(data,{root:"",store:flat})



	return flat
}


dflat.xson_to_xsv=function(data,root,paths)
{

	var header=[]
	var t={}
	xson.all(data,function(v,a){
		var n=a.join("")
		for(let path in paths)
		{
			if(n.startsWith(path)) // only remember these values
			{
				n=n.substr( root.length )
				t[n]=true
				break
			}
		}
	})
	for(var n in t)
	{
		header.push(n)
	}
	header.sort()
	header.unshift(root)
	header.unshift("parent")
	header.unshift("index")

	var lines=[]
	
	lines.push(header.join(","))

	var row=function(it)
	{
		var t=[];
		t.push(it[0]);
		t.push(it[1]);
		t.push(it[2]);
		for(var i=3;i<header.length;i++)
		{
			var head=header[i]
			if( it[root+head] !== undefined )
			{
				var s=""+it[root+head]
				if(s.includes(",") || s.includes(";") || s.includes("\t") || s.includes("\n") ) // need to escape
				{
					s="\""+s.replace("\n","\\n").replace("\"","\"\"")+"\""; // wrap in quotes and double quotes in string and kill newlines
				}
				t.push( s );
			}
			else
			{
				t.push("");
			}
		}
		while(t[t.length-1]==="") { t.splice(-1) } // trim trailing commas
		lines.push(t.join(","))
	}
	

	var rows=[]

	var walk
	walk=function(it,nn,row)
	{
		var basepath=nn.join("")

		if(basepath==root) // start a new item
		{
			if(row[2]!=="") // check if we are already done
			{
				row={0:rows.length+1,2:basepath.substr( root.length )}
				rows[rows.length]=row // new row
			}
		}

		for(const n of Object.keys(it).sort() ) // force order
		{
			var v=it[n]
			if(Array.isArray(v))
			{
				if(v.length>1)
				{
					for(let i=0;i<v.length;i++)
					{
						if(basepath.startsWith(root)) // always need a new row to keep heirachy
						{
							rows[rows.length]={ 0:rows.length+1 , 1:row[0] , 2:(basepath+n).substr( root.length ) } // new row
							walk( v[i] , nn.concat([n]) , rows[rows.length-1] )
						}
						else
						{
							walk( v[i] , nn.concat([n]) , row )
						}
					}
				}
				else
				if(v.length==1)
				{
					walk( v[0] , nn.concat([n]) , row ) // not a new row just a new path
				}
			}
			else
			{
				for(let path in paths)
				{
					if(basepath.startsWith(path)) // only remember these values
					{
						row[ basepath+n ]=v
						break
					}
				}
			}
		}
	}
	if( Array.isArray(data) ) // hack for possible top level array
	{
		walk({"":data},[],{})
	}
	else
	{
		walk(data,[],{})
	}

	for(var v of rows)
	{
		row(v)
	}

	return lines.join("\n")
}

// perform sanitation work on the input XML
dflat.clean=function(data)
{
	dflat.clean_copy_toplevel_attributes(data)
	dflat.clean_copy_defaults(data)
	dflat.clean_reduce_values(data)
}

// precalculate currency default map
let currencymap={}
for( const n in database.paths )
{
	if(n.endsWith("@currency"))
	{
		let v=database.paths[n]
		let d=""
		let a=""
		for( let i=0 ; i<v.jpath.length-1 ; i++ )
		{
			d+=v.jpath[i]
		}
		a=v.jpath[v.jpath.length-1]

		currencymap[d]=a // hopefully only one per parent (this might break...)
	}
}

// precalculate currency default map
let vocabmap={}
for( const n in database.paths )
{
	if(n.endsWith("@vocabulary"))
	{
		let v=database.paths[n]
		let d=""
		let a=""
		for( let i=0 ; i<v.jpath.length-1 ; i++ )
		{
			d+=v.jpath[i]
		}
		a=v.jpath[v.jpath.length-1]

		vocabmap[d]=a // hopefully only one per parent (this might break...)
	}
}

// precalculate langauge default map
let langmap={}
for( const n in database.paths )
{
	if( n.endsWith("@xml:lang") )
	{
		let v=database.paths[n]
		let d=""
		let a=""
		for( let i=0 ; i<v.jpath.length-1 ; i++ )
		{
			d+=v.jpath[i]
		}
		a=v.jpath[v.jpath.length-1]

		langmap[d]=a // hopefully only one per parent (this might break...)
	}
}

// copy all the atributes on iati-activities into each sub iati-activitiy
// and do the same for iati-organisations into iati-organisation
// so that when these individual activities are removed from their original file
// we still know what these values where
dflat.clean_copy_toplevel_attributes=function(data)
{

	if( data["/iati-activities/iati-activity"] )
	{
		let ac={}
		for( const name in data ) // find iati-activities attributes
		{
			let aa = name.split("@")
			if( aa[1] && aa[0]=="/iati-activities")
			{
				ac["@"+aa[1]]=data[name]
			}
		}
		for( const act of data["/iati-activities/iati-activity"] )
		{
			for( const n in ac )
			{
				if( ! act[n] ) // do not destroy existing values
				{
					act[n]=ac[n]
				}
			}
		}
	}

	if( data["/iati-organisations/iati-organisation"] )
	{
		let ac={}
		for( const name in data ) // find iati-activities attributes
		{
			let aa = name.split("@")
			if( aa[1] && aa[0]=="/iati-organisations")
			{
				ac["@"+aa[1]]=data[name]
			}
		}
		for( const act of data["/iati-organisations/iati-organisation"] )
		{
			for( const n in ac )
			{
				if( ! act[n] ) // do not destroy existing values
				{
					act[n]=ac[n]
				}
			}
		}
	}
	return data
}

// Reduce values based on types to make them easier to query
// So for example multiple boolean values are converted to 0 and 1 from any true and false strings.
// we can also force cast numbers and dates and times here to remove bad values.
dflat.clean_reduce_values=function(data)
{
	xson.walk(data,function(it,paths,index){

		let path=paths.join("")


		for(let n of Object.keys(it)) // this caches the keys so we can modify
		{
			let v=it[n]
			let p=database.paths[path+n]

			if( codemap[path+n] || n.endsWith("@xml:lang") ) // this is a lookup code so treat as special
			{
				v=(v).toString().trim().toUpperCase() // sanity, trim and uppercase all codes
				it[n]=v
			}

			if( p )
			{
				if( (p.type=="int") || (p.type=="uint") || (p.type=="number") )
				{
					if(typeof v == "string" )
					{
						v=v.trim().toLowerCase()
						
						if(Number(v)==v) // converts to number if the act is non destructive
						{
							it[n]=Number(v)
						}
					}
				}
				if(p.type=="bool")
				{
					if(typeof v == "string" )
					{
						v=v.trim().toLowerCase()
						
						if(Number(v)==v) // converts to number
						{
							it[n]=Number(v)
						}
						
						if(v=="true")
						{
							it[n]=1
						}
						if(v=="false")
						{
							it[n]=0
						}
					}
				}
			}
			
			if(it[n]==="") { delete it[n] } // delete empty strings
		}
	})
}

// copy the defaults explicitly into the places they should apply
dflat.clean_copy_defaults=function(data)
{
	let f=function(root,act)
	{
		if(!act["@xml:lang"]) { act["@xml:lang"]="EN" } // a missing default language is assumed to be english

		// vocab is in "wrong" place for these items, so force copy it
		if( act["/country-budget-items@vocabulary"] && act["/country-budget-items/budget-item"] )
		{
			for(const it of act["/country-budget-items/budget-item"] )
			{
				it["@vocabulary"]=act["/country-budget-items@vocabulary"]
			}
		}
		xson.walk(act,function(it,paths,index){
			let path=root+paths.join("")
			if(act["@default-currency"]) // copy default to all missing @currency attributes 
			{
				let v=currencymap[path]
				if(v)
				{
					if(!it[v])
					{
						it[v]=act["@default-currency"]
					}
				}
			}
			if(act["@xml:lang"]) // copy default to all missing @lang attributes 
			{
				let v=langmap[path]
				if(v)
				{
					if(!it[v])
					{
						it[v]=act["@xml:lang"]
					}
				}
			}
			let v=vocabmap[path] // set default vocabulary to 1
			if(v)
			{
				if(!it[v])
				{
					it[v]="1"
				}
			}
		})
	}
	
	for( const act of (data["/iati-activities/iati-activity"] || [] ) )
	{
		f("/iati-activities/iati-activity",act)
	}

	for( const act of (data["/iati-organisations/iati-organisation"] || [] ) )
	{
		f("/iati-organisations/iati-organisation",act)
	}

	return data
}
