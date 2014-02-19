//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var dstore_db=exports;
if(typeof dstore_db  === "undefined") { dstore_db ={}; }
required["dstore_db"]=dstore_db;

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var iati_cook=require('./iati_cook');
var dstore_sqlite=require('./dstore_sqlite');

var wait=require('wait.for');

var util=require('util');
var http=require('http');
var nconf = require('nconf');
var sqlite3 = require('sqlite3').verbose();



var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// values copied from the activities into other tables for quik lookup (no need to join tables)
dstore_db.bubble_act={
		"reporting_org":true,
		"reporting_org_ref":true,
		"funder":true,
		"aid":true
	};
	
	
// data table descriptions
dstore_db.tables={
	activities:[
		{ name:"aid",							NOCASE:true , PRIMARY:true },
		{ name:"slug",							NOCASE:true , INDEX:true },
		{ name:"xml",							TEXT:true },
		{ name:"jml",							TEXT:true },
		{ name:"json",							TEXT:true },
		{ name:"status_code",					INTEGER:true , INDEX:true },	
		{ name:"day_start",						INTEGER:true , INDEX:true },	
		{ name:"day_end",						INTEGER:true , INDEX:true },
		{ name:"day_length",					INTEGER:true , INDEX:true },
		{ name:"title",							NOCASE:true },
		{ name:"description",					NOCASE:true },
		{ name:"reporting_org",					NOCASE:true },
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true },
		{ name:"funder",						NOCASE:true }
	],
	transactions:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"jml",						TEXT:true },
		{ name:"json",							TEXT:true },
		{ name:"ref",							NOCASE:true },
		{ name:"description",					NOCASE:true },
		{ name:"day",							INTEGER:true , INDEX:true },
		{ name:"currency",						NOCASE:true },
		{ name:"value",							REAL:true },
		{ name:"usd",							REAL:true },
		{ name:"code",							NOCASE:true , INDEX:true },
		{ name:"flow_code",						NOCASE:true , INDEX:true },
		{ name:"finance_code",					NOCASE:true , INDEX:true },
		{ name:"aid_code",						NOCASE:true , INDEX:true },
		{ name:"reporting_org",					NOCASE:true },
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true },
		{ name:"funder",						NOCASE:true }
	],
	budgets:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"budget",						NOCASE:true , INDEX:true }, // budget or plan (planned-disbursement)
		{ name:"jml",							TEXT:true },
		{ name:"json",							TEXT:true },
		{ name:"type",							NOCASE:true },
		{ name:"day_start",						INTEGER:true , INDEX:true },
		{ name:"day_end",						INTEGER:true , INDEX:true },
		{ name:"day_length",					INTEGER:true , INDEX:true },
		{ name:"currency",						NOCASE:true },
		{ name:"value",							REAL:true },
		{ name:"usd",							REAL:true },
		{ name:"reporting_org",					NOCASE:true },
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true },
		{ name:"funder",						NOCASE:true }
	],
// These are intended just to be joined to the above.
// use &from=activities,country,sector,location& to request a join via aid ( this *may* return duplicate activities )
	country:[
		{ name:"country_aid",					NOCASE:true , INDEX:true },
		{ name:"country_code",					NOCASE:true , INDEX:true },
		{ name:"country_percent",				REAL:true , INDEX:true }
	],
	sector:[
		{ name:"sector_aid",					NOCASE:true , INDEX:true },
		{ name:"sector_group",					NOCASE:true , INDEX:true },	// sector group
		{ name:"sector_code",					INTEGER:true , INDEX:true },
		{ name:"sector_percent",				REAL:true , INDEX:true }
	],
	location:[
		{ name:"location_aid",					NOCASE:true , INDEX:true },
		{ name:"location_code",					NOCASE:true , INDEX:true },
		{ name:"location_gazetteer_ref",		NOCASE:true , INDEX:true },
		{ name:"location_gazetteer",			NOCASE:true , INDEX:true },
		{ name:"location_name",					NOCASE:true , INDEX:true },
		{ name:"location_longitude",			REAL:true , INDEX:true },
		{ name:"location_latitude",				REAL:true , INDEX:true },
		{ name:"location_precision",			INTEGER:true , INDEX:true },
		{ name:"location_percent",				REAL:true , INDEX:true }
	],
