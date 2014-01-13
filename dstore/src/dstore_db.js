//create a nodejs or clientjs module
var exports=exports;
if(typeof required === "undefined") { required={}; }
if(typeof exports  === "undefined") { exports ={}; }
required["dstore_db"]=exports;

var nconf = require('nconf');
var sqlite3 = require('sqlite3').verbose();
var xml2js = require('xml2js');


exports.open = function(){
	var db = new sqlite3.Database( nconf.get("database") );
	
// speed up data writes.
	db.serialize(function() {
		db.run('PRAGMA synchronous = 0 ;');
		db.run('PRAGMA encoding = "UTF-8" ;');
		db.run('PRAGMA journal_mode=WAL;');
	});
	
	return db;
};


exports.test = function(req,res){

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



exports.fill_acts = function(acts){

	var db = required["dstore_db"].open();
	
	db.serialize(function() {

		var stmt = db.prepare("INSERT INTO xmlacts VALUES (?,?)");

		for(var i=0;i<acts.length;i++)
		{
			var v=acts[i];
			var xml;
			var json;
			xml2js.parseString(v, function (err, result) {
				xml=result;
				json=JSON.stringify(xml);
			});
			var id=xml["iati-activity"]["iati-identifier"][0]
//			console.dir(id+" : "+json.length);

			stmt.run(id,v);

		}
		
		stmt.finalize();
		
	});

	db.close();
};



exports.create_tables = function(){

	var db = required["dstore_db"].open();

	db.serialize(function() {
	
// simple data dump table containing just the raw xml of each activity.
// this is filled on import and then used as a source

		db.run("DROP TABLE If EXISTS xmlacts;");
		db.run("CREATE TABLE xmlacts (id TEXT,xml TEXT);");

		console.log("Created databse "+nconf.get("database"));

	});
	
	db.close();
}

