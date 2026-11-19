# Seed copy of the code lists

`codelists.json` is written to `dflat/json` by `dflat fetch codelists`, and
the code needs it to build and run. This is a copy for a fresh checkout, where
no fetch has been run yet.

`bin/seed` copies it into `dflat/json` only if the file there is missing, and
`./build` and `bin/build` run it first. A file written by a fetch is never
replaced, so a server that fetches each night uses its own file.

It only needs to be recent enough to build and run. To refresh it, run the
fetch and copy the file here:

```sh
dflat/dflat fetch codelists
cp dflat/json/codelists.json dflat/json-seed/
```

Refresh it along with the seeds in `dstore/json-seed`.