// track what was imported...
	slugs:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"slug",							NOCASE:true , INDEX:true }
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


dstore_db.fill_acts = function(acts,slug){

	var db = dstore_db.open();	
	db.serialize();

	db.run("DELETE FROM slugs WHERE slug=?",slug); // remove all the old slugs

	var before=0;
	var after=0;
	
	db.each("SELECT COUNT(*) FROM activities", function(err, row)
	{
		before=row["COUNT(*)"];
	});

//	var stmt = db.prepare("REPLACE INTO activities (aid,xml,jml) VALUES (?,?,?)");

	for(var i=0;i<acts.length;i++)
	{
		var xml=acts[i];
		json=refry.xml(xml);
		var aid=iati_xml.get_aid(json);
		
		if(aid)
		{
			process.stdout.write("+"); // some thing we will import (but may overwrite other acts)
		}
		else
		{
			process.stdout.write("-"); // missing aid, so it wont import
		}

		dstore_db.refresh_act(db,aid,xml);
		
	}
	process.stdout.write("\n");
	
	db.each("SELECT COUNT(*) FROM activities", function(err, row)
	{
		after=row["COUNT(*)"];
	});

	db.run(";", function(err, row){
		db.close();
		process.stdout.write(after+" ( "+(after-before)+" ) \n");
	});

};

// pull every activity from the table and update *all* connected tables using its raw xml data

dstore_db.refresh_acts = function(){
		
	var db = dstore_db.open();
	db.serialize();

	db.each("SELECT aid,xml FROM activities", function(err, row){

		process.stdout.write(".");
		dstore_db.refresh_act(db,row.aid,row.xml);
	});


	db.run(";", function(err, row){
		db.close();
		process.stdout.write("FIN\n");
	});

};

