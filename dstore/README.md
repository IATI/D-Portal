DSTORE
======

DStore subsidizes the iati-datastore with an optimized nodejs + 
SQLite database for use in real time Country Tracker queries.

Assuming you are on a Debian derivative.

	../bin/getapts
	npm install

will get you nodejs from a new PPA and install the required modules.

Any problems encountered at this stage are probably due to an old 
version of nodejs being installed via apt-get. If you have problems 
or are not on debian, try building the latest stable version of 
node rather than using apt-get.

v0.10.24 is current and tested as of the now.

Success?

Then the following commands can now be run.

NB: There seems to be some confusiuon over the use of node or nodejs 
due to package name clashes. Try nodejs if node is not found.


	node serv.js

Runs the main server.


	node serv.js --port=1337 --database=db/dstore.sqlite

Runs the server with some options that could also have been set in 
the config.json file.


	node serv.js --cmd init


Clears the database and creates the default tables ready to be 
filled. Alternatively, you could just delete the dstore.sqlite file 
for a full reset.


	node serv.js --cmd import --xmlfile "tmp/bd.xml"

Populate the database from just the named xml file which is good 
for simple tests.


	../bin/import_bd_ug_hn

This is a small script that clears the database and then downloads 
and imports data for Bangladesh, Uganda and Honduras. It's probably 
best to have a look at this script and see what it does rather than 
just run it blindly.


