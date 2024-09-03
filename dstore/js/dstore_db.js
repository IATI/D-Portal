// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

module.exports=exports;

var dstore_db=exports;

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var iati_cook=require('./iati_cook');

var dflat=require('../../dflat/js/dflat');
var dflat_database=require('../../dflat/json/database.json');

var codes=require('../json/iati_codes');

var util=require('util');
var http=require('http');

var crypto=require('crypto');

var dstore_back=require('./dstore_back');
//dstore_back.dstore_db=dstore_db; // circular dependencies...

dstore_db.engine=dstore_back.engine;

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var tonumber=function(v)
{
	var n=Number(v);
	if(("number" == typeof n)&&(n==n)) // number and not nan
	{
		return n;
	}
	return undefined;
}


// values copied from the main activity into sub tables for quik lookup (no need to join tables)
dstore_db.bubble_act={
		"aid":true
	};
	
	
// data table descriptions
dstore_db.tables={
// TODO: jml should be removed and xson used instead...
	jml:[
		{ name:"aid",							TEXT:true , PRIMARY:true , HASH:true },
		{ name:"jml",							TEXT:true}, // moved to reduce the main act table size
	],
	xson:[
		{ name:"aid",							TEXT:true , INDEX:true },
		{ name:"pid",							TEXT:true , INDEX:true },
		{ name:"root",							TEXT:true , INDEX:true , NOT_NULL:true }, // root of the xson data
		{ name:"xson",							JSON:true , NOT_NULL:true }, // this is magical in postgres but just text in sqlite
// see below for code that will
// automagically include special indexes from xflat database
// in the following format
//		{	XSON_INDEX:["/iati-identifier","int"] },
	],
	hash:[
		{ name:"aid",							TEXT:true , PRIMARY:true , HASH:true },
		{ name:"hash_day",						INTEGER:true , INDEX:true }, // last detected change
		{ name:"hash_jml",						TEXT:true }, // our cached hash value for jml on this day
	],
	act:[
		{ name:"aid",							TEXT:true , PRIMARY:true , HASH:true },
		{ name:"reporting",						NOCASE:true , INDEX:true },
		{ name:"reporting_ref",					NOCASE:true , INDEX:true },
		{ name:"funder_ref",					NOCASE:true , INDEX:true },
		{ name:"title",							NOCASE:true },
		{ name:"slug",							NOCASE:true , INDEX:true },
		{ name:"status_code",					INTEGER:true , INDEX:true , codes:"activity_status" },	
		{ name:"day_start",						INTEGER:true , INDEX:true },	
		{ name:"day_end",						INTEGER:true , INDEX:true },
		{ name:"day_length",					INTEGER:true , INDEX:true },
		{ name:"description",					NOCASE:true },
		{ name:"commitment",					REAL:true , INDEX:true }, // USD (C)
		{ name:"spend",							REAL:true , INDEX:true },  // USD (D+E)
		{ name:"commitment_eur",				REAL:true , INDEX:true }, // EUR (C)
		{ name:"spend_eur",						REAL:true , INDEX:true },  // EUR (D+E)
		{ name:"commitment_gbp",				REAL:true , INDEX:true }, // GBP (C)
		{ name:"spend_gbp",						REAL:true , INDEX:true },  // GBP (D+E)
		{ name:"commitment_cad",				REAL:true , INDEX:true }, // CAD (C)
		{ name:"spend_cad",						REAL:true , INDEX:true },  // CAD (D+E)
		{ name:"flags",							INTEGER:true , INDEX:true },
// FLAGS set to 0 if good otherwise
// 1 == secondary publisher so transactions/budgets should be ignored to avoid double accounting
	],
// link to related activity ids found in the xml
	related:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true , NOT_NULL:true },
		{ name:"related_aid",					TEXT:true , INDEX:true , HASH:true , NOT_NULL:true },
		{ name:"related_type",					INTEGER:true , INDEX:true },
//		{ 										UNIQUE:["aid","related_aid"] }, // each pair is unique
	],
	trans:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"trans_ref",						NOCASE:true , HASH:true },
		{ name:"trans_description",				NOCASE:true},
		{ name:"trans_day",						INTEGER:true , INDEX:true },
		{ name:"trans_currency",				NOCASE:true , INDEX:true },
		{ name:"trans_value",					REAL:true , INDEX:true },
		{ name:"trans_usd",						REAL:true , INDEX:true },
		{ name:"trans_eur",						REAL:true , INDEX:true },
		{ name:"trans_gbp",						REAL:true , INDEX:true },
		{ name:"trans_cad",						REAL:true , INDEX:true },
		{ name:"trans_code",					NOCASE:true , INDEX:true , codes:"transaction_type" },
		{ name:"trans_flow_code",				NOCASE:true , INDEX:true },
		{ name:"trans_finance_code",			NOCASE:true , INDEX:true },
		{ name:"trans_aid_code",				NOCASE:true , INDEX:true },
// FLAGS set to 0 if good otherwise
// 1 == this is a fake transaction built after a full import for publishers that only publish C not D/E
		{ name:"trans_flags",					INTEGER:true , INDEX:true },
// added split values by sector/country
		{ name:"trans_country",					NOCASE:true , INDEX:true , codes:"country" },
		{ name:"trans_sector",					NOCASE:true , INDEX:true , codes:"sector" },
		{ name:"trans_sector_group",			NOCASE:true , INDEX:true , codes:"sector_category" },	// sector group ( category )
		{ name:"trans_id",						INTEGER:true , INDEX:true }, // unique id within activity, can be used to group split values
	],
	budget:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"budget",						NOCASE:true , INDEX:true }, // budget or plan (planned-disbursement) or total,country,org (organization total,country,org)
		{ name:"budget_priority",				INTEGER:true , INDEX:true }, // set to 0 if it should be ignored(bad data or total)
		{ name:"budget_type",					NOCASE:true , INDEX:true },	// planed disburtions have priority
		{ name:"budget_day_start",				INTEGER:true , INDEX:true },
		{ name:"budget_day_end",				INTEGER:true , INDEX:true },
		{ name:"budget_day_length",				INTEGER:true , INDEX:true }, // budgets longer than a year will have 0 priority
		{ name:"budget_currency",				NOCASE:true , INDEX:true },
		{ name:"budget_value",					REAL:true , INDEX:true },
		{ name:"budget_usd",					REAL:true , INDEX:true },
		{ name:"budget_eur",					REAL:true , INDEX:true },
		{ name:"budget_gbp",					REAL:true , INDEX:true },
		{ name:"budget_cad",					REAL:true , INDEX:true },
