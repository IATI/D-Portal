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

// turn all chunks back into a string
// this is broken :)
plate.out_chunks=function(chunks)
{
	return plate_old.out_chunks(chunks)

}

// break a string on {data} ready to replace
plate.prepare=function(str)
{
	return plate_old.prepare(str)
}

// clear namespace
plate.reset_namespace=function()
{
	return plate_old.reset_namespace()
}

// add this dat into the namespaces that we also check when filling in chunks
plate.push_namespace=function(dat)
{
	return plate_old.push_namespace(dat)
}

// remove last namespace from top of stack
plate.pop_namespace=function()
{
	return plate_old.pop_namespace()
}

// lookup a str in dat or namespace
plate.lookup=function(str,dat)
{
	return plate_old.lookup(str,dat)
}
// lookup only in dat
plate.lookup_single=function(str,dat)
{
	return plate_old.lookup_single(str,dat)
}

// replace once only, using dat and any added namespaces
plate.replace_once=function(str,dat)
{
	return plate_old.replace_once(str,dat)
}

// repeatedly replace untill all things that can expand, have expanded, or we ran out of sanity
plate.replace=function(str,arr)
{
	return plate_old.replace(str,arr)
}


