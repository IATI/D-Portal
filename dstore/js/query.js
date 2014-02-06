//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var query=exports;
if(typeof query  === "undefined") { dstore_db ={}; }
required["query"]=query;

var util=require('util');

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var dstore_db=require("./dstore_db");
var dstore_sqlite=require("./dstore_sqlite");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


query.mustbenumber=function(v)
{
	var n=Number(v);
	if("number" == typeof n)
	{
		if(n==n) //check for nan
		{
			return n;
		}
	}
	return undefined;
}

query.maybenumber=function(v)
{
	return query.mustbenumber(v) || v;
}



//
// 3 ways of passing query values
//
// Highest priority is just a standard query string, this is merged with
// and overides lower priority data
//
// Next is the special json values in a standard query string which contains json data
// so a ?json={"a":1} style string
//
// Finally you may perform a post request with json in the body.
//
query.get_q = function(req){
	var q={};
	var cp=function(f,unesc){
		for(var n in f) // single depth copy only
		{
			var v=f[n];
			if(unesc){ v=unesc(v); ls([v,unesc(v)]); } // use unescape function?
			if(q[n]===undefined) // only set if not exists, so call cp in order of priority from high to low
			{
				q[n]=v;
			}
		}
	};

// start with normal query
	cp(req.query);

// possibly containing an encoded json string?
	if(q.json) // expand json values for ?json=jsondata (also remove the this unexpanded value)
	{
		console.log(q.json);
		var t=JSON.parse(q.json);
		q.json=undefined;
		cp(t);
	}

// finally the body may contain json so add that as well
	if(req.body)
	{
		cp(req.body);
	}

// we now have a json style chunk of data that consists of many possible inputs
	return q;
};

query.test = function(q,res){
	var r={};
	var db = dstore_db.open();
	db.serialize(function() {
		
		r.count=0;
		r.freq={}
		
		var count=function(n,v)
		{
			var t=r.freq[n];
			if(!t)
			{
				t={};
				r.freq[n]=t;
			}
			t[v]=( t[v] || 0 ) + 1;
		};
		
		db.each("SELECT raw_json FROM activities", function(err, row)
		{
			var act=JSON.parse(row.raw_json);
			
			r.count++;
//console.log(act);

			for(var n in act)
			{
				var v=act[n];
				if( ("string"==typeof n) && ("string"==typeof v) )
				{
					count(n,v);
				}
			}
			
			act[1].forEach(function(it){
				var n=it[0];
				var v=it[1];
				if(v) { v=v[0]; }
				if( ("string"==typeof n) && ("string"==typeof v) )
				{
//					console.log(n + " : " + v);
					count(n,v);
				}
			});
			
		},function(err,count)
		{

			res.jsonp(r)
			
		});
		
	});
	db.close();


};

query.stats=function(req,res){
	
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
	db.serialize();

	db.each("SELECT raw_json FROM activities", function(err, row)
	{
		var act=JSON.parse(row.raw_json);

		tabs.acts.push(act);
		
		process.stdout.write(".");

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

	});
	
	db.run(";", function(err, row){

//			process.stdout.write("\n");
//			console.log("counts");
//			console.dir(counts);
//			console.log("totals");
//			console.dir(totals);

//			for(var n in tabs)
//			{
//				console.log(n+" : "+tabs[n].length);
//			}

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
			
//				ls(year);
//				ls(ts);
//				ls(bs);
			
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

/*
* 			var out=[];

		out.push("org")
		years.forEach(function(year){
			out.push("\t"+year+" #Trans");
			out.push("\t"+year+" Trans");
			out.push("\t"+year+" #Budget");
			out.push("\t"+year+" Budget");
		});
		out.push("\n");
		
		for(var org in byorg )
		{
			out.push(org);
			var v=byorg[org];
			years.forEach(function(year){
				var t;
				out.push("\t");
				t=v[year+" #Trans"]; if(t) { out.push(t); }
				out.push("\t");
				t=v[year+" Trans"]; if(t) { out.push(t); }
				out.push("\t");
				t=v[year+" #Budget"]; if(t) { out.push(t); }
				out.push("\t");
				t=v[year+" Budget"]; if(t) { out.push(t); }
			});
			out.push("\n");
		}

		console.log(out.join(""));
*/
		var freq={};
		for(var n in tabs)
		{
			freq[n]=tabs[n].length;
		}

		res.jsonp({orgs:byorg,counts:counts,totals:totals,freq:freq});

	});

	db.run(";", function(err, row){
		db.close();
	});

};

query.getsql_select=function(q,qv){
	var ss=[];

	var ns={};
	for(var name in dstore_sqlite.tables )
	{
		for(var n in dstore_sqlite.tables_active[name])
		{
			ns[n]=true;
		}
	}

	var done_list=false;
	if(q.select)
	{
		var qq;
		qq=q.select.split(",");
		for(var i=0;i<qq.length;i++)
		{
			var v=qq[i];
			if(ns[v]) // valid member names only
			{
				ns[v]=undefined; // only allow once
				ss.push(v);
				done_list=true;
			}
		}
	}
	
	if(done_list) // already dealt with above
	{
	}
	else
	if(q.select=="stats")
	{
		ss.push(" COUNT(*) ");
		for(n in dstore_sqlite.tables_active[q.from])
		{
			ss.push(" MAX("+n+") ");
			ss.push(" MIN("+n+") ");
			ss.push(" AVG("+n+") ");
			ss.push(" TOTAL("+n+") ");
			ss.push(" COUNT("+n+") ");
			ss.push(" COUNT(DISTINCT "+n+") ");
		}
	}
	else
	{
		ss.push(" * ");
	}
	
	return " SELECT "+ss.join(" , ");
};

