// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var query=exports;

var util=require('util');
var fs=require('fs');

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

query.maybenumber=function(v,ty)
{
	if(ty=="char") { return ""+v; } // force string
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
//--REMOVED--- Finally you may perform a post request with json in the body.
//
query.get_q = function(req){
	var q={};
	
	q.start_time=Date.now();
	
	var cp=function(f,unesc){
		for(var n in f) // single depth copy only
		{
			var v=f[n];
			if(unesc){ v=unesc(v); } // use unescape function?
			if(q[n]===undefined) // only set if not exists, so call cp in order of priority from high to low
			{
				q[n]=v;
			}
		}
	};

// use file extension as form
	var aa=req.url.split(".");
	if(aa[1]) { q.form=aa[1].split("?")[0]; }

// start with normal query
	cp(req.query);

// possibly containing an encoded json string?
//	if(q._json) // expand json values for ?json=jsondata (also remove the this unexpanded value)
//	{
//		console.log(q._json);
//		var t=JSON.parse(q._json);
//		q.json=undefined;
//		cp(t);
//	}

// finally the body may contain json so add that as well
	if(req.body)
	{
		cp(req.body);
	}
	
// defaults
	if(!q.from)
	{
		q.from="act"; // default act
	}
	if(q.form=="xml") // xml view so we...
	{
		q.from+=",jml"; // ...need a jml join to spit out xml (jml is jsoned xml)
	}
	

// we now have a json style chunk of data that consists of many possible inputs
	return q;
};

query.getsql_select=function(q,qv){
	var ss=[];

//	var stats_skip={	// ignore these columns
//		"xml":true,
//		"jml":true,
//		"json":true
//		};


	var ns=q[0];

// extra special calculations
	var pcts={"country":true,"sector":true,"location":true};
	var percents=function(ret,name,agg){
		var mults=[];
		var aa=q.from.split(",");
		for(var i=0;i<aa.length;i++)
		{
			if( pcts[ aa[i] ] ) // validate
			{
				mults.push(aa[i]);
			}
		}
		var s=" "+agg+"( "+name+" ";
		mults.forEach(function(n){
			s=s+" * ("+n+"_percent/100)"
		});
		s=s+" ) AS "+ret+" ";
		ss.push(s);
	}
//these calculations need to be turned into generic prefix functions.
	var calc={
		"sum_of_percent_of_trans_usd":function(){
			percents("sum_of_percent_of_trans_usd","trans_usd","SUM");
		},
		"sum_of_percent_of_trans_value":function(){
			percents("sum_of_percent_of_trans_value","trans_value","SUM");
		},
		"percent_of_trans_usd":function(){
			percents("percent_of_trans_usd","trans_usd","");
		},
		"percent_of_trans_value":function(){
			percents("percent_of_trans_value","trans_value","");
		},
		"sum_of_percent_of_budget_usd":function(){
			percents("sum_of_percent_of_budget_usd","budget_usd","SUM");
		},
		"sum_of_percent_of_budget_value":function(){
			percents("sum_of_percent_of_budget_value","budget_value","SUM");
		},
		"percent_of_budget_usd":function(){
			percents("percent_of_budget_usd","budget_usd","");
		},
		"percent_of_budget_value":function(){
			percents("percent_of_budget_value","budget_value","");
		},
		"round0_location_longitude":function(){
			ss.push(" ROUND(location_longitude,0) AS round0_location_longitude");
		},
		"round0_location_latitude":function(){
			ss.push(" ROUND(location_latitude,0) AS round0_location_latitude");
		},
		"round1_location_longitude":function(){
			ss.push(" ROUND(location_longitude,1) AS round1_location_longitude");
		},
		"round1_location_latitude":function(){
			ss.push(" ROUND(location_latitude,1) AS round1_location_latitude");
		},
		"count_aid":function(){
			ss.push(" COUNT(DISTINCT aid) AS count_aid");
		},
		"count":function(){
			ss.push(" COUNT(*) AS count");
		}
	};

	var done_list=false;
	if(q.select)
	{
		var qq;
		qq=q.select.split(",");
		for(var i=0;i<qq.length;i++)
		{
			var v=qq[i];
			if( calc[v] )
			{
				calc[v](); // special
				done_list=true;
			}
			else
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
//				if(!stats_skip[n])
//				{
					ss.push(" MAX("+n+") ");
					ss.push(" MIN("+n+") ");
					ss.push(" AVG("+n+") ");
					ss.push(" TOTAL("+n+") ");
					ss.push(" COUNT("+n+") ");
					ss.push(" COUNT(DISTINCT "+n+") ");
//				}
			}
		}
	}
	else
	{
		if(q.form=="xml") // just need jml to spit out xml
		{
			ss.push(" jml ");
		}
		else
		{
//		ss.push(" * ");
			var aa=q.from.split(",");
			for(i=0;i<aa.length;i++)
			{
				var f=aa[i];
				for(n in dstore_sqlite.tables_active[f])
				{
//					if(!stats_skip[n])
//					{
						ss.push(" "+n+" ");
//					}
				}
			}
		}
	}
	
	return " SELECT "+ss.join(" , ");
};