//		{ name:"budget_country",				NOCASE:true , INDEX:true },	// only used by country budget from orgfile
		{ name:"budget_org",					NOCASE:true , INDEX:true },	// only used by org budget from orgfile
// added split values by sector/country
		{ name:"budget_country",				NOCASE:true , INDEX:true , codes:"country"  },
		{ name:"budget_sector",					NOCASE:true , INDEX:true , codes:"sector" },
		{ name:"budget_sector_group",			NOCASE:true , INDEX:true , codes:"sector_category" },	// sector group ( category )
		{ name:"budget_id",						INTEGER:true , INDEX:true }, // unique id within activity, can be used to group split values
	],
	country:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"country_code",					NOCASE:true , INDEX:true , codes:"country" },
		{ name:"country_percent",				REAL:true , INDEX:true },
	],
	sector:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"sector_group",					NOCASE:true , INDEX:true , codes:"sector_category" },	// sector group ( category )
		{ name:"sector_code",					NOCASE:true , INDEX:true , codes:"sector" },
		{ name:"sector_percent",				REAL:true , INDEX:true },
	],
	location:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"location_code",					NOCASE:true , INDEX:true },
		{ name:"location_gazetteer_ref",		NOCASE:true , INDEX:true },
		{ name:"location_gazetteer",			NOCASE:true , INDEX:true },
		{ name:"location_name",					NOCASE:true , INDEX:true },
		{ name:"location_longitude",			REAL:true , INDEX:true },
		{ name:"location_latitude",				REAL:true , INDEX:true },
		{ name:"location_precision",			INTEGER:true , INDEX:true },
		{ name:"location_percent",				REAL:true , INDEX:true },
	],
// track what was imported...
	slug:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"slug",							NOCASE:true , INDEX:true },
	],

// include policy-markers (DAC codes only)
	policy:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"policy_code",					NOCASE:true , INDEX:true , codes:"policy" },				// the code is prefixed by the significance and an underscore then the code
	],

// include explicit tags and inferred tags from transaction/sector etc codes
// mode is an internal dportal list and not official tag vocab values ( expanded and mnemonic rather than numeric )
// mode can be null for explicit freeform text codes
	tag:[
		{ name:"aid",							TEXT:true , INDEX:true , HASH:true },
		{ name:"tag_mode",						NOCASE:true , INDEX:true  },				// tag mode
		{ name:"tag_code",						NOCASE:true , INDEX:true  },				// depends on mode
	],

};

dstore_db.tables_active={};
{
	for(let name in dstore_db.tables)
	{
		let t={};
		for(let i=0; i<dstore_db.tables[name].length; i++ )
		{
			let v=dstore_db.tables[name][i];
			
			let ty="null";
			
			if(v.TEXT) { ty="char"; }
			else
			if(v.NOCASE) { ty="char"; }
			else
			if(v.INTEGER) { ty="int"; }
			else
			if(v.REAL) { ty="float"; }
			
			if(v.name)
			{
				t[v.name]=ty;
			}
		}
		dstore_db.tables_active[name]=t;
	}
}

dstore_db.table_name_map={} // look up table from name
{
	let ns={};
	dstore_db.table_name_map=ns
	
	for(var name in dstore_db.tables )
	{
		for(var n in dstore_db.tables_active[name])
		{
			var tname=name
			if(n=="aid") { tname="act" } // force act for all aid columns
			ns[n]={ "format":dstore_db.tables_active[name][n] , "table":tname , "name":n };
		}
	}

	// special case for possible tags
	for(let mode in codes.tag_mode )
	{
		let alias="tag_"+(mode.toLowerCase())
		ns[alias]={
			"mode":mode ,
			"mode_name":alias+".tag_mode" ,
			"format":dstore_db.tables_active["tag"]["tag_code"] ,
			"table":"tag" ,
			"alias":alias ,
			"name":alias+".tag_code" }
	}
	ns["tag"]={ "format":dstore_db.tables_active["tag"]["tag_code"] , "table":"tag" , "name":"tag.tag_code" }
}

// console.log(dstore_db.table_name_map)



let dflat_indexs={}
for( let pn in dflat_database.paths ) // auto xson indexes
{
	let p=dflat_database.paths[pn]
	if( p.jpath )
	{
		let a=p.jpath[ p.jpath.length-1 ]
// do not index any path ending in "" as it can be huge text, eg narratives
		if( (a!="") /*&& (a!="@ref")*/ ) // ignore long strings
		{
			dflat_indexs[ a ] = p // merge
		}
	}
}
for( let pn in dflat_indexs ) // auto ad index
{
	let p=dflat_indexs[pn]
	let a=p.jpath[ p.jpath.length-1 ]
	let it={}
	it.XSON_INDEX=[a,p.type]
	dstore_db.tables.xson.push(it)
	
}
//console.log(dstore_db.tables.xson)



dstore_db.open = async function(instance){
	return await dstore_back.open(instance);
};



// pull every activity from the table and update *all* connected tables using its raw xml data

