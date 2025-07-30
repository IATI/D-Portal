// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const view_related={}
export default view_related
view_related.name="view_related"

import ctrack     from "./ctrack.js"
import views      from "./views.js"
import fetcher    from "./fetcher.js"
import iati_codes from "../../dstore/json/iati_codes.json"
import SVG        from "svg.js"

// enable 1 2 3 4 5 but not 6
var base_related_filters = 2+4+8+16+32

view_related.gotoe=function(e,ev)
{
	if(e)
	{
		e.focus()

		let ev_top=+200
		if(typeof ev=="number")
		{
			ev_top=ev
			ev=null
		}

		if(ev)
		{
			ev_top = Math.floor(ev.clientY-(ev.currentTarget.getBoundingClientRect().height/2))
		}

		let y=$(e).offset().top-ev_top

		window.scroll({
		  top: y, 
		  left: 0, 
		  behavior: 'smooth'
		})

	}
}

view_related.goto=function(event,name,id,dupe_idx)
{
//	console.log(event,name,id,dupe_idx)
	if(dupe_idx==0)
	{
		view_related.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
		ctrack.change_hash();
		if(name=='aid')
		{
			ctrack.url('#view=related&aid='+id)
		}
		else
		if(name=='pid')
		{
			ctrack.url('#view=related&pid='+id)
		}
	}
	else // scrollto
	{
		if(name=='aid')
		{
			let e=document.getElementById("related_"+dupe_idx)
			view_related.gotoe(e,event)
		}
		else
		if(name=='pid')
		{
			let e=document.getElementById("related_"+dupe_idx)
			view_related.gotoe(e,event)
		}
	}
}

view_related.filters_update=function(toggle)
{
	if(toggle)
	{
		$("#related_opts_small").hide()
		$("#related_opts_large").show()
		view_related.draw_graph( ctrack.chunk("related_graph") )
		view_related.draw_radar( ctrack.chunk("related_data") , ctrack.chunk("related_lookup") )
	}
	
	let fs=ctrack.hash.related_filters || base_related_filters
	
	for(let i=1 ; i<=6 ; i++ )
	{
		let p=2**i
		if( ( fs & p ) == p ) // bit set
		{
			$("#related_opts_small_filter"+i).attr('checked', true)
			$("#related_opts_large_filter"+i).attr('checked', true)
		}
		else
		{
			$("#related_opts_small_filter"+i).attr('checked', false)
			$("#related_opts_large_filter"+i).attr('checked', false)
		}
	}
}
view_related.filters_update_click=async function()
{
	let ps=0
	for(let i=1 ; i<=6 ; i++ )
	{
		let p=2**i
		if( $("#related_opts_large_filter"+i).is(':checked') )
		{
			ps+=p
		}
	}

//	console.log(ps)

	ctrack.hash.related_filters=ps
	ctrack.display_hash()
	ctrack.chunk("related_aid",false) // force reload
	ctrack.chunk("related_pid",false)

	await view_related.ajax({})
	view_related.showhide()
	view_related.draw_graph( ctrack.chunk("related_graph") )
	view_related.draw_radar( ctrack.chunk("related_data") , ctrack.chunk("related_lookup") )

//	view_related.fixup()
}

view_related.toggle=function(idx,event)
{
	if( view_related.hide_graph ) // just toggle everythig
	{
		view_related.hide_graph=false
		view_related.draw_graph( ctrack.chunk("related_graph") )
		view_related.draw_radar( ctrack.chunk("related_data") , ctrack.chunk("related_lookup") )
		return
	}

	let lookup=ctrack.chunk("related_lookup")
	let it=lookup[idx]
//	console.log("toggle",it)

	let n=1
	let tog=function(it)
	{
		it.hides+=n
		for(let i of it.upups)
		{
			tog(lookup[i])
		}
		for(let i of it.downs)
		{
			tog(lookup[i])
		}
	}

	if(it.toggle)
	{
		n=-1
		it.toggle=false
		tog(it)
		it.hides-=n // not this one
	}
	else
	{
		n=1
		it.toggle=true
		tog(it)
		it.hides-=n // not this one
	}

	view_related.showhide()
	view_related.draw_graph( ctrack.chunk("related_graph") )
	view_related.draw_radar( ctrack.chunk("related_data") , ctrack.chunk("related_lookup") )

}

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
	view_related.ajax({});

	ctrack.setcrumb(1);
	ctrack.change_hash();

}

