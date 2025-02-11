// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_related=exports;
exports.name="view_related";

var ctrack=require("./ctrack.js")
var views=require("./views.js")
var fetcher=require("./fetcher.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

// the chunk names this view will fill with new data
view_related.chunks=[
	"related_datas",
];

//
// Perform ajax call to get numof data
//
view_related.view=function(args)
{
	view_related.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(1);
	ctrack.change_hash();

	view_related.ajax({});
}

//
// Perform ajax call to get numof data
//
view_related.fixup=function(args)
{
	args=args||{}
	fetcher.ajax_dat_fix(args)

	if( args.aid && ( args.aid != ctrack.chunk("related_aid") ) )
	{
		view_related.ajax({});
	}

	if( args.pid && ( args.pid != ctrack.chunk("related_pid") ) )
	{
		view_related.ajax({});
	}

}



//
// Perform ajax call to get data
//
view_related.ajax=async function(args)
{
	args=args||{}
	fetcher.ajax_dat_fix(args)

	if(args.aid) // act
	{
		view_related.ajax_aid(args.aid)
	}
	else
	if(args.pid) // org
	{
//		view_related.ajax_pid(args.pid)
		ctrack.chunk("related_datas","{related_data_error}")
	}
	else
	{
		ctrack.chunk("related_datas","{related_data_error}")
	}

}

view_related.ajax_aid=async function(aid)
{

	ctrack.chunk("related_aid",aid)
	ctrack.chunk("related_pid","")

let q={}
	q.aid=aid
	q.sql=`

WITH q AS (
    SELECT $\{aid} AS aid
)

SELECT related_aid,depth,related_type,g.aid,title,funder_ref,commitment,spend,reporting,reporting_ref,day_start,day_end,status_code
 FROM (

WITH RECURSIVE
graph1(aid, related_aid, related_type, depth) AS (
    SELECT r.aid, r.related_aid, r.related_type, -1
    FROM q, related r WHERE
        r.aid=q.aid
        AND
        related_type=1
    UNION ALL
        SELECT r.aid, r.related_aid, r.related_type, g.depth - 1
        FROM related r, graph1 g
        WHERE r.aid = g.related_aid AND r.related_type=g.related_type
) CYCLE aid SET is_cycle USING path
,
graph2(aid, related_aid, related_type, depth) AS (
    SELECT r.aid, r.related_aid, r.related_type, 1
    FROM q, related r WHERE
        r.aid=q.aid
        AND
        related_type=2
    UNION ALL
        SELECT r.aid, r.related_aid, r.related_type, g.depth + 1
        FROM related r, graph2 g
        WHERE r.aid = g.related_aid AND r.related_type=g.related_type
) CYCLE aid SET is_cycle USING path
,
graph3(aid, related_aid, related_type, depth) AS (
    SELECT r.aid, r.related_aid, r.related_type, 0
    FROM q, related r WHERE
        r.aid=q.aid
        AND
        related_type=3
)

SELECT * FROM graph1
UNION
SELECT * FROM graph2
UNION
SELECT * FROM graph3
UNION
SELECT q.aid,q.aid,3,0 FROM q

) g LEFT JOIN act a ON a.aid=g.related_aid ORDER BY depth,related_type,aid,related_aid

`;

	let result=await fetcher.ajax(q)

//	console.log(result)

	let depth_min=0
	let depth_max=0
	let depths={}
	for( let row of result.rows ) // probe min max
	{
		let d=Number(row.depth)
		if( d<depth_min ) { depth_min=d }
		if( d>depth_max ) { depth_max=d }
	}
	for( let row of result.rows ) // build array of arrays
	{
		let depth=Number(row.depth)-depth_min
		if(!depths[depth]) { depths[depth]=[] }
		depths[depth].push(row)
	}

	let related_data=[]

	let idx=1
	for( let depth=depth_min ; depth<=depth_max ; depth++ )
	{
		let a={}
		a.depth=depth
		a.title="STREAM"
		if( depth<0 )
		{
			a.title="Up Stream ("+(0-depth)+")"
		}
		else
		if(depth==0)
		{
			a.title="Side Stream"
		}
		else
		{
			a.title="Down Stream ("+(depth)+")"
		}
		a.tab=[]
		related_data.push(a)
		let rows=depths[depth-depth_min]
		for(let row of rows)
		{
			let it={}
			it.idx=idx++
			it.aid=row.related_aid
			it.pid=row.reporting_ref
			it.title=row.title || it.aid
			it.currency="USD"
			it.date_start=row.day_start?fetcher.get_nday(row.day_start):"N/A"
			it.date_end=row.day_end?fetcher.get_nday(row.day_end):"N/A"
			it.reporting=iati_codes.publisher_names[row.reporting_ref] || row.reporting || row.reporting_ref || "N/A";

			it.commitment=row.commitment || 0
			it.pct=0;
			if( row.commitment!=0 )
			{
				it.pct=Math.floor(0.5+100*(row.spend/row.commitment));
				if(it.pct<0){it.pct=0;}
				if(it.pct>100){it.pct=100;}
			}
			else
			if( row.spend )
			{
				it.commitment=row.spend
				it.pct=100
			}

			it.pivot=""
			if( it.aid==aid ) // pivot
			{
				it.pivot="related_pivot"
			}

			a.tab.push(it)
		}
	}


	ctrack.chunk("related_data",related_data)
	ctrack.chunk("related_datas","{related_data_head}{related_data:related_data_body}{related_data_foot}")

//	console.log(related_data)
	ctrack.display();

}