dstore_db.refresh_budget=async function(db,it,act,act_json,priority,splits)
{
	
	var t={};
	for(var n in dstore_db.bubble_act){ t[n]=act_json[n]; } // copy some stuff

	t.budget_priority=priority;
	
	t.budget="unknown";
	if(it[0]=="planned-disbursement") // flag to share table with planned-disbursement (they seem very similar)
	{
		t.budget="plan";
	}
	else
	if(it[0]=="budget")
	{
		t.budget="budget";
	}
	else
	if(it[0]=="total-budget")
	{
		t.budget="total";
		t.budget_priority=0; // make sure this does not double count
	}
	else
	if(it[0]=="recipient-org-budget")
	{
		t.budget="org";
		t.budget_priority=0; // make sure this does not double count
	}
	else
	if(it[0]=="recipient-country-budget")
	{
		t.budget="country";
		t.budget_priority=0; // make sure this does not double count
	}
	
	t["budget_type"]=it["type"];

	t["budget_day_start"]=				iati_xml.get_isodate_number(it,"period-start");
	t["budget_day_end"]=				iati_xml.get_isodate_number(it,"period-end");


	t["budget_day_length"]=null;
	if(t["budget_day_end"] && t["budget_day_start"] ) // length may be null for bad data
	{
		t["budget_day_length"]=			t["budget_day_end"]-t["budget_day_start"];
		if( t["budget_day_length"] < 0 )
		{
			t["budget_day_length"]=null; // ends before it starts
		}
	}
	
	if( (!t["budget_day_length"]) || (t["budget_day_length"] > 370) ) // allow a few days over a year
	{
		t.budget_priority=0; // remove priority
	}

	t["budget_currency"]=				iati_xml.get_value_currency(it,"value") || act["default-currency"] || act["@default-currency"] ;
	t["budget_value"]=					iati_xml.get_value(it,"value")||0;
	t["budget_usd"]=					iati_xml.get_ex(it,"value","USD",act["default-currency"]||act["@default-currency"])||0;
	t["budget_eur"]=					iati_xml.get_ex(it,"value","EUR",act["default-currency"]||act["@default-currency"])||0;
	t["budget_gbp"]=					iati_xml.get_ex(it,"value","GBP",act["default-currency"]||act["@default-currency"])||0;
	t["budget_cad"]=					iati_xml.get_ex(it,"value","CAD",act["default-currency"]||act["@default-currency"])||0;

	t["budget_org"]=					refry.tagattr(it,"recipient-org","ref");

	t["budget_country"]=null
	var country_code=refry.tagattr(it,"recipient-country","code");	
	if( country_code )
	{
		t["budget_country"] = country_code.trim().toUpperCase();
	}

	t["budget_sector"]=null
	t["budget_sector_group"]=null
	// maybe multiple vocabs
	refry.tags(it,"sector",function(it){ if(it.vocabulary=="DAC" || it.vocabulary=="1" || it.vocabulary=="2" || (!it.vocabulary) ) { // 5 or 3 digit codes
		var code=it.code;
		if(code)
		{
			code=(""+code).trim(); // remove dodgy white space
			var group=code.slice(0,3);
			if(code.length==3)
			{
				t["budget_sector"]=null
				t["budget_sector_group"]=group
			}
			else
			if(code.length==5)
			{
				t["budget_sector"]=code
				t["budget_sector_group"]=group
			}
		}
	}})



	t.jml=JSON.stringify(it);
	
	if(splits)
	{			
		splits.idx=splits.idx+1
	}
	
	t["budget_id"]=splits && splits.idx || 0

	if(splits)
	{
		var tt={} ; for(var n in t) { tt[n]=t[n] } // make a copy we can mess with
		if( t["budget_sector"] || t["budget_sector_group"] )
		{
			if(t["budget_country"]) // sector and country
			{
				await dstore_back.replace(db,"budget",t);
			}
			else // sector only
			{
				if(splits.country.length==0)
				{
					await dstore_back.replace(db,"budget",t);
				}
				else
				{
					for(var i=0;i<splits.country.length;i++)
					{
						var f=splits.country[i].country_percent/100
						for(var n in {"budget_value":1,"budget_usd":1,"budget_eur":1,"budget_gbp":1,"budget_cad":1})
						{
							tt[n]=t[n]*f
						}
						tt.budget_country = splits.country[i].country_code
						await dstore_back.replace(db,"budget",tt);
					}
				}
			}
		}
		else // no sector
		{
			if(t["budget_country"]) // country only
			{
				if(splits.sector.length==0)
				{
					await dstore_back.replace(db,"budget",t);
				}
				else
				{
					for(var i=0;i<splits.sector.length;i++)
					{
						var f=splits.sector[i].sector_percent/100
						for(var n in {"budget_value":1,"budget_usd":1,"budget_eur":1,"budget_gbp":1,"budget_cad":1})
						{
							tt[n]=t[n]*f
						}
						tt.budget_sector       = splits.sector[i].sector_code
						tt.budget_sector_group = splits.sector[i].sector_group
						await dstore_back.replace(db,"budget",tt);
					}
				}
			}
			else // no sector or country
			{
				if(splits.all.length==0)
				{
					await dstore_back.replace(db,"budget",t);
				}
				else
				{
					for(var i=0;i<splits.all.length;i++)
					{
						var f=splits.all[i].all_percent/100
						for(var n in {"budget_value":1,"budget_usd":1,"budget_eur":1,"budget_gbp":1,"budget_cad":1})
						{
							tt[n]=t[n]*f
						}
						tt.budget_country      = splits.all[i].country_code
						tt.budget_sector       = splits.all[i].sector_code
						tt.budget_sector_group = splits.all[i].sector_group
						await dstore_back.replace(db,"budget",tt);
					}
				}
			}
		}	
	}
	else
	{
		await dstore_back.replace(db,"budget",t);
	}
};


