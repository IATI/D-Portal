// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var nconf = require('nconf');
var express = require('express');
var app = express();

nconf.argv().file({ file: 'config.json' });
nconf.set("port",1337);

app.use(express.static(__dirname+"/../"));

console.log("Starting ctrack server at http://localhost:"+nconf.get("port")+"/");

app.listen(nconf.get("port"));
