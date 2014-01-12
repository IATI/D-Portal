
var express = require('express');
var app = express();

app.use(express.logger());

//app.use("/");

app.use("/test",function (req, res) {
console.time("serv: "+req.url);

	var t=require("./src/test")
	var html=required["test"].html(req,res);
	res.writeHead(200, {'Content-Type': html.mime});
	res.end(html.headbody);

console.timeEnd("serv: "+req.url);
});


app.use(express.compress());
app.use(express.static(__dirname));

app.listen(process.env.PORT || 1337);
