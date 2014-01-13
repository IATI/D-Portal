//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var dstore_db=exports;
if(typeof dstore_db  === "undefined") { dstore_db ={}; }
required["dstore_db"]=dstore_db;

var wait=require('wait.for');
var util=require('util');
var http=require('http');
var nconf = require('nconf');
var sqlite3 = require('sqlite3').verbose();
var xml2js = require('xml2js');

var exs=require('./exs');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// data table descriptions
dstore_db.tables={
	xmlacts:[
		{ name:"aid",				TEXT:true , PRIMARY:true },	// this is the iati Activity : iati-IDentifier and is used everywhere
		{ name:"xml",				TEXT:true },
		{ name:"json",				TEXT:true }
	],
	acts:[
		{ name:"aid",				TEXT:true , PRIMARY:true },
		{ name:"title",				TEXT:true },
		{ name:"description",		TEXT:true }
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


dstore_db.test = function(req,res){

	var db = new sqlite3.Database(':memory:');

	db.serialize(function() {
		db.run("CREATE TABLE lorem (info TEXT)");

		var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
		for (var i = 0; i < 10; i++)
		{
			stmt.run("Ipsum " + i);
		}
		stmt.finalize();

		var s=""
		db.each("SELECT rowid AS id, info FROM lorem", function(err, row)
		{
			
			console.log(row.id + ": " + row.info);
			s=s+row.id + ": " + row.info+"\n";
			
		},function(err, count){
			
			res.end(s);
			
		});
	});

	db.close();

};



dstore_db.fill_acts = function(acts){

	var db = dstore_db.open();	
	db.serialize(function() {

		var stmt = db.prepare("INSERT INTO xmlacts VALUES (?,?,?)");

		var rawacts=[];
		for(var i=0;i<acts.length;i++)
		{
			var v=acts[i];
			var xml;
			var json;
			xml2js.parseString(v, function (err, result) {
				xml=result;
				json=JSON.stringify(xml);
			});

			rawacts.push(xml);
			
			var id=xml["iati-activity"]["iati-identifier"][0]

//			console.dir(xml);

			process.stdout.write(".");

			stmt.run(id,v,json);

		}
		process.stdout.write("\n");
		
		console.log("Finalize data");
		stmt.finalize();
		
		console.log("checking data");
		db.each("SELECT id,xml FROM xmlacts", function(err, row)
		{
			process.stdout.write(".");
		},function(err, count){
			process.stdout.write("\n");
		});

		return rawacts;
	});
	db.close();
};

var xml_get_isodate=function(it)
{
	var t=it;
	if(t){
		if(t[0]){t=t[0];}
		if(t["$"]){t=t["$"];}
		if(t["iso-date"]){t=t["iso-date"]; return t;}
	}
	return null;
};


var xml_get_value=function(it)
{
	var t=it;
	if(t){
		if(t[0]){t=t[0];}
		if(t["_"]){
			return parseInt(t["_"]);
		}
	}
	return null;
}

var xml_get_value_year=function(it)
{
	var t=it;
	if(t){
		if(t[0]){t=t[0];}
		if(t["$"]){t=t["$"];}
		if(t["value-date"]){
			return parseInt(t["value-date"]); // parseint will get the first number and ignore the -
		}
	}
	return null;
}

var xml_get_value_currency=function(it)
{
	var t=it;
	if(t){
		if(t[0]){t=t[0];}
		if(t["$"]){t=t["$"];}
		if(t["currency"]){
			return t["currency"];
		}
	}
	return null;
}

var xml_get_usd=function(it,default_currency)
{
	var y=xml_get_value_year(it) || 2010; // pick a default year?
	if(y<1990) { y=1990; } // deal with bad year formats
	
	var x=xml_get_value_currency(it) || default_currency || "USD";
	var v=xml_get_value(it);
	return exs.exchange_year(y,x,v);
}

var xml_get_text=function(it)
{
	var t=it;
	if(t){
		if(t[0]){t=t[0];}
		if(t["_"]){t=t["_"];}
		return t;
	}
	return null;
}

var xml_get_code=function(it)
{
	var t=it;
	if(t){
		if(t[0]){t=t[0];}
		if(t["$"]){t=t["$"];}
		if(t["code"]){t=t["code"]; return t;}
	}
	return null;
}

dstore_db.hack_acts = function(){
	
	var counts={budget:0,transaction:0};
	var totals={budget:0,transaction:0};
	var values={};
	
	var add_value=function(n,v){
		if(values[n]===undefined) { values[n]={}; }
		values[n][ v ]=(values[n][ v ] || 0 ) +1;
	}
	
	var do_budget=function(it,act)
	{
		counts.budget++;
		
		var default_currency=act["$"]["default-currency"];

		var t={};
		t["start"]=xml_get_isodate(it["period-start"]);
		t["end"]=xml_get_isodate(it["period-end"]);
		t["usd"]=xml_get_usd(it["value"],default_currency);

//		console.dir(it);
//		console.dir(t);

		totals.budget+=t.usd;
		
		
//		for(var i=0;i<99999999999999999999;i++);
	};
	var do_transaction=function(it,act)
	{
		counts.transaction++;

		var default_currency=act["$"]["default-currency"];

		var t={};
		t["description"]=xml_get_text(it["description"]);
		t["usd"]=xml_get_usd(it["value"],default_currency);
		t["code"]=xml_get_code(it["transaction-type"]);

		add_value("tdesc",t["description"]);
		add_value("tcode",t["code"]);

//		if(t.usd)
//		{
			totals.transaction+=t.usd;
//		}
/*
 * 		else
		{
			var y=xml_get_value_year(it["value"]) || 2010; // pick a default year?
	if(y<1990) { y=1990; }
			var x=xml_get_value_currency(it["value"]) || default_currency || "USD";
			var v=xml_get_value(it["value"]);
			var usd=exs.exchange_year(y,x,v);
			ls([y,x,v,usd]);
			ls(default_currency);
			ls(t);
			ls(it);
		}
*/
		
//		ls(t);
//		ls(it);

//		for(var i=0;i<99999999999999999999;i++);
	};

	var db = dstore_db.open();
	db.serialize(function() {
		db.each("SELECT json FROM xmlacts", function(err, row)
		{
			var act=JSON.parse(row.json)["iati-activity"];
			process.stdout.write(".");
			
//			console.log(util.inspect(act,{depth:null}));
			
//			console.log(act["reporting-org"]);
			var org=act["reporting-org"][0]["_"];
			var default_currency=act["$"]["default-currency"];

			add_value("org",org);
			add_value("default_currency",default_currency);
			
			if(act.transaction)
			{
				for(var i=0;i<act.transaction.length;i++) { do_transaction(act.transaction[i],act); }
			}
			if(act.budget)
			{
				for(var i=0;i<act.budget.length;i++) { do_budget(act.budget[i],act); }
			}
			
//			for(var i=0;i<99999999999999999999;i++);

		},function(err, count){
			process.stdout.write("\n");
			console.log("counts");
			console.dir(counts);
			console.log("totals");
			console.dir(totals);
			console.log("values");
			console.dir(values);
			
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

		db.run("DROP TABLE If EXISTS xmlacts;");
		db.run("CREATE TABLE xmlacts (aid TEXT PRIMARY KEY,xml TEXT,json TEXT);");

		console.log("Created database "+nconf.get("database"));

	});
	
	db.close();
}


dstore_db.check_tables = function(){

	var db = dstore_db.open();

	db.serialize(function() {
	
		db.all("SELECT * FROM sqlite_master WHERE name=?;","xmlacts", function(err, rows)
		{
			console.dir(rows);
		});

	});

	db.close();
}

/*
 *  need this sort of thing in js to handle table creation?
 * 

-- get info about a table, this can only work if WE created the table
function get_info(db,kind)

	kind=fixkind(kind)

--[[
	local d=rows(db,"PRAGMA table_info('"..name.."')");
	print(wstr.serialize(d))
]]

	local d=rows(db,"select sql from sqlite_master where name = '"..kind.."';")
	
	if not d[1] then return end -- no table of the given kind exists
	
-- grab the bit in brackets
	local _,_,s=string.find(d[1].sql,"%((.*)%)")
--print(s)
-- and split it by commas
	local a=wstr.split(s,",")
	
	tab={}
	
	local flags={"NOT","NULL","INTEGER","REAL","TEXT","BLOB","PRIMARY","FOREIGN","KEY","COLLATE","BINARY","NOCASE","RTRIM","UNIQUE","CHECK","DEFAULT"}
	for i,v in ipairs(flags) do flags[v]=0 end -- set as this next word
	flags.DEFAULT=1 -- set as the next word
	
	for i,v in ipairs(a) do
		local c=wstr.split_words(v)
--		print(wstr.serialize(c))
		local d={}
		for i,v in ipairs(c) do d[v]=flags[v] and c[i+flags[v]] end -- set flags only if we recognise them
		local cmd=false
		for i,v in ipairs(flags) do if c[1]:sub(1,#v)==v then cmd=v end end
		if cmd then
			d.cmd=c[1] -- set the command
		else -- a named column
			d.name=c[1] -- set the name
			if d.name:sub(1,1)=="'" then d.name=d.name:sub(2,-2) end -- strip quotes
		end

		tab[i]=d
	end
	
--	print(wstr.serialize(tab))
	return tab
end

-- create or update a table, this can only update if *we* created the table using this function
-- info is the same as when returned from info function
-- the two arecompared and the table updated with any missing columns
-- so you may not get a a table in the exact order specified or it may have extra cruft etc
--
-- in general it should be safe to add columns to the end of the info and call this again
-- so we can modify existing tabs
function set_info(db,kind,info)

	kind=fixkind(kind)

--print(wstr.dump(info))

	old=get_info(db,kind)

-- build the sql string we need to run	
	local t={}
	local p=function(...) for i,v in ipairs{...} do t[#t+1]=tostring(v) end end

-- add a column
	local function pdef(t)
		if t.name then
			p("'"..t.name.."'")
			if t.INTEGER then
				p(" INTEGER")
			elseif t.REAL then
				p(" REAL")
			elseif t.TEXT then
				p(" TEXT")
			elseif t.BLOB then
				p(" BLOB")
			end
			if t.PRIMARY then
				p(" PRIMARY KEY")
			elseif t.UNIQUE then
				p(" UNIQUE")
			end
			if t.DEFAULT then
				p(" DEFAULT ",t.DEFAULT) --- Only numbers? ...dont want defaults anyhow...
			end
		end
	end
	
--check if is already added
	local function in_table(tab,name)
		for i,v in ipairs(tab) do
			if v.name==name then return true end
		end
	end
	
	if not old then -- create new
	
		p("CREATE TABLE "..kind.."( ")
		for i,v in ipairs(info) do
			if i>1 then p(" , ") end
			pdef(v)
		end
		p(" );")
	
	else -- adjust
	
		local ch -- if set then we need to add these columns
		for i,v in ipairs(info) do
			if not in_table(old,v.name) then
				ch=ch or {}
				ch[#ch+1]=v
			end
		end

		if ch then
print("ORIGINAL TABLE:"..wstr.dump(old))
print("ALTER TABLE:"..wstr.dump(ch))
			for i,v in ipairs(ch) do
				p("ALTER TABLE "..kind.." ADD COLUMN ")
				pdef(v)
				p(" ;")
			end
		end
	end
	
	if t[1] then -- something to do
--		print(table.concat(t))
		exec(db,table.concat(t))
	end
	
end

*/

