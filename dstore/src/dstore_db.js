//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var dstore_db=exports;
if(typeof dstore_db  === "undefined") { dstore_db ={}; }
required["dstore_db"]=dstore_db;

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');

var wait=require('wait.for');

var util=require('util');
var http=require('http');
var nconf = require('nconf');
var sqlite3 = require('sqlite3').verbose();



var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// data table descriptions
dstore_db.tables={
	activities:[
		{ name:"aid",					TEXT:true , PRIMARY:true },
		{ name:"raw_xml",				TEXT:true },
		{ name:"raw_json",				TEXT:true },
		{ name:"json",					TEXT:true },
		{ name:"day_start",				INTEGER:true },
		{ name:"day_end",				INTEGER:true },
		{ name:"day_length",			INTEGER:true },
		{ name:"title",					TEXT:true },
		{ name:"description",			TEXT:true },
		{ name:"reporting_org",			TEXT:true },
		{ name:"reporting_org_ref",		TEXT:true }
	],
	transactions:[
		{ name:"aid",					TEXT:true },
		{ name:"raw_json",				TEXT:true },
		{ name:"json",					TEXT:true },
		{ name:"ref",					TEXT:true },
		{ name:"description",			TEXT:true },
		{ name:"day",					INTEGER:true },
		{ name:"currency",				TEXT:true },
		{ name:"value",					REAL:true },
		{ name:"usd",					REAL:true },
		{ name:"code",					TEXT:true },
		{ name:"flow_code",				TEXT:true },
		{ name:"finance_code",			TEXT:true },
		{ name:"aid_code",				TEXT:true }
	],
	budgets:[
		{ name:"aid",					TEXT:true },
		{ name:"raw_json",				TEXT:true },
		{ name:"json",					TEXT:true },
		{ name:"type",					TEXT:true },
		{ name:"day_start",				INTEGER:true },
		{ name:"day_end",				INTEGER:true },
		{ name:"day_length",			INTEGER:true },
		{ name:"currency",				TEXT:true },
		{ name:"value",					REAL:true },
		{ name:"usd",					REAL:true }
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
dstore_db.hack_exs = function(){
	
	var exs=["AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BOV","BRL","BSD","BTN","BWP","BYR","BZD","CAD","CDF","CHF","CLF","CLP","CNY","COP","COU","CRC","CUC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRO","MUR","MVR","MWK","MXN","MXV","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","STD","SVC","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","USN","USS","UYI","UYU","UZS","VEF","VND","VUV","WST","XAF","XCD","XOF","XPF","YER","ZAR","ZMK","ZWL"];

	var years={
	}
	
	exs.map(function(v){
		ls(v);
		var csv=wait.for(http_getbody,"http://www.oanda.com/currency/average?amount=1&start_month=1&start_year=1990&end_month=1&end_year=2014&base=USD&avg_type=Year&Submit=1&exchange="+v+"&interbank=0&format=CSV");
		if(csv){csv=csv.split("<pre>")[2];}
		if(csv){csv=csv.split("</PRE>")[0];} // hacks to grab the csv part of the page...
		if(csv)
		{
			csv.split("\n").map(function(line){
				var l=line.split(",");
				if(l[1])
				{
					if(l[0][0]=="*"){ l[0]=l[0].split("*")[1]; } // remove leading * (marks incomplete data)
					var year=parseInt(l[0]);
					var val=Number(l[1]);
					
					years[year]=years[year] || {};
					years[year][v]=val;
				}
			});
		}
	});

	var p=[];
	p.push("year");
	exs.map(function(v){
		p.push("\t");
		p.push(v);
	});
	p.push("\n");
	
	for(y in years)
	{
		p.push(""+y);
		exs.map(function(v){
			p.push("\t");
			if(years[y][v] && years[y][v]>0)
			{
				p.push(""+years[y][v]);
			}
		});
		p.push("\n");
	}
	console.log(p.join(""));
//	ls(years);
// http://www.oanda.com/currency/average?amount=1&start_month=1&start_year=1990&end_month=1&end_year=2014&base=USD&avg_type=Year&Submit=1&exchange=GBP&interbank=0&format=CSV

}


dstore_db.open = function(){
	var db = new sqlite3.Database( nconf.get("database") );
	
// speed up data writes.
	db.serialize(function() {
		db.run('PRAGMA synchronous = 0 ;');
		db.run('PRAGMA encoding = "UTF-8" ;');
		db.run('PRAGMA journal_mode=WAL;');
	});
	
	return db;
};


dstore_db.fill_acts = function(acts){

	var db = dstore_db.open();	
	db.serialize();

	var stmt = db.prepare("INSERT INTO activities (aid,raw_xml,raw_json) VALUES (?,?,?)");

	for(var i=0;i<acts.length;i++)
	{
		var xml=acts[i];
		json=refry.xml(xml);
		var id=refry.tagval(json,"iati-identifier");

		process.stdout.write(".");

		stmt.run(id,xml,JSON.stringify(json[0]));
	}
	process.stdout.write("\n");
	
	console.log("Finalize data");
	stmt.finalize();
	
	console.log("checking data");
	db.each("SELECT aid,raw_xml FROM activities", function(err, row)
	{
		process.stdout.write(".");
	},function(err, count){
		process.stdout.write("\n");
	});

	db.run(";", function(err, row){
		db.close();
		process.stdout.write("\nFIN\n");
	});

};

// pull every activity from the table and update *all* connected tables using its raw json data

dstore_db.refresh_acts = function(){
		
	var db = dstore_db.open();
	db.serialize();

	var do_transaction=function(it,act)
	{
		var t={};

		t["aid"]=refry.tagval(act,"iati-identifier");
		t["ref"]=it["ref"];
		t["description"]=refry.tagval(it,"description");
		t["day"]=iati_xml.get_isodate_number(it,"transaction-date");

		t["code"]=iati_xml.get_code(it,"transaction-type");
		t["flow_code"]=iati_xml.get_code(it,"flow-type");
		t["finance_code"]=iati_xml.get_code(it,"finance-type");
		t["aid_code"]=iati_xml.get_code(it,"aid-type");
		
		t["currency"]=iati_xml.get_value_currency(it,"value") || act["default-currency"] || "USD";
		t["value"]=iati_xml.get_value(it,"value");
		t["usd"]=iati_xml.get_usd(it,"value",act["default-currency"]);

		var $t={}; for(var n in dstore_db.tables_active.transactions) { $t["$"+n]=t[n]; } // prepare to insert using named values
		$t.$json=JSON.stringify(t); // everything above is stored in the json string
		$t.$raw_json=JSON.stringify(it);
		
		var stmt = db.prepare(dstore_db.tables_insert_sql.transactions);
		stmt.run($t);
		stmt.finalize();
	};

	var do_budget=function(it,act)
	{
		var t={};
		
		t["aid"]=refry.tagval(act,"iati-identifier");

		t["type"]=it["type"];

		t["day_start"]=iati_xml.get_isodate_number(it,"period-start");
		t["day_end"]=iati_xml.get_isodate_number(it,"period-end");
		t["day_length"]=t["day_end"]-t["day_start"];
		
		t["currency"]=iati_xml.get_value_currency(it,"value") || act["default-currency"] || "USD";
		t["value"]=iati_xml.get_value(it,"value");
		t["usd"]=iati_xml.get_usd(it,"value",act["default-currency"]);

		var $t={}; for(var n in dstore_db.tables_active.budgets) { $t["$"+n]=t[n]; } // prepare to insert using named values
		$t.$json=JSON.stringify(t); // everything above is stored in the json string
		$t.$raw_json=JSON.stringify(it);
		
		var stmt = db.prepare(dstore_db.tables_insert_sql.budgets);
		stmt.run($t);
		stmt.finalize();
	};
	
	db.each("SELECT aid,raw_xml,raw_json FROM activities", function(err, row){

		var act=JSON.parse(row.raw_json);
		var t={};
		
		t.aid=row.aid;
		process.stdout.write(".");
//		console.log(t.aid);

		t.title=refry.tagval(act,"title");
		t.description=refry.tagval(act,"description");				
		t.reporting_org=refry.tagval(act,"reporting-org");				
		t.reporting_org_ref=refry.tag(act,"reporting-org").ref;

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
		
		var $t={}; for(var n in dstore_db.tables_active.activities) { $t["$"+n]=t[n]; } // prepare to insert using named values
		$t.$json=JSON.stringify(t); // everything above is stored in the json string
		$t.$raw_xml=row.raw_xml;
		$t.$raw_json=row.raw_json;
		
		var sa = db.prepare(dstore_db.tables_update_sql.activities+" WHERE aid=$aid ");
		sa.run($t);
		sa.finalize();
		
		db.run("DELETE FROM transactions WHERE aid=?",t.aid); // remove all the old ones, then add new
		refry.tags(act,"transaction",function(it){do_transaction(it,act)});

		db.run("DELETE FROM budgets WHERE aid=?",t.aid); // remove all the old ones, then add new
		refry.tags(act,"budget",function(it){do_budget(it,act)});

	});

	db.run(";", function(err, row){
		db.close();
		process.stdout.write("\FIN\n");
	});

};




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

/*
			console.log("org\tfrequencey")
			for(var n in values.org)
			{
				var v=values.org[n];
				console.log(n+"\t"+v)
			}
*/
		});

	});
	db.close();


};