dstore_db.refresh_act = async function(db,aid,xml,head){

// choose to prioritise planned-transaction or budgets for each year depending on which we fine in the xml
// flag each year when present
	var got_budget={};

	var replace=async function(name,it)
	{
		await dstore_back.replace(db,name,it);
	}
	var select_by_aid=async function(name,aid)
	{
		return await dstore_back.select_by_aid(db,name,aid);
	}

	var refresh_transaction=async function(it,act,act_json,splits)
	{
//		process.stdout.write("t");

		var t={};
		for(var n in dstore_db.bubble_act){ t[n]=act_json[n]; } // copy some stuff

		t["trans_ref"]=				it["ref"];
		t["trans_description"]=		refry.tagval_narrative(it,"description");
		t["trans_day"]=				iati_xml.get_isodate_number(it,"transaction-date");

		t["trans_code"]=			iati_xml.get_code(it,"transaction-type");
		t["trans_flow_code"]=		iati_xml.get_code(it,"flow-type");
		t["trans_finance_code"]=	iati_xml.get_code(it,"finance-type");
		t["trans_aid_code"]=		iati_xml.get_code(it,"aid-type");

		
		t["trans_currency"]=		iati_xml.get_value_currency(it,"value") || act["default-currency"];
		t["trans_value"]=			iati_xml.get_value(it,"value")||0;
		t["trans_usd"]=				iati_xml.get_ex(it,"value","USD",act["default-currency"])||0;
		t["trans_eur"]=				iati_xml.get_ex(it,"value","EUR",act["default-currency"])||0;
		t["trans_gbp"]=				iati_xml.get_ex(it,"value","GBP",act["default-currency"])||0;
		t["trans_cad"]=				iati_xml.get_ex(it,"value","CAD",act["default-currency"])||0;


		t["trans_country"]=null
		var country_code=refry.tagattr(it,"recipient-country","code");	
		if( country_code )
		{
			t["trans_country"] = country_code.trim().toUpperCase();
		}

		t["trans_sector"]=null
		t["trans_sector_group"]=null
		// maybe multiple vocabs
		refry.tags(it,"sector",function(it){ if(it.vocabulary=="DAC" || it.vocabulary=="1" || it.vocabulary=="2" || (!it.vocabulary) ) { // 5 or 3 digit codes
			var code=it.code;
			if(code)
			{
				code=(""+code).trim(); // remove dodgy white space
				var group=code.slice(0,3);
				if(code.length==3)
				{
					t["trans_sector"]=null
					t["trans_sector_group"]=group
				}
				else
				if(code.length==5)
				{
					t["trans_sector"]=code
					t["trans_sector_group"]=group
				}
			}
		}})



// map new 201 codes to old		
		t["trans_code"]= codes.transaction_type_map[ t["trans_code"] ] || t["trans_code"];

// transaction flag, 0 by default
		t["trans_flags"]=			0;

		t.jml=JSON.stringify(it);
		
		if(splits)
		{			
			splits.idx=splits.idx+1

// attempt to build country/sector percentages backwards from transactions

			var value=(Math.abs(t["trans_usd"])||0)
			
			var country=t["trans_country"] // country split
			if(country)
			{
				splits.ANY= splits.ANY || {}
				splits.ANY.country = splits.ANY.country || {}
				splits.ANY.country[country]=(splits.ANY.country[country]||0)+value

				if(t["trans_code"]=="C")
				{
					splits.CC         = splits.CC         || {}
					splits.CC.country = splits.CC.country || {}
					splits.CC.country[country]=(splits.CC.country[country]||0)+value
				}
				else
				if( (t["trans_code"]=="D") || (t["trans_code"]=="E") )
				{
					splits.DE         = splits.DE         || {}
					splits.DE.country = splits.DE.country || {}
					splits.DE.country[country]=(splits.DE.country[country]||0)+value
				}
			}
			
			var sector=t["trans_sector"] || t["trans_sector_group"] // assume all 5 or all 3 digit codes so we can mix
			if(sector)
			{
				splits.ANY= splits.ANY || {}
				splits.ANY.sector = splits.ANY.sector || {}
				splits.ANY.sector[sector]=(splits.ANY.sector[sector]||0)+value

				if(t["trans_code"]=="C")
				{
					splits.CC         = splits.CC         || {}
					splits.CC.sector  = splits.CC.sector  || {}
					splits.CC.sector[sector]=(splits.CC.sector[sector]||0)+value
				}
				else
				if( (t["trans_code"]=="D") || (t["trans_code"]=="E") )
				{
					splits.DE         = splits.DE         || {}
					splits.DE.sector  = splits.DE.sector  || {}
					splits.DE.sector[sector]=(splits.DE.sector[sector]||0)+value
				}
			}
		}
		
		t["trans_id"]=splits && splits.idx || 0

		if(splits)
		{
			var tt={} ; for(var n in t) { tt[n]=t[n] } // make a copy we can mess with
			if( t["trans_sector"] || t["trans_sector_group"] )
			{
				if(t["trans_country"]) // sector and country
				{
					await dstore_back.replace(db,"trans",t);
				}
				else // sector only
				{
					if(splits.country.length==0)
					{
						await dstore_back.replace(db,"trans",t);
					}
					else
					{
						for(var i=0;i<splits.country.length;i++)
						{
							var f=splits.country[i].country_percent/100
							for(var n in {"trans_value":1,"trans_usd":1,"trans_eur":1,"trans_gbp":1,"trans_cad":1})
							{
								tt[n]=t[n]*f
							}
							tt.trans_country = splits.country[i].country_code
							await dstore_back.replace(db,"trans",tt);
						}
					}
				}
			}
			else // no sector
			{
				if(t["trans_country"]) // country only
				{
					if(splits.sector.length==0)
					{
						await dstore_back.replace(db,"trans",t);
					}
					else
					{
						for(var i=0;i<splits.sector.length;i++)
						{
							var f=splits.sector[i].sector_percent/100
							for(var n in {"trans_value":1,"trans_usd":1,"trans_eur":1,"trans_gbp":1,"trans_cad":1})
							{
								tt[n]=t[n]*f
							}
							tt.trans_sector       = splits.sector[i].sector_code
							tt.trans_sector_group = splits.sector[i].sector_group
							await dstore_back.replace(db,"trans",tt);
						}
					}
				}
				else // no sector or country
				{
					if(splits.all.length==0)
					{
						await dstore_back.replace(db,"trans",t);
					}
					else
					{
						for(var i=0;i<splits.all.length;i++)
						{
							var f=splits.all[i].all_percent/100
							for(var n in {"trans_value":1,"trans_usd":1,"trans_eur":1,"trans_gbp":1,"trans_cad":1})
							{
								tt[n]=t[n]*f
							}
							tt.trans_country      = splits.all[i].country_code
							tt.trans_sector       = splits.all[i].sector_code
							tt.trans_sector_group = splits.all[i].sector_group
							await dstore_back.replace(db,"trans",tt);
						}
					}
				}
			}	
		}
		else
		{
			await dstore_back.replace(db,"trans",t);
		}
	};

	var refresh_budget=async function(it,act,act_json,priority,splits)
	{
		await dstore_db.refresh_budget(db,it,act,act_json,priority,splits);
		
		var y=iati_xml.get_isodate_year(it,"period-start"); // get year from start date
		got_budget[ y ]=true;
	};

	var refresh_activity=async function(xml,head)
	{
//		process.stdout.write("a");
		
		var act=xml;
		if((typeof xml)=="string") { act=refry.xml(xml,aid); } // raw xml convert to jml
		act=refry.tag(act,"iati-activity"); // and get the main tag
		
		if(head) // copy all attributes from iati-activities into each activity using the iati-activities: namespace
		{
			for(var n in head)
			{
				if(n.includes(":"))
				{
					act[n]=head[n]
				}
				else
				{
					act["iati-activities:"+n]=head[n]
					act["xmlns:iati-activities"]="http://d-portal.org/xmlns/iati-activities"
				}
			}
		}
		
		iati_cook.activity(act); // cook the raw json(xml) ( most cleanup logic has been moved here )
	
		var t={};
		
		t.slug=refry.tagattr(act,"iati-activity","dstore:dataset"); // this value is hacked in when the acts are split
		t.aid=iati_xml.get_aid(act);

		if(!t.aid || !t.slug) // do not save when there is no ID or slug
		{
			return false;
		}

// report if this id is from another file and being replaced, possibly from this file even
// I think we should complain a lot about this during import
		if( await dstore_db.warn_dupes(db,t.aid,t.slug) )
		{
//			console.log("\nSKIPPING: "+t.aid);
			await dstore_back.replace(db,"slug",{"aid":t.aid,"slug":t.slug});
			return false;
		}

// delete all traces of this activity before we add it
		for( let v of ["act","jml","xson","trans","budget","country","sector","location","policy","related","tag"] )
		{
			await dstore_db.delete_from(db,v,{aid:t.aid});
		}
// we want multiple slug entries when the activity id is used many times
		await dstore_db.delete_from(db,"slug",{slug:t.slug,aid:t.aid});


		t.title=refry.tagval_narrative(act,"title");
		t.description=refry.tagval_narrative(act,"description");
		t.reporting=refry.tagval_narrative(act,"reporting-org");
		t.reporting_ref=refry.tagattr(act,"reporting-org","ref");
		t.status_code=tonumber(refry.tagattr(act,"activity-status","code"));

		// we should null invalid status codes
		if(!codes.activity_status[t.status_code])
		{
//			console.log("badcode "+t.status_code)
			t.status_code=null
		}

		if( "string" == typeof t.reporting_ref ) { t.reporting_ref = t.reporting_ref.trim() } // remove white space

		t.flags=0;
		if( codes.publisher_secondary[t.reporting_ref] ) { t.flags=1; } // flag as secondary publisher (probably best to ignore)

		t.commitment=0;
		t.spend=0;
		t.commitment_eur=0;
		t.spend_eur=0;
		t.commitment_gbp=0;
		t.spend_gbp=0;
		t.commitment_cad=0;
		t.spend_cad=0;

		refry.tags(act,"transaction",function(it){
			var code=iati_xml.get_code(it,"transaction-type");
			code= codes.transaction_type_map[code] || code ; // map new 201 codes to old letters

			code=code && (code.toUpperCase());
			if(code=="C")
			{
				var usd=iati_xml.get_ex(it,"value","USD",act["default-currency"])||0;	t.commitment+=usd;
				var eur=iati_xml.get_ex(it,"value","EUR",act["default-currency"])||0;	t.commitment_eur+=eur;
				var gbp=iati_xml.get_ex(it,"value","GBP",act["default-currency"])||0;	t.commitment_gbp+=gbp;
				var cad=iati_xml.get_ex(it,"value","CAD",act["default-currency"])||0;	t.commitment_cad+=cad;
			}
			if( (code=="D") || (code=="E") )
			{
				var usd=iati_xml.get_ex(it,"value","USD",act["default-currency"])||0;	t.spend+=usd;
				var eur=iati_xml.get_ex(it,"value","EUR",act["default-currency"])||0;	t.spend_eur+=eur;
				var gbp=iati_xml.get_ex(it,"value","GBP",act["default-currency"])||0;	t.spend_gbp+=gbp;
				var cad=iati_xml.get_ex(it,"value","CAD",act["default-currency"])||0;	t.spend_cad+=cad;
			}
		});
//console.log("C="+t.commitment+"\tD+E="+t.spend);

		var funder;
		
		if(!funder) { funder=refry.tagattr(act,{0:"participating-org",role:"funding"},"ref"); }
		if(funder){ funder=funder.trim(); if(!codes.funder_names[funder]) {funder=null;} } //validate code
		
		if(!funder) { funder=refry.tagattr(act,{0:"participating-org",role:"extending"},"ref"); }
		if(funder){ funder=funder.trim(); if(!codes.funder_names[funder]) {funder=null;} } //validate code
		
		if(!funder) { funder=refry.tagattr(act,{0:"reporting-org"},"ref"); }
		if(funder)
		{
			funder=funder.trim();
			funder=codes["iati_funders"][funder] || funder; // special group and or rename
		}
		t.funder_ref=funder; // remember funder id


// fix list og percents to add upto 100
		var fixpercents=function(aa)
		{
			if(aa[0]) // must have at least one
			{
				var pcname // work out which percentage we will be using
				if(aa[0].country_percent) { pcname="country_percent" }
				if(aa[0].sector_percent)  { pcname="sector_percent"  }
				if(aa[0].all_percent)     { pcname="all_percent"     }

				var total=0;
				for(var i=0;i<aa.length;i++) { total+=aa[i][pcname] }
				for(var i=0;i<aa.length;i++) { aa[i][pcname]=100*aa[i][pcname]/total }
			}
		}
		var fixsplits=async function(splits)
		{
// use splits containing transaction numbers to backwards work out activity level sector or country if we need it

			if(splits.country.length==0) // need to work out country percents
			{
				var ss = ( splits.CC && splits.CC.country) || ( splits.DE && splits.DE.country)
				if(ss)
				{
//console.log("CAN WORKOUT COUNTRY")
					var total=0
					for(var country in ss)
					{
						total=total+Math.abs(ss[country])
					}
					if(total<=0){total=1;} // try not to /0
					for(var country in ss)
					{

						var pc=(100*Math.abs(ss[country])/total)
						var cc=country
						var d={"aid":t.aid,"country_code":cc,"country_percent":pc}

						await dstore_back.replace(db,"country",d); // save to database as we work out

						splits.country.push({
							country_code:		cc,
							country_percent:	pc
						});
//console.log(d) // this should not trigger, as we should not have to reconstruct 
					}
// also include zero percenters
					for(var country in splits.ANY.country)
					{
						if( (typeof ss[country]) == "undefined" )
						{
							var pc=0
							var cc=country
							var d={"aid":t.aid,"country_code":cc,"country_percent":pc}

							await dstore_back.replace(db,"country",d); // save to database as we work out
						}
					}
				}
			}

			if(splits.sector.length==0) // need to work out sector percents
			{
				var ss = ( splits.CC && splits.CC.sector) || ( splits.DE && splits.DE.sector)
				if(ss)
				{
//console.log("CAN WORKOUT SECTOR")
					var total=0
					for(var sector in ss)
					{
						total=total+Math.abs(ss[sector])
					}
					for(var sector in ss)
					{

						var pc=(100*Math.abs(ss[sector])/total)
						var sc=sector
						var group=null
						if((""+sc).length==3)
						{
							group=sc
							sc=null
						}
						else
						if((""+sc).length==5)
						{
							group=(""+sc).slice(0,3)
						}
						
						var d={"aid":t.aid,"sector_group":group,"sector_code":sc,"sector_percent":pc}

						await dstore_back.replace(db,"sector",d); // save to database as we work out
						
						splits.sector.push({
							sector_group:group,
							sector_code:sc,
							sector_percent:pc
						});
					}
// also include zero percenters
					for(var sector in splits.ANY.sector)
					{
						if( (typeof ss[sector]) == "undefined" )
						{
							var pc=0
							var sc=sector
							var group=null
							if((""+sc).length==3)
							{
								group=sc
								sc=null
							}
							else
							if((""+sc).length==5)
							{
								group=(""+sc).slice(0,3)
							}
							
							var d={"aid":t.aid,"sector_group":group,"sector_code":sc,"sector_percent":pc}

							await dstore_back.replace(db,"sector",d); // save to database as we work out
						}
					}
				}
			}

			splits.all=[] // we are always going to rebuild this
			var sc=splits.country; if(sc.length==0) {sc=[{}];} // use empty [{}] so "all" contains data
			var ss=splits.sector;  if(ss.length==0) {ss=[{}];}		
			for(var idxc=0;idxc<sc.length;idxc++)
			{
				var vc=sc[idxc];
				for(var idxs=0;idxs<ss.length;idxs++)
				{
					var vs=ss[idxs];
					var v={};
					for(var ns in vs) { v[ns]=vs[ns]; } // merge, there should be no name clash
					for(var nc in vc) { v[nc]=vc[nc]; } 
					v.all_percent=((v.sector_percent||100)*(v.country_percent||100))/100; // multiply percents
					splits.all.push(v);
				}
			}
		}

		var splits={country:[],sector:[],all:[],idx:0}; // cached split data to break a transaction/budget into fragments

		refry.tags2(act,"iati-activity","recipient-country",function(it){
				var code=(it.code || "").trim().toUpperCase()
				var pc=parseFloat(it.percentage)||1
				if(pc<0) { pc=-pc }
				splits.country.push({
					country_code:		code,
					country_percent:	pc
				});
			 });
		fixpercents(splits.country);
		for(var idx=0;idx<splits.country.length;idx++)
		{
			var v=splits.country[idx]
			dstore_back.replace(db,"country",
			{
				"aid":t.aid,
				"country_code":v.country_code,
				"country_percent":v.country_percent
			});
		}

		refry.tags2(act,"iati-activity","sector",function(it){ if(it.vocabulary=="DAC" || it.vocabulary=="1" || it.vocabulary=="2" || (!it.vocabulary) ) { // 5 or 3 digit codes
				var code=(it.code || "").trim()
				var pc=parseFloat(it.percentage)||1
				if(pc<0) { pc=-pc }
				var group=null
				if(code.length==5)
				{
					group=code.slice(0,3);
				}
				else
				if(code.length==3)
				{
					group=code
					code=null
				}
				splits.sector.push({
					sector_group:group,
					sector_code:code,
					sector_percent:pc
				});
		}});
		fixpercents(splits.sector);
		for(var idx=0;idx<splits.sector.length;idx++)
		{
			var v=splits.sector[idx]
			dstore_back.replace(db,"sector",{
				"aid":t.aid,
				"sector_group":v.sector_group,
				"sector_code":v.sector_code,
				"sector_percent":v.sector_percent
			});
		}

		await fixsplits(splits)
		
// print debug splits
/*
		var s="\n"+splits.all.length+" ("+splits.country.length+","+splits.sector.length+") :";
		for(var i=0;i<splits.all.length;i++)
		{
			var v=splits.all[i];
			s=s+" "+Math.floor(v.all_percent)
		}
		console.log(s)
*/


		var locations=[];
		var percents=[];
		refry.tags(act,"location",function(it){ locations.push(it); percents.push(it.percentage); });
		fixpercents(percents);
		if(locations[0]) {
			for( var i=0; i<locations.length ; i++ )
			{
				var it=locations[i];
				var pc=percents[i];
				var longitude;
				var latitude;
				var precision;
				var name=refry.tagval_narrative(it,"name");
				var code=refry.tagattr(it,"location-type","code");
				var gazref=refry.tagattr(it,"gazetteer-entry","gazetteer-ref");
				var gaz=refry.tagval_narrative(it,"gazetteer-entry");
				var co=refry.tag(it,"coordinates");
				var flags=0;
				if(co)
				{
					longitude=tonumber(co.longitude);
					latitude=tonumber(co.latitude);
					precision=tonumber(co.precision);					
				}
				var point=refry.tag(it,"point");
				var exact=refry.tag(it,"exactness");
				if(point) // new style point/pos
				{
					var pos=refry.tagval_trim(point,"pos");
					if(pos)
					{
						var aa=pos.match(/\S+/g);
						if(aa)
						{
							latitude=tonumber(aa[0]);
							longitude=tonumber(aa[1]);
							if( exact && exact.code )
							{
								precision=tonumber(exact.code);
							}
						}
					}
				}
				
				// sanity maximum length for database index
				if( typeof name == "string" ) { name=name.substring(0,2048) }

				if((typeof(longitude)=="number")&&(typeof(latitude)=="number")) // only bother to remember good data, otherwise we waste time filtering it out.
				{
					await dstore_back.replace(db,"location",{
						"aid":t.aid,
						"location_code":code,
						"location_gazetteer_ref":gazref,
						"location_gazetteer":gaz,
						"location_name":name,
						"location_longitude":longitude,
						"location_latitude":latitude,
						"location_precision":precision,
						"location_percent":pc,
					});
				}
			}
		}

// also accept 201 number codes
		t.day_start=null;
		t.day_end=null;
		refry.tags(act,"activity-date",function(it){
			if( it.type=="start-planned" || it.type=="1" ) 	{ t.day_start=iati_xml.get_isodate_number(it); }
			else
			if( it.type=="end-planned"   || it.type=="3" )	{ t.day_end=iati_xml.get_isodate_number(it); }
		});
		refry.tags(act,"activity-date",function(it){
			if( it.type=="start-actual"  || it.type=="2" ) 	{ t.day_start=iati_xml.get_isodate_number(it) || t.day_start ; }
			else
			if( it.type=="end-actual"    || it.type=="4" )	{ t.day_end=iati_xml.get_isodate_number(it) || t.day_end ; }
		});

		t.day_length=null;
		if( t["day_start"] ) // length may be null for bad data
		{
			if(t["day_end"]) // allow missing end date
			{
				t["day_length"]=			t["day_end"]-t["day_start"];
				if( t["day_length"] < 0 )
				{
					t["day_length"]=null; // ends before it starts
				}
			}
			else // allow missing end date (null), just set length to 0 rather than null so it is not discarded
			{
				t.day_length=0
			}
		}
		
// record policy-marker DAC only with significance and code closely coupled (they make no sense apart as one may negate the other)

		for( let it of refry.all_tags(act,"policy-marker") )
		{
			if( (!it.vocabulary) || (it.vocabulary=="DAC") || (it.vocabulary==1) ) // must be DAC
			{
				if( (!isNaN(parseInt(it.significance))) && (!isNaN(parseInt(it.code))) )
				{
					var code=parseInt(it.significance)+"_"+parseInt(it.code)
					await dstore_back.replace(db,"policy",{
						"aid":t.aid,
						"policy_code":code,
					});
				}
			}
		}

// work on related activities

		for( let it of refry.all_tags(act,"related-activity") )
		{
			if( it.ref )
			{
				await dstore_back.replace(db,"related",{
					"aid":t.aid,
					"related_aid":it.ref.trim(),
					"related_type":parseInt(it.type)||0,
				});
			}

		}
		
// work on act tags , singe flags so use key values

		let tag={}
		let manifest_tag_mode=function(mode)
		{
			if(!tag[mode]) { tag[mode]={} }
			return tag[mode]
		}
		let tagmap={}
		tagmap[1]="AGROVOC"
		tagmap[2]="UNSDG"
		tagmap[3]="UNSDT"
		tagmap[4]="TEI"

		let sectmap={}
		sectmap[7]="UNSDG"
		sectmap[8]="UNSDT"
		sectmap[9]="UNSDI"
		
		for( let it of refry.all_tags(act,"tag") )
		{
			let vocab=(it.vocabulary||"").trim().toUpperCase()
			let code=(it.code||"").trim().toUpperCase()
			if( (vocab!="") && (code!="") ) // got a mode and a code
			{
				let mode=tagmap[vocab]
				if(mode)
				{
					manifest_tag_mode(mode)[code]=true // flag it
				}	
			}

		}

// this will find sectors in transactions or at toplevel of act
		refry.tags(it,"sector",function(sector){
			let vocab=(sector.vocabulary||"").trim().toUpperCase()
			let code=(sector.code||"").trim().toUpperCase()
			if( (vocab!="") && (code!="") ) // got a mode and a code
			{
				let mode=sectmap[vocab]
				if(mode)
				{
					manifest_tag_mode(mode)[code]=true // flag it
				}
			}
		})
		
		for( let mode in tag )
		{
			for( let code in tag[mode] )
			{
//				console.log(mode,code)
				await dstore_back.replace(db,"tag",{
					"aid":t.aid,
					"tag_mode":mode,
					"tag_code":code,
				});
			}
		}
		
//		t.xml=xml;
		t.jml=JSON.stringify(act);

// update our hash if we detect a change, this lets us keep track of the last time we saw new data per activity.
// note that obviously this data will be lost if we rebuild the database but it is still nice to be able to
// find which activities changed yesterday.
		t.hash_jml=crypto.createHash('sha256').update(t.jml).digest("hex");
		t.hash_day=Math.floor( new Date() / (1000*60*60*24) ) // today
		var hash=await select_by_aid("hash",t.aid)
		if( (!hash) || (hash.hash_jml!=t.hash_jml) ) // new data
		{
			await replace("hash",t);
		}
		
//		dstore_back.replace(db,"activity",t);
		await replace("act",t);
		await replace("jml",t);

		got_budget={}; // reset which budgets we found

		let its=[]

		for( let it of refry.all_tags(act,"transaction") ) { await refresh_transaction(it,act,t,splits); }
		
		await fixsplits(splits) // we may work out *NEW* percentage splits after parsing the transactions

		for( let it of refry.all_tags(act,"budget") ) { await refresh_budget(it,act,t,1,splits) }

		for( let it of refry.all_tags(act,"planned-disbursement") )
		{
			var y=iati_xml.get_isodate_year(it,"period-start"); // get year from start date
			if( (!y) || (!got_budget[y]) ) // if not already filled in (budget is missing or has bad data)
			{
				await refresh_budget(it,act,t,1,splits); // then try and use this planned-disbursement instead
			}
			else
			{
				await refresh_budget(it,act,t,0,splits); // else this is marked as data to ignore (priority of 0)
//				ls({"skipyear":y});
			}
		}
		
//update slug

		await dstore_back.replace(db,"slug",{"aid":t.aid,"slug":t.slug});
		
// do not need this any more as we have xson
/*
		var vols=refry.tag_volumes(refry.tag(act,"iati-activity"));
		{
			for(name in vols) { var vol=vols[name];
				var aa=name.split(".");
				var e={};
				e.aid=t.aid;
				e.element_volume=vol;
				e.element_name0=null;
				e.element_name1=null;
				e.element_name2=null;
				e.element_name3=null;
				e.element_attr=null;

				if(aa[aa.length-1]) {
					var bb=aa[aa.length-1].split("@"); // optional attribute
					e.element_name0=bb[0];
					if( bb[1] )
					{
						e.element_attr=bb[1];
					}
				}
				if(aa[aa.length-2]) { e.element_name1=aa[aa.length-2]; }
				if(aa[aa.length-3]) { e.element_name2=aa[aa.length-3]; }
				if(aa[aa.length-4]) { e.element_name3=aa[aa.length-4]; }

// we run out of space on live server if we try and track attribute use
// takes an extra 16gb+++ of indexing data and slows down the import considerably
// so disable saving attribute stats
				if(!e.element_attr)
				{
					dstore_back.replace(db,"element",e);
				}
			}
		}
*/

// update xson
		let xtree=dflat.xml_to_xson( { 0:"iati-activities" , 1:[act] } )
		dflat.clean(xtree)
		xtree=xtree["/iati-activities/iati-activity"][0]

		t.pid=xtree["/reporting-org@ref"]
		let xwalk
		xwalk=function(it,path)
		{
			let x={}

			x.aid=t.aid
			x.pid=t.pid
			x.root=path
			x.xson=JSON.stringify( it );
			
			if(x.xson)
			{
				replace("xson",x);
			}
			
			for(let n in it )
			{
				let v=it[n]
				if(Array.isArray(v))
				{
					for(let i=0;i<v.length;i++)
					{
						xwalk( v[i] , path+n )
					}
				}
			}
		}
		xwalk( xtree ,"/iati-activities/iati-activity")


		return t;
	};
	
	// then add new
	return await refresh_activity(xml,head);

};

