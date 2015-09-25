// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_db=exports;

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var iati_cook=require('./iati_cook');
var dstore_sqlite=require('./dstore_sqlite');

var codes=require('../json/iati_codes');

var wait=require('wait.for');

var util=require('util');
var http=require('http');
var sqlite3 = require('sqlite3').verbose();



var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// values copied from the main activity into sub tables for quik lookup (no need to join tables)
dstore_db.bubble_act={
		"aid":true
	};
	
	
// data table descriptions
dstore_db.tables={
	jml:[
		{ name:"aid",							NOCASE:true , PRIMARY:true },
		{ name:"jml",							TEXT:true }, // moved to reduce the main act table size
	],
	act:[
		{ name:"aid",							NOCASE:true , PRIMARY:true },
		{ name:"reporting",						NOCASE:true , INDEX:true },
		{ name:"reporting_ref",					NOCASE:true , INDEX:true },
		{ name:"funder_ref",					NOCASE:true , INDEX:true },
		{ name:"title",							NOCASE:true },
		{ name:"slug",							NOCASE:true , INDEX:true },
		{ name:"status_code",					INTEGER:true , INDEX:true },	
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
	trans:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"trans_ref",						NOCASE:true , INDEX:true },
		{ name:"trans_description",				NOCASE:true , INDEX:true },
		{ name:"trans_day",						INTEGER:true , INDEX:true },
		{ name:"trans_currency",				NOCASE:true , INDEX:true },
		{ name:"trans_value",					REAL:true , INDEX:true },
		{ name:"trans_usd",						REAL:true , INDEX:true },
		{ name:"trans_eur",						REAL:true , INDEX:true },
		{ name:"trans_gbp",						REAL:true , INDEX:true },
		{ name:"trans_cad",						REAL:true , INDEX:true },
		{ name:"trans_code",					NOCASE:true , INDEX:true },
		{ name:"trans_flow_code",				NOCASE:true , INDEX:true },
		{ name:"trans_finance_code",			NOCASE:true , INDEX:true },
		{ name:"trans_aid_code",				NOCASE:true , INDEX:true },
		{ name:"trans_flags",					INTEGER:true , INDEX:true },
// FLAGS set to 0 if good otherwise
// 1 == this is a fake transaction built after a full import for publishers that only publish C not D/E
	],
	budget:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"budget",						NOCASE:true , INDEX:true }, // budget or plan (planned-disbursement) or total (organization total)
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
	],
	country:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"country_code",					NOCASE:true , INDEX:true },
		{ name:"country_percent",				REAL:true , INDEX:true },
	],
	sector:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"sector_group",					NOCASE:true , INDEX:true },	// sector group
		{ name:"sector_code",					INTEGER:true , INDEX:true },
		{ name:"sector_percent",				REAL:true , INDEX:true },
	],
	location:[
		{ name:"aid",							NOCASE:true , INDEX:true },
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
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"slug",							NOCASE:true , INDEX:true },
	]
};
	
var http_getbody=function(url,cb)
{
	http.get(url, function(res) {
		res.setEncoding('utf8');
		var s="";
		res.on('data', function (chunk) {
			s=s+chunk;
		});
		res.on('end', function() {
			cb(null,s);
		});
	}).on('error', function(e) {
		cb(e,null);
	});

};


dstore_db.open = function(){
	return dstore_sqlite.open();
};



