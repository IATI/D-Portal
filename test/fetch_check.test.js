// The checks "dstore fetch" runs on what it downloaded before writing anything
// (dstore/js/fetch_check.js), fed good and bad data directly, with no network.

import { test } from "node:test"
import assert from "node:assert/strict"
import fetch_check from "../dstore/js/fetch_check.js"

// an object with n keys
const keys = function(n, prefix)
{
	const o = {}
	for(let i = 0; i < n; i++) { o[prefix + i] = { id: prefix + i } }
	return o
}

const required = ["sector", "country", "publisher_names"]

// a fetch that should pass: every required code present, 14,000 datasets, 2,000 publishers
const good = function()
{
	return {
		codes: { sector: keys(300, "s"), country: keys(250, "c"), publisher_names: keys(2000, "p") },
		packages: keys(14000, "d"),
	}
}

test("a normal fetch passes", function()
{
	assert.deepEqual(fetch_check.check(good(), good(), required), [])
})

test("a first fetch, with no previous files, passes", function()
{
	assert.deepEqual(fetch_check.check(good(), {}, required), [])
})

test("a missing code list fails", function()
{
	const fetched = good()
	delete fetched.codes.country
	const problems = fetch_check.check(fetched, good(), required)
	assert.deepEqual(problems, ["codes.country is missing or empty"])
})

test("an empty code list fails", function()
{
	const fetched = good()
	fetched.codes.sector = {}
	const problems = fetch_check.check(fetched, good(), required)
	assert.deepEqual(problems, ["codes.sector is missing or empty"])
})

test("every problem is reported, not just the first", function()
{
	const fetched = good()
	delete fetched.codes.country
	fetched.packages = keys(999, "d")
	const problems = fetch_check.check(fetched, good(), required)
	assert.deepEqual(problems, [
		"codes.country is missing or empty",
		"only 999 datasets, expected at least 1000",
		"datasets fell from 14000 to 999",
	])
})

test("too few datasets fails, even with no previous files", function()
{
	const fetched = good()
	fetched.packages = keys(999, "d")
	const problems = fetch_check.check(fetched, {}, required)
	assert.deepEqual(problems, ["only 999 datasets, expected at least 1000"])
})

test("datasets falling by more than 10% fails", function()
{
	const fetched = good()
	fetched.packages = keys(12599, "d")
	const problems = fetch_check.check(fetched, good(), required)
	assert.deepEqual(problems, ["datasets fell from 14000 to 12599"])
})

test("datasets falling by up to 10% passes", function()
{
	const fetched = good()
	fetched.packages = keys(12600, "d")
	assert.deepEqual(fetch_check.check(fetched, good(), required), [])
})

test("force skips the falls but not the other checks", function()
{
	const fetched = good()
	fetched.codes.publisher_names = keys(1799, "p")
	fetched.packages = keys(999, "d")
	const problems = fetch_check.check(fetched, good(), required, true)
	assert.deepEqual(problems, ["only 999 datasets, expected at least 1000"])
})

test("publisher names falling by more than 10% fails", function()
{
	const fetched = good()
	fetched.codes.publisher_names = keys(1799, "p")
	const problems = fetch_check.check(fetched, good(), required)
	assert.deepEqual(problems, ["publisher names fell from 2000 to 1799"])
})
