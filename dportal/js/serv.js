// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


import express            from "express"
import express_fileupload from "express-fileupload"
import minimist           from "minimist"
import dstore_argv        from "../../dstore/js/argv.js"
import dstore_query       from "../../dstore/js/query.js"
import dstore_upload      from "../../dstore/js/upload.js"
import dflat_query        from "../../dflat/js/query.js"
import dflat_savi         from "../../dflat/js/savi.js"

var app = express();

app.set("trust proxy", true)


let argv=minimist(process.argv.slice(2))
global.argv=argv
dstore_argv.parse(argv)

//express.static.mime.define({'text/plain': ['']});

//app.use(morgan('combined'));

app.use( express_fileupload() );

// we need to do crap with OPTIONS for some sites to talk to us ?

app.use(function(req, res, next) {
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

app.use(function(req, res, next) {

//	res.setHeader("Access-Control-Allow-Origin", "*")
  
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

app.use(express.static( argv.staticdir || (import.meta.dirname+"/../static") ));

app.use( express.json( { limit: '10MB' } ) )

app.use(function(req, res, next) {
	var aa=req.path.split("/");
	var ab=aa && aa[1] && (aa[1].split("."));

console.log(req.path)

	if( ab && (ab[0]=="q") ) // data query endpoint, 
	{
		dstore_query.serv(req,res,next);
	}
	else
	if( ab && (ab[0]=="upload") && argv.upload) // upload api endpoint, for testing xml files only if upload is set
	{
		dstore_upload.serv(req,res,next);
	}
	else
	{
		next();
	}
});

app.use( express.urlencoded({ extended: true }) )

// dquery
app.use('/dquery', dflat_query.serv )

// dquery
app.use('/savi', dflat_savi.serv )


// redirect any unknown page to main homepage
app.use(function(req, res) {
	res.redirect( argv.homepage || '/ctrack.html#view=search');
});


console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

