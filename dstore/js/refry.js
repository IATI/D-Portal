//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var refry=exports;
if(typeof refry  === "undefined") { dstore_db ={}; }
required["refry"]=refry;

var util=require('util');

var htmlparser=require('htmlparser');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


//
// Refry an XML string into json via htmlparser.
// Returns a json dumpable object.
// Each object is either a literal string or an object comprised of an
// entities supplied attributes plus two special attributes
// [0] is the name of the entity
// [1] is an array of child entities if any exist.
//
// This gives a rather compact xml representation in json format.
//
refry.xml=function(data)
{
	
	var dom;
	(new htmlparser.Parser(new htmlparser.DefaultHandler(function(e,d){
			if(!e) { dom=d; }
			},{ verbose: false, ignoreWhitespace: true }))).parseComplete(data);

//	ls(dom);
	
	var json=[];
	var xml_refry_dom;
	xml_refry_dom=function(dom,kids)
	{
		for(var i=0;i<dom.length;i++)
		{
			var v=dom[i];
			
			if(v.type=="tag")
			{
				var e=v.attribs || {};// reuse attribs as base
				e[0]=v.name;
				kids.push(e);
				if(v.children)
				{
					e[1]=[];
					xml_refry_dom(v.children,e[1]); // recurse
				}
			}
			else
			if(v.type=="text")
			{
				var e=kids.push(v.data); // push a string
			}
		}
	}
	
	xml_refry_dom(dom,json);

	return json;
}

// turn json back into xml
refry.json=function(json)
{
	var ss=[];

	if(!json){ return; }
	var f; f=function(it)
	{
		if(typeof it == "object")
		{
			if(it[0]==name) { cb(it); } // call parent first, then children
			if(it[1]) { it[1].map(f); }
		}
	};
	if(json.map) { json.map(f); }
	else { f(json); }
}

// return the first tag of the given name that we find (walking down the tree) or null
refry.tag=function(json,name)
{
	if(!json){ return; }
	var ret;
	var f; f=function(it)
	{
		if(!ret)
		{
			if(typeof it == "object")
			{
				if(it[0]==name) { ret=it } // only call once
				if(it[1]) { it[1].map(f); }
			}
		}
	};
	if(json.map) { json.map(f); }
	else { f(json); }
	
	return ret;
}
// return the enclosed value string of the first tag we find of the given name
refry.tagval=function(json,name)
{
	var t=refry.tag(json,name); // find
	if( t && t[1] && t[1][0] && ( "string" == typeof t[1][0] ) ) // check
	{
		return t[1][0];
	}
}

// callback for all tags of the given name, walking down the tree
refry.tags=function(json,name,cb)
{
	if(!json){ return; }
	var f; f=function(it)
	{
		if(typeof it == "object")
		{
			if(it[0]==name) { cb(it); } // call parent first, then children
			if(it[1]) { it[1].map(f); }
		}
	};
	if(json.map) { json.map(f); }
	else { f(json); }
}
