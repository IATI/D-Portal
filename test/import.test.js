// Import the IATI standard example activity (2.03, see fixtures/README.md) into a scratch SQLite database
// and check what was written, including the currency conversions done at
// import time. Expected values are worked out from the example XML.

import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { DatabaseSync } from "node:sqlite"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const example = root + "/test/fixtures/activity-standard-example-annotated.xml"
const aid = "AA-AAA-123456789-ABC123"

let tmp, db

// days since 1970-01-01, as dstore stores dates
const day = function(iso) { return Date.parse(iso + "T00:00:00Z") / 86400000 }

const dstore = function(...args)
{
	const r = spawnSync(process.execPath, ["js/cmd.wrap.js", ...args, "--database", tmp + "/dstore.sqlite"],
		{ cwd: root + "/dstore", encoding: "utf8" })
	assert.equal(r.status, 0, "dstore " + args.join(" ") + " failed:\n" + r.stdout + r.stderr)
}

const all = function(sql) { return db.prepare(sql).all() }

before(function()
{
	tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dportal-import-"))
	dstore("init")
	dstore("import", example)
	db = new DatabaseSync(tmp + "/dstore.sqlite", { readOnly: true })
})

after(function()
{
	if(db) { db.close() }
	if(tmp) { fs.rmSync(tmp, { recursive: true, force: true }) }
})

test("one activity, with its fields", function()
{
	const rows = all("SELECT * FROM act")
	assert.equal(rows.length, 1)
	const a = rows[0]
	assert.equal(a.aid, aid)
	assert.equal(a.title, "Activity title")
	assert.equal(a.reporting_ref, "AA-AAA-123456789")
	assert.equal(a.slug, "activity-standard-example-annotated")
	assert.equal(a.status_code, 2)
	assert.equal(a.day_start, day("2012-04-28"), "actual start date, preferred over planned")
	assert.equal(a.day_end, day("2015-12-31"))
})

test("recipient countries and sectors, percentages normalised to 100", function()
{
	const c = all("SELECT country_code, country_percent FROM country ORDER BY country_code")
	assert.deepEqual(c.map(r => [r.country_code, r.country_percent]), [["AF", 50], ["AG", 50]])
	const s = all("SELECT sector_group, sector_percent FROM sector ORDER BY sector_group")
	assert.deepEqual(s.map(r => [r.sector_group, r.sector_percent]), [["111", 50], ["112", 50]])
})

test("one transaction, converted from EUR at the January 2012 rate", function()
{
	const rows = all("SELECT * FROM trans")
	assert.equal(rows.length, 1)
	const t = rows[0]
	assert.equal(t.trans_ref, "1234")
	assert.equal(t.trans_code, "IF")
	assert.equal(t.trans_day, day("2012-01-01"))
	assert.equal(t.trans_currency, "EUR")
	assert.equal(t.trans_value, 1000)
	assert.equal(t.trans_eur, 1000)
	// if these change, the exchange rate data (freechange) has changed
	assert.equal(t.trans_usd.toFixed(2), "1291.35")
	assert.equal(t.trans_gbp.toFixed(2), "832.05")
	assert.equal(t.trans_cad.toFixed(2), "1308.23")
})

test("budget and planned disbursements, split across countries and sectors", function()
{
	// one budget and two planned disbursements of 3000 EUR, each split
	// into 2 countries x 2 sectors = 4 rows of 750
	const rows = all("SELECT budget, COUNT(*) AS n, SUM(budget_value) AS value FROM budget GROUP BY budget ORDER BY budget")
	assert.deepEqual(rows.map(r => [r.budget, r.n, r.value]), [["budget", 4, 3000], ["plan", 8, 6000]])

	for(const b of all("SELECT * FROM budget"))
	{
		assert.equal(b.budget_value, 750)
		assert.equal(b.budget_currency, "EUR")
		assert.equal(b.budget_day_start, day("2014-01-01"))
		// if this changes, the exchange rate data (freechange) has changed
		assert.equal(b.budget_usd.toFixed(2), "1020.91")
	}
})
