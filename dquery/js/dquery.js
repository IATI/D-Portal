
var dquery=exports;

// running in browser
if(typeof window !== 'undefined')
{
	window.$ = window.jQuery = require("jquery");
	var split=require("jquery.splitter")
//	var term=(require("jquery.terminal"))()

	var ui=require("./jquery-ui.js")

//	var tree=require("jstree/dist/jstree.js")
}


dquery.opts={}
dquery.opts.test=false

dquery.start=function(opts){
	for(var n in opts) { dquery.opts[n]=opts[n] } // copy opts
	$(dquery.start_loaded)
}

dquery.start_loaded=async function(){

	var ace=require("brace")
	require("brace/ext/modelist")
	require("brace/theme/twilight")

	require("brace/mode/javascript")
	require("brace/mode/json")
	require("brace/mode/html")
	require("brace/mode/css")
	require("brace/mode/markdown")
	require("brace/mode/sh")
	require("brace/mode/gitignore")

	$("html").prepend(plated.plate('<style>{css}</style>')) // load our styles

	$("html").prepend("<style>"+require("jquery.splitter/css/jquery.splitter.css")+"</style>")
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
	$("#split").height("100%").split({orientation:'vertical',limit:5,position:'20%',onDrag: resize_func });
	$("#split_left").split({orientation:'horizontal',limit:5,position:'80%',onDrag: resize_func });
//	$("#split_right").split({orientation:'horizontal',limit:5,position:'90%',onDrag: resize_func });

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
	dquery.editor.setTheme("ace/theme/twilight");
	dquery.editor.$blockScrolling = Infinity 

}

dquery.click=async function(id)
{
	switch(id)
	{
		default:
			console.log("unhandled click "+id)
		break
	}
}


