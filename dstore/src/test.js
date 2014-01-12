//create a nodejs or clientjs module
var exports=exports;
if(typeof required === "undefined") { required={}; }
if(typeof exports  === "undefined") { exports ={}; }
required["test"]=exports;

	exports.html = function(req,res){
		r={};
		r.mime='text/html';
		r.head='<script src="jslib/head.js"></script>';
		r.body='heloooo wurld!';
		return r;
	};
	
