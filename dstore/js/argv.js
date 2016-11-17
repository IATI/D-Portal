// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT



exports.parse=function(argv)
{

// argv default settings which can be changed by environment and command line

//setting     = commandline   || environment                 || default                      ;
argv.port     = argv.port     || process.env.DSTORE_PORT     || 1408                        ;
argv.database = argv.database || process.env.DSTORE_DATABASE || "../dstore/db/dstore.sqlite" ;
argv.cache    = argv.cache    || process.env.DSTORE_CACHE    || "../dstore/cache"            ;
argv.pg       = argv.pg       || process.env.DSTORE_PG       || undefined                    ;

// to switch to postgres defaults set the following in your environment
// DSTORE_PG=postgresql:///dstore

};
