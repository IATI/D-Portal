
var express = require('express');
var express = require('express');
var app = express();

app.use(express.logger());

//app.use("/");

app.use("/test",function (req, res) {
	var t=require("./src/test")
	var html=required["test"].html(req,res);
	res.writeHead(200, {'Content-Type': html.mime});
	res.end(html.headbody);
});

app.use("/dstore_db",function (req, res) {
	require("./src/dstore_db").test(req,res);
});


app.use(express.compress());
app.use(express.static(__dirname));

app.listen(process.env.PORT || 1337);
