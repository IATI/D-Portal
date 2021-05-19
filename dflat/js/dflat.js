// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dflat=exports;

var util=require('util');

var entities = require("entities");

var papa = require('papaparse');

var stringify = require('json-stable-stringify');

var jml = require("./jml.js");
var xson = require("./xson.js");
var savi = require("./savi.js");

var database = require("../json/database.json");
let codemap = require('../json/codemap.json')

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// trim white space and force lowercase and replace any non alpha or numeric or _ chars with -
dflat.saneid=function(insaneid)
{
	return insaneid.trim().toLowerCase().replace(/\W+/g,"-")
}


// convert json back into xml
dflat.xson_to_xml=function(json)
{
	// try and yank highest version number we can find out of the activities
	if( json["/iati-activities/iati-activity"] )
	{
		let v=parseFloat(json["/iati-activities@version"]||0)
		for(let it of json["/iati-activities/iati-activity"] )
		{
			let t=parseFloat(it["@iati-activities:version"])
			if(t && t>v) { v=t }
		}
		if(v)
		{
			json["/iati-activities@version"]=v
		}
	}

	// try and yank highest version number we can find out of the organisation
	if( json["/iati-organisations/iati-organisation"] )
	{
		let v=parseFloat(json["/iati-organisations@version"]||0)
		for(let it of json["/iati-organisations/iati-organisation"] )
		{
			let t=parseFloat(it["@iati-organisations:version"])
			if(t && t>v) { v=t }
		}
		if(v)
		{
			json["/iati-organisations@version"]=v
		}
	}


	let j=xson.to_jml(json,function(root,tab){


		tab.sort(function(a,b){
			

			let pa=database.paths[root+a]
			let pb=database.paths[root+b]
			
			let ia=pa && pa.orderby || 999999
			let ib=pb && pb.orderby || 999999
			
			if( ia == ib )
			{
				if( a<b ) { return -1 } // alpha sort
				if( a>b ) { return  1 }
				return 0
			}
			else
			{
				return ia-ib
			}

		})

/*
console.log("==="+root)
for(let n in tab) {
	let pn=root+tab[n]
	let pd=database.paths[pn]
	console.log("+++"+pn+" "+( pd && pd.orderby || 999999 ))
}
*/

	})
// copy or fake a version into the header and sort elements

	return '<?xml version="1.0" encoding="UTF-8"?>\n'+jml.to_xml( j )
}

// convert json to a string
dflat.xson_to_string=function(json)
{
	return stringify(json,{space:" "})
}
	
