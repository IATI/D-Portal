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
		"aid":true
	};
	
	
// data table descriptions
dstore_db.tables={
	activities:[
		{ name:"aid",							NOCASE:true , PRIMARY:true },
		{ name:"raw_xml",						TEXT:true },
		{ name:"raw_json",						TEXT:true },
		{ name:"json",							TEXT:true },
		{ name:"status_code",					INTEGER:true , INDEX:true },	
		{ name:"day_start",						INTEGER:true , INDEX:true },	
		{ name:"day_end",						INTEGER:true , INDEX:true },
		{ name:"day_length",					INTEGER:true , INDEX:true },
		{ name:"title",							NOCASE:true },
		{ name:"description",					NOCASE:true },
		{ name:"reporting_org",					NOCASE:true },
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true }
	],
	transactions:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"raw_json",						TEXT:true },
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
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true }
	],
	budgets:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"raw_json",						TEXT:true },
		{ name:"json",							TEXT:true },
		{ name:"type",							NOCASE:true },
		{ name:"day_start",						INTEGER:true , INDEX:true },
		{ name:"day_end",						INTEGER:true , INDEX:true },
		{ name:"day_length",					INTEGER:true , INDEX:true },
		{ name:"currency",						NOCASE:true },
		{ name:"value",							REAL:true },
		{ name:"usd",							REAL:true },
		{ name:"reporting_org",					NOCASE:true },
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true }
	],
	planned_disbursements:[
		{ name:"aid",							NOCASE:true , INDEX:true },
		{ name:"raw_json",						TEXT:true },
		{ name:"json",							TEXT:true },
		{ name:"type",							NOCASE:true },
		{ name:"day_start",						INTEGER:true , INDEX:true },
		{ name:"day_end",						INTEGER:true , INDEX:true },
		{ name:"day_length",					INTEGER:true , INDEX:true },
		{ name:"currency",						NOCASE:true },
		{ name:"value",							REAL:true },
		{ name:"usd",							REAL:true },
		{ name:"reporting_org",					NOCASE:true },
		{ name:"reporting_org_ref",				NOCASE:true , INDEX:true }
	],
