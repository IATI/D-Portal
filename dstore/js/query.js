// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var query=exports;

var util=require('util');
var fs=require('fs');

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var dstore_db=require("./dstore_db");
var iati_codes=require("../json/iati_codes.json")

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
	var n=query.mustbenumber(v);
	if("number" == typeof n) { return n; }
	return v;
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
	var aa=req.url.split("?");
	if(aa[0]) {
		aa=aa[0].split(".");
		if(aa[1]) { q.form=aa[1]; }
	}

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
	if( q.form=="xml" || q.form=="html" ) // xml view so we...
	{
		if(q.from.indexOf("jml")==-1) // only add once
		{
			q.from+=",jml"; // ...need a jml join to spit out xml (jml is jsoned xml)
		}
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
		"count":function(){
			ss.push(" COUNT(*) AS count");
		}
	};
	
// available funcs
	var calc_funcs={
		"count":true,
		"round0":true,
		"round1":true,
		"percent_of":true,
		"sum_of_percent_of":true,
		"avg":true,
		"sum":true,
		"max":true,
		"min":true,
		"any":true,
	};
	
	var numeric="";
	if(dstore_db.engine=="pg") { numeric="::numeric"; }

	var calc_func=function(func,name)
	{
		switch(func)
		{
			case "count":
				ss.push(" COUNT(DISTINCT "+name+") AS count_"+name);
			break
			case "round0":
					ss.push(" ROUND("+name+numeric+",0) AS round0_"+name);
			break
			case "round1":
				ss.push(" ROUND("+name+numeric+",1) AS round1_"+name);
			break
			case "percent_of":
				percents("percent_of_"+name,name,"");
			break
			case "sum_of_percent_of":
				percents("sum_of_percent_of_"+name,name,"SUM");
			break
			case "avg":
				ss.push(" AVG("+name+") AS avg_"+name);
			break
			case "sum":
				ss.push(" SUM("+name+") AS sum_"+name);
			break
			case "max":
				ss.push(" MAX("+name+") AS max_"+name);
			break
			case "min":
				ss.push(" MIN("+name+") AS min_"+name);
			break
			case "any":
				ss.push(" MAX("+name+") AS "+name); // for getting a value from grouped data when any of them will do.
			break
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
			else // try all the calc names
			{
				for(var func in calc_funcs)
				{
					for(var name in ns)
					{
						if(v==func+"_"+name)
						{
							calc_func(func,name);
							done_list=true;
						}
					}
				}
			}
		}
	}
	
	if(done_list) // already dealt with above
	{
	}
	else
	if(q.select=="stats")
	{
		ss.push(" COUNT(*) AS count");
		var aa=q.from.split(",");
		for(i=0;i<aa.length;i++)
		{
			var f=aa[i];
			for(n in dstore_db.tables_active[f])
			{
				var t=dstore_db.tables_active[f][n];
//				if(!stats_skip[n])
//				{
					if((t=="int")||(t=="float")) // only numbers
					{
						ss.push(" MAX("+n+") AS max_"+n+" ");
						ss.push(" MIN("+n+") AS min_"+n+" ");
						ss.push(" AVG("+n+") AS avg_"+n+" ");
						ss.push(" SUM("+n+") AS sum_"+n+" ");
					}
					ss.push(" COUNT("+n+") AS count_"+n+" ");
					ss.push(" COUNT(DISTINCT "+n+") AS distinct_"+n+" ");
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
				for(n in dstore_db.tables_active[f])
				{
//					if(!stats_skip[n])
//					{
						ss.push(" "+n+" ");
//					}
				}
			}
		}
	}
	
	return ss.join(" , ");
};

