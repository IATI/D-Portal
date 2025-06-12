
// this module allows us to import the same data files in node as we do in webpack
// so we may share source code between the two more easily
// however it requires that node must be run with this module preloaded
// eg:
//
//     node --import ./webpack.loader.js
//
// or some files will fail to import as text

import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"

registerHooks(
{
	load:function(url, context, nextLoad)
	{
		// note that this pattern must be kept in sync with the raw-loader webpack pattern
		const matchtxt=/\.(txt|html|css|sql)$/
		if(url.match(matchtxt))
		{
			let p=fileURLToPath(url)
			let t=readFileSync(p,"utf8")

// textual problems
//			t=t.replaceAll("\\25BC","\u25BC")

			return {
				format: 'json',
				source:JSON.stringify(t),
				shortCircuit:true
				}
		}

		return nextLoad(url, context)
	},
})

