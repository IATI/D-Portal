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
	
	q.start_time=Date.now();
	
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
	if(q._json) // expand json values for ?json=jsondata (also remove the this unexpanded value)
	{
//		console.log(q._json);
		var t=JSON.parse(q._json);
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

	var stats_skip={	// ignore these columns
		"xml":true,
		"jml":true,
		"json":true
		};

	var ns=q[0];

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
		var aa=q.from.split(",");
		for(i=0;i<aa.length;i++)
		{
			var f=aa[i];
			for(n in dstore_sqlite.tables_active[f])
			{
				if(!stats_skip[n])
				{
					ss.push(" MAX("+n+") ");
					ss.push(" MIN("+n+") ");
					ss.push(" AVG("+n+") ");
					ss.push(" TOTAL("+n+") ");
					ss.push(" COUNT("+n+") ");
					ss.push(" COUNT(DISTINCT "+n+") ");
				}
			}
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

	var f=q.from || "";
	f=f.split(",");

// filter by real tables
	f=f.map(function(it){
		var r="";
		for(var name in dstore_sqlite.tables )
		{
			if(it==name){ r=name; }
		}
		return r;
	});
	
	if(f[0]=="") { f[0]="activities"; } // default to activities table
		
	q.from=f[0]; // store the first table name back in the q for later use
	
	ss.push( " FROM "+f[0]+" " )

	for( var i=1; i<f.length ; i++)
	{
		var n=f[i];
		if(n!="")
		{
			ss.push(" JOIN "+n+" ON aid="+n+"_aid " );
		}
	}

	if(ss[0]) { return ss.join(""); }
	return "";
};

query.getsql_where=function(q,qv){
	var ss=[];
	
	var ns=q[0];
	
	var joins={};
	
	var qemap={ // possible comparisons
		"_lt":"<",
		"_gt":">",
		"_lteq":"<=",
		"_gteq":">=",
		"_eq":"=",
		"_glob":"GLOB",
		"_like":"LIKE",
		"":"="
	};

	for(var n in ns)
	{
		for( var qe in qemap )
		{
			var ty=ns[n];
			var v=q[n+qe];
			var eq=qemap[qe];
			if( v !== undefined ) // got a value
			{
//				if(n=="recipient_country_code") { joins["recipient_country"]=true; }
//				if(n=="recipient_sector_code") { joins["recipient_sector"]=true; }
				
				var t=typeof v;
				if(t=="string")
				{
					var sa=v.split("|");
					var sb=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(v);
					if( v.length==10 && sb.length==4 && ty=="int") // date string, convert to number if dest is an int
					{
						v=iati_xml.isodate_to_number(v);
						ss.push( " "+n+" "+eq+" $"+n+qe+" " ); qv["$"+n+qe]=query.maybenumber(v);
					}
					else
					if(sa[1]) // there was an "|"
					{
						v=sa;
						t="object"; // do object below
					}
					else
					{
						ss.push( " "+n+" "+eq+" $"+n+qe+" " ); qv["$"+n+qe]=query.maybenumber(v);
					}
				}
				else
				if(t=="number")
				{
					ss.push( " "+n+" "+eq+" $"+n+qe+" " ); qv["$"+n+qe]=v;
				}
				
				if(t=="object") // array, string above may also have been split into array
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
		}
	}
	
	var ret="";
	if(ss[0]) { ret=" WHERE "+ss.join(" AND "); }
	
//	ss=[];
//	for(var n in joins)
//	{
//		ss.push(" JOIN "+n+" ON aid="+n+"_aid " );
//	}
//	if(ss[0]) { ret=ss.join(" ")+ret; }
	
	return ret;
};

query.getsql_group_by=function(q,qv){
	var ss=[];

	var ns=q[0];

	if(q.groupby)
	{
		var qq;
		qq=q.groupby.split(",");
		for(var i=0;i<qq.length;i++)
		{
			var v=qq[i];
			if(ns[v]) // valid member names only
			{
				ss.push(v);
			}
		}
	}
	
	if(ss[0]) { return " GROUP BY "+ss.join(" , "); }
	return "";
};

query.getsql_order_by=function(q,qv){
	var ss=[];

	var ns=q[0];

	if(q.orderby)
	{
		var qq;
		qq=q.orderby.split(",");
		for(var i=0;i<qq.length;i++)
		{
			var xtra="";
			var v=qq[i];
			if( v.slice(-1)=="-")
			{
				xtra=" DESC";
				v=v.slice(0,-1);
			}
			if(ns[v]) // valid member names only
			{
				ss.push(v+xtra);
			}
		}
	}

	if(ss[0]) { return " ORDER BY "+ss.join(" , "); }
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

query.getsql_build_column_names=function(q,qv){

	var ns={};
	for(var name in dstore_sqlite.tables )
	{
		for(var n in dstore_sqlite.tables_active[name])
		{
			ns[n]=dstore_sqlite.tables_active[name][n];
		}
	}
	
//	ns.recipient_country_code="index";
//	ns.recipient_sector_code="index";

	q[0]=ns; // special array of valid column names

};

query.do_select=function(q,res){

	query.getsql_build_column_names(q);

	var r={rows:[],count:0};
	var qv={};	
	r.qvals=qv
	r.query = 	query.getsql_select(q,qv) + 
				query.getsql_from(q,qv) + 
				query.getsql_where(q,qv) + 
				query.getsql_group_by(q,qv) + 
				query.getsql_order_by(q,qv) + 
				query.getsql_limit(q,qv);

	var db = dstore_db.open();
	db.serialize();

	db.each(r.query,qv, function(err, row)
	{
		r.rows.push(row);
		r.count++;
	});

	db.run(";", function(err, row){
		if(q.form=="xml")
		{
			res.set('Content-Type', 'text/xml');

			res.write(	'<?xml version="1.0" encoding="UTF-8"?>\n'+
						'<?xml-stylesheet type="text/xsl" href="/art/activities.xsl"?>\n'+
						'<result>\n'+
						'	<iati-activities>\n');
						
			for(var i=0;i<r.rows.length;i++)
			{
				var v=r.rows[i];
				if(v && v.jml)
				{
					res.write(	refry.json(v.jml) );
				}
			}

			res.end(	'	</iati-activities>\n'+
						'</result>\n');
    
   		}
		else
		if(q.form=="rawxml")
		{
			res.set('Content-Type', 'text/xml');

			res.write(	'<?xml version="1.0" encoding="UTF-8"?>\n'+
						'<?xml-stylesheet type="text/xsl" href="/art/activities.xsl"?>\n'+
						'<result>\n'+
						'	<iati-activities>\n');

			for(var i=0;i<r.rows.length;i++)
			{
				var v=r.rows[i];
				if(v && v.xml)
				{
					res.write(	v.xml );
				}
			}
    
			res.end(	'	</iati-activities>\n'+
						'</result>\n');
		}
		else
		{
			r.time=(Date.now()-q.start_time)/1000;
			res.jsonp(r);
		}
		db.close();
	});


};

// handle the /q url space
query.serv = function(req,res){
	var q=query.get_q(req);
	return query.do_select(q,res);
};

