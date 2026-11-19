// fetch_util, shared by "dflat fetch" and "dstore fetch": downloads fail on an
// HTTP error or a server that stops answering, and write_files writes every
// file and leaves no temporary files behind. Uses a local server, no network.

import { test, after } from "node:test"
import assert from "node:assert/strict"
import * as fs from "node:fs"
import * as http from "node:http"
import * as os from "node:os"
import * as path from "node:path"
import fetch_util from "../dflat/js/fetch_util.js"

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dportal-fetch-util-"))

// /ok answers, /error answers with HTTP 500, anything else never answers
const server = http.createServer(function(req, res)
{
	if(req.url == "/ok") { res.end("hello") }
	else if(req.url == "/error") { res.statusCode = 500; res.end("broken") }
})
await new Promise(function(resolve) { server.listen(0, "127.0.0.1", resolve) })
const base = "http://127.0.0.1:" + server.address().port

after(function()
{
	server.closeAllConnections()
	server.close()
	fs.rmSync(dir, { recursive: true, force: true })
})

test("a download returns the body", async function()
{
	assert.equal(await fetch_util.http_getbody_once(base + "/ok"), "hello")
})

test("a download fails on an HTTP error", async function()
{
	await assert.rejects(fetch_util.http_getbody_once(base + "/error"), { message: base + "/error returned HTTP 500" })
})

test("a download fails when the server stops answering", async function()
{
	const timeout = fetch_util.timeout_ms
	fetch_util.timeout_ms = 200
	try{
		await assert.rejects(fetch_util.http_getbody_once(base + "/hang"), { message: base + "/hang did not finish within 0.2 seconds" })
	}finally{
		fetch_util.timeout_ms = timeout
	}
})

test("write_files writes every file and leaves no temporary files", function()
{
	fs.writeFileSync(dir + "/a.json", "old")
	const logged = []
	const log = console.log
	console.log = function(line) { logged.push(line) }
	try{
		fetch_util.write_files(dir, { "a.json": "new a", "b.json": "new b" })
	}finally{
		console.log = log
	}
	assert.deepEqual(logged, ["Writing " + dir + "/a.json", "Writing " + dir + "/b.json"])
	assert.deepEqual(fs.readdirSync(dir).sort(), ["a.json", "b.json"])
	assert.equal(fs.readFileSync(dir + "/a.json", "utf8"), "new a")
	assert.equal(fs.readFileSync(dir + "/b.json", "utf8"), "new b")
})
