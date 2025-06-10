// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


const dstore_argv={}
export default dstore_argv

dstore_argv.parse=function(argv)
{

// instance settings, normally disabled.
// instance should be set to an MD5 hash of the default instance which will be used from the command line.
// The server subdomain will decide which instance to display when serving. This will override the instance setting.

argv.instance     = argv.instance     || process.env.DSTORE_INSTANCE     || undefined             ;
argv.instance_dir = argv.instance_dir || process.env.DSTORE_INSTANCE_DIR || "../dstore/instance/" ;

	// argv default settings which can be changed by environment and command line

	//setting     = commandline   || environment                 || default                      ;
	argv.port     = argv.port     || process.env.DSTORE_PORT     || 1408                         ;
	argv.database = argv.database || process.env.DSTORE_DATABASE || "../dstore/db/dstore.sqlite" ;
	argv.cache    = argv.cache    || process.env.DSTORE_CACHE    || "../dstore/cache"            ;
	argv.pg       = argv.pg       || process.env.DSTORE_PG       || undefined                    ; // main PG
	argv.pgro     = argv.pgro     || process.env.DSTORE_PGRO     || undefined                    ; // read only PG

	// to switch to postgres defaults set the following in your environment
	// DSTORE_PG=postgresql:///dstore


	// location of static files

	argv.staticdir = argv.staticdir || process.env.DSTORE_STATICDIR ;

	// default page if a file is missing

	argv.homepage  = argv.homepage  || process.env.DSTORE_HOMEPAGE  ;

	// enable uploads page

	argv.upload  = argv.upload  || process.env.DSTORE_UPLOAD  ;

};
