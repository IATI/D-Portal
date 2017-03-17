// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var upload=exports;

var util=require('util');
var fs=require('fs');

var refry=require('./refry');
var exs=require('./exs');
var iati_xml=require('./iati_xml');
var dstore_db=require("./dstore_db");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


// handle the /upload url space
upload.serv = function(req,res){


};