//
// Perform ajax call to get numof data
//
view_related.fixup=async function(args)
{
	args=args||{}
	fetcher.ajax_dat_fix(args)
	
	view_related.filters_update()

	if( args.aid && ( args.aid != ctrack.chunk("related_aid") ) )
	{
		await view_related.ajax({});
	}
	else
	if( args.pid && ( args.pid != ctrack.chunk("related_pid") ) )
	{
		await view_related.ajax({});
	}

	view_related.showhide()
	view_related.draw_graph( ctrack.chunk("related_graph") )
	view_related.draw_radar( ctrack.chunk("related_data") , ctrack.chunk("related_lookup") )

	let e=document.getElementsByClassName("related_pivot")[0];
	view_related.gotoe(e)
}

view_related.resize=function()
{
	view_related.draw_graph( ctrack.chunk("related_graph") )
	view_related.draw_radar( ctrack.chunk("related_data") , ctrack.chunk("related_lookup") )
}
view_related.showhide=function()
{
	let lookup=ctrack.chunk("related_lookup")
	if(!lookup) { return }
	for( let idx in lookup )
	{
		let it=lookup[idx]
		let e=document.getElementById("related_"+idx)
		if( e && e.classList )
		{
			if(it.shows-it.hides>=1)
			{
				e.classList.remove("related_hide");
			}
			else
			{
				e.classList.add("related_hide");
			}
		}
	}
//	e.classList.contains("related_hide");
}

