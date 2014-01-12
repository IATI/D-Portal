//create a nodejs or clientjs module
var exports=exports;
if(typeof required === "undefined") { required={}; }
if(typeof exports  === "undefined") { exports ={}; }
required["dstore_db"]=exports;


exports.test = function(req,res){

	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database(':memory:');

	db.serialize(function() {
		db.run("CREATE TABLE lorem (info TEXT)");

		var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
		for (var i = 0; i < 10; i++)
		{
			stmt.run("Ipsum " + i);
		}
		stmt.finalize();

		var s=""
		db.each("SELECT rowid AS id, info FROM lorem", function(err, row)
		{
			console.log(row.id + ": " + row.info);
			s=s+row.id + ": " + row.info+"\n";
		},function(err, count){
			res.end(s);
		});
	});

	db.close();

};
