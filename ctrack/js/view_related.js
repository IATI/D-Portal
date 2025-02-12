// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_related=exports;
exports.name="view_related";

var ctrack=require("./ctrack.js")
var views=require("./views.js")
var fetcher=require("./fetcher.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var SVG=require('svg.js')


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
view_related.fixup=async function(args)
{
	args=args||{}
	fetcher.ajax_dat_fix(args)

	if( args.aid && ( args.aid != ctrack.chunk("related_aid") ) )
	{
		await view_related.ajax({});
	}
	else
	if( args.pid && ( args.pid != ctrack.chunk("related_pid") ) )
	{
		await view_related.ajax({});
	}

	view_related.draw_graph( 		ctrack.chunk("related_graph") )
}

view_related.resize=function()
{
	view_related.draw_graph( 		ctrack.chunk("related_graph") )
}

view_related.draw_graph=function(graph)
{
	let ls=graph&&graph.list
	if(!ls){return}

	let e=document.getElementById("svg_overlay")
	if(!e)
	{
		e=document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		e.id="svg_overlay"
		e.style.position="absolute"
		e.style.left="0px"
		e.style.top="0px"
		ctrack.div.master.append(e)
	}
//	e.innerHTML="" // reset
	e.style.pointerEvents="none"
	let draw=SVG(e)
	draw.clear()
	draw.size(100,100)
	draw.size(document.documentElement.scrollWidth, document.documentElement.scrollHeight)
//	console.log(document.documentElement.scrollWidth, document.documentElement.scrollHeight)

	let r=e.getBoundingClientRect()
	let xb=r.x
	let yb=r.y


	let ds={}
	let rs={}
	for(let l of ls)
	{
//console.log(l)

		if(!ds[ l[3] ]){ds[ l[3] ]=1}
		if(!rs[ l[1] ]){rs[ l[1] ]=ds[ l[3] ]++}
		let w=rs[ l[1] ]

		let e0=document.getElementById("related_"+l[1])
		let e1=document.getElementById("related_"+l[2])
		if(!(e1&&e0)){continue} // sanity

		let r0=e0.getBoundingClientRect()
		let r1=e1.getBoundingClientRect()

		let x0=r0.x-xb
		let y0=r0.y-yb+r0.height*0.5
		let x1=r1.x-xb
		let y1=r1.y-yb+r1.height*0.5
		let out=-(0+w*10)
		let h=r0.height*0.5

		if(l[0]=="R") // draw on right side
		{
			out=-out
			x0=r0.x-xb+r0.width
			x1=r1.x-xb+r1.width
		}
		let f=Math.floor
		let p=f(x0)+","+f(y0)+" "+f(x0+out)+","+f(y0+h)+" "+f(x1+out)+","+f(y1-h)+" "+f(x1)+","+f(y1)

//console.log(x0,y0,x1,y1)
//console.log(p)

		let path=draw.polyline(p)
		path.stroke({ color: '#fff' , width: 4 })
		path.fill("none")


	}

}

//
// Perform ajax call to get data
//
view_related.ajax=async function(args)
{
	ctrack.chunk("related_graph",{})

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

	let idx=1
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
		row.idx=idx++
		depths[depth].push(row)
	}

	let related_data=[]

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
			it.idx=row.idx
			it.depth=depth
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

			it.downs=[]
			it.upups=[]
			for( let row of result.rows ) // build array of arrays
			{
				if(row.aid==it.aid)
				{
					if(row.related_type==1)
					{
						it.upups.push(row.idx)
					}
					else
					if(row.related_type==2)
					{
						it.downs.push(row.idx)
					}
				}
			}

			a.tab.push(it)
		}
	}

	let related_graph={}
	let a=[]
	related_graph.list=a

	for(let t of related_data)
	{
		for(let r of t.tab)
		{
//			console.log(r)
			let s1="L"
			let s2="R"
			if(r.depth<0)
			{
				if((-r.depth)%2==1)
				{
					s1="R"
					s2="L"
				}
			}
			if(r.depth>0)
			{
				if((r.depth%2)==1)
				{
					s1="R"
					s2="L"
				}
			}
			for(let idx of r.upups)
			{
				a.push([s1,idx,r.idx,r.depth-1])
			}
			for(let idx of r.downs)
			{
				a.push([s2,r.idx,idx,r.depth])
			}
		}
	}



	ctrack.chunk("related_graph",related_graph)
	ctrack.chunk("related_data",related_data)
	ctrack.chunk("related_datas","{related_data_head}{related_data:related_data_body}{related_data_foot}")

//	console.log(related_data)
	ctrack.display();

}
