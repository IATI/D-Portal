var http = require('http');
http.createServer(function (req, res) {
console.time("serv: "+req.url);

var t=require("./src/test")

	var html=required["test"].html(req,res);
	html.headbody=html.headbody ||
	'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"\n'+
	'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'+
	'<html xmlns="http://www.w3.org/1999/xhtml">\n'+
	'<head>'+html.head+'</head>\n'+
	'<body>'+html.body+'</body>\n'+
	'</html>\n';
			
	res.writeHead(200, {'Content-Type': html.mime});
	res.end(html.headbody);

console.timeEnd("serv: "+req.url);
}).listen(1337, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1337/');
