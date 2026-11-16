// Copyright (c) 2026 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// Checks run on what "dstore fetch" downloaded, before anything is written.
// A fetch that fails any of them writes nothing, so the previous files stay.

const fetch_check={}
export default fetch_check

// fewer datasets than this means the dataset list is broken, dstore cache
// uses the same minimum before emptying or deleting files
fetch_check.min_packages=1000

// a list may shrink a little from one night to the next, but not by more than this
fetch_check.min_fraction=0.9

var count=function(o)
{
	return ( o && typeof o=="object" ) ? Object.keys(o).length : 0
}

// fetched  : { codes, packages }   what this fetch produced
// previous : { codes, packages }   the files from the last fetch, either may be undefined
// required : names of codes that must be present and not empty
// force    : skip the checks that compare with the previous files
// returns a list of problems, empty if everything passed
fetch_check.check=function(fetched,previous,required,force)
{
	var problems=[]

	for(var name of required)
	{
		if( count(fetched.codes[name])==0 )
		{
			problems.push("codes."+name+" is missing or empty")
		}
	}

	var shrunk=function(what,now,before)
	{
		if( !force && before && now < before*fetch_check.min_fraction )
		{
			problems.push(what+" fell from "+before+" to "+now)
		}
	}

	var packages=count(fetched.packages)
	if( packages < fetch_check.min_packages )
	{
		problems.push("only "+packages+" datasets, expected at least "+fetch_check.min_packages)
	}
	shrunk("datasets", packages, count(previous.packages))

	shrunk("publisher names", count(fetched.codes.publisher_names), count(previous.codes && previous.codes.publisher_names))

	return problems
}