// convert json into html ( BEWARE this will add extra junk to your json )
dflat.xson_to_html=function(json,origin)
{
	dflat.clean(json) // clean this data
	savi.prepare(json) // prepare for display
	savi.chunks.origin=origin || "http://d-portal.org"
	savi.chunks.iati=json
	var html=savi.plate(
`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="{origin}/savi/lib/savi.js" type="text/javascript" charset="utf-8"></script>
<script> require("savi").start({ embeded:true }); </script>
</head>
<body class="print"><style>{savi-page-css}{savi-css}</style><div>{iati./iati-activities/iati-activity:iati-activity||}{iati./iati-organisations/iati-organisation:iati-organisation||}</div></body>
`)
	return html
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
			v=v.replace(/\r\n/g,"\n") // convert CRLF
			v=v.replace(/\r/g,"\n") // convert CR
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
	if(!root) // guess
	{
		if( data["/iati-activities/iati-activity"] )
		{
			root="/iati-activities/iati-activity"
			paths={"/iati-activities/iati-activity":true}
		}
		else
		if( data["/iati-organisations/iati-organisation"] )
		{
			root="/iati-organisations/iati-organisation"
			paths={"/iati-organisations/iati-organisation":true}
		}
	}

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
				if(s.includes(",") || s.includes(";") || s.includes("\t") || s.includes("\n") || s.includes("\r") ) // need to escape
				{
					s="\""+s.replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\"/g,"\"\"")+"\""; // wrap in quotes and double quotes in string and kill newlines
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

dflat.xsv_to_xson=function(data)
{
	let ret={}
	let map={}
	let mappath={}
	
	let lines=papa.parse(data).data

	let head=lines[0]
	let root=head[2]
	for( let idx=1 ; idx<lines.length ; idx++ )
	{
		let line=lines[idx]
		let it={}
		let id=line[0]
		let parent_id=line[1]
		let path=line[2]
		let subpath=path

		let parent=ret
		if( parent_id )
		{
			let parentpath=mappath[ parent_id ]
			parent=map[ parent_id ]
			if( path.startsWith( parentpath ) )
			{
				subpath=path.substring(parentpath.length)
			}
//			console.log( parentpath + " ? " + path + " = " +subpath)
		}
		else
		{
			path=root
			subpath=root
		}
		parent[ subpath ]=parent[ subpath ] || []
		parent[ subpath ].push(it)

		map[id]=it
		mappath[id]=path

		for( let i=3 ; i<line.length ; i++ )
		{
			if( head[i] && line[i]!="" )
			{
				let name=head[i]
				if( name.startsWith(path) )
				{
					name=name.substring(path.length)
				}
				it[ name ]=line[i]
			}
		}
	}

// make sure we have arrays everywhere we need them in the json

	xson.walk(ret,function(v,a){
		if( typeof v == "object" )
		{
			let newpaths={}
			var root=a.join("")
//			console.log(root)
			for(var n of Object.keys(v).sort() ) // force order
			{
				if(n)
				{
					var path=root+n
					var info = database.paths[ path ]
					if(info && info.jpath)
					{
						let jpath=""
						let max=info.jpath.length-2
//						if( info.jpath[ info.jpath.length-1 ]=="" ) { max=max-1 } // special case for "" narratives
						for( let pi=0 ; pi < max ; pi++)
						{
							jpath=jpath+info.jpath[pi]
							if( (jpath==root) )
							{
								newpaths[ info.jpath[pi+1] ]=path
								break
							}
						}
					}
				}
			}
			for( let newpath in newpaths )
			{
				if(typeof v[newpath] != "object") // do not do twice
				{
//					console.log(root + " +++ " +newpath+ " from "+newpaths[newpath] + " ? "+typeof v[newpath])
					let it={}
					for(var n of Object.keys(v).sort() ) // force order
					{
						if( n.startsWith(newpath) )
						{
							it[ n.substring(newpath.length) ] = v[n]
							delete v[n]
						}
					}
					v[newpath]=[it]
				}
			}
		}
	})


	return ret
}


// perform sanitation work on the input XML
dflat.clean=function(data)
{
	dflat.clean_copy_toplevel_attributes(data)
	dflat.clean_copy_defaults(data)
	dflat.clean_reduce_values(data)
	dflat.clean_stable_sort_arrays(data)
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

// precalculate percent default 100% map
let percentmap={}
for( const n in database.paths )
{
	let v=database.paths[n]
	if(v && v.jpath)
	{
		let a=v.jpath[v.jpath.length-1]
		if(a=="@percentage")
		{
			let d=""
			for( let i=0 ; i<v.jpath.length-1 ; i++ )
			{
				d+=v.jpath[i]
			}
			percentmap[d]=a
		}
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
				ac[aa[1]]=data[name]
			}
		}
		for( const act of data["/iati-activities/iati-activity"] )
		{
			for( const n in ac )
			{
				if(n.includes(":"))
				{
					if(act["@"+n]===undefined)
					{
						act["@"+n]=ac[n]
					}
				}
				else
				{
					if(act["@iati-activities:"+n]===undefined)
					{
						act["@iati-activities:"+n]=ac[n]
						act["@xmlns:iati-activities"]="http://d-portal.org/xmlns/iati-activities"
					}
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
				ac[aa[1]]=data[name]
			}
		}
		for( const act of data["/iati-organisations/iati-organisation"] )
		{
			for( const n in ac )
			{
				if(n.includes(":"))
				{
					if(act["@"+n]===undefined)
					{
						act["@"+n]=ac[n]
					}
				}
				else
				{
					if(act["@iati-organisations:"+n]===undefined)
					{
						act["@iati-organisations:"+n]=ac[n]
						act["@xmlns:iati-organisations"]="http://d-portal.org/xmlns/iati-organisations"
					}
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
		if(root=="/iati-activities/iati-activity")
		{
			if( typeof act["@hierarchy"] == "undefined" ) { act["@hierarchy"]=1 } // a missing activity hierarchy is assumed to be 1
		}

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
					let aa=v.split("@")
					if( (aa[0]=="") || (it[ aa[0] ]!==undefined) ) // need to check this sub array exists
					{
						if(!it[v])
						{
							it[v]=act["@default-currency"]
						}
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
				let aa=v.split("@")
				if( (aa[0]=="") || (it[ aa[0] ]!==undefined) ) // need to check this sub array exists
				{
					if(!it[v])
					{
						it[v]="1"
					}
				}
			}
			if(percentmap[path]) // default any empty percents to 100%
			{
				if( it["@percentage"]===undefined )
				{
					it["@percentage"]=100
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

// find all arrays and sort them into a stable order
dflat.clean_stable_sort_arrays=function(data)
{
	let dosort=function(aa)
	{
		aa.sort(function(a,b){
			let sa=stringify(a)
			let sb=stringify(b)
			if(sa<sb) { return -1 }
			if(sb>sa) { return  1 }
			return 0;
		})
	}
	
	let f=function(root,act)
	{
		xson.walk(act,function(it,paths,index){
			let path=root+paths.join("")
			for( let n in it)
			{
				if( ( "object" == typeof it[n] ) && ( Array.isArray(it[n]) ) )
				{
					dosort(it[n])
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

// the dataset timestamps are mostly useless, especially the generated ones.
dflat.clean_remove_dataset_timestamps=function(data)
{
	let f=function(root,act)
	{
		for( let name in act )
		{
			if( name.endsWith("-datetime") ) // remove it
			{
				delete act[name]
			}
		}
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

