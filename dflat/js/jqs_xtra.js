// Copyright (c) 2025 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// window depends that depend on jquery

const jqs_xtra={}
export default jqs_xtra

import jquery_json_viewer  from "jquery.json-viewer/json-viewer/jquery.json-viewer.js"
import chosen              from "chosen-npm/public/chosen.jquery.js"
import typeahead           from "typeahead.js/dist/typeahead.jquery.js"
import stupid_table_plugin from "stupid-table-plugin"
import jquery_ui           from "jquery-ui-dist/jquery-ui.js"
import brace               from "brace"

jqs_xtra.jquery_json_viewer = jquery_json_viewer
jqs_xtra.chosen = chosen
jqs_xtra.typeahead = typeahead
jqs_xtra.stupid_table_plugin = stupid_table_plugin
jqs_xtra.jquery_ui = jquery_ui
jqs_xtra.brace = brace

