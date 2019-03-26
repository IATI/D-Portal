// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dflat_parse=exports;

var entities = require("entities");

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
dflat_parse.xml_to_jml=function(data)
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

// maintain cdata text flag
	parser.onopencdata=()=>{ cdata=true; }
	parser.onclosecdata=()=>{ cdata=false; }

//throw any errors
	parser.onerror=(e)=>{ throw new Error(e) }

	parser.write(data);

	return stack[0][1][0];
	
}

// turn json back into xml
dflat_parse.jml_to_xml=function(data)
{
	if("string"==typeof data)
	{
		data=JSON.parse(data);
	}
	
	var ss=[];

	if(!data){ return; }
	var f; f=function(it)
	{
		if("string" == typeof it)
		{
			ss.push(entities.encodeXML(it));
		}
		else
		if("object" == typeof it)
		{
			ss.push("<"+it[0]);
			for(var n in it) // attributes
			{
				if(n!=0 && n!=1)
				{
					ss.push(" "+n+"="+"\""+entities.encodeXML( String(it[n]) )+"\"");
				}
			}
			if(it[1]) // child entities
			{
				ss.push(">");
				it[1].forEach(f);
				ss.push("</"+it[0]+">");
			}
			else // nothing inside so just close
			{
				ss.push("></"+it[0]+">");
			}
		}
	};
	if(data.forEach) { data.forEach(f); }
	else { f(data); }
	
	return ss.join("");
}