// These are intended just to be joined to the above.
	recipient_country:[
		{ name:"recipient_country_aid",			NOCASE:true , INDEX:true },
		{ name:"recipient_country_code",		NOCASE:true , INDEX:true }
	],
	recipient_sector:[
		{ name:"recipient_sector_aid",			NOCASE:true , INDEX:true },
		{ name:"recipient_sector_code",			INTEGER:true , INDEX:true }
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


dstore_db.fill_acts = function(acts){

	var db = dstore_db.open();	
	db.serialize();

//	var stmt = db.prepare("REPLACE INTO activities (aid,raw_xml,raw_json) VALUES (?,?,?)");

	for(var i=0;i<acts.length;i++)
	{
		var xml=acts[i];
		json=refry.xml(xml);
		var aid=iati_xml.get_aid(json);
		
		if(aid)
		{
			process.stdout.write(".");
			dstore_db.refresh_act(db,aid,xml);
		}
		else
		{
			process.stdout.write(" "); // missing aid
		}
		
//		stmt.run(aid,xml,JSON.stringify(json[0]));
	}
	process.stdout.write("\n");
	
	console.log("Finalize data");
//	stmt.finalize();
	
	db.each("SELECT COUNT(*) FROM activities", function(err, row)
	{
		process.stdout.write("Number of acts = "+row["COUNT(*)"]+"\n");
	});

	db.run(";", function(err, row){
		db.close();
		process.stdout.write("\nFIN\n");
	});

};

// pull every activity from the table and update *all* connected tables using its raw xml data

dstore_db.refresh_acts = function(){
		
	var db = dstore_db.open();
	db.serialize();

	db.each("SELECT aid,raw_xml FROM activities", function(err, row){

		process.stdout.write(".");
		dstore_db.refresh_act(db,row.aid,row.raw_xml);
	});


	db.run(";", function(err, row){
		db.close();
		process.stdout.write("FIN\n");
	});

};

dstore_db.refresh_act = function(db,aid,raw_xml){

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

		t.raw_json=JSON.stringify(it);
		
//		dstore_sqlite.replace(db,"transactions",t);
		replace("transactions",t);

	};

	var refresh_budget=function(it,act,act_json)
	{
//		process.stdout.write("b");
		
		var t={};
		for(var n in dstore_db.bubble_act){ t[n]=act_json[n]; } // copy some stuff
		
		t["type"]=it["type"];

		t["day_start"]=				iati_xml.get_isodate_number(it,"period-start");
		t["day_end"]=				iati_xml.get_isodate_number(it,"period-end");
		t["day_length"]=			t["day_end"]-t["day_start"];
		
		t["currency"]=				iati_xml.get_value_currency(it,"value");
		t["value"]=					iati_xml.get_value(it,"value");
		t["usd"]=					iati_xml.get_usd(it,"value");

		t.raw_json=JSON.stringify(it);
		
//		dstore_sqlite.replace(db,"budgets",t);
		replace("budgets",t);

	};

	var refresh_planned_disbursement=function(it,act,act_json)
	{
//		process.stdout.write("p");
		
		var t={};		
		for(var n in dstore_db.bubble_act){ t[n]=act_json[n]; } // copy some stuff
		
		t["type"]=it["type"];

		t["day_start"]=				iati_xml.get_isodate_number(it,"period-start");
		t["day_end"]=				iati_xml.get_isodate_number(it,"period-end");
		t["day_length"]=			t["day_end"]-t["day_start"];
		
		t["currency"]=				iati_xml.get_value_currency(it,"value");
		t["value"]=					iati_xml.get_value(it,"value");
		t["usd"]=					iati_xml.get_usd(it,"value");

		t.raw_json=JSON.stringify(it);
		
//		dstore_sqlite.replace(db,"planned_disbursements",t);
		replace("planned_disbursements",t);

	};

	var refresh_activity=function(raw_xml)
	{
//		process.stdout.write("a");
		
		var act=refry.xml(raw_xml); // raw xml convert to json
		act=refry.tag(act,"iati-activity"); // and get the main tag
		
		iati_cook.activity(act); // cook the raw json(xml) ( most cleanup logic has been moved here )
		
		var t={};
		
		t.aid=iati_xml.get_aid(act);
		if(!t.aid) // do not save when there is no ID
		{
			process.stdout.write("-");
			return;
		}

		t.title=refry.tagval(act,"title");
		t.description=refry.tagval(act,"description");				
		t.reporting_org=refry.tagval(act,"reporting-org");				
		t.reporting_org_ref=refry.tagattr(act,"reporting-org","ref");
		t.status_code=refry.tagattr(act,"activity-status","code") || -1;
		
		var country=[];
		var percents=[];
		refry.tags(act,"recipient-country",function(it){ country.push( (it.code || "").toUpperCase() ); percents.push(it.percentage); });
		if(country[0]) {
			t.recipient_country_codes="/"+country.join("/")+"/";
			t.recipient_country_percents="/"+percents.join("/")+"/";
			country.forEach(function(it)
			{
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["recipient_country"]);
				sa.run({"$recipient_country_aid":t.aid,"$recipient_country_code":it});				
				sa.finalize();
			});
		}

		var sectors=[];
		var percents=[];
		refry.tags(act,"sector",function(it){ sectors.push(it.code); percents.push(it.percentage); });
		if(sectors[0]) {
			t.sector_codes="/"+sectors.join("/")+"/";
			t.sector_percents="/"+percents.join("/")+"/";
			sectors.forEach(function(it)
			{
				var sa = db.prepare(dstore_sqlite.tables_replace_sql["recipient_sector"]);
				sa.run({"$recipient_sector_aid":t.aid,"$recipient_sector_code":it});				
				sa.finalize();
			});
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
		
		t.raw_xml=raw_xml;
		t.raw_json=JSON.stringify(act);
		
//		dstore_sqlite.replace(db,"activities",t);
		replace("activities",t);
		
		refry.tags(act,"transaction",function(it){refresh_transaction(it,act,t);});
		refry.tags(act,"budget",function(it){refresh_budget(it,act,t);});
		refry.tags(act,"planned-disbursement",function(it){refresh_planned_disbursement(it,act,t);});

		return t;
	};
	
	db.run("DELETE FROM transactions WHERE aid=?",aid); // remove all the old references
	db.run("DELETE FROM budgets WHERE aid=?",aid); 
	db.run("DELETE FROM planned_disbursements WHERE aid=?",aid);
	db.run("DELETE FROM recipient_country WHERE recipient_country_aid=?",aid);
	db.run("DELETE FROM recipient_sector WHERE recipient_sector_aid=?",aid);

	// then add new
	var act_json=refresh_activity(raw_xml);
	
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
		db.each("SELECT raw_json FROM activities", function(err, row)
		{
			var act=JSON.parse(row.raw_json);

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