dstore_db.refresh_act = function(db,aid,xml){

// choose to remember planned-transactions or budgets for each year depending on which we fine in the xml
// flag each year when present
	var got_budget={};

/*	
	var preps={};
	var prep=function(name)
	{
		if(!preps[name])
		{
			preps[name]=db.prepare(dstore_sqlite.tables_replace_sql[name]);
		}
		return preps[name];
	}
*/	

	var replace=function(name,it)
	{
		dstore_sqlite.replace(db,name,it);
/*		
		var $t=dstore_sqlite.replace_vars(db,name,it);
		var sa = prep(name);
		sa.run($t);
*/
	}
	


	var refresh_transaction=function(it,act,act_json)
	{
//		process.stdout.write("t");

		var t={};
		for(var n in dstore_db.bubble_act){ t[n]=act_json[n]; } // copy some stuff

		t["ref"]=				it["ref"];
		t["description"]=		refry.tagval(it,"description");
		t["day"]=				iati_xml.get_isodate_number(it,"transaction-date");

		t["code"]=				iati_xml.get_code(it,"transaction-type");
		t["flow_code"]=			iati_xml.get_code(it,"flow-type");
		t["finance_code"]=		iati_xml.get_code(it,"finance-type");
		t["aid_code"]=			iati_xml.get_code(it,"aid-type");
		
		t["currency"]=			iati_xml.get_value_currency(it,"value");
		t["value"]=				iati_xml.get_value(it,"value");
		t["usd"]=				iati_xml.get_usd(it,"value");

		t.jml=JSON.stringify(it);
		
//		dstore_sqlite.replace(db,"transactions",t);
		replace("transactions",t);

	};

	var refresh_budget=function(it,act,act_json)
	{
//		process.stdout.write("b");
		
		var t={};
		for(var n in dstore_db.bubble_act){ t[n]=act_json[n]; } // copy some stuff
		
		if(it[0]=="planned-disbursement") // flag to share table with planned-disbursement (they seem very similar)
		{
			t.budget="plan";
		}
		else
		{
			t.budget="budget";
		}
		
		t["type"]=it["type"];

		t["day_start"]=				iati_xml.get_isodate_number(it,"period-start");
		t["day_end"]=				iati_xml.get_isodate_number(it,"period-end");
		t["day_length"]=			t["day_end"]-t["day_start"];
		
		t["currency"]=				iati_xml.get_value_currency(it,"value");
		t["value"]=					iati_xml.get_value(it,"value");
		t["usd"]=					iati_xml.get_usd(it,"value");

		t.jml=JSON.stringify(it);
		
//		dstore_sqlite.replace(db,"budgets",t);
		replace("budgets",t);
		
		var y=iati_xml.get_isodate_year(it,"period-start"); // get year from start date
		got_budget[ y ]=true;

	};

	var refresh_activity=function(xml)
	{
//		process.stdout.write("a");
		
		var act=refry.xml(xml); // raw xml convert to jml
		act=refry.tag(act,"iati-activity"); // and get the main tag
		
		iati_cook.activity(act); // cook the raw json(xml) ( most cleanup logic has been moved here )
		
		var t={};
		
		t.slug=refry.tagattr(act,"iati-activity","dstore_slug"); // this value is hacked in when the acts are split
		t.aid=iati_xml.get_aid(act);

		var sa = db.prepare(dstore_sqlite.tables_replace_sql["slugs"]);
		sa.run({"$aid":t.aid,"$slug":t.slug});		
		sa.finalize();

		if(!t.aid) // do not save when there is no ID
		{
			return;
		}

		t.title=refry.tagval(act,"title");
		t.description=refry.tagval(act,"description");				
		t.reporting_org=refry.tagval(act,"reporting-org");				
		t.reporting_org_ref=refry.tagattr(act,"reporting-org","ref");
		t.status_code=refry.tagattr(act,"activity-status","code");

		var funder;
		
		if(!funder) { funder=refry.tagattr(act,{0:"participating-org",role:"funding"},"ref"); }
		if(!funder) { funder=refry.tagattr(act,{0:"participating-org",role:"extending"},"ref"); }
		if(!funder) { funder=refry.tagattr(act,{0:"reporting-org"},"ref"); }
		
		if( funder[2]=="-" )
		{
			t.funder=funder.slice(0,2).toUpperCase();
		}

/*

Hope this pseudocode makes sense...
I will build all lookup lists

funder-code = ""
funder-name = ""
iso-codes = "AO,GB,etc"
iso-names = "Angola,United Kingdom,etc"
funder-exception-codes = "XM,XY,XX"
funder-exception-names = "Multilaterals,Other international organisations,Unknown"

Org-Id = participating-org/@role="funding"/@ref
If org-id else org-id = participating-org/@role="extending"/@ref
If org-id else org-id = reporting-org/@ref

exception-ids = "NL-KVK-12345,41002,etc"
exception-funders = "GB,XM,etc"
DAC-channel-ids = "41000,41002,etc"
DAC-channel-funder-codes = "XM,XY,etc"

If org-id exists in exception-ids then 
funder-code = exception-funders
End else
If org-id[3,1] = "-" and Alpha(org-id[1,2]) then
funder-code = org-id[1,2]
End else
If Len(org-id) = 5 and Num(org-id) then
If org-id exists in DAC-channel-ids then
funder-code = DAC-channel-funder-codes
End else
funder-code = "XX" 
End
End
End
End

If funder-code[1,1] = "X" then
Locate funder-code in funder-exception-codes then
funder-name = funder-exception-names
End 
End else
Locate funder-code in iso-codes then
funder-name = iso-names
End
End

*/




// fix percents to add upto 100
		var fixpercents=function(aa)
		{
			var total=0;
			
			for(var i=0;i<aa.length;i++)
			{
				aa[i]=parseFloat(aa[i]) || 1;
				total+=aa[i];
			}

			for(var i=0;i<aa.length;i++)
			{
				aa[i]=100*aa[i]/total;
			}			
		};
		
		var country=[];
		var percents=[];
		refry.tags(act,"recipient-country",function(it){ country.push( (it.code || "").toUpperCase() ); percents.push(it.percentage); });
		fixpercents(percents);
		if(country[0]) {
			for( var i=0; i<country.length ; i++ )
			{
				var cc=country[i];
				var pc=percents[i];
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["country"]);
				sa.run({"$country_aid":t.aid,"$country_code":cc,"$country_percent":pc});				
				sa.finalize();
			}
		}

		var sectors=[];
		var percents=[];
		refry.tags(act,"sector",function(it){ if(it.vocabulary=="DAC") { sectors.push(it.code); percents.push(it.percentage); } });
		fixpercents(percents);
		if(sectors[0]) {
			for( var i=0; i<sectors.length ; i++ )
			{
				var sc=sectors[i];
				var pc=percents[i];
				var group="none";
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["sector"]);
				sa.run({"$sector_aid":t.aid,"$sector_group":group,"$sector_code":sc,"$sector_percent":pc});				
				sa.finalize();
			}
		}

		var locations=[];
		var percents=[];
		refry.tags(act,"location",function(it){ locations.push(it); percents.push(it.percentage); });
		fixpercents(percents);
		if(sectors[0]) {
			for( var i=0; i<locations.length ; i++ )
			{
				var it=locations[i];
				var pc=percents[i];
				var longitude;
				var latitude;
				var precision;
				var name=refry.tagval_trim(it,"name");
				var code=refry.tagattr(it,"location-type","code");
				var gazref=refry.tagattr(it,"gazetteer-entry","gazetteer-ref");
				var gaz=refry.tagval_trim(it,"gazetteer-entry");
				var co=refry.tag(it,"coordinates");
				if(co)
				{
					longitude=co.longitude;
					latitude=co.latitude;
					precision=co.precision;
				}
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["location"]);
				sa.run({"$location_aid":t.aid,
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

		t.day_start=null;
		t.day_end=null;
		refry.tags(act,"activity-date",function(it){
			if( it.type=="start-planned" ) 	{ t.day_start=iati_xml.get_isodate_number(it); }
			else
			if( it.type=="end-planned" )	{ t.day_end=iati_xml.get_isodate_number(it); }
		});
		refry.tags(act,"activity-date",function(it){
			if( it.type=="start-actual" ) 	{ t.day_start=iati_xml.get_isodate_number(it); }
			else
			if( it.type=="end-actual" )		{ t.day_end=iati_xml.get_isodate_number(it); }
		});

		t.day_length=t.day_end-t.day_start;

		t.default_currency=act["default-currency"];
		
		t.xml=xml;
		t.jml=JSON.stringify(act);
		
//		dstore_sqlite.replace(db,"activities",t);
		replace("activities",t);
		
		got_budget={};
		refry.tags(act,"transaction",function(it){refresh_transaction(it,act,t);});
		refry.tags(act,"planned-disbursement",function(it){refresh_budget(it,act,t);});
		refry.tags(act,"budget",function(it){
			var y=iati_xml.get_isodate_year(it,"period-start"); // get year from start date
			if( (!y) || (!got_budget[y]) ) // if not already filled in by planned
			{
				refresh_budget(it,act,t);
			}
			else
			{
//				ls({"skipyear":y});
			}
		});

		return t;
	};
	

	// remove all the old references to this aid before adding new
 	db.run("DELETE FROM transactions WHERE aid=?",aid);
	db.run("DELETE FROM budgets WHERE aid=?",aid); 
	db.run("DELETE FROM country WHERE country_aid=?",aid);
	db.run("DELETE FROM sector WHERE sector_aid=?",aid);

	// then add new
	var act_json=refresh_activity(xml);

};



/*
dstore_db.hack_acts = function(){
	
	var tabs={
			acts:[],
			trans:[],
			budgets:[] // or planned disbursements?
		};
	
	var counts={budget:0,transaction:0,planned:0};
	var totals={budget:0,transaction:0,planned:0};
	var values={};
	
	var add_value=function(n,v){
		if(values[n]===undefined) { values[n]={}; }
		values[n][ v ]=(values[n][ v ] || 0 ) +1;
	}
	
	var do_planned=function(it,act)
	{
		counts.planned++;
		
		var default_currency=act["default-currency"];

		var t={};
		t["aid"]=refry.tagval(act,"iati-identifier");
		t["org"]=refry.tagval(act,"reporting-org");
		t["start"]=iati_xml.get_isodate_number(it,"period-start");
		t["end"]=iati_xml.get_isodate_number(it,"period-end");
		t["usd"]=iati_xml.get_usd(it,"value",act["default-currency"]);

		tabs.budgets.push(t);

//		ls(t);
//		ls(it);

		totals.planned+=t.usd;
	};

	var do_budget=function(it,act)
	{
		counts.budget++;
		
		var default_currency=act["default-currency"];

		var t={};
		t["aid"]=refry.tagval(act,"iati-identifier");
		t["org"]=refry.tagval(act,"reporting-org");
		t["start"]=iati_xml.get_isodate_number(it,"period-start");
		t["end"]=iati_xml.get_isodate_number(it,"period-end");
		t["usd"]=iati_xml.get_usd(it,"value",act["default-currency"]);

		tabs.budgets.push(t);
		
		totals.budget+=t.usd;
		
	};

	var do_transaction=function(it,act)
	{
		counts.transaction++;

		var t={};

		t["aid"]=refry.tagval(act,"iati-identifier");
		t["org"]=refry.tagval(act,"reporting-org");
		
		t["description"]=refry.tagval(it,"description");
		t["usd"]=iati_xml.get_usd(it,"value",act["default-currency"]);
		t["code"]=iati_xml.get_code(it,"transaction-type");
		t["date"]=iati_xml.get_isodate_number(it,"transaction-date");
		
		tabs.trans.push(t);

		add_value("tdesc",t["description"]);
		add_value("tcode",t["code"]);

		totals.transaction+=t.usd;
	};

	var db = dstore_db.open();
	db.serialize(function() {
		db.each("SELECT jml FROM activities", function(err, row)
		{
			var act=JSON.parse(row.jml);

			tabs.acts.push(act);
			
			process.stdout.write(".");
			
//			console.log(util.inspect(act,{depth:null}));
//			console.log(act["reporting-org"]);
			var org=refry.tagval(act,"reporting-org");
			var default_currency=act["default-currency"];

			add_value("org",org);
			add_value("default_currency",default_currency);
			
			refry.tags(act,"transaction",function(it){do_transaction(it,act)});
			
			if( refry.tag(act,"planned-disbursement") ) // do we have planned or budget?
			{
				refry.tags(act,"budget",function(it){do_planned(it,act)});
			}
			else
			{
				refry.tags(act,"budget",function(it){do_budget(it,act)});
			}
*/
/*
			if(act.transaction)
			{
				for(var i=0;i<act.transaction.length;i++) { do_transaction(act.transaction[i],act); }
			}
			if(act.budget)
			{
				for(var i=0;i<act.budget.length;i++) { do_budget(act.budget[i],act); }
			}
			else
			if(act["planned-disbursement"])
			{
				for(var i=0;i<act["planned-disbursement"].length;i++) { do_planned(act["planned-disbursement"][i],act); }
			}
*/
/*			
//			for(var i=0;i<99999999999999999999;i++);

		},function(err, count){
			process.stdout.write("\n");
			console.log("counts");
			console.dir(counts);
			console.log("totals");
			console.dir(totals);
//			console.log("values");
//			console.dir(values);

			for(var n in tabs)
			{
				console.log(n+" : "+tabs[n].length);
			}

// sum transactions in a period

			var sum_trans=function(more,less)
			{
				var r={};
				for(var n in tabs.trans)
				{
					var v=tabs.trans[n];
					if( (v.date) && (v.date>more) && (v.date<less) && ( (v.code=="D") || (v.code=="E") ) )
					{
						if(r[v.org]===undefined)
						{
							r[v.org]={count:0,usd:0};
						}
						r[v.org].count++;
						r[v.org].usd+=v.usd;
					}
				}
				return r;
			}
			
			var sum_budgets=function(more,less)
			{
				var range=less-more;
				var r={};
				for(var n in tabs.budgets)
				{
					var v=tabs.budgets[n];
					if( (v.end) && (v.end>more) && (v.end<less) ) // check end date
					{
						if( (v.end-v.start)<range ) // long timespan budgets are ignored
						{
							if(r[v.org]===undefined)
							{
								r[v.org]={count:0,usd:0};
							}
							r[v.org].count++;
							r[v.org].usd+=v.usd;
						}
					}
				}
				return r;
			}

			var byorg={}
			var years=[2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018];
			years.map(function(year){

				var ts=sum_trans(   iati_xml.isodate_to_number(year+"-04-00") , iati_xml.isodate_to_number((year+1)+"-04-01") );
				var bs=sum_budgets( iati_xml.isodate_to_number(year+"-04-00") , iati_xml.isodate_to_number((year+1)+"-04-01") );
				
				ls(year);
				ls(ts);
				ls(bs);
				
				for(var org in ts)
				{
					var v=ts[org];
					if( byorg[org]===undefined ) { byorg[org]={}; }
					var o=byorg[org];
					
					o[ year+" #Trans"]=v.count;
					o[ year+" Trans"]=Math.round(v.usd);
				}

				for(var org in bs)
				{
					var v=bs[org];
					if( byorg[org]===undefined ) { byorg[org]={}; }
					var o=byorg[org];
					
					o[ year+" #Budget"]=v.count;
					o[ year+" Budget"]=Math.round(v.usd);
				}
				
			});
			
//			ls(byorg);

			var out=[];

			out.push("org")
			years.map(function(year){
//				out.push("\t"+year+" #Trans");
				out.push("\t"+year+" Trans");
//				out.push("\t"+year+" #Budget");
				out.push("\t"+year+" Budget");
			});
			out.push("\n");
			
			for(var org in byorg )
			{
				out.push(org);
				var v=byorg[org];
				years.map(function(year){
					var t;
//					out.push("\t");
//					t=v[year+" #Trans"]; if(t) { out.push(t); }
					out.push("\t");
					t=v[year+" Trans"]; if(t) { out.push(t); }
					out.push("\t");
//					t=v[year+" #Budget"]; if(t) { out.push(t); }
//					out.push("\t");
					t=v[year+" Budget"]; if(t) { out.push(t); }
				});
				out.push("\n");
			}

			console.log(out.join(""));


			console.log("org\tfrequencey")
			for(var n in values.org)
			{
				var v=values.org[n];
				console.log(n+"\t"+v)
			}

		});

	});
	db.close();


};
*/


dstore_db.create_tables = function(){
	return dstore_sqlite.create_tables();
}

dstore_db.check_tables = function(){
	return dstore_sqlite.check_tables();
}

// prepare some sql code
dstore_db.cache_prepare = function(){
	return dstore_sqlite.cache_prepare(dstore_db.tables);
}
dstore_db.cache_prepare();