dstore_db.get_meta = function(){
	if(dstore_db.meta) { return dstore_db.meta } else {
	
	var build_codes=function(dat){
		var ret=[]
		for(var n in dat)
		{
			var it={}
			it.name=n
			it.value=dat[n]
			ret[ret.length]=it
		}
		return ret
	}

	var meta={}
	dstore_db.meta=meta // cache it
	
	meta.tables=dstore_db.tables
	
	meta.codes={}
	
	meta.codes.activity_status  = build_codes( codes.activity_status )
	meta.codes.transaction_type = build_codes( codes.transaction_type )
	meta.codes.sector           = build_codes( codes.sector )
	meta.codes.sector_category  = build_codes( codes.sector_category )
	meta.codes.country          = build_codes( codes.country )
	meta.codes.policy_code      = build_codes( codes.policy_code )
	meta.codes.policy_sig       = build_codes( codes.policy_sig )
	
	meta.codes.policy = [] // policy is a merged value from two codelists
	for(var ns in codes.policy_sig)
	{
		for(var nc in codes.policy_code)
		{
			var it={}
			it.name=ns+"_"+nc
			it.value=codes.policy_code[nc]+" IS "+codes.policy_sig[ns]
			meta.codes.policy[meta.codes.policy.length]=it
		}
	}

	return meta }
}