view_related.draw_radar=function(data,lookup)
{
	let svg_radar_element=null
	if(!data){return}
	if(!lookup){return}

	let olde=document.getElementById("svg_radar")
	if(olde)
	{
		olde.remove()
	}


	let	e=document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	e.id="svg_radar"
	e.style.position="fixed"
	e.style.left="0px"
	e.style.top="0px"
	e.style.zIndex="1000"
	e.dataset.data=data
	e.dataset.lookup=lookup
	ctrack.div.master.append(e)
	svg_radar_element=e

//	e.innerHTML="" // reset
	e.style.pointerEvents="visiblePainted"
	let draw=SVG(e)
	draw.clear()
	draw.size(100,100)
	draw.size( document.documentElement.scrollWidth , 200 )
	
	let back = draw.rect( document.documentElement.scrollWidth , 200 ).fill("#000")
	
	let group=draw.group()

	let lines=group.group()

	let sx=64
	let sy=16
	let sr=8

	let px=0
	let py=0
	
	let parts={}
	parts.items={}
	parts.links=[]
	parts.values=[]
	parts.ids={}

console.log(parts)

	let update_parts
	update_parts=function()
	{
		if( ! document.body.contains( svg_radar_element ) )
		{
			return // give up when our radar is removed and stop animating
		}
		
let minx= 999999999
let miny= 999999999
let maxx=-999999999
let maxy=-999999999

		lines.clear()
		for( let il=0 ; il<parts.links.length ; il++ )
		{
			let link=parts.links[il]
			let va=parts.values[ parts.ids[ link[0] ] ]
			let vb=parts.values[ parts.ids[ link[1] ] ]
			let dx=vb.px-va.px
			let dy=vb.py-va.py
			let dd=((dx*dx)+(dy*dy))
			if( dd > 0 )
			{
				let d=Math.sqrt(dd)
				let vx=(dx/d)
				let vy=(dy/d)
				let s=(d/sx)-1
				if(s>1) { s=1; }
				va.vx+=vx*s
				va.vy+=vy*s
				vb.vx-=vx*s
				vb.vy-=vy*s
				
				let a=Math.atan2(dy,dx)/Math.PI

				s=(a*2)

				va.vx+=-vy*s
				va.vy+=vx*s
				vb.vx-=-vy*s
				vb.vy-=vx*s

			}
			
			lines.line(va.px+sr,va.py,vb.px-sr,vb.py).stroke({ color: "#fff" , width: 1 })
		}

		for( let ia=0 ; ia<parts.values.length ; ia++ )
		{
			let va=parts.values[ia]
			for( let ib=ia+1 ; ib<parts.values.length ; ib++ )
			{
				let vb=parts.values[ib]
				let dx=vb.px-va.px
				let dy=vb.py-va.py
				let dd=((dx*dx)+(dy*dy))
				let maxd=sx
				if( ( dd < (maxd*maxd) ) && ( dd > 0 ) )
				{
					let d=Math.sqrt(dd)
					let s=(1-(d/maxd))
					s=s*s
					let vx=s*(dx/d)
					let vy=s*(dy/d)
					va.vx-=vx
					va.vy-=vy
					vb.vx+=vx
					vb.vy+=vy
				}
			}
		}
		for( let ia=0 ; ia<parts.values.length ; ia++ )
		{
			let va=parts.values[ia]
			if( va.vx*va.vx+va.vy*va.vy > 0.01 ) // minimum move speed
			{
				va.px+=va.vx
				va.py+=va.vy
			}
			va.vx*=0.5
			va.vy*=0.5
			parts.items[va.id].center(va.px,va.py)
			
			if( va.px<minx ) { minx=va.px }
			if( va.py<miny ) { miny=va.py }
			if( va.px>maxx ) { maxx=va.px }
			if( va.py>maxy ) { maxy=va.py }
		}
		
		let sy=200/(20+maxy-miny)
		let xpos=(document.documentElement.scrollWidth/2)-(((maxx-minx)/2)*sy)
		
		let e=document.activeElement
		let aid=e && e.dataset.aid
		if(e.dataset.aid) // focus this circ in center
		{
			
			let it=parts.values[ parts.ids[e.dataset.aid] ]
//			xpos=(document.documentElement.scrollWidth/2)-((it.px)*sy)
		}

		group.transform({ a: sy, b: 0, c: 0, d: sy, e: xpos, f: (10-miny)*sy })

		requestAnimationFrame(update_parts)
	}
	let mouseover_parts=function(event)
	{
		let aid=event.target.dataset.aid		
		let e=document.querySelectorAll('div.related_main[data-aid~="'+aid+'"]')[0]
		if(e)
		{
			view_related.gotoe(e,300)
		}
	}
	let click_parts=function(event)
	{
		let aid=event.target.dataset.aid		
		let e=document.querySelectorAll('div.related_main[data-aid~="'+aid+'"]')[0]
		if(e)
		{
		}
		console.log("click",aid)
	}

	console.log("data",data)
	for(let dat of data)
	{
		for(let tab of dat.tab)
		{
			let id=tab.aid
			if(!parts.items[id])
			{
				let idx=parts.values.length
				let x=px+(Math.random()*0.1)
				let y=py+(Math.random()*0.1)
				parts.items[id]=group.circle(sr*2).center(x,y).fill("#fff").attr("id","radar_"+tab.idx).attr("data-aid",id).attr("class","radar_blob")
				parts.items[id].on("mouseover", mouseover_parts)
				parts.items[id].on("click", click_parts)

				parts.values[idx]={ id:id, px:x, py:y, vx:0, vy:0, }
				parts.ids[id]=idx
				py+=sy
			}
			for(let idx of tab.upups)
			{
				let it=lookup[idx]
				parts.links.push( [it.aid,tab.aid] )
			}
			for(let idx of tab.downs)
			{
				let it=lookup[idx]
				parts.links.push( [tab.aid,it.aid] )
			}
		}
		px+=sx
		py=0
	}
	
	requestAnimationFrame(update_parts)

}

