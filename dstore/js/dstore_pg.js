// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var dstore_pg=exports;

var wait=require("wait.for");

var pgp = require("pg-promise");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }
