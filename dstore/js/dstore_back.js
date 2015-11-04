// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


module.exports=exports=require('./dstore_sqlite');


// use postgres
if(argv.pg){
	
console.log("**WARNING USING POSTGRES WHICH IS UNDER CONSTRUCTION**");
	
	module.exports=exports=require('./dstore_pg');

}