dstore_db.fill_acts = function(acts,slug,data,head,main_cb){

	var before_time=Date.now();
	var after_time=Date.now();
	var before=0;
	var after=0;

	var db = dstore_db.open();	
	db.serialize();
	
	wait.for(function(cb){
		db.run("BEGIN TRANSACTION",cb);
	});
	
	db.each("SELECT COUNT(*) FROM act", function(err, row)
	{
		before=row["COUNT(*)"];
	});

// delete everything related to this slug
	db.each("SELECT aid FROM slug WHERE slug=?",slug, function(err, row)
	{
		var a=row["aid"];
		db.run("DELETE FROM act       WHERE aid=?",a);
		db.run("DELETE FROM jml       WHERE aid=?",a);
		db.run("DELETE FROM trans     WHERE aid=?",a);
		db.run("DELETE FROM budget    WHERE aid=?",a);
		db.run("DELETE FROM country   WHERE aid=?",a);
		db.run("DELETE FROM sector    WHERE aid=?",a);
		db.run("DELETE FROM location  WHERE aid=?",a);
		db.run("DELETE FROM slug      WHERE aid=?",a);
	});

	wait.for(function(cb){ db.run("PRAGMA page_count", function(err, row){ cb(err); }); });

	var progchar=["0","1","2","3","4","5","6","7","8","9"];

	if(acts.length==0) // probably an org file, try and import budgets from full data
	{

		var org=refry.xml(data,slug); // raw xml convert to jml
		var aid=iati_xml.get_aid(org);

		console.log("importing budgets from org file for "+aid)

		db.run("DELETE FROM budget    WHERE aid=?",aid);

		refry.tags(org,"total-budget",function(it){dstore_db.refresh_budget(db,it,org,{aid:aid},0);});

		var sa = db.prepare(dstore_sqlite.tables_replace_sql["slug"]);
		sa.run({"$aid":aid,"$slug":slug});
		sa.finalize();
	}


	for(var i=0;i<acts.length;i++)
	{
		var xml=acts[i];

		json=refry.xml(xml,slug);
		var aid=iati_xml.get_aid(json);
		if(aid)
		{
			var p=Math.floor(progchar.length*(i/acts.length));
			if(p<0) { p=0; } if(p>=progchar.length) { p=progchar.length-1; }
			process.stdout.write(progchar[p]);

			dstore_db.refresh_act(db,aid,json,head);

	// block and wait here

			wait.for(function(cb){
				db.run("PRAGMA page_count", function(err, row){
					cb(err);
				});
			});
		}
	}

	wait.for(function(cb){ db.run("COMMIT TRANSACTION",cb); });
	process.stdout.write("\n");

	db.each("SELECT COUNT(*) FROM act", function(err, row)
	{
		after=row["COUNT(*)"];
	});


	db.run("PRAGMA page_count", function(err, row){
		dstore_sqlite.close(db);
		
		after_time=Date.now();
		
		process.stdout.write(after+" ( "+(after-before)+" ) "+(after_time-before_time)+"ms\n");
		
		if(main_cb){ main_cb(); }
	});

};

// call after major data changes to help sqlite optimise queries

dstore_db.vacuum = function(){

	process.stdout.write("VACUUM start\n");
	var db = dstore_db.open();
	db.run("VACUUM", function(err, row){
		dstore_sqlite.close(db);
		process.stdout.write("VACUUM done\n");
	});

}

dstore_db.analyze = function(){


	process.stdout.write("ANALYZE start\n");
	var db = dstore_db.open();
	db.run("ANALYZE", function(err, row){
		dstore_sqlite.close(db);
		process.stdout.write("ANALYSE done\n");
	});
}

// pull every activity from the table and update *all* connected tables using its raw xml data

dstore_db.refresh_budget=function(db,it,act,act_json,priority)
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
	
	t["budget_currency"]=				iati_xml.get_value_currency(it,"value");
	t["budget_value"]=					iati_xml.get_value(it,"value");
	t["budget_usd"]=					iati_xml.get_ex(it,"value","USD");
	t["budget_eur"]=					iati_xml.get_ex(it,"value","EUR");
	t["budget_gbp"]=					iati_xml.get_ex(it,"value","GBP");
	t["budget_cad"]=					iati_xml.get_ex(it,"value","CAD");

	t.jml=JSON.stringify(it);
	
	dstore_sqlite.replace(db,"budget",t);
};


