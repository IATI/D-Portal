var http = require('http');
http.createServer(function (req, res) {
var t=require("./src/test")
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n'+required["test"].test());
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');

