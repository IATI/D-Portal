// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const static_query={}
export default static_query

import static_db from "./static_db.js"

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var smart_tsquery=function(s)
{
	if(s.match("\"")) { return s } // assume you know what you are doing

	var aa=s.split(/\s+/);
	var r=[]
	var last=""
	for( var it of aa )
	{
		if( last.match(/^[0-9a-zA-Z]+$/) && it.match(/^[0-9a-zA-Z]+$/) ) // insert an & between words
		{
			r.push("&")
			r.push(it)
		}
		else
		{
			r.push(it)
		}
		last=it
	}

	return r.join(" ")
}

static_query.mustbenumber=function(v)
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

static_query.maybenumber=function(v,ty)
{
	if(ty=="char") { return ""+v; } // force string
	var n=static_query.mustbenumber(v);
	if("number" == typeof n) { return n; }
	return v;
}



static_query.base_q = function(q){

	if( (!q.from) && q.aid ) // auto activity
	{
		q.from="xson"
		q.root="/iati-activities/iati-activity"
		return q
	}
	else
	if( (!q.from) && q.pid ) // auto publisher
	{
		q.from="xson"
		q.root="/iati-organisations/iati-organisation"
		return q
	}
	else
	if(!q.from)
	{
		q.from="act"; // default act
	}
	if( ( q.form=="xml" || q.form=="html" ) && (q.from.indexOf("xson")==-1) ) // xml hax needs exclusions for new xson
	{
		if(q.from.indexOf("jml")==-1) // only add once
		{
			q.from+=",jml"; // ...need a jml join to spit out xml (jml is jsoned xml)
		}
	}

	return q;
};

