// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

import * as util from "util"
import * as path from "path"

import express            from "express"
import minimist           from "minimist"

import argvjs from "./agrv.js"
import queryjs from "./query.js"


var app = express();

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// global.argv
let argv=minimist(process.argv.slice(2))
argvjs.parse(argv);

// make sure we have a db dir
fs.mkdir("db",function(e){});


//app.use(express.json());

//app.use("/");

app.use("/q",function (req, res) {
	queryjs.serv(req,res);
});

//app.use(express.compress());
app.use(express.static(__dirname+"/../../dportal/static"));

console.log("Starting dstore server at http://localhost:"+argv.port+"/");

app.listen(argv.port);


