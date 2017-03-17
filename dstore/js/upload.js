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


console.log("UPLOAD",req.files.xml);

	if(req.files.xml)
	{

		var md5omatic = require('md5-o-matic');

		var instance=md5omatic(req.files.xml.data.toString('utf8'));

	console.log("INSTANCE : "+instance);

		var xml_filename=argv.instance_dir+instance+".xml";

	console.log("FILENAME : "+xml_filename);


	/*
		// rename file, keep it in our instance directory for parsing

		fs.rename(req.files.data.path, xml_filename , function (err) {
			
			if (err) throw err;
			console.log('successfully deleted ' + req.files.path);

		});
	*/

	}

};

