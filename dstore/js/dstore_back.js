// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

import dstore_pg from "./dstore_pg.js"
import dstore_sqlite from "./dstore_sqlite.js"

let dstore_back
// use postgres if a pg connection string is provided
if(global && global.argv && global.argv.pg)
{
	dstore_back=dstore_pg
}
else // default to sqlite
{
	dstore_back=dstore_sqlite
}
export default dstore_back