query.getsql_from=function(q,qv){
	var ss=[];

	for(var name in dstore_sqlite.tables )
	{
		if(q.from==name)
		{
			ss.push(name);
		}
	}

	if(ss[0]) { return " FROM "+ss.join("")+" "; }
	return "";
};

query.getsql_where=function(q,qv){
	var ss=[];
	

	var ns={};
	for(var name in dstore_sqlite.tables )
	{
		for(var n in dstore_sqlite.tables_active[name])
		{
			ns[n]=true;
		}
	}

	for(var n in ns)
	{
		var v=q[n];
		var t=typeof v;
		if(t=="string")
		{
			var sa=v.split("|");
			if(sa[1]) // there was an "|"
			{
				v=sa;
				t="object"; // do below
			}
			else
			{
				var s1=v.slice(0,1);
				if(s1=="*")
				{
					v=v.slice(1);
					ss.push( " "+n+" LIKE $"+n+" " ); qv["$"+n]=query.maybenumber(v);
				}
				else
				if(s1=="<")
				{
					v=v.slice(1);
					ss.push( " "+n+"<$"+n+" " ); qv["$"+n]=query.maybenumber(v);
				}
				else
				if(s1==">")
				{
					v=v.slice(1);
					ss.push( " "+n+">$"+n+" " ); qv["$"+n]=query.maybenumber(v);
				}
				else
				{
					ss.push( " "+n+"=$"+n+" " ); qv["$"+n]=query.maybenumber(v);
				}
			}
		}
		else
		if(t=="number")
		{
			ss.push( " "+n+"=$"+n+" " ); qv["$"+n]=v;
		}
		
		if(t=="object")
		{
			var so=[];
			for(var i=0;i<v.length;i++)
			{
				so.push( " $"+n+"_"+i+" " )
				qv["$"+n+"_"+i]=query.maybenumber(v[i]);
			}
			ss.push( " "+n+" IN ("+so.join(",")+") " );
		}
		
	}
	
	if(ss[0]) { return " WHERE "+ss.join(" AND "); }
	return "";
};

query.getsql_group_by=function(q,qv){
	var ss=[];

	if(ss[0]) { return " GROUP BY "+ss.join(""); }
	return "";
};

query.getsql_limit=function(q,qv){
	var ss=[];
	var limit=100;
	
	if( q.limit )
	{
		var n=query.mustbenumber(q.limit);
		if( "number" == typeof n)
		{
			limit=n
		}
	}
	
	if(limit>=0)
	{
		ss.push(" LIMIT "+limit+" ");
	}
	
	if( q.page )
	{
		var n=query.mustbenumber(q.page);
		if( "number" == typeof n)
		{
			ss.push(" OFFSET "+n*limit+" ");
		}
	}
	else
	if( q.offset )
	{
		var n=query.mustbenumber(q.offset);
		if( "number" == typeof n)
		{
			ss.push(" OFFSET "+n+" ");
		}
	}

	if(ss[0]) { return ss.join(""); }
	return "";
};

query.do_select=function(q,res){

	var r={rows:[],count:0};
	var qv={};	
	r.qvals=qv
	r.query = 	query.getsql_select(q,qv) + 
				query.getsql_from(q,qv) + 
				query.getsql_where(q,qv) + 
				query.getsql_group_by(q,qv) + 
				query.getsql_limit(q,qv);

	var db = dstore_db.open();
	db.serialize();

	db.each(r.query,qv, function(err, row)
	{
		r.rows.push(row);
		r.count++;
	});

	db.run(";", function(err, row){
		res.jsonp(r);
		db.close();
	});


};

/*
 * query.stats2=function(req,res){

	var db = dstore_db.open();
	db.serialize();
	
	var r={rows:[]};
	var op={};
	var year=2012;
	op.$day_start=iati_xml.isodate_to_number(year+"-04-00") ;
	op.$day_end=  iati_xml.isodate_to_number((year+1)+"-04-01");
	op.$code1="E";
	op.$code2="D";
	db.each("SELECT SUM(usd) FROM transactions WHERE day > $day_start AND day < $day_end AND ( code=$code1 OR code=$code2 ) ", op , function(err, row)
	{
//		var t=JSON.parse(row.json);

		r.rows.push(row);

	});

	db.run(";", function(err, row){
		res.jsonp(r);
		db.close();
	});
	
};
*/

// handle the /q url space
query.serv = function(req,res){
	
	var q=query.get_q(req);
	
//	res.writeHead(200, {'Content-Type': "application/json"});
//	query.test(q,res);


//	query.stats(q,res);
	query.do_select(q,res);

/*	
	var r={};
	r.mime='text/html';
	r.head='<script src="jslib/head.min.js"></script>';
	r.body=JSON.stringify(q);
	r.headbody=
	'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"\n'+
	'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'+
	'<html xmlns="http://www.w3.org/1999/xhtml">\n'+
	'<head>'+r.head+'</head>\n'+
	'<body>'+r.body+'</body>\n'+
	'</html>\n';

	res.writeHead(200, {'Content-Type': r.mime});
	res.end(r.headbody);
*/

};

