
const dquery={}
export default dquery

import dquery_html            from "./dquery.html"
import dquery_css             from "./dquery.css"
import dquery_sql             from "./dquery.sql"
import jqs                    from "./jqs.js"
import plated_base            from "plated"
import stringify              from "json-stable-stringify"


	dquery.origin="//d-portal.org"

// running in browser
if(typeof window !== 'undefined')
{

	dquery.origin=window.location.origin

}

var plated=plated_base.create({},{pfs:{}}) // create a base instance for inline chunks with no file access

dquery.chunks={}

plated.chunks.fill_chunks( dquery_html, dquery.chunks )
plated.chunks.fill_chunks( dquery_css,  dquery.chunks )
plated.chunks.fill_chunks( dquery_sql,  dquery.chunks )


plated.chunks.format_chunks(dquery.chunks)

plated.plate=function(str){ return plated.chunks.replace(str,dquery.chunks) }

dquery.opts={}
dquery.opts.test=false

dquery.start=function(opts){
	for(var n in opts) { dquery.opts[n]=opts[n] } // copy opts
	$(dquery.start_loaded)
}

dquery.start_loaded=async function(){

	var ace=brace

	$("html").prepend(plated.plate('<style>{css}</style>')) // load our styles

	$("html").prepend(`<style>${jquery_splitter_css}</style>`)
	$("html").prepend(`<style>${jquery_json_viewer_css}</style>`)
	$("html").prepend(`<style>${jquery_ui_css}</style>`)

	$("body").empty().append(plated.plate('{body}')) // fill in the base body

	var resize_timeout;
	var resize_func=function(event) {
		var f=function() {
			$("#split").height("100%")
			$("#split_left").height("100%")
			$("#split_right").height("100%")
			window.dispatchEvent(new Event('resize'));
		};
		clearTimeout(resize_timeout);
		timresize_timeouteout=setTimeout(f,100);
	};
	$( window ).resize(resize_func) // keep height full
	$("#split").height("100%").split({orientation:'vertical',limit:5,position:'50%',onDrag: resize_func });

	$("#menubar").menu({
		position: { my: 'left top', at: 'left bottom' },
		blur: function() {
			$(this).menu('option', 'position', { my: 'left top', at: 'left bottom' });
		},
		focus: function(e, ui) {
			if ($('#menubar').get(0) !== $(ui).get(0).item.parent().get(0)) {
				$(this).menu('option', 'position', { my: 'left top', at: 'right top' });
			}
		},
	})

	$("#menubar").on( "menuselect", function(e,ui){
		var id=ui.item.attr("id")
		dquery.click(id)
	})

	dquery.editor=ace.edit("editor");
	dquery.editor.setTheme("ace/theme/tomorrow_night_eighties");
	dquery.editor.$blockScrolling = Infinity

	dquery.hash=window.location.hash
	var session=dquery.editor.getSession()
	session.setValue( decodeURIComponent( dquery.hash.substr(1) ) )
	session.setMode( "ace/mode/pgsql" );
	session.setUseWrapMode(true);

	dquery.set_download_links()

	window.setInterval(dquery.cron,1000) // start cron tasks

	$('body').keydown(function (e) {
	  if (e.ctrlKey && e.keyCode == 13) {

		  dquery.click("menu_execute")
	  }
	});

}

dquery.set_download_links=function()
{
	var session=dquery.editor.getSession()
	var sqls=encodeURIComponent(session.getValue())
	$("#download_xson_as_json a").attr("href", dquery.origin+"/dquery?form=json&sql="+sqls )
	$("#download_xson_as_csv a").attr("href",  dquery.origin+"/dquery?form=csv&sql="+sqls )
	$("#download_xson_as_csv_human a").attr("href",  dquery.origin+"/dquery?form=csv&human=1&sql="+sqls )

	$("#download_xson_as_xson a").attr("href", dquery.origin+"/dquery?from=xson&form=json&sql="+sqls )
	$("#download_xson_as_xcsv a").attr("href",  dquery.origin+"/dquery?from=xson&form=csv&sql="+sqls )
	$("#download_xson_as_xml a").attr("href",  dquery.origin+"/dquery?from=xson&form=xml&sql="+sqls )
	$("#download_xson_as_html a").attr("href", dquery.origin+"/dquery?from=xson&form=html&sql="+sqls )
}

dquery.cron=async function()
{
	if(dquery.cron.lock) { return; } // there can be only one
	dquery.cron.lock=true

	var session=dquery.editor.getSession()
	var undo=session.getUndoManager()
	if( !undo.isClean() )
	{
		dquery.hash="#"+encodeURI(session.getValue()).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
		window.location.hash=dquery.hash
		undo.markClean()
		dquery.set_download_links()
	}

	if( dquery.hash != window.location.hash ) // update editor with any chnages to hash (browser forward/back buttons)
	{
		dquery.hash = window.location.hash
		session.setValue( decodeURI( dquery.hash.substr(1) ) )
	}

	dquery.cron.lock=false
}

dquery.result=function(data,status,xhdr)
{

	$('#result').jsonViewer(data,{collapsed:false,rootCollapsable:true});

//	$("#result").text( stringify(data,{space:" "}) )
}

dquery.text_insert=async function(s)
{
	dquery.editor.session.replace(dquery.editor.selection.getRange(), s);
//	dquery.editor.session.insert(dquery.editor.getCursorPosition(), plated.plate("{sql_select_activity}"))
}


dquery.click=async function(id)
{
	if(id.startsWith("menu_examples_"))
	{
		let sid=id.substr(14)
		dquery.text_insert( plated.plate("{sql_"+sid+"}") )
	}
	else
	{
		let session=dquery.editor.getSession()
		let data={}
		window.location.search.substring(1).split("&").forEach(
			function(n){
				let aa=n.split("=");
				data[aa[0]||""]=decodeURIComponent(aa[1]||"")
			}
		);

		switch(id)
		{

			case "menu_execute":
				data.sql=session.getValue()
				$('#result').jsonViewer({"Loading":"..."});
				$.ajax({
				  type: "POST",
				  url: "/dquery",
				  data: data,
				  success: dquery.result,
				  dataType: "json",
				});
			break;

			case "menu_explain":
				data.sql="EXPLAIN ( ANALYZE TRUE , VERBOSE TRUE , FORMAT JSON )\n"+session.getValue()
				$('#result').jsonViewer({"Loading":"..."});
				$.ajax({
				  type: "POST",
				  url: "/dquery",
				  data: data,
				  success: dquery.result,
				  dataType: "json",
				});
			break;

			case "menu_browse":
				let aids=encodeURIComponent(dquery.origin+"/dquery?sql="+encodeURIComponent(session.getValue()))
				window.open(dquery.origin+"/ctrack.html?aids="+aids+"#view=main", '_blank');
			break;

			default:
				console.log("unhandled click "+id)
			break
		}
	}
}