dstore_db.create_tables = function(){

	var db = dstore_db.open();

	db.serialize(function() {
	
// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		for(var name in dstore_db.tables)
		{
			var tab=dstore_db.tables[name];
			var s=dstore_db.getsql_create_table(db,name,tab);

			console.log(s);

			db.run("DROP TABLE IF EXISTS "+name+";");
			db.run(s);
		}

		console.log("Created database "+nconf.get("database"));
		
	});
	
	db.close();
}


dstore_db.getsql_prepare_insert = function(name,row){

	var s=[];

	s.push("INSERT INTO "+name+" ( ");
	
	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" "+n+" ");
		need_comma=true
	}

	s.push(" ) VALUES ( ");

	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" $"+n+" ");
		need_comma=true
	}

	s.push(" ); ");

	return s.join("");
}

dstore_db.getsql_prepare_update = function(name,row){

	var s=[];
	s.push("UPDATE "+name+" SET ");
	var need_comma=false;
	for(var n in row)
	{
		if(need_comma) { s.push(" , "); }
		s.push(" "+n+"=$"+n+" ");
		need_comma=true
	}
	s.push(" ");
	return s.join("");
}

dstore_db.getsql_create_table=function(db,name,tab)
{
	var s=[];
	
	s.push("CREATE TABLE "+name+" ( ");
	
	for(var i=0; i<tab.length;i++)
	{
		var col=tab[i];

		s.push(" "+col.name+" ");
		
		if(col.INTEGER)		{ s.push(" INTEGER "); }
		else
		if(col.REAL) 		{ s.push(" REAL "); }
		else
		if(col.TEXT) 		{ s.push(" TEXT "); }
		else
		if(col.BLOB) 		{ s.push(" BLOB "); }

		if(col.PRIMARY) 	{ s.push(" PRIMARY KEY "); }
		else
		if(col.UNIQUE) 		{ s.push(" UNIQUE "); }
		
		if(i<tab.length-1)
		{
		s.push(" , ");
		}
	}
	
	s.push(" ); ");

	return s.join("");
}

dstore_db.check_tables = function(){

	var db = dstore_db.open();

	db.serialize(function() {
	
		db.all("SELECT * FROM sqlite_master;", function(err, rows)
		{
			ls(rows);
		});

	});

	db.close();
}


// prepare some sql code cache
dstore_db.cache_prepare = function(){

	dstore_db.tables_insert_sql={};
	dstore_db.tables_update_sql={};
	dstore_db.tables_active={};
	for(var name in dstore_db.tables)
	{
		var t={};
		for(var i=0; i<dstore_db.tables[name].length; i++ )
		{
			var v=dstore_db.tables[name][i];
			t[v.name]=true;
		}
		dstore_db.tables_active[name]=t;
		dstore_db.tables_insert_sql[name]=dstore_db.getsql_prepare_insert(name,t);
		dstore_db.tables_update_sql[name]   =dstore_db.getsql_prepare_update(name,t);
	}
}
dstore_db.cache_prepare();

