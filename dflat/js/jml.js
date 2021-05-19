// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var jml=exports;

var entities = require("entities");


// sort jml
jml.cmp=function(a,b)
{
	if(a.key=="0" || b.key=="1") { return -1 }
	if(b.key=="0" || a.key=="1") { return  1 }
	return a.key > b.key ? 1 : -1;
}



//
// Refry an XML string into json ( JML ) via sax.
// Returns a json dumpable object.
// Each object is either a literal string or an object comprised of an
// entities supplied attributes plus two special attributes
// [0] is the name of the entity
// [1] is an array of child entities if any exist.
//
// This gives a rather compact xml representation in json format.
//
jml.from_xml=function(data)
{
	var json=[];
	var stack=[];
	var top={};stack.push(top);
	var cdata=false;

	var parser = require('sax').parser(true)

	parser.onopentag=(node)=>{
		var parent=top
		top={};stack.push(top)
		for(n in node.attributes) { top[n]=node.attributes[n] }
		top[0]=node.name
		if(!parent[1]){ parent[1]=[]; }
		parent[1].push(top)
	}

	parser.onclosetag=(name)=>{
		stack.pop()
		top=stack[stack.length-1]
	}

	parser.ontext=(text)=>{
		text=text.trim()
		if(text!="") // ignore white space
		{
			if(!top[1]) {	top[1]=[]	}
			if(cdata)	{ 	top[1].push( (text) )	}
			else		{	top[1].push( (text) )	}
		}
	}
	parser.oncdata=parser.ontext // oncdata is same function as ontext

// maintain cdata text flag
	parser.onopencdata=()=>{ cdata=true; }
	parser.onclosecdata=()=>{ cdata=false; }

//throw any errors
	parser.onerror=(e)=>{ throw new Error(e) }

	parser.write(data);

	if(stack.length>1)
	{
		throw new Error("premature ending in xml data")
	}


	return stack[0] && stack[0][1] && stack[0][1][0];
	
}

// turn json back into xml
jml.to_xml=function(tree)
{
	if("string"==typeof tree)
	{
		tree=JSON.parse(tree);
	}
	
	var ss=[];

	if(!tree){ return; }
	var f; f=function(it,space)
	{
		if("string" == typeof it) // this is probably never used
		{
			ss.push(space);
			ss.push(entities.encodeXML(it));
			ss.push("\n");
		}
		else
		if("object" == typeof it)
		{
			ss.push(space);
			ss.push("<"+it[0]);
			for(const n of Object.keys(it).sort() ) // force order
			{
				if(n!=0 && n!=1)
				{
					ss.push(" "+n+"="+"\""+entities.encodeXML( String(it[n]) )+"\"");
				}
			}
			if(it[1].length>0) // child entities
			{
				if( (it[1].length==1) && ("string" == typeof it[1][0]) ) // smart wrap if just a single string
				{
					ss.push(">");
					ss.push(entities.encodeXML(it[1][0]));
					ss.push("</"+it[0]+">\n");
				}
				else
				{
					ss.push(">\n");
					it[1].forEach(function(it){return f(it,space+" ")});
					ss.push(space);
					ss.push("</"+it[0]+">\n");
				}
			}
			else // nothing inside so just close
			{
				ss.push("></"+it[0]+">\n");
			}
		}
	};
	if(tree.forEach) { tree.forEach(function(it){return f(it,"")}); }
	else { f(tree,""); }
	
	return ss.join("");
}

// call back is called with (element,xpath) for each jml element in the tree
// return true to prevent further recursion on this element
// if cruftless is true then ignore the namespace:xml cruft
jml.walk_xpath=function(tree,cb,cruftless)
{
	if(!tree){ return }

	var walk
	walk=function(it,root)
	{
		if( typeof it != "object" ) { return } // ignore string
		var name=it[0]
		if(cruftless) // remove cruft
		{
			var aa=name.split(":")
			name=aa[1] || aa[0]
		}
		var children=it[1]
		var path=root+"/"+name
		if( cb(it,path) ) { return } // callback can disable recursion by returning true
		if(Array.isArray(children))
		{
			for(var i=0;i<children.length;i++)
			{
				walk(children[i],root+"/"+name)
			}
		}
	}
	walk(tree,"")
}


jml.find_xpath=function(tree,findpath,cruftless)
{
	var ret=[]
	jml.walk_xpath(tree,(it,path)=>{
		if(path==findpath)
		{
			ret.push(it)
			return true
		}
		if(!findpath.startsWith(path)) { return true } // go no further down this path
	},cruftless)
	return ret
}

jml.find_child=function(tree,name)
{
	for(let i=0;i<tree[1].length;i++) // find
	{
		if(name==tree[1][i][0])
		{
			return tree[1][i]
		}
	}
}


jml.manifest_xpath=function(tree,path)
{
	if(path=="") { return tree }
	
	let aa=path.split("/") // path must begin with a / and not contain any @
	let ret=tree
	for( let i=1 ; i<aa.length ; i++) // find or create
	{
		let name=aa[i]
		let it=jml.find_child(ret,name)
		if(!it) // or create
		{
			it={0:name,1:[]}
			ret[1].push(it)
		}
		ret=it
	}
	return ret
}