query.getsql_from=function(q,qv){
	var ss=[];

	var f=q.from;
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
			
//	q.from=f[0]; // store the first table name back in the q for later use
	
	ss.push( " FROM "+f[0]+" " )

	for( var i=1; i<f.length ; i++)
	{
		var n=f[i];
		if(n!="")
		{
			ss.push(" JOIN "+n+" USING (aid) " );
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
		"_nteq":"!=",
		"_eq":"=",
		"_glob":"GLOB",
		"_like":"LIKE",
		"_null":"NULL",
		"_not_null":"NOT NULL",
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
				if( eq=="NOT NULL") { ss.push( " "+n+" IS NOT NULL " ); }
				else
				if( eq=="NULL") { ss.push( " "+n+" IS NULL " ); }
				else
				{
					var t=typeof v;
					if(t=="string")
					{
						var sa=v.split("|");
						var sb=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(v);
						if( v.length==10 && sb && sb.length==4 && ty=="int") // date string, convert to number if dest is an int
						{
							v=iati_xml.isodate_to_number(v);
							ss.push( " "+n+" "+eq+" $"+n+qe+" " ); qv["$"+n+qe]=query.maybenumber(v,ty);
						}
						else
						if(sa[1]) // there was an "|"
						{
							v=sa;
							t="object"; // do object below
						}
						else
						{
							ss.push( " "+n+" "+eq+" $"+n+qe+" " ); qv["$"+n+qe]=query.maybenumber(v,ty);
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
							qv["$"+n+"_"+i]=query.maybenumber(v[i],ty);
						}
						ss.push( " "+n+" IN ("+so.join(",")+") " );
					}
				}
			}
		}
	}
	
	var ret="";
	if(ss[0]) { ret=" WHERE "+ss.join(" AND "); }
	
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
			var n=parseInt(v);
			if(ns[v]) // valid member names only
			{
				ss.push(v);
			}
			else
			if("number" == typeof n) // or number
			{
				ss.push(n+"");
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
			else
			{
				var n=parseInt(v); // or allow numerical indexes into results row
				if((n>0)&&(n<100)&&(n==n))
				{
					ss.push(n+xtra);
				}
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
	
if(true)
{
	db.all( "EXPLAIN QUERY PLAN "+r.query,qv,
		function(err,rows)
		{
			if(rows)
			{
				r.sqlite_explain_detail=[];
				rows.forEach(function(it){
					r.sqlite_explain_detail.push(it.detail);
				});
			}
		}
	);
}
	

	db.each(r.query,qv, function(err, row)
	{
		if(err)
		{
			console.log(r.query+"\n"+err);
		}
		else
		{
			r.rows.push(row);
			r.count++;
		}
	});

	var send_json=function(r)
	{
		if(q.callback)
		{
			res.jsonp(r); // seems to only get headers right with a callback
		}
		else
		{
			res.set('Content-Type', 'application/json');
			res.json(r);
		}
	};
	db.run(";", function(err, row){
		if(q.form=="xml")
		{
			res.set('Content-Type', 'text/xml');

			var xsl='<?xml-stylesheet type="text/xsl" href="/art/activities.xsl"?>\n';
			if(q.xsl=="!") { xsl=""; } // disable pretty view
			
			res.write(	'<?xml version="1.0" encoding="UTF-8"?>\n'+
						xsl+
						'<iati-activities xmlns:dstore="http://d-portal.org/dstore">\n');
						
			for(var i=0;i<r.rows.length;i++)
			{
				var v=r.rows[i];
				if(v && v.jml)
				{
					res.write(	refry.json(v.jml) );
				}
			}

			res.end(	'</iati-activities>\n');
    
   		}
		else
		if(q.form=="csv")
		{
			res.set('Content-Type', 'text/csv');

			var head=[];
			if(r.rows[0])
			{
				for(var n in r.rows[0]) { head.push(n); }
				head.sort();
				res.write(	head.join(",")+"\n" );
				for(var i=0;i<r.rows.length;i++)
				{
					var v=r.rows[i];
					var t=[];
					head.forEach(function(n){
						var s=""+v[n];
						if("string" == typeof s) // may need to escape
						{
							if(s.split(",")[1] || s.split("\n")[1] ) // need to escape
							{
								s="\""+s.split("\"").join("\"\"")+"\""; // wrap in quotes and double quotes in string
							}
						}
						t.push( s );
					});
					res.write(	t.join(",")+"\n" );
				}
				res.end("");
			}
			else
			{
				res.end("");
			}
		}
		else
		if(q.form=="jcsv") // a jsoned csv (much smaller than json for large table data)
		{
			if(r.rows[0])
			{
				var head=[];
				var ta=[];
				for(var n in r.rows[0]) { head.push(n); }
				head.sort(); // result order will be fixed
				ta[0]=head;
				for(var i=0;i<r.rows.length;i++)
				{
					var v=r.rows[i];
					var t=[];
					ta[i+1]=t;
					head.forEach(function(n){
						t.push( v[n] || null );
					});
				}
				send_json(ta);
			}
			else
			{
				send_json([]); // nothing to see, but still trigger callback
			}
		}
		else
		{
			r.time=(Date.now()-q.start_time)/1000;
			send_json(r);
		}
		dstore_sqlite.close(db);
	});


};

// handle the /q url space
query.serv = function(req,res){
	var q=query.get_q(req);

// special log info requests
	if(q.from=="cronlog_time")
	{
		fs.stat('../dportal/production/cron.log', function (err, data) {
				var ret={};
				if(err) { ret.err=err; }
				else
				{
					ret.time = data.mtime;
				}
				res.jsonp(ret);
		});
		return;
	}
	else
	if(q.from=="cronlog")
	{
		fs.readFile('../dportal/production/cron.log',"utf8", function (err, data) {
				var ret={};
				if(err) { ret.err=err; }
				else
				{
					ret.log = data;
				}
				res.jsonp(ret);
		});
		return;
	}
	
	return query.do_select(q,res);
};