static_query.getsql_select=function(qq)
{
	let q=qq.q
	let qv=qq.qv

	var ss=[];

//	var stats_skip={	// ignore these columns
//		"xml":true,
//		"jml":true,
//		"json":true
//		};


	var ns=static_db.table_name_map;

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
		var s;
		if(agg)
		{
			s=" "+agg+"( "+name+" ";
		}
		else
		{
			s=" ( "+name+" ";
		}
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
	if(static_db.engine=="pg") { numeric="::numeric"; }

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
			for(n in static_db.tables_active[f])
			{
				var t=static_db.tables_active[f][n];
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
		if(q.form=="xml"&&q.from!="xson") // just need jml to spit out xml
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
				for(let n in static_db.tables_active[f])
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

static_query.getsql_from=function(qq)
{
	let q=qq.q
	let qv=qq.qv


	var startsmap=[
		"sum_of_percent_of_", // longest must be first
		"percent_of_",
		"filter_",
		"round0_",
		"round1_",
		"count_",
		"avg_",
		"sum_",
		"max_",
		"min_",
		"any_",
	];

	var endsmap=[
		"_not_null", // longest must be first
		"_lteq",
		"_gteq",
		"_nteq",
		"_glob",
		"_like",
		"_null",
		"_lt",
		"_gt",
		"_eq",
	];
	let trimq=function(n)
	{
		for( let starts of startsmap )
		{
			if(n.startsWith(starts))
			{
				n=n.slice(starts.length)
			}
		}
		for( let ends of endsmap )
		{
			if(n.endsWith(ends))
			{
				n=n.slice(n,-ends.length)
			}
		}
		return n
	}

	var ss=[];

	let ff={}
	let f=null
	for( let name of q.from.split(",") )
	{
		if( static_db.tables_active[name] )
		{
			ff[name]=name
			if(!f){f=name}
		}
	}

	for( let name in q ) // find tables in use
	{
		name=trimq(name)
		if( static_db.table_name_map[name] )
		{
			let t=static_db.table_name_map[name]
			ff[t.alias||t.table]=t
			if(!f){f=t.table}
		}
	}

	if(!f) { return "" } // no tables to join

	ss.push( " FROM "+f+" " )

	for( let name in ff)
	{
		if(name==f) { continue }
		let table=ff[name]

		if(typeof(table)=="string")
		{
			ss.push(" JOIN "+table+" USING (aid) " );
		}
		else
		if(typeof(table)=="object")
		{
			if(table.alias)
			{
				ss.push(" JOIN "+table.table+" AS "+table.alias+" USING (aid) " );
			}
			else
			{
				ss.push(" JOIN "+table.table+" USING (aid) " );
			}
		}
	}

	if(ss[0]) { return ss.join(""); }
	return "";
};

static_query.getsql_where=function(qq)
{
	let q=qq.q
	let qv=qq.qv

	var filters=[];
	var tables={};
	var wheres=[];

	var ns=static_db.table_name_map;

	var joins={};

	var premap={ // possible prefixs
		"filter_":"filter",
		"":"query",
	};

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
for(var n in ns) // all valid fields
{
	for( var pm in premap ) // prefix
	{
		var mp=premap[pm];
		var ss;
		if(mp=="filter")	{ ss=filters; } // a sub query
		else 				{ ss=wheres;  }

		for( var qe in qemap ) // postfix
		{
			var nformat=ns[n].format;
			var ntable=ns[n].table;
			var nname=ns[n].name;
			var v=q[pm+n+qe];
			var eq=qemap[qe];

			if( v !== undefined ) // got a value
			{
				if(mp=="filter") { tables[ntable]=true } // keep map of tables to filter with

				if( eq=="NOT NULL") { ss.push( " "+nname+" IS NOT NULL " ); }
				else
				if( eq=="NULL") { ss.push( " "+nname+" IS NULL " ); }
				else
				{
					var t=typeof v;
					if(t=="string")
					{
						var sa=v.split(/,|\|/);
						if( nname == "aid" ) // aid must remain a string as it could contain any old garbage
						{
							sa=[v]
						}
						var sb=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(sa[0]);
						if( sa[0].length==10 && sb && sb.length==4 && nformat=="int") // date string, convert to number if dest is an int
						{
							v=iati_xml.isodate_to_number(v);

							if(sa.length==2 && (/null/i).test(sa[1]) ) // allow an explicit or |null case
							{
								ss.push( " ( "+nname+" "+eq+" "+static_db.text_plate(n+qe)+" OR "+nname+" IS NULL ) " ); qv[static_db.text_name(n+qe)]=static_query.maybenumber(v,nformat);
							}
							else
							{
								ss.push( " "+nname+" "+eq+" "+static_db.text_plate(n+qe)+" " ); qv[static_db.text_name(n+qe)]=static_query.maybenumber(v,nformat);
							}
						}
						else
						if(sa[1]) // there was an "|" or "," so do multiple values
						{
							v=sa;
							t="object"; // do object below
						}
						else
						{
							ss.push( " "+nname+" "+eq+" "+static_db.text_plate(n+qe)+" " ); qv[static_db.text_name(n+qe)]=static_query.maybenumber(v,nformat);
						}
					}
					else
					if(t=="number")
					{
						ss.push( " "+nname+" "+eq+" "+static_db.text_plate(n+qe)+" " ); qv[static_db.text_name(n+qe)]=v;
					}

					if(t=="object") // array, string above may also have been split into array
					{
						var so=[];
						for(var i=0;i<v.length;i++)
						{
							so.push( " "+static_db.text_plate(n+qe+"_"+i)+" " )
							qv[static_db.text_name(n+qe+"_"+i)]=static_query.maybenumber(v[i],nformat);
						}
						if(v.length==2 && (/null/i).test(v[1]) ) // allow an explicit or null case for base comparisons
						{
							ss.push( " (  "+nname+" "+eq+so[0]+" OR "+nname+" IS NULL ) ");
							qv[ so[1].trim() ]=undefined; // not going to be used
						}
						else
						if(eq == "=") // make an IN statement
						{
							ss.push( " "+nname+" IN ("+so.join(",")+") " );
						}
						else // explode into a bunch of OR statements
						{
							var st=[];
							st.push( " ( " );
							for(var i=0;i<so.length;i++)
							{
								var v=so[i];
								if(i>0) { st.push( " OR " ); }
								st.push( " "+nname+" "+eq+v );
							}
							st.push( " ) " );

							ss.push(st.join(""));
						}
					}
				}
				if( ns[n].mode ) // lock mode
				{
					ss.push( " ( "+ns[n].mode_name+" = '"+ns[n].mode+"' AND " + ss.pop() + " ) " );
				}
			}
		}
	}
}

	if(static_db.engine!="pg") // old sqlite search code
	{
		var v=q["text_search"];
		if( (ns["title"]) && (ns["description"]) && v ) // description and title and text_search available
		{
//console.log("text_search "+v)
			if(!argv.pg) // use old sqlite search code that only checks title
			{
				wheres.push( " title LIKE "+static_db.text_plate("text_search") );
				qv[static_db.text_name("text_search")]="%"+v+"%";
			}
		}
	}

/*
	if( (ns["title"]) && q["keyword"] ) // simple keyword only search
	{
		wheres.push( " title LIKE "+static_db.text_plate("keyword") );
		qv[static_db.text_name("keyword")]="%"+q["keyword"]+"%";
	}
*/

	static_query.getsql_external_aids(q,qv,wheres)
	static_query.getsql_where_xson(q,qv,wheres)			// this only works with postgres

	var ret="";

	if(filters[0])
	{
		var ts=[]
		for(var n in tables) { ts.push(n) } // convert to array so we can join it
		tables=ts.join(",")
		wheres.push( " aid IN ( SELECT DISTINCT aid FROM "+tables+" WHERE "+filters.join(" AND ")+" ) " )
	}
	if(wheres[0] ) { ret =" WHERE "+wheres.join(" AND "); }

	return ret;
};

static_query.getsql_group_by=function(qq)
{
	let q=qq.q
	let qv=qq.qv

	var ss=[];

	var ns=static_db.table_name_map;

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

// support external list of json
static_query.getsql_external_aids=function(qq)
{
	let q=qq.q
	let qv=qq.qv


	if(q.aids)
	{
		if(typeof q.aids=="string") // convert to json
		{
			try {
				q.aids=JSON.parse(q.aids)
			} catch (e) {
				q.aids=q.aids.split(",")
			}
		}
		if( Array.isArray( q.aids ) )
		{
			qv[ static_db.text_name("aids") ]=q.aids
			let ret=" aid = ANY("+static_db.text_plate("aids")+") "

//	console.log(ret)

			wheres.push(ret)
		}
	}

}

// check the new json values
static_query.getsql_where_xson=function(qq)
{
	let q=qq.q
	let qv=qq.qv



	if(static_db.engine!="pg") { return ""; } // postgres only ( so following sql code is postgres )

	let ands=[]

	let push=function(_n,v)
	{
	let n=_n

	let vs=v.split(/[,|]/) // check for multiple values
	if(vs.length==1) { vs=undefined } // not a multiple

//		console.log(n+" == "+v)

// we should allow these operators?
/*
	let pc={ // possible operators
		"_not":"NOT",
	}
	let op="=" // the operator to use
	for( let eo in pc )
	{
		if( n.endsWith(eo) )
		{
			n=n.slice(0,-eo.length)
			op=pc[eo]
			break
		}
	}
*/


		if( n.startsWith("*") ) // wildcarded xpath partial so we must find all possible paths
		{
			let ors=[]
			let cn=n.trim().toLowerCase().replace(/\W+/g,"_")
			let ne=n.slice(1) // remmove * from start
			for(let n in database.paths)
			{
				let p=database.paths[n]
				if( n.endsWith(ne) ) // wildcard test
				{
					let nb=p.jpath[ p.jpath.length-1 ]
					let na=p.jpath.join("").slice(0,-nb.length)

					if( v=="*" || v=="!*" )
					{
						ors.push( " ( root = '"+na+"' AND xson ? '"+nb+"' ) " )
					}
					else
					if(vs)
					{
						ors.push( " ( root = '"+na+"' AND xson->>'"+nb+"' = ANY("+static_db.text_plate(cn)+") ) " )
					}
					else
					{
						ors.push( " ( root = '"+na+"' AND xson->>'"+nb+"' = "+static_db.text_plate(cn)+" ) " )
					}
				}
			}

			if( ors.length>0 )
			{
				let prefix=""
				if( v.startsWith("!") )
				{
					v=v.slice(0,-1)
					prefix=" NOT "
				}
				ands.push( prefix+" ( "+ors.join(" OR ")+" ) " )

				qv[ static_db.text_name(cn) ]=vs || v
			}

		}
		else
		{

			let p=database.paths[n]

			if(p && p.jpath) // a valid path
			{

				let cn=n.trim().toLowerCase().replace(/\W+/g,"_")
				let nb=p.jpath[ p.jpath.length-1 ]
				let na=p.jpath.join("")
				if(nb.length>0) { na=na.slice(0,-nb.length) }

				let prefix=""
				if( v.startsWith("!") )
				{
					v=v.slice(0,-1)
					prefix=" NOT "
				}
				if( v=="*" || v=="!*" )
				{
					ands.push( prefix+" ( root = '"+na+"' AND xson ? '"+nb+"' ) " )
				}
				else
				if(vs)
				{
					ands.push( prefix+" ( root = '"+na+"' AND xson->>'"+nb+"' = ANY("+static_db.text_plate(cn)+") ) " )
				}
				else
				{
					ands.push( prefix+" ( root = '"+na+"' AND xson->>'"+nb+"' = "+static_db.text_plate(cn)+" ) " )
				}

				qv[ static_db.text_name(cn) ]=vs||v

			}
		}
	}

	for( let n in q )
	{
		let v=q[n]
		if(n.startsWith("/iati-activities/iati-activity"))
		{
			push(n,v)
		}
		else
		if(n.startsWith("/iati-organisations/iati-organisation"))
		{
// future support for org files ?
//			push(n,v)
		}
		else
		if( n.startsWith("/") || n.startsWith("@") ) // shorthand for /iati-activities/iati-activity
		{
			push("/iati-activities/iati-activity"+n,v)
		}
		else
		if( n.startsWith("*") ) // wildcarded xpath partial match
		{
			push(n,v)
		}
	}

	if( q["text_search"] ) // text search in *all* narratives in
	{
//console.log("text_search "+v)
		ands.push( " ( to_tsvector('simple', xson->>'') @@ websearch_to_tsquery('simple',"+static_db.text_plate("text_search")+") ) " )
		qv[ static_db.text_name("text_search") ]=smart_tsquery( q["text_search"] );
	}

	if( ands.length>0 )
	{

		let ret=" aid in ( select distinct aid from xson where aid is not null AND "+
			ands.join(" INTERSECT select distinct aid from xson where aid is not null AND ")+" ) "

//	console.log(ret)
//	console.log(qv)

		wheres.push(ret)

	}

}


static_query.getsql_distinct_on=function(qq)
{
	let q=qq.q
	let qv=qq.qv


	if(static_db.engine!="pg") { return ""; } // postgres only

	var ss=[];

	var ns=static_db.table_name_map;

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

static_query.getsql_order_by=function(qq)
{
	let q=qq.q
	let qv=qq.qv

	var ss=[];

	var ns=static_db.table_name_map;

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

static_query.getsql_limit=function(qq)
{
	let q=qq.q
	let qv=qq.qv
	
	var ss=[];
	var limit=100;

	if( q.limit )
	{
		var n=static_query.mustbenumber(q.limit);
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
		var n=static_query.mustbenumber(q.page);
		if( "number" == typeof n)
		{
			ss.push(" OFFSET "+n*limit+" ");
		}
	}
	else
	if( q.offset )
	{
		var n=static_query.mustbenumber(q.offset);
		if( "number" == typeof n)
		{
			ss.push(" OFFSET "+n+" ");
		}
	}

	if(ss[0]) { return ss.join(""); }
	return "";
};


static_query.getsql_all=function(q)
{
	let r={}
	qq.q=static_query.base_q(q)
	qq.qv={}
	qq.query =	" SELECT "+
		(q.distincton?"* FROM ( SELECT ":"")+
		static_query.getsql_distinct_on(qq) +
		static_query.getsql_select(qq) +
		static_query.getsql_from(qq) +
		static_query.getsql_where(qq) +
		static_query.getsql_group_by(qq) +
		(q.distincton?" ) q ":"")+
		static_query.getsql_order_by(qq) +
		static_query.getsql_limit(qq);
	return qq
};
