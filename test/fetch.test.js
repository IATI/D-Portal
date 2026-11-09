// dstore commands must work before the fetched json files exist: on a fresh
// checkout, once they are no longer committed, "dstore fetch" has to be able
// to create them, and other commands must not need packages.json.
//
// Each test runs dstore from a scratch copy of the code, with json files
// removed, so it cannot pick up the real ones in this checkout.

import { test, after } from "node:test"
import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

const root = path.resolve(import.meta.dirname, "..")

// the files "dstore fetch" writes
const fetched = ["iati_codes.json", "packages.json", "validhash.json", "publishers.json", "curl.txt"]

const scratchDirs = []

after(function()
{
	for(const dir of scratchDirs) { fs.rmSync(dir, { recursive: true, force: true }) }
})

// a scratch copy of what dstore needs to run, in a new temp directory
const scratchCopy = function()
{
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dportal-fetch-"))
	scratchDirs.push(dir)
	for(const folder of ["dstore/js", "dstore/csv", "dstore/json", "dflat/js", "dflat/json"])
	{
		fs.cpSync(root + "/" + folder, dir + "/" + folder, { recursive: true })
	}
	fs.mkdirSync(dir + "/ctrack")
	fs.copyFileSync(root + "/ctrack/webpack.loader.js", dir + "/ctrack/webpack.loader.js")
	fs.copyFileSync(root + "/package.json", dir + "/package.json")
	fs.symlinkSync(root + "/node_modules", dir + "/node_modules")
	return dir
}

// remove files from a scratch copy's dstore/json
const removeJson = function(dir, filesToRemove)
{
	for(const file of filesToRemove) { fs.rmSync(dir + "/dstore/json/" + file, { force: true }) }
}

// dstore uses Postgres if DSTORE_PG is set, so remove the Postgres settings
// to make sure the tests only use a scratch SQLite database
const env = { ...process.env }
delete env.DSTORE_PG
delete env.DSTORE_PGRO

const dstore = function(dir, ...args)
{
	return spawnSync(process.execPath, ["js/cmd.wrap.js", ...args, "--database", dir + "/dstore.sqlite"],
		{ cwd: dir + "/dstore", encoding: "utf8", env })
}

test("dstore fetch starts with none of the fetched files present", async function()
{
	const dir = scratchCopy()
	removeJson(dir, fetched)

	// Run it until it reports starting from empty, then stop it. That is
	// before any download completes, so the test needs no network access.
	const child = spawn(process.execPath, ["js/cmd.wrap.js", "fetch"], { cwd: dir + "/dstore", env })
	let out = ""
	const started = await new Promise(function(resolve)
	{
		const done = function(found) { clearTimeout(timer); child.kill("SIGKILL"); resolve(found) }
		const timer = setTimeout(function() { done(false) }, 30000)
		const read = function(chunk)
		{
			out += chunk
			if(out.includes("starting from empty")) { done(true) }
		}
		child.stdout.on("data", read)
		child.stderr.on("data", read)
		child.on("exit", function() { done(out.includes("starting from empty")) })
	})
	assert.ok(started, "dstore fetch did not start from empty:\n" + out)
})

test("dstore commands run without packages.json", function()
{
	const dir = scratchCopy()
	removeJson(dir, ["packages.json"])
	const result = dstore(dir, "args")
	assert.equal(result.status, 0, result.stdout + result.stderr)
})

test("dstore cache empty refuses to run without packages.json", function()
{
	const dir = scratchCopy()
	removeJson(dir, ["packages.json"])
	const cache = dir + "/cache"
	fs.mkdirSync(cache)
	fs.writeFileSync(cache + "/some-dataset.xml", "<iati-activities/>")

	const result = dstore(dir, "cache", "empty", "--cache", cache)
	assert.notEqual(result.status, 0, "should fail without packages.json")
	assert.match(result.stderr, /run "dstore fetch" first/)
	// with no list of packages to keep it would otherwise empty every file
	assert.equal(fs.readFileSync(cache + "/some-dataset.xml", "utf8"), "<iati-activities/>")
})

test("dstore cache empty refuses to run with an empty packages.json", function()
{
	const dir = scratchCopy()
	fs.writeFileSync(dir + "/dstore/json/packages.json", "{}")
	const cache = dir + "/cache"
	fs.mkdirSync(cache)
	fs.writeFileSync(cache + "/some-dataset.xml", "<iati-activities/>")

	const result = dstore(dir, "cache", "empty", "--cache", cache)
	assert.notEqual(result.status, 0, "should fail with an empty packages.json")
	assert.match(result.stderr, /will not empty the cache/)
	assert.equal(fs.readFileSync(cache + "/some-dataset.xml", "utf8"), "<iati-activities/>")
})

test("dstore cache empty keeps listed datasets and empties the rest", function()
{
	const dir = scratchCopy()
	// a list of 1000 datasets, enough to pass the minimum, including the one we keep
	const packages = { "listed-dataset": { id: "listed" } }
	for(let i = 1; i < 1000; i++) { packages["dataset-" + i] = { id: "id-" + i } }
	fs.writeFileSync(dir + "/dstore/json/packages.json", JSON.stringify(packages))
	const cache = dir + "/cache"
	fs.mkdirSync(cache)
	fs.writeFileSync(cache + "/listed-dataset.xml", "<iati-activities/>")
	fs.writeFileSync(cache + "/unlisted-dataset.xml", "<iati-activities/>")

	const result = dstore(dir, "cache", "empty", "--cache", cache)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.equal(fs.readFileSync(cache + "/listed-dataset.xml", "utf8"), "<iati-activities/>")
	assert.equal(fs.readFileSync(cache + "/unlisted-dataset.xml", "utf8"), "")
})
