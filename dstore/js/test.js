// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

//create a nodejs or clientjs module
var exports=exports;
if(typeof required === "undefined") { required={}; }
if(typeof exports  === "undefined") { exports ={}; }
required["test"]=exports;

exports.html = function(req,res){
	r={};
	r.mime='text/html';
	r.head='<script src="jslib/head.min.js"></script>';
	r.body='heloooo wurld!';
	r.headbody=
	'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"\n'+
	'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'+
	'<html xmlns="http://www.w3.org/1999/xhtml">\n'+
	'<head>'+r.head+'</head>\n'+
	'<body>'+r.body+'</body>\n'+
	'</html>\n';
	return r;
};

