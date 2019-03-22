// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dflat=exports;

var util=require('util');

var entities = require("entities");



var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// parse the xml string into a flat structure
dflat.xml_to_json=function(data)
{
	var flat={}
	var jml=dflat.xml_to_jml(data)

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
	


	var multi_elements={
		"iati-activity/contact-info":true,
		"iati-activity/participating-org":true,
		"iati-activity/recipient-country":true,
		"iati-activity/recipient-region":true,
		"iati-activity/location":true,
		"iati-activity/sector":true,
		"iati-activity/policy-marker":true,
		"iati-activity/budget":true,
		"iati-activity/planned-disbursement":true,
		"iati-activity/transaction":true,
		"iati-activity/document-link":true,
		"iati-activity/related-activity":true,
		"iati-activity/legacy-data":true,
		"iati-activity/result":true,
		"iati-activity/humanitarian-scope":true,
		"iati-activity/other-identifier":true,
		"iati-activity/crs-add/other-flags":true,
		"iati-activity/country-budget-items/budget-item":true,
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
		
		if( it[0] == "narrative" )
		{
			if( Array.isArray(it[1]) && (it[1].length==1) && (typeof it[1][0] == "string") )
			{
				var lang = it["xml:lang"] || op.lang // use default lang
				store(op,op.root+"narrative/"+lang,it[1][0])
			}
		}
		else
		{
			var np=Object.assign({},op)
			np.name=op.root+it[0]
			np.root=np.name+"/"
			
			if(it[0]=="iati-activity" && op.root=="iati-activities/" )
			{
				np.name="iati-activity"
				np.root=np.name+"/"
				if(it["xml:lang"])
				{
					np.lang=it["xml:lang"]
				}
				flat["iati-activities/iati-activity"]=flat["iati-activities/iati-activity"] || []
				np.store={}
				np.trim=np.name
				flat["iati-activities/iati-activity"].push(np.store)
			}

// split out *possible* multiple elemets into arrays, no matter how many there are
			if( multi_elements[ op.root+it[0] ] ) // can there be multiples?S
			{
				var n=pretrim( op.root+it[0] , "iati-activity" ) // trim

				op.store[ n ]=op.store[ n ] || []
				np.store={}
				np.trim=np.name
				op.store[ n ].push(np.store)
			}

// flatten description using @type
			if( it[0]=="description"&& op.root=="iati-activity/" )
			{
				np.name=op.root+it[0]+"/"+(it["type"] || "1") // defaults to type 1
				np.root=np.name+"/"
				if(it[1]) { dump(it[1],np) }
				return
			}

// flatten activity-date using @type	
			if( it[0]=="activity-date" && it["type"] && op.root=="iati-activity/" )
			{
				np.name=op.root+it[0]+"/"+it["type"]
				np.root=np.name+"/"
				dump_attr(it,np)
				if(it[1]) { dump(it[1],np) }
				return
			}

			dump_attr(it,np)
			if(it[1]) { dump(it[1],np) }
		}

	}
	dump(jml,{root:"",store:flat})



	return flat
}



//
// Refry an XML string into json ( JML ) via htmlparser.
// Returns a json dumpable object.
// Each object is either a literal string or an object comprised of an
// entities supplied attributes plus two special attributes
// [0] is the name of the entity
// [1] is an array of child entities if any exist.
//
// This gives a rather compact xml representation in json format.
//
dflat.xml_to_jml=function(data)
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
dflat.jml_to_xml=function(data)
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