dstore_db.refresh_act = function(db,aid,xml,head){

// choose to prioritise planned-transaction or budgets for each year depending on which we fine in the xml
// flag each year when present
	var got_budget={};

	var replace=function(name,it)
	{
		dstore_sqlite.replace(db,name,it);
	}

	var refresh_transaction=function(it,act,act_json)
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

		
		t["trans_currency"]=		iati_xml.get_value_currency(it,"value");
		t["trans_value"]=			iati_xml.get_value(it,"value");
		t["trans_usd"]=				iati_xml.get_ex(it,"value","USD");
		t["trans_eur"]=				iati_xml.get_ex(it,"value","EUR");
		t["trans_gbp"]=				iati_xml.get_ex(it,"value","GBP");
		t["trans_cad"]=				iati_xml.get_ex(it,"value","CAD");

// map new 201 codes to old		
		t["trans_code"]= codes.transaction_type_map[ t["trans_code"] ] || t["trans_code"];

// transaction flag, 0 by default
		t["trans_flags"]=			0;

		t.jml=JSON.stringify(it);
		
		dstore_sqlite.replace(db,"trans",t);
	};

	var refresh_budget=function(it,act,act_json,priority)
	{
		dstore_db.refresh_budget(db,it,act,act_json,priority);
		
		var y=iati_xml.get_isodate_year(it,"period-start"); // get year from start date
		got_budget[ y ]=true;
	};

	var refresh_activity=function(xml,head)
	{
//		process.stdout.write("a");
		
		var act=xml;
		if((typeof xml)=="string") { act=refry.xml(xml,aid); } // raw xml convert to jml
		act=refry.tag(act,"iati-activity"); // and get the main tag
		
		if(head) // copy all attributes from iati-activities into each activity unless the activity already has it
		{
			for(var n in head) { act[n]=act[n] || head[n]; }
		}
		
		iati_cook.activity(act); // cook the raw json(xml) ( most cleanup logic has been moved here )
	
		var t={};
		
		t.slug=refry.tagattr(act,"iati-activity","dstore:slug"); // this value is hacked in when the acts are split
		t.aid=iati_xml.get_aid(act);

		if(!t.aid) // do not save when there is no ID
		{
			return;
		}

// report if this id is from another file and being replaced, possibly from this file even
// I think we should complain a lot about this during import
		db.each("SELECT * FROM slug WHERE aid=?",t.aid, function(err, row)
		{
			console.log("\nDUPLICATE: "+row.slug+" : "+row.aid);
		});


// make really really sure old junk is deleted
		db.run("DELETE FROM act       WHERE aid=?",t.aid);
		db.run("DELETE FROM jml       WHERE aid=?",t.aid);
		db.run("DELETE FROM trans     WHERE aid=?",t.aid);
		db.run("DELETE FROM budget    WHERE aid=?",t.aid);
		db.run("DELETE FROM country   WHERE aid=?",t.aid);
		db.run("DELETE FROM sector    WHERE aid=?",t.aid);
		db.run("DELETE FROM location  WHERE aid=?",t.aid);
		db.run("DELETE FROM slug      WHERE aid=?",t.aid);


		t.title=refry.tagval_narrative(act,"title");
		t.description=refry.tagval_narrative(act,"description");				
		t.reporting=refry.tagval(act,"reporting-org");				
		t.reporting_ref=refry.tagattr(act,"reporting-org","ref");
		t.status_code=refry.tagattr(act,"activity-status","code");

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
				var usd=iati_xml.get_ex(it,"value","USD");	t.commitment+=usd;
				var eur=iati_xml.get_ex(it,"value","EUR");	t.commitment_eur+=eur;
				var gbp=iati_xml.get_ex(it,"value","GBP");	t.commitment_gbp+=gbp;
				var cad=iati_xml.get_ex(it,"value","CAD");	t.commitment_cad+=cad;
			}
			if( (code=="D") || (code=="E") )
			{
				var usd=iati_xml.get_ex(it,"value","USD");	t.spend+=usd;
				var eur=iati_xml.get_ex(it,"value","EUR");	t.spend_eur+=eur;
				var gbp=iati_xml.get_ex(it,"value","GBP");	t.spend_gbp+=gbp;
				var cad=iati_xml.get_ex(it,"value","CAD");	t.spend_cad+=cad;
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


// fix percents to add upto 100
		var fixpercents=function(aa)
		{
			var total=0;
			
			for(var i=0;i<aa.length;i++)
			{
				aa[i]=parseFloat(aa[i]) || 1;
				if(aa[i]<1) { aa[i]=-aa[i]; } // fix negative percents?
				total+=aa[i];
			}

			for(var i=0;i<aa.length;i++)
			{
				aa[i]=100*aa[i]/total;
			}			
		};
		
		var country=[];
		var percents=[];
		refry.tags(act,"recipient-country",function(it){ country.push( (it.code || "").trim().toUpperCase() ); percents.push(it.percentage); });
		fixpercents(percents);
		if(country[0]) {
			for( var i=0; i<country.length ; i++ )
			{
				var cc=country[i];
				var pc=percents[i];
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["country"]);
				sa.run({"$aid":t.aid,"$country_code":cc,"$country_percent":pc});				
				sa.finalize();
			}
		}

		var sectors=[];
		var percents=[];
		refry.tags(act,"sector",function(it){ if(it.vocabulary=="DAC" || it.vocabulary=="1" || it.vocabulary=="2") { sectors.push(it.code); percents.push(it.percentage); } });
		fixpercents(percents);
		if(sectors[0]) {
			for( var i=0; i<sectors.length ; i++ )
			{
				var sc=sectors[i];
				var pc=percents[i];
				var group;
				if(sc){ group=codes.sector_group[sc.slice(0,3)]; }
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["sector"]);
				sa.run({"$aid":t.aid,"$sector_group":group,"$sector_code":sc,"$sector_percent":pc});				
				sa.finalize();
			}
		}

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
				if(co)
				{
					longitude=co.longitude;
					latitude=co.latitude;
					precision=co.precision;
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
							latitude=parseFloat(aa[0]);
							longitude=parseFloat(aa[1]);
							if( exact && exact.code )
							{
								precision=exact.code;
							}
						}
					}
				}

				var sa = db.prepare(dstore_sqlite.tables_replace_sql["location"]);
				sa.run({"$aid":t.aid,
					"$location_code":code,
					"$location_gazetteer_ref":gazref,
					"$location_gazetteer":gaz,
					"$location_name":name,
					"$location_longitude":longitude,
					"$location_latitude":latitude,
					"$location_precision":precision,
					"$location_percent":pc});
				sa.finalize();
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
			if( it.type=="start-actual"  || it.type=="2" ) 	{ t.day_start=iati_xml.get_isodate_number(it); }
			else
			if( it.type=="end-actual"    || it.type=="4" )	{ t.day_end=iati_xml.get_isodate_number(it); }
		});

		t.day_length=null;
		if(t["day_end"] && t["day_start"] ) // length may be null for bad data
		{
			t["day_length"]=			t["day_end"]-t["day_start"];
			if( t["day_length"] < 0 )
			{
				t["day_length"]=null; // ends before it starts
			}
		}
		
		
		
