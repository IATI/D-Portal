
Ctrack=function(opts){

	var storage_available=typeof window.localStorage!=='undefined';
	var json_available=typeof window.JSON!=='undefined';

	var ctrack={};
	
#include "src/ctrack.html.js"	
		
	return ctrack;
};
