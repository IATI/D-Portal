// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const static_db={}
export default static_db

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


static_db.engine="pg";


// values copied from the main activity into sub tables for quik lookup (no need to join tables)
static_db.bubble_act={
		"aid":true
	};


// data table descriptions
static_db.tables={
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
		{ name:"related_source",				INTEGER:true , INDEX:true },
//		{ 										UNIQUE:["aid","related_aid","related_type"] }, // should only say it once
// it is safer to just remove dupes after import than deal with import clashes
	],
// related activity data combined into publishers
	relatedp:[
		{ name:"pid",							TEXT:true , INDEX:true , HASH:true , NOT_NULL:true , NOT_ACTIVE:true },
		{ name:"related_pid",					TEXT:true , INDEX:true , HASH:true , NOT_NULL:true },
		{ name:"related_type",					INTEGER:true , INDEX:true },
		{ name:"related_source",				INTEGER:true , INDEX:true },
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

static_db.tables_active={};
{
	for(let name in static_db.tables)
	{
		let t={};
		for(let i=0; i<static_db.tables[name].length; i++ )
		{
			let v=static_db.tables[name][i];

			if(v.NOT_ACTIVE) { continue } // ignore this table column when doing Q logic

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
		static_db.tables_active[name]=t;
	}
}

static_db.table_name_map={} // look up table from name
{
	let ns={};
	static_db.table_name_map=ns

	for(var name in static_db.tables )
	{
		for(var n in static_db.tables_active[name])
		{
			var tname=name
			if(n=="aid") { tname="act" } // force act for all aid columns
			ns[n]={ "format":static_db.tables_active[name][n] , "table":tname , "name":n };
		}
	}

	// special case for possible tags
	for(let mode in iati_codes.tag_mode )
	{
		let alias="tag_"+(mode.toLowerCase())
		ns[alias]={
			"mode":mode ,
			"mode_name":alias+".tag_mode" ,
			"format":static_db.tables_active["tag"]["tag_code"] ,
			"table":"tag" ,
			"alias":alias ,
			"name":alias+".tag_code" }
	}
	ns["tag"]={ "format":static_db.tables_active["tag"]["tag_code"] , "table":"tag" , "name":"tag.tag_code" }
}