query.getsql_from=function(q,qv){
	var ss=[];

	var f=q.from;
	f=f.split(",");

// filter by real tables
	f=f.map(function(it){
		var r="";
		for(var name in dstore_db.tables )
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

	var niq=0;
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
						var sb=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(sa[0]);
						if( sa[0].length==10 && sb && sb.length==4 && ty=="int") // date string, convert to number if dest is an int
						{
							v=iati_xml.isodate_to_number(v);

							if(sa.length==2 && (/null/i).test(sa[1]) ) // allow an explicit or |null case
							{
								ss.push( " ( "+n+" "+eq+" "+dstore_db.text_plate(n+qe)+" OR "+n+" IS NULL ) " ); qv[dstore_db.text_name(n+qe)]=query.maybenumber(v,ty);
							}
							else
							{
								ss.push( " "+n+" "+eq+" "+dstore_db.text_plate(n+qe)+" " ); qv[dstore_db.text_name(n+qe)]=query.maybenumber(v,ty);
							}
						}
						else
						if(sa[1]) // there was an "|"
						{
							v=sa;
							t="object"; // do object below
						}
						else
						{
							ss.push( " "+n+" "+eq+" "+dstore_db.text_plate(n+qe)+" " ); qv[dstore_db.text_name(n+qe)]=query.maybenumber(v,ty);
						}
					}
					else
					if(t=="number")
					{
						ss.push( " "+n+" "+eq+" "+dstore_db.text_plate(n+qe)+" " ); qv[dstore_db.text_name(n+qe)]=v;
					}
					
					if(t=="object") // array, string above may also have been split into array
					{
						var so=[];
						for(var i=0;i<v.length;i++)
						{
							so.push( " "+dstore_db.text_plate(n+qe+"_"+i)+" " )
							qv[dstore_db.text_name(n+qe+"_"+i)]=query.maybenumber(v[i],ty);
						}
						if(v.length==2 && (/null/i).test(v[1]) ) // allow an explicit or null case for base comparisons
						{
							ss.push( " (  "+n+" "+eq+so[0]+" OR "+n+" IS NULL ) ");
							qv[ so[1].trim() ]=undefined; // not going to be used
						}
						else
						if(eq == "=") // make an IN statement
						{
							ss.push( " "+n+" IN ("+so.join(",")+") " );
						}
						else // explode into a bunch of OR statements
						{
							var st=[];
							st.push( " ( " );
							for(var i=0;i<so.length;i++)
							{
								var v=so[i];
								if(i>0) { st.push( " OR " ); }
								st.push( " "+n+" "+eq+v );
							}
							st.push( " ) " );
							
							ss.push(st.join(""));
						}
					}
				}
			}
		}
	}
	
	var v=q["text_search"];
	if( (ns["title"]) && (ns["description"]) && v ) // description and title and text_search available
	{
//console.log("text_search "+v)
		if(argv.pg) // can use better pg search code
		{
			ss.push( " to_tsvector('simple',title || ' ' || description) @@ plainto_tsquery('simple',"+dstore_db.text_plate("text_search")+") " );
			qv[dstore_db.text_name("text_search")]=v;
		}
		else // can only use old sqlite search code that only checks title
		{
			ss.push( " title LIKE "+dstore_db.text_plate("text_search") );
			qv[dstore_db.text_name("text_search")]="%"+v+"%";
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

query.getsql_distinct_on=function(q,qv){

	if(dstore_db.engine!="pg") { return ""; } // postgres only
	
	var ss=[];

	var ns=q[0];

	if(q.distincton)
	{
		var qq;
		qq=q.distincton.split(",");
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
	
	if(ss[0]) { return " DISTINCT ON ( "+ss.join(" , ")+" ) "; }
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
	for(var name in dstore_db.tables )
	{
		for(var n in dstore_db.tables_active[name])
		{
			ns[n]=dstore_db.tables_active[name][n];
		}
	}

	q[0]=ns; // special array of valid column names

};

query.do_select_response=function(q,res,r){

	var humanizer=function(name,value)
	{
		if(q.human!==undefined)
		{
			if( value != null )
			{
				switch(name)
				{
					case "day_start":
					case "day_end":
					case "hash_day":
						value=(new Date( Number((value)*(1000*60*60*24)) )).toISOString().split("T")[0]
					break
					case "status_code":
						value=iati_codes.activity_status[value] || value
					break
					case "trans_code":
						value=iati_codes.transaction_type[value] || value
					break
					case "sector_code":
					case "trans_sector":
					case "budget_sector":
						value=iati_codes.sector[value] || value
					break
					case "sector_group":
					case "trans_sector_group":
					case "budget_sector_group":
						value=iati_codes.sector_category[value] || value
					break
					case "country_code":
					case "trans_country":
					case "budget_country":
						value=iati_codes.country[value] || value
					break
					case "aid":
						value="http://d-portal.org/q.html?aid="+value
					break
				}
			}
			else
			{
				value="" // a null should be an empty string
			}
			return value
		}
		else
		{
			return value
		}
	}

	var send_json=function(r)
	{
		if(q.callback)
		{
			res.jsonp(r); // seems to only get headers right with a callback
		}
		else
		{
			res.set('charset','utf8');
			res.set('Content-Type', 'application/json');
			res.json(r);
		}
	};

	res.set('charset','utf8'); // This is always the correct answer.

	if(q.form=="html")
	{
		res.set('Content-Type', 'text/xml');

		var xsl='<?xml-stylesheet type="text/xsl" href="/ctrack/art/activities.xsl"?>\n';
		if(q.xsl=="!") { xsl=""; } // disable pretty view
		
		res.write(	'<?xml version="1.0" encoding="UTF-8"?>\n'+
					xsl+
					'<iati-activities xmlns:dstore="http://d-portal.org/dstore" xmlns:iati-extra="http://datastore.iatistandard.org/ns">\n');
					
		for(var i=0;i<r.rows.length;i++)
		{
			var v=r.rows[i];
			if(v && v.jml)
			{
				res.write(	refry.json(v.jml) );
				res.write(	"\n" );
			}
		}

		res.end(	'</iati-activities>\n');

	}
	else
	if(q.form=="xml")
	{
		res.set('Content-Type', 'text/xml');

		res.write(	'<iati-activities xmlns:iati-extra="http://datastore.iatistandard.org/ns">\n');
					
		for(var i=0;i<r.rows.length;i++)
		{
			var v=r.rows[i];
			if(v && v.jml)
			{
				var d=JSON.parse(v.jml);
				delete d["dstore:slug"];	// remove dstore tags
				delete d["dstore:idx"];
				
				res.write(	refry.json(d) );
				res.write(	"\n" );
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
					var s=""+humanizer(n,v[n]);
					if("string" == typeof s) // may need to escape
					{
						if(s.includes(",") || s.includes(";") || s.includes("\t") || s.includes("\n") ) // need to escape
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
					t.push( humanizer(n,v[n]) || null );
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
		if(q.human!==undefined)
		{
			for(var i=0;i<r.rows.length;i++)
			{
				var v=r.rows[i];
				var vv={}
				for(var n in v) { vv[n]=humanizer(n,v[n]) }
				r.rows[i]=vv
			}
		}
		r.time=(Date.now()-q.start_time)/1000;
		send_json(r);
	}
}

query.do_select=function(q,res,req){

	query.getsql_build_column_names(q);

	var r={rows:[],count:0};
	var qv={};	
	r.qvals=qv
	r.query =	" SELECT "+
				(q.distincton?"* FROM ( SELECT ":"")+
				query.getsql_distinct_on(q,qv) + 
				query.getsql_select(q,qv) + 
				query.getsql_from(q,qv) + 
				query.getsql_where(q,qv) + 
				query.getsql_group_by(q,qv) + 
				(q.distincton?" ) q ":"")+
				query.getsql_order_by(q,qv) + 
				query.getsql_limit(q,qv);

//console.log(r.query);
	return dstore_db.query_select(q,res,r,req);
};

// handle the /q url space
query.serv = function(req,res){
	var q=query.get_q(req);

// special log info requests
	var logname=__dirname+'/../../dportal/production/cron.log'
	if(argv.instance)
	{
		var instance=(req && req.subdomains && req.subdomains[0]) || argv.instance;
		instance=String( instance ).replace(/[^A-Za-z0-9]/g, ''); // force alphanumeric only

		logname=__dirname+"/../../dstore/instance/"+instance+".log";
	}
	if(q.from=="sluglog" && q.slug) // download a specific slug log
	{
		var slug=q.slug;
		slug=String( slug ).replace(/[^0-9a-zA-Z\-_]/g, '_');
		var logname1=__dirname+"/../../dstore/cache/"+slug+".xml.curl.last.log";
		var logname2=__dirname+"/../../dstore/cache/"+slug+".xml.import.last.log";

		fs.readFile(logname1,"utf8", function (err, data) {
				var ret={};
				if(err) { ret.err=err; res.jsonp(ret); }
				else
				{
					ret.log = data;
					fs.readFile(logname2,"utf8", function (err, data) {
						if(err) { ret.err=err; res.jsonp(ret); }
						else
						{
							ret.log = ret.log+"\n\n\n"+data;
							res.jsonp(ret);
						}
					});
				}
		});
		return;
	}
	else
	if(q.from=="cronlog_time")
	{
		fs.stat(logname, function (err, data) {
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
		fs.readFile(logname,"utf8", function (err, data) {
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
	
	return query.do_select(q,res,req);
};

