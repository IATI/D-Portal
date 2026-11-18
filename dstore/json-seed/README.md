# Seed copies of fetched files

`iati_codes.json` and `validhash.json` are written to `dstore/json` by
`dstore fetch`, and the code needs them to build and run. These are copies
for a fresh checkout, where no fetch has been run yet.

`bin/seed` copies each one into `dstore/json` only if the file there is
missing, and `./build` and `bin/build` run it first. A file written by a fetch
is never replaced, so a server that fetches each night uses its own files.

They only need to be recent enough to build and run. To refresh them, run
`dstore fetch` and copy the two files here:

```sh
dstore/dstore fetch
cp dstore/json/iati_codes.json dstore/json/validhash.json dstore/json-seed/
```

Refresh them when IATI publishes new code lists, or every few months.
