// Copyright (c) 2026 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// Downloading and writing for "dflat fetch" and "dstore fetch". Node only,
// keep it out of anything ctrack bundles.

const fetch_util={}
export default fetch_util

import * as fs   from "fs"
import * as path from "path"
import nodefetch from "node-fetch"

// give up on a download that takes longer than this, so a server that stops
// answering cannot hang the nightly job
fetch_util.timeout_ms=2*60*1000

// the body of url as text, throwing if the server does not answer with success
fetch_util.http_getbody_once=async function(url)
{
	try{
		const response = await nodefetch(url,{ signal:AbortSignal.timeout(fetch_util.timeout_ms) });
		if(!response.ok)
		{
			throw new Error(url+" returned HTTP "+response.status)
		}
		const data = await response.text();
		return data;
	}catch(e){
		if(e.name=="TimeoutError" || e.name=="AbortError")
		{
			throw new Error(url+" did not finish within "+(fetch_util.timeout_ms/1000)+" seconds")
		}
		throw e
	}
}

// try once more after a short wait, in case the failure was brief
fetch_util.http_getbody=async function(url)
{
	try{
		return await fetch_util.http_getbody_once(url)
	}catch(e){
		console.log("Retrying after: "+e.message)
		await new Promise(function(resolve){ setTimeout(resolve,5000) })
		return await fetch_util.http_getbody_once(url)
	}
}

// relative to the current directory if inside it, json/packages.json when run
// from dstore, otherwise the full path
const show_path=function(file)
{
	const relative=path.relative(process.cwd(),file)
	return relative.startsWith("..") ? path.resolve(file) : relative
}

// files is { name: text }. Write them all to temporary files in dir first, then
// rename them all, so a crash while writing leaves the previous files as they
// are, and the new files replace the old ones together.
fetch_util.write_files=function(dir,files)
{
	for(const name in files)
	{
		console.log("Writing "+show_path(dir+"/"+name))
		fs.writeFileSync(dir+"/"+name+".tmp",files[name])
	}
	for(const name in files)
	{
		fs.renameSync(dir+"/"+name+".tmp",dir+"/"+name)
	}
}