//		t.xml=xml;
		t.jml=JSON.stringify(act);
		
//		dstore_sqlite.replace(db,"activity",t);
		replace("act",t);
		replace("jml",t);
		
		got_budget={}; // reset
		refry.tags(act,"transaction",function(it){refresh_transaction(it,act,t);});
		refry.tags(act,"budget",function(it){refresh_budget(it,act,t,1);});
		refry.tags(act,"planned-disbursement",function(it){
			var y=iati_xml.get_isodate_year(it,"period-start"); // get year from start date
			if( (!y) || (!got_budget[y]) ) // if not already filled in (budget is missing or has bad data)
			{
				refresh_budget(it,act,t,1); // then try and use this planned-disbursement instead
			}
			else
			{
				refresh_budget(it,act,t,0); // else this is marked as data to ignore (priority of 0)
//				ls({"skipyear":y});
			}
		});
		
//update slug

		var sa = db.prepare(dstore_sqlite.tables_replace_sql["slug"]);
		sa.run({"$aid":t.aid,"$slug":t.slug});		
		sa.finalize();
		
		return t;
	};
	
	// then add new
	refresh_activity(xml,head);

};


dstore_db.fake_trans = function(){

	var db = dstore_db.open();
	
	var ids={};

	var fake_ids=[];
	
	process.stdout.write("Removing all fake transactions\n");
	db.run("DELETE FROM trans WHERE trans_flags=?",1,function(err, rows)  // remove old fake
	{

		db.all("SELECT reporting_ref , trans_code ,  COUNT(*) AS count FROM act  JOIN trans USING (aid)  GROUP BY reporting_ref , trans_code", function(err, rows)
		{
			for(i=0;i<rows.length;i++)
			{
				var v=rows[i];
				if(v.trans_code=="C")
				{
					ids[v.reporting_ref] = (ids[v.reporting_ref] || 0) + 1 ;
				}
				else
				if( (v.trans_code=="D") || (v.trans_code=="E") )
				{
					ids[v.reporting_ref] = (ids[v.reporting_ref] || 0) - 1 ;
				}
			}
			for(var n in ids)
			{
				var v=ids[n];
				if(v>0) // we have commitments but no D or E 
				{
					fake_ids.push(n);
				}
			}

			process.stdout.write("The following publishers will have fake transactions added\n");
			ls(fake_ids);


			process.stdout.write("Adding fake transactions for the following IDs\n");
			for(i=0;i<fake_ids.length;i++) // add new fake
			{
				var v=fake_ids[i];
				db.all("SELECT * FROM act  JOIN trans USING (aid)  WHERE reporting_ref=? AND trans_code=\"C\" ",v, function(err, rows)
				{
					for(j=0;j<rows.length;j++)
					{
						var t=rows[j];
						process.stdout.write(t.aid+"\n");
						t.trans_code="D";
						t.trans_flags=1;
						dstore_sqlite.replace(db,"trans",t);
					}
	//				ls(rows);
				});
			}

		});
	});

};


dstore_db.create_tables = function(){
	return dstore_sqlite.create_tables();
}

dstore_db.create_indexes = function(){
	return dstore_sqlite.create_indexes();
}

dstore_db.delete_indexes = function(){
	return dstore_sqlite.delete_indexes();
}

dstore_db.check_tables = function(){
	return dstore_sqlite.check_tables();
}

// prepare some sql code
dstore_db.cache_prepare = function(){
	return dstore_sqlite.cache_prepare(dstore_db.tables);
}
dstore_db.cache_prepare();

