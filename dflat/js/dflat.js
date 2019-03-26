// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dflat=exports;

var util=require('util');

var entities = require("entities");

var jml = require("./jml.js");


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// parse the xml string into a flat structure
dflat.xml_to_json=function(data)
{
	data=jml.from_xml(data)

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
			
			if( np.name == "/iati-activities/iati-activity" )
			{
				np.name="iati-activity"
				np.root=np.name+"/"
				if(it["xml:lang"])
				{
					np.lang=it["xml:lang"]
				}
				flat["/iati-activities/iati-activity"]=flat["/iati-activities/iati-activity"] || []
				np.store={}
				np.trim=np.name
				flat["/iati-activities/iati-activity"].push(np.store)
			}

// split out *possible* multiple elemets into arrays, no matter how many there are
			if( multi_elements[ np.name ] ) // can there be multiples?S
			{
				var n=pretrim( np.name , "iati-activity" ) // trim

				op.store[ n ]=op.store[ n ] || []
				np.store={}
				np.trim=np.name
				op.store[ n ].push(np.store)
			}

// flatten description using @type
			if( np.name == "iati-activity/description" )
			{
				np.name=np.name+"/"+(it["type"] || "1") // defaults to type 1
				np.root=np.name+"/"
				if(it[1]) { dump(it[1],np) }
				return
			}

// flatten activity-date using @type	
			if( it["type"] && ( np.name == "iati-activity/activity-date" ) )
			{
				np.name=np.name+"/"+it["type"]
				np.root=np.name+"/"
				dump_attr(it,np)
				if(it[1]) { dump(it[1],np) }
				return
			}

			dump_attr(it,np)
			if(it[1]) { dump(it[1],np) }
		}

	}
	dump(data,{root:"/",store:flat})



	return flat
}
