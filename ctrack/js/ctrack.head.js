// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

// one global function
Ctrack=function(args){

	var storage_available=typeof window.localStorage!=='undefined';
	var json_available=typeof window.JSON!=='undefined';

	var ctrack={};
	ctrack.args=args;
	
#include "src/ctrack.chunks.js"
#include "src/ctrack.plate.js"
#include "src/ctrack.html.js"
#include "src/ctrack.iati.js"
#include "src/ctrack.json.js"
		
	return ctrack;
};
