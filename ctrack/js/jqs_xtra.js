// Copyright (c) 2025 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// window depends that depend on jquery

const jqs_xtra={}
export default jqs_xtra

import chosen from "chosen-npm/public/chosen.jquery.js"
import typeahead from "typeahead.js/dist/typeahead.jquery.js"
import stupid_table_plugin from "stupid-table-plugin"

jqs_xtra.chosen = chosen
jqs_xtra.typeahead = typeahead
jqs_xtra.stupid_table_plugin = stupid_table_plugin

