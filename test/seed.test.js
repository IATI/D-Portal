// bin/seed copies dstore/json-seed into dstore/json where a file is missing,
// so a fresh checkout can build and run before "dstore fetch" has been run.
//
// Each test runs from a scratch copy of the code, so it cannot change the
// real files in this checkout.

import { test, after } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

const root = path.resolve(import.meta.dirname, "..")

// every seed, as "dstore/json/iati_codes.json" and so on, where bin/seed copies it to
const seeds = []
for(const dir of ["dstore/json", "dflat/json"])
{
	for(const name of fs.readdirSync(root + "/" + dir + "-seed"))
	{
		if(name.endsWith(".json")) { seeds.push(dir + "/" + name) }
	}
}

const scratchDirs = []

after(function()
{
	for(const dir of scratchDirs) { fs.rmSync(dir, { recursive: true, force: true }) }
})

// the files the nightly fetches write
const fetched = ["dstore/json/iati_codes.json", "dstore/json/packages.json", "dstore/json/validhash.json",
	"dstore/json/publishers.json", "dstore/json/curl.txt", "dflat/json/codelists.json"]

// a scratch copy of what bin/seed and dstore need, with none of the fetched
// files in dstore/json
const scratchCopy = function()
{
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dportal-seed-"))
	scratchDirs.push(dir)
	// skip the fetched files, but not the seeds
	const notFetched = function(file) { return !fetched.includes(path.relative(root, file)) }
	for(const folder of ["bin", "dstore/js", "dstore/csv", "dstore/json", "dstore/json-seed", "dflat/js", "dflat/json", "dflat/json-seed"])
	{
		fs.cpSync(root + "/" + folder, dir + "/" + folder, { recursive: true, filter: notFetched })
	}
	fs.mkdirSync(dir + "/ctrack")
	fs.copyFileSync(root + "/ctrack/webpack.loader.js", dir + "/ctrack/webpack.loader.js")
	fs.copyFileSync(root + "/package.json", dir + "/package.json")
	fs.symlinkSync(root + "/node_modules", dir + "/node_modules")
	return dir
}

const seed = function(dir)
{
	const result = spawnSync("bash", [dir + "/bin/seed"], { encoding: "utf8" })
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result
}

test("the seeds are iati_codes.json, validhash.json and codelists.json", function()
{
	assert.deepEqual(seeds.sort(), ["dflat/json/codelists.json", "dstore/json/iati_codes.json", "dstore/json/validhash.json"])
})

test("bin/seed copies every seed that is missing", function()
{
	const dir = scratchCopy()
	seed(dir)
	for(const file of seeds)
	{
		const seedFile = path.dirname(file) + "-seed/" + path.basename(file)
		assert.equal(
			fs.readFileSync(dir + "/" + file, "utf8"),
			fs.readFileSync(root + "/" + seedFile, "utf8"),
			file + " should be a copy of " + seedFile)
	}
})

test("bin/seed leaves a file that is already there", function()
{
	const dir = scratchCopy()
	fs.writeFileSync(dir + "/dstore/json/iati_codes.json", "{\"fetched\":true}")
	const result = seed(dir)
	assert.equal(fs.readFileSync(dir + "/dstore/json/iati_codes.json", "utf8"), "{\"fetched\":true}")
	assert.doesNotMatch(result.stdout, /iati_codes.json/)
	assert.match(result.stdout, /Seeding dstore\/json\/validhash.json/)
})

test("dstore runs after seeding a checkout with none of the fetched files", function()
{
	const dir = scratchCopy()

	// dstore imports iati_codes.json and, through savi.js, validhash.json and
	// codelists.json, so without the seeds this fails
	const env = { ...process.env }
	delete env.DSTORE_PG
	delete env.DSTORE_PGRO
	const dstore = function()
	{
		return spawnSync(process.execPath, ["js/cmd.wrap.js", "init", "--database", dir + "/dstore.sqlite"],
			{ cwd: dir + "/dstore", encoding: "utf8", env })
	}
	const before = dstore()
	assert.notEqual(before.status, 0, "dstore should fail before seeding")
	assert.match(before.stderr, /Cannot find module .*(iati_codes|validhash|codelists)\.json/, "dstore should fail because a seeded file is missing")

	seed(dir)
	const result = dstore()
	assert.equal(result.status, 0, result.stdout + result.stderr)
})
