// "dflat fetch codelists": the checks on the downloaded code lists, fed good and
// bad XML directly with no network, and that the command can start on a fresh
// checkout with no json/codelists.json.

import { test, after } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import fetch from "../dflat/js/fetch.js"

const root = path.resolve(import.meta.dirname, "..")

// a code list in IATI's XML format, with a code and its English and French names for each entry
const codelist = function(name, entries)
{
	let items = ""
	for(const [code, en, fr] of entries)
	{
		items += "<codelist-item><code>" + code + "</code><name>" +
			"<narrative>" + en + "</narrative>" +
			"<narrative xml:lang=\"fr\">" + fr + "</narrative>" +
			"</name></codelist-item>"
	}
	return "<codelist name=\"" + name + "\"><codelist-items>" + items + "</codelist-items></codelist>"
}

const status = codelist("ActivityStatus", [["1", "Pipeline", "En projet"], ["2", "Implementation", "En cours"]])
const vocabulary = codelist("ResultVocabulary", [["99", "Reporting Organisation", "Organisation déclarante"]])

test("good code lists pass and become lookup tables", function()
{
	const parsed = fetch.parse_codelists({ "ActivityStatus.xml": status, "ResultVocabulary.xml": vocabulary })
	assert.deepEqual(parsed.problems, [])
	const codes = fetch.codelists_to_codes(parsed.codelists)
	assert.deepEqual(codes["en-name"]["ActivityStatus"], { "1": "Pipeline", "2": "Implementation" })
	assert.deepEqual(codes["fr-name"]["ActivityStatus"], { "1": "En projet", "2": "En cours" })
})

test("a list with only one code keeps it", function()
{
	const parsed = fetch.parse_codelists({ "ResultVocabulary.xml": vocabulary })
	assert.deepEqual(parsed.problems, [])
	const codes = fetch.codelists_to_codes(parsed.codelists)
	assert.deepEqual(codes["en-name"]["ResultVocabulary"], { "99": "Reporting Organisation" })
})

test("a list with no codes fails", function()
{
	const parsed = fetch.parse_codelists({ "Empty.xml": codelist("Empty", []) })
	assert.deepEqual(parsed.problems, ["Empty.xml is not a code list with codes in it"])
})

test("an error page instead of a code list fails", function()
{
	const parsed = fetch.parse_codelists({ "ActivityStatus.xml": "<html><body>Service unavailable</body></html>" })
	assert.deepEqual(parsed.problems, ["ActivityStatus.xml is not a code list with codes in it"])
})

test("every problem is reported, not just the first", function()
{
	const parsed = fetch.parse_codelists({
		"ActivityStatus.xml": status,
		"Empty.xml": codelist("Empty", []),
		"Broken.xml": "<html></html>",
	})
	assert.deepEqual(parsed.problems, [
		"Empty.xml is not a code list with codes in it",
		"Broken.xml is not a code list with codes in it",
	])
})

test("two files with the same list name fail", function()
{
	const parsed = fetch.parse_codelists({ "ActivityStatus.xml": status, "Copy.xml": status })
	assert.deepEqual(parsed.problems, ["Copy.xml has the same name, ActivityStatus, as ActivityStatus.xml"])
})

// lookup tables with an English name for each of count codes in each list
const tables = function(counts)
{
	const names = {}
	for(const [list, count] of Object.entries(counts))
	{
		names[list] = {}
		for(let i = 1; i <= count; i++) { names[list][i] = "Code " + i }
	}
	return { "en-name": names }
}

test("lists that keep their codes pass, and so does a first fetch", function()
{
	assert.deepEqual(fetch.compare_codelists(tables({ Sector: 300, Region: 10 }), tables({ Sector: 300, Region: 10 })), [])
	assert.deepEqual(fetch.compare_codelists(tables({ Sector: 280 }), tables({ Sector: 300 })), [])
	assert.deepEqual(fetch.compare_codelists(tables({ Sector: 300, New: 5 }), tables({ Sector: 300 })), [])
	assert.deepEqual(fetch.compare_codelists(tables({ Sector: 1 }), undefined), [])
})

test("a list that is missing or has lost codes fails", function()
{
	const problems = fetch.compare_codelists(tables({ Sector: 1 }), tables({ Sector: 300, Region: 10 }))
	assert.deepEqual(problems, ["Sector fell from 300 to 1 codes", "Region is missing, it had 10 codes"])
})

const scratchDirs = []

after(function()
{
	for(const dir of scratchDirs) { fs.rmSync(dir, { recursive: true, force: true }) }
})

test("dflat fetch codelists starts without json/codelists.json", async function()
{
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dportal-dflat-fetch-"))
	scratchDirs.push(dir)
	fs.cpSync(root + "/dflat/js", dir + "/dflat/js", { recursive: true })
	fs.cpSync(root + "/dflat/json", dir + "/dflat/json", { recursive: true,
		filter: function(file) { return path.basename(file) != "codelists.json" } })
	fs.mkdirSync(dir + "/ctrack")
	fs.copyFileSync(root + "/ctrack/webpack.loader.js", dir + "/ctrack/webpack.loader.js")
	fs.copyFileSync(root + "/package.json", dir + "/package.json")
	fs.symlinkSync(root + "/node_modules", dir + "/node_modules")

	// Run it until it starts downloading, then stop it, so the test needs no
	// network access. Before this change it failed on startup, importing the
	// file it is meant to create.
	const child = spawn(process.execPath, ["js/cmd.wrap.js", "fetch", "codelists"], { cwd: dir + "/dflat" })
	let out = ""
	const started = await new Promise(function(resolve)
	{
		const done = function(found) { clearTimeout(timer); child.kill("SIGKILL"); resolve(found) }
		const timer = setTimeout(function() { done(false) }, 30000)
		const read = function(chunk)
		{
			out += chunk
			if(out.includes("downloading")) { done(true) }
		}
		child.stdout.on("data", read)
		child.stderr.on("data", read)
		child.on("exit", function() { done(out.includes("downloading")) })
	})
	assert.ok(started, "dflat fetch codelists did not start:\n" + out)
})
