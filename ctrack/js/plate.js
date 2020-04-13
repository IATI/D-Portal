// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var plate=exports;

var plate_old=require('./plate_old');


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

// prepare for new plate code

// break a string into chunks ( can be merged and overried other chunks )
plate.fill_chunks=function(str,chunks)
{
	return plate_old.fill_chunks(str,chunks)

}


// add this dat into the namespaces that we also check when filling in chunks
plate.push_namespace=function(dat)
{
	return plate_old.push_namespace(dat)
}


// repeatedly replace untill all things that can expand, have expanded, or we ran out of sanity
plate.replace=function(str,arr)
{
	return plate_old.replace(str,arr)
}


