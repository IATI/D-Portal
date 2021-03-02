// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var express = require('express');
var express_fileupload = require('express-fileupload');

//var morgan = require('morgan');
var app = express();

app.set("trust proxy", true)


var argv=require('yargs').argv; global.argv=argv;
require("../../dstore/js/argv").parse(argv);

express.static.mime.define({'text/plain': ['']});

//app.use(morgan('combined'));

app.use( express_fileupload() );


app.use(function(req, res, next) {

	res.setHeader("Access-Control-Allow-Origin", "*")
  
 	var aa=req.path.split("/");
	var ab=aa && (aa[aa.length-1].split("."));

	if( ab && (ab.length==1) ) // no extension
	{
		res.contentType('text/html'); // set to html
	}
	
	if(req.get('user-agent'))
	{
		if( req.get('user-agent').indexOf("Trident/5.0") > -1 ) // only if IE9
		{
			res.set("X-UA-Compatible", "IE=9"); //This fixes IE9 iframes?
		}
	}
	
	next();
});

app.use(express.static( argv.staticdir || (__dirname+"/../static") ));

app.use( express.json( { limit: '10MB' } ) )

app.use(function(req, res, next) {
	var aa=req.path.split("/");
	var ab=aa && aa[1] && (aa[1].split("."));

console.log(req.path)

	if( ab && (ab[0]=="q") ) // data query endpoint, 
	{
		require("../../dstore/js/query").serv(req,res,next);
	}
	else
	if( ab && (ab[0]=="upload") && argv.upload) // upload api endpoint, for testing xml files only if upload is set
	{
		require("../../dstore/js/upload").serv(req,res,next);
	}
	else
	{
		next();
	}
});

app.use( express.urlencoded({ extended: true }) )

// dquery
app.use('/dquery', require("../../dflat/js/query").serv )

// dquery
app.use('/savi', require("../../dflat/js/savi").serv )


// redirect any unknown page to main homepage
app.get('*', function(req, res) {
	res.redirect( argv.homepage || '/ctrack.html#view=search');
});




console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

