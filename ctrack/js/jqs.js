// Copyright (c) 2025 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// window depends, eg jquery etc etc

const jqs={}
export default jqs

import dayjs               from "dayjs"
import * as Chartist       from "chartist"


let jquery = (await import("jquery"))["default"]

if(window)
{
	window.$ = jquery
	window.jQuery = jquery
}

jqs.chosen_jquery = (await import("chosen-npm/public/chosen.jquery.js"))["default"]
jqs.typeahead = (await import("typeahead.js/dist/typeahead.jquery.js"))["default"]
jqs.stupid_table_plugin = (await import("stupid-table-plugin"))["default"]

jqs.dayjs = dayjs
jqs.Chartist = Chartist

if(window)
{
	window.stupid_table_plugin = jqs.stupid_table_plugin
	window.Chartist            = jqs.Chartist
	window.moment              = jqs.dayjs
	window.chosen              = jqs.chosen
	window.typeahead           = jqs.typeahead
}