dstore_db.vacuum = async function(){
	var f=dstore_back.vacuum;
	if(f) { return await f(); }
};

dstore_db.analyze = async function(){
	var f=dstore_back.analyze;
	if(f) { return await f(); }
};

dstore_db.fill_acts = async function(acts,slug,data,head){
	var f=dstore_back.fill_acts;
	if(f) { return await f(acts,slug,data,head); }
};

dstore_db.fake_trans = async function(){
	var f=dstore_back.fake_trans;
	if(f) { return await f(); }
};

dstore_db.warn_dupes = async function(db,aid,slug){
	var f=dstore_back.warn_dupes;
	if(f) { return await f(db,aid,slug); }
};



// we can now call create_tables with {opts.do_not_drop} to update tables
dstore_db.create_tables = async function(opts){
	return await dstore_back.create_tables(opts);
}

dstore_db.create_indexes = async function(idxs){
	return await dstore_back.create_indexes(idxs);
}

dstore_db.delete_indexes = async function(){
	return await dstore_back.delete_indexes();
}

dstore_db.dump_tables = async function(){
	return await dstore_back.dump_tables();
}

// handle a simple delete
dstore_db.delete_from = async function(db,tablename,opts){
	return await dstore_back.delete_from(db,tablename,opts);
}

// prepare some sql code
dstore_db.cache_prepare = async function(){
	return await dstore_back.cache_prepare(dstore_db.tables);
}

// the database part of the query code
dstore_db.query_select = async function(q,res,r,req){
	return await dstore_back.query_select(q,res,r,req);
}

// the database part of the query code
dstore_db.query = async function(q,v){
	return await dstore_back.query(q,v);
}

dstore_db.cache_prepare();

