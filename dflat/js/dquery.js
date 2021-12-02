
var dquery=exports;

	dquery.origin="http://d-portal.org"

// running in browser
if(typeof window !== 'undefined')
{
	window.$ = window.jQuery = require("jquery");

	var split=require("jquery.splitter")
	split( window.jQuery )

//	var term=(require("jquery.terminal"))()


	var ui=require("./jquery-ui.js")

//	var tree=require("jstree/dist/jstree.js")

	var jsonv=require("jquery.json-viewer/json-viewer/jquery.json-viewer.js")


	dquery.origin=window.location.origin

}

var plated=require("plated").create({},{pfs:{}}) // create a base instance for inline chunks with no file access

dquery.chunks={}
plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/dquery.html', 'utf8'), dquery.chunks )
plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/dquery.css',  'utf8'), dquery.chunks )
plated.chunks.fill_chunks( require('fs').readFileSync(__dirname + '/dquery.sql',  'utf8'), dquery.chunks )
plated.chunks.format_chunks(dquery.chunks)

plated.plate=function(str){ return plated.chunks.replace(str,dquery.chunks) }

dquery.opts={}
dquery.opts.test=false

dquery.start=function(opts){
	for(var n in opts) { dquery.opts[n]=opts[n] } // copy opts
	$(dquery.start_loaded)
}

dquery.start_loaded=async function(){

	var ace=require("brace")
	require("brace/ext/modelist")
	require("brace/theme/tomorrow_night_eighties")

	require("brace/mode/pgsql")
//	require("brace/mode/json")

	$("html").prepend(plated.plate('<style>{css}</style>')) // load our styles

	$("html").prepend("<style>"+require("jquery.splitter/css/jquery.splitter.css")+"</style>")
	$("html").prepend("<style>"+require("jquery.json-viewer/json-viewer/jquery.json-viewer.css")+"</style>")

	$("html").prepend("<style>"+require('fs').readFileSync(__dirname + '/jquery-ui.css', 'utf8')+"</style>")


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
		dquery.hash="#"+encodeURI(session.getValue())
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
	var stringify = require('json-stable-stringify');
	
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

		switch(id)
		{

			case "menu_execute":
				$('#result').jsonViewer({"Loading":"..."});
				$.ajax({
				  type: "POST",
				  url: "/dquery",
				  data: {sql:session.getValue()},
				  success: dquery.result,
				  dataType: "json",
				});
			break;
			
			case "menu_explain":
				$('#result').jsonViewer({"Loading":"..."});
				$.ajax({
				  type: "POST",
				  url: "/dquery",
				  data: {sql:"EXPLAIN ( ANALYZE TRUE , VERBOSE TRUE , FORMAT JSON )\n"+session.getValue()},
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


