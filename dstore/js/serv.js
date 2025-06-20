// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

import * as util from "util"
import * as path from "path"

import express            from "express"
import minimist           from "minimist"
import dstore_argv  from "./argv.js"

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
let argv=minimist(process.argv.slice(2))
global.argv=argv
dstore_argv.parse(argv)

//we must choose a backend before importing these
const queryjs    = (await import("./query.js")).default




var app = express();


// make sure we have a db dir
fs.mkdir("db",function(e){});


//app.use(express.json());

//app.use("/");

app.use("/q",function (req, res) {
	queryjs.serv(req,res);
});

//app.use(express.compress());
app.use(express.static(import.meta.dirname+"/../../dportal/static"));

console.log("Starting dstore server at http://localhost:"+argv.port+"/");

app.listen(argv.port);


