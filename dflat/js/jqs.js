// Copyright (c) 2025 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// window depends, eg jquery etc etc

const jqs={}
export default jqs

import dayjs               from "dayjs"
import * as Chartist       from "chartist"
import jquery              from "jquery"
import jquery_ui_css          from "jquery-ui-dist/jquery-ui.css"
import jquery_splitter        from "jquery.splitter"
import jquery_splitter_css    from "jquery.splitter/css/jquery.splitter.css"
import jquery_json_viewer_css from "jquery.json-viewer/json-viewer/jquery.json-viewer.css"

console.log(jquery)

if(window)
{
console.log(jquery)
	window.$=jquery
	window.jQuery = jquery

//	var split=jquery_splitter
//	var ui=jquery_ui
//	var jsonv=jquery_json_viewer

}

jqs.dayjs = dayjs
jqs.Chartist = Chartist
jqs.jquery_splitter

jqs.xtra = (await import("./jqs_xtra.js"))["default"]

if(window)
{
	window.Chartist            = jqs.Chartist
	window.moment              = jqs.dayjs
	window.jquery_splitter     = jqs.jquery_splitter
	window.jquery_json_viewer  = jqs.xtra.jquery_json_viewer
	window.stupid_table_plugin = jqs.xtra.stupid_table_plugin
	window.chosen              = jqs.xtra.chosen
	window.typeahead           = jqs.xtra.typeahead
	window.jquery_ui           = jqs.xtra.jquery_ui
	window.brace               = jqs.xtra.brace	
}
