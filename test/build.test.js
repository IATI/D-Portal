// Check the output of ./build (or bin/build): the static site in
// dportal/static and the ctrack bundle. Skipped locally if the site has not
// been built; fails in CI, where it must have been.

import { test } from "node:test"
import assert from "node:assert/strict"
import * as fs from "node:fs"
import * as path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const site = root + "/dportal/static"
const bundle = site + "/ctrack/jslib/ctrack_loader/ctrack.js"
const languages = ["cmn", "fra", "hin", "jpn", "spa"]

const built = fs.existsSync(site + "/ctrack.html")

const check = function(name, fn)
{
	test(name, function(t)
	{
		if(!built)
		{
			assert.ok(!process.env.CI, "dportal/static has not been built")
			t.skip("dportal/static not built, run bin/build first")
			return
		}
		fn()
	})
}

const read = function(f) { return fs.readFileSync(site + "/" + f, "utf8") }

check("main pages are built", function()
{
	for(const f of ["index.html", "ctrack.html", "about.html", "faq.html"])
	{
		assert.match(read(f), /<html/i, f)
	}
})

check("each language has its pages", function()
{
	for(const l of languages)
	{
		for(const f of ["index.html", "about.html"])
		{
			assert.ok(fs.existsSync(site + "/" + l + "/" + f), l + "/" + f)
		}
	}
})

check("scripts and stylesheets the pages load exist", function()
{
	const pages = ["index.html", "ctrack.html", "about.html", ...languages.map(l => l + "/index.html")]
	let checked = 0
	for(const p of pages)
	{
		const html = read(p)
		const refs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"|<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*rel="stylesheet"/g)]
			.map(m => m[1] || m[2] || m[3])
			.filter(u => !/^(https?:)?\/\//.test(u))
		for(const u of refs)
		{
			const f = path.resolve(path.dirname(site + "/" + p), u.split(/[?#]/)[0])
			assert.ok(fs.existsSync(f), p + " loads missing " + u)
			checked++
		}
	}
	assert.ok(checked > 0, "found no local scripts or stylesheets to check")
})

check("the ctrack bundle contains the current codes", function()
{
	assert.ok(fs.existsSync(bundle), "no ctrack bundle")
	const js = fs.readFileSync(bundle, "utf8")
	const codes = JSON.parse(fs.readFileSync(root + "/dstore/json/iati_codes.json", "utf8"))

	assert.ok(js.includes(codes.sector["11110"]), "sector names missing from bundle")
	assert.ok(js.includes(codes.country["AF"]), "country names missing from bundle")
	// a plain publisher name, so it appears in the bundle unescaped
	const publisher = Object.values(codes.publisher_names).find(n => /^[A-Za-z ,.()-]{15,}$/.test(n))
	assert.ok(publisher && js.includes(publisher), "publisher names missing from bundle")
})