view_related.draw_graph=function(graph)
{
	let ls=graph&&graph.list
	if(!ls){return}

	if(view_related.hide_graph) { return }

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

		// hidden data
		if( e0.classList.contains("related_hide") || e1.classList.contains("related_hide") )
		{
			continue
		}

		let r0=e0.getBoundingClientRect()
		let r1=e1.getBoundingClientRect()

		let x0=r0.x-10-xb
		let y0=r0.y-yb+r0.height*0.5
		let x1=r1.x-10-xb
		let y1=r1.y-yb+r1.height*0.5
		let out=-(12+w*6)
		let h0=100 // r0.height*0.5
		let h1=100 // r1.height*0.5

		if(l[0]=="R") // draw on right side
		{
			out=-out
			x0=r0.x-xb+r0.width+10
			x1=r1.x-xb+r1.width+10
		}
		let f=Math.floor
		let p=f(x0)+","+f(y0)+" "+f(x0+out)+","+f(y0+h0)+" "+f(x1+out)+","+f(y1-h1)+" "+f(x1)+","+f(y1)

//console.log(x0,y0,x1,y1)
//console.log(p)

		let path=draw.polyline(p)
		path.addClass('related_link')


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
		view_related.ajax_id("aid",args.aid)
	}
	else
	if(args.pid) // org
	{
		view_related.ajax_id("pid",args.pid)
	}
	else
	{
		ctrack.chunk("related_datas","{related_data_error}")
	}

}

