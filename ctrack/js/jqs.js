// Copyright (c) 2025 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// window depends, eg jquery etc etc

const jqs={}
export default jqs

import dayjs               from "dayjs"
import * as Chartist       from "chartist"
import jquery              from "jquery"

if(window)
{
	window.$ = jquery
	window.jQuery = jquery
}

jqs.dayjs = dayjs
jqs.Chartist = Chartist

jqs.xtra = (await import("./jqs_xtra.js"))["default"]

if(window)
{
	window.stupid_table_plugin = jqs.xtra.stupid_table_plugin
	window.Chartist            = jqs.Chartist
	window.moment              = jqs.dayjs
	window.chosen              = jqs.xtra.chosen
	window.typeahead           = jqs.xtra.typeahead
}
