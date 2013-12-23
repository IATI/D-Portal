
// one global function
Ctrack=function(args){

	var storage_available=typeof window.localStorage!=='undefined';
	var json_available=typeof window.JSON!=='undefined';

	var ctrack={};
	ctrack.args=args;
	
#include "src/ctrack.chunks.js"	
#include "src/ctrack.plate.js"	
#include "src/ctrack.html.js"	
		
	return ctrack;
};