view_related.ajax_id=async function(name,id)
{
	ctrack.chunk("related_lookup",{})
	ctrack.chunk("related_graph",{})
	ctrack.chunk("related_data",{})

	ctrack.chunk("related_aid","")
	ctrack.chunk("related_pid","")
	ctrack.chunk("related_"+name,id)


let q={}
	q[name]=id
	let pid="${pid}" // prevent template tag expansion
	let aid="${aid}" // prevent template tag expansion
	let src="${src}" // prevent template tag expansion

	let ps=[]
	let fs=ctrack.hash.related_filters || base_related_filters
	for(let i=1 ; i<=6 ; i++ )
	{
		let p=2**i
		if( ( fs & p ) == p ) // bit set
		{
			ps.push(i)
		}
	}
	q.src="{"+ps.join(",")+"}"


if(name=="pid")
{

	q.sql=`

--$pid=NL-KVK-41177588
--$src={1,2,3,4,5,6}

SELECT g.pid,g.related_pid,g.related_type
	,xson->'/name/narrative'->0->'' AS name
FROM (

WITH RECURSIVE
graph1(pid, related_pid) AS (
    SELECT r.pid, r.related_pid
    FROM relatedp r
		WHERE r.pid=${pid}
        AND related_type=1
        AND related_source=ANY (${src}::int[])
    UNION
        SELECT r.pid, r.related_pid
        FROM relatedp r, graph1 g
			WHERE r.pid = g.related_pid
			AND r.related_type=1
			AND related_source=ANY (${src}::int[])
)
,
graph2(pid, related_pid) AS (
    SELECT r.pid, r.related_pid
    FROM relatedp r
		WHERE r.pid=${pid}
        AND related_type=2
        AND related_source=ANY (${src}::int[])
    UNION
        SELECT r.pid, r.related_pid
        FROM relatedp r, graph2 g
			WHERE r.pid = g.related_pid
			AND r.related_type=2
			AND related_source=ANY (${src}::int[])
)
,
graph3(pid, related_pid) AS (
    SELECT r.pid, r.related_pid
    FROM relatedp r
		WHERE r.pid=${pid}
        AND related_type=ANY ('{3,4,5}'::int[])
        AND related_source=ANY (${src}::int[])
)
,
graph4(pid, related_pid) AS (
    WITH p(pid) AS (
        SELECT r.related_pid FROM relatedp r
        WHERE r.pid=${pid}
        AND related_type=1
        AND related_source=ANY (${src}::int[])
    )
    SELECT r.pid, r.related_pid
    FROM p, relatedp r
		WHERE r.pid=p.pid
        AND related_type=2
        AND related_source=ANY (${src}::int[])
)

SELECT pid, related_pid, 1 AS related_type FROM graph1
UNION
SELECT pid, related_pid, 2 AS related_type FROM graph2
UNION
SELECT ${pid} AS pid, ${pid} AS related_pid, -2 AS related_type
UNION
SELECT pid, related_pid, -1 AS related_type FROM graph4
UNION
SELECT pid, related_pid, 3 AS related_type FROM graph3

) g

LEFT JOIN xson x ON x.pid=g.related_pid AND root='/iati-organisations/iati-organisation'


`;

}
else // aid
{
	q.sql=`

--$aid=US-GOV-18-NE
--$src={1,2,3,4,5,6}

SELECT related_aid,related_type,g.aid,title,funder_ref,commitment,spend,reporting,reporting_ref,day_start,day_end,status_code
 FROM (

WITH RECURSIVE
graph1(aid, related_aid) AS (
    SELECT r.aid, r.related_aid
    FROM related r
		WHERE r.aid=${aid}
        AND related_type=1
        AND related_source=ANY (${src}::int[])
    UNION
        SELECT r.aid, r.related_aid
        FROM related r, graph1 g
			WHERE r.aid = g.related_aid
			AND r.related_type=1
			AND related_source=ANY (${src}::int[])
)
,
graph2(aid, related_aid) AS (
    SELECT r.aid, r.related_aid
    FROM related r
		WHERE r.aid=${aid}
        AND related_type=2
        AND related_source=ANY (${src}::int[])
    UNION
        SELECT r.aid, r.related_aid
        FROM related r, graph2 g
			WHERE r.aid = g.related_aid
			AND r.related_type=2
			AND related_source=ANY (${src}::int[])
)
,
graph3(aid, related_aid) AS (
    SELECT r.aid, r.related_aid
    FROM related r
		WHERE r.aid=${aid}
        AND related_type=ANY ('{3,4,5}'::int[])
        AND related_source=ANY (${src}::int[])
)
,
graph4(aid, related_aid) AS (
    WITH p(aid) AS (
        SELECT r.related_aid FROM related r
			WHERE r.aid=${aid}
			AND related_type=1
			AND related_source=ANY (${src}::int[])
    )
    SELECT r.aid, r.related_aid
    FROM p, related r
		WHERE r.aid=p.aid
        AND related_type=2
        AND related_source=ANY (${src}::int[])
)

SELECT aid, related_aid, 1 AS related_type FROM graph1
UNION
SELECT aid, related_aid, 2 AS related_type FROM graph2
UNION
SELECT ${aid} AS aid, ${aid} AS related_aid, -2 AS related_type
UNION
SELECT aid, related_aid, -1 AS related_type FROM graph4
UNION
SELECT aid, related_aid, 3 AS related_type FROM graph3

) g LEFT JOIN act a ON a.aid=g.related_aid


`;
}

	let result=await fetcher.ajax(q)
//	console.log(result)

	let rows=[]
	for(let row of result.rows) { rows.push(row) ; row.depth=0 }
	let rowsort=(function(a,b){
		if(a["related_"+name]==b["related_"+name])
		{
			if(a.related_type==b.related_type)
			{
				if( a[name] < b[name] ) { return -1 } else { return 1 }
			}
			else
			{
				if( a.related_type < b.related_type ) { return -1 } else { return 1 }
			}
		}
		else
		{
			if( a["related_"+name] < b["related_"+name] ) { return -1 } else { return 1 }
		}
		return 0;
	})

	let up_idx=0
	let up_old=[id]
	let up_new=[]
	let down_idx=0
	let down_old=[id]
	let down_new=[]
	let sanity=0
	while( rows.length>0 )
	{
//		console.log(rows.length)
		if(rows.length==sanity) { break } // last loop had no effect
		sanity=rows.length

		up_idx--
		down_idx++
		for( let idx=rows.length-1 ; idx>=0 ; idx-- )
		{
			let row=rows[idx]
			if(row.related_type==1)
			{
				for( let up of up_old)
				{
					if(up==row[name])
					{
						up_new.push(row["related_"+name])
						row.depth=up_idx
						rows.splice(idx, 1)
						break
					}
				}
			}
			else
			if(row.related_type==2)
			{
				for( let down of down_old)
				{
					if(down==row[name])
					{
						down_new.push(row["related_"+name])
						row.depth=down_idx
						rows.splice(idx, 1)
						break
					}
				}
			}
			else
			{
				row.depth=0
				rows.splice(idx, 1)
			}
		}
		up_old=up_new
		up_new=[]
		down_old=down_new
		down_new=[]
	}
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
	for( let depth=depth_min ; depth<=depth_max ; depth++ ) { depths[depth-depth_min]=[] }
	for( let row of result.rows ) // build array of arrays
	{
		let depth=Number(row.depth)
		row.idx=idx++
		depths[depth-depth_min].push(row)
	}
	// sort
	for( let depth=depth_min ; depth<=depth_max ; depth++ )
	{
		let rows=depths[depth-depth_min]
		rows.sort(rowsort)
	}
	console.log("depths",depth_min,depth_max,depths)

	// remove any dupes at each depth
	for( let depth=depth_min ; depth<=depth_max ; depth++ )
	{
		let rows=depths[depth-depth_min]
		for(let r1=rows.length-1;r1>=0;r1--)
		{
			for(let r2=0;r2<r1;r2++)
			{
				if(rows[r1]["related_"+name]==rows[r2]["related_"+name])
				{
//					rows[r1].dupe=true
					rows.splice(r1, 1)
					break;
				}
			}
		}
	}
	// find myself
	let onlyme=[]
	let me={}
	for(let row of depths[0-depth_min])
	{
		if( id==row["related_"+name] ) { onlyme.push(row) ; me=row; break }
	}
	// mark all dupes at other depths carefully
	for( let depth=-1 ; depth>=depth_min ; depth-- ) // parents
	{
		for( let row of depths[depth-depth_min] )
		{
			if(row.dupe){continue}
			for( let d=depth+1 ; d<=0 ; d++ )
			{
				if(row.dupe){break}
				let rs=depths[d-depth_min]
				if(d==0){rs=onlyme}
				for( let r of rs )
				{
					if(row.dupe){break}
					if(r["related_"+name]==row["related_"+name])
					{
						row.dupe=true
					}
				}
			}
		}
	}
	for( let depth=1 ; depth<=depth_max ; depth++ ) // children
	{
		for( let row of depths[depth-depth_min] )
		{
			if(row.dupe){continue}
			for( let d=depth-1 ; d>=0 ; d-- )
			{
				if(row.dupe){break}
				let rs=depths[d-depth_min]
				if(d==0){rs=onlyme}
				for( let r of rs )
				{
					if(row.dupe){break}
					if(r["related_"+name]==row["related_"+name])
					{
						row.dupe=true
					}
				}
			}
		}
	}
	for( let row of depths[0-depth_min] ) // siblings
	{
		if(row.dupe){continue}
		for( let d=depth_min ; d<=depth_max ; d++ )
		{
			if(d==0){continue}
			if(row.dupe){break}
			for( let r of depths[d-depth_min] )
			{
				if(row.dupe){break}
				if(r["related_"+name]==row["related_"+name])
				{
					row.dupe=true
				}
			}
		}
	}
	me.dupe=false // i am never the dupe
	// link each dupe to its non dupe
//	mainidx={}
	for( let depth=depth_min ; depth<=depth_max ; depth++ )
	{
		let rows=depths[depth-depth_min]
		for(row of rows)
		{
			if(row.dupe)
			{
				if(depth<=0)
				{
					for( let d=depth_min ; d<=( depth==0 ? depth_max : 0 ) ; d++ )
					{
						if(row.dupe_idx) { break }
						let rs=depths[d-depth_min]
						for( let r of rs )
						{
							if(row.dupe_idx) { break }
							if( (!r.dupe) && ( r["related_"+name]==row["related_"+name] ) )
							{
								row.dupe_idx=r.idx
							}
						}
					}
				}
				else
				{
					for( let d=depth_max ; d>=0 ; d-- )
					{
						if(row.dupe_idx) { break }
						let rs=depths[d-depth_min]
						for( let r of rs )
						{
							if(row.dupe_idx) { break }
							if( (!r.dupe) && ( r["related_"+name]==row["related_"+name] ) )
							{
								row.dupe_idx=r.idx
							}
						}
					}
				}
			}
		}
	}

	let related_data=[]
	let lookup={}

	for( let depth=depth_min ; depth<=depth_max ; depth++ )
	{
		let rows=depths[depth-depth_min]
		if(rows.length<=0) { continue }

		let a={}
		a.depth=depth
		a.title="STREAM"
		if( depth<0 )
		{
			let d=0-depth
			if(d<2){d=""}
			a.title="Up<sup>"+(d)+"</sup> Stream"
		}
		else
		if(depth==0)
		{
			a.title="Side Stream"
		}
		else
		{
			let d=depth
			if(d<2){d=""}
			a.title="Down<sup>"+(d)+"</sup> Stream"
		}
		a.tab=[]
		related_data.push(a)
		for(let row of rows)
		{
			let it={}
			it.shows=0
			it.hides=0
			it.lcount=0
			it.rcount=0
			it.ldir=""
			it.rdir=""
			it.idx=row.idx
			it.depth=depth
			it.id=""
			it.dupe=row.dupe&&"dupe"||"main"
			it.dupe_idx=row.dupe_idx||0
			it.type=row.related_type


			if(name=="pid")
			{
				it.pid=row.related_pid
				if(!row.dupe) { it.id=it.pid }
				it.title=row.name || it.pid
			}
			else // aid
			{
				it.aid=row.related_aid
				if(!row.dupe) { it.id=it.aid }
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
			}

			it.pivot=""
			if( (it[name]==id) && (depth==0) ) // pivot
			{
				it.pivot="related_pivot"
			}

			it.downs=[]
			it.upups=[]
			if(row.depth>=0) // downstream
			{
				for( let r of (depths[ (row.depth+1) -depth_min ])||[] )
				{
					if( (r[name]==row["related_"+name]) && (r.related_type==2) )
					{
						it.downs.push(r.idx)
					}
				}
			}
			if(row.depth<=0) // upstream
			{
//				console.log("frm",row.depth,row)
				for( let r of (depths[ (row.depth-1) -depth_min ])||[] )
				{
//					console.log("too",r.depth,r)
					if( (r[name]==row["related_"+name]) && (r.related_type==1) )
					{
//						console.log("link",r.idx)
						it.upups.push(r.idx)
					}
				}
			}
			if( (row.depth==-1) ) // siblings up/down links
			{
				for( let r of (depths[ (0) -depth_min ])||[] )
				{
					if( (r[name]==row["related_"+name]) && (r.related_type==-1)  )
					{
						it.downs.push(r.idx)
					}
				}
			}
			a.tab.push(it)
			lookup[it.idx]=it
		}
	}

	for( let depth=depth_min ; depth<=depth_max ; depth++ )
	{
		let rows=depths[depth-depth_min]
		for(let row of rows)
		{
			let it=lookup[row.idx]
			if(depth>=0) // downstream
			{
				for( let ri of it.downs )
				{
					let dit=lookup[ri]
					dit.shows++
				}
			}
			if(depth<=0) // upstream
			{
				for( let ri of it.upups )
				{
					let uit=lookup[ri]
					uit.shows++
				}
			}
			if( (depth==0) && (it.type==-1) && !it.pivot ) // siblings up links
			{
				it.shows++
			}
			if(it.pivot)
			{
				it.shows++ // keep pivot shown
			}
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
			let it=lookup[r.idx]
			it.ldir="«"
			it.rdir="»"
			if(r.depth<0)
			{
				it.ldir="«"
				it.rdir="«"
				if((-r.depth)%2==1)
				{
					s1="R"
					s2="L"
					let it=lookup[r.idx]
					it.rdir="»"
					it.ldir="»"
				}
			}
			if(r.depth>0)
			{
				it.ldir="»"
				it.rdir="»"
				if((r.depth%2)==1)
				{
					s1="R"
					s2="L"
					let it=lookup[r.idx]
					it.ldir="«"
					it.rdir="«"
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

	for(let a of related_graph.list)
	{
		it1=lookup[a[1]]
		it2=lookup[a[2]]
		let side=a[0].toLowerCase()+"count"
		it1[side]++
		it2[side]++
	}

	console.log(related_data)
	console.log(related_graph)

	if(related_graph.list.length > 1024 )
	{
		view_related.hide_graph=true
	}
	else
	{
		view_related.hide_graph=false
	}


	ctrack.chunk("related_lookup",lookup)
	ctrack.chunk("related_graph",related_graph)
	ctrack.chunk("related_data",related_data)
	if(name=="pid")
	{
		ctrack.chunk("related_datas","{relatedp_data_head}{related_data:relatedp_data_body}{relatedp_data_foot}")
	}
	else // aid
	{
		ctrack.chunk("related_datas","{related_data_head}{related_data:related_data_body}{related_data_foot}")
	}

//	console.log(related_data)
	ctrack.display();

}



