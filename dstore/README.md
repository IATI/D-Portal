DSTORE
======

DStore subsidises the iati-datastore with an optimised nodejs + 
SQLite database for use in real time Country Tracker queries.

Assuming you are on a Debian derivative.

	../bin/getapts
	npm install

will get you nodejs from a new PPA and install the required modules.

Any problems encountered at this stage are probably due to an old 
version of nodejs being installed via apt-get. If you have problems 
or are not on debian, try building the latest stable version of 
node rather than using apt-get.

On windows I recommend installing git and node and then using git 
bash, the command-line for git to run npm and node as shown bellow.

v0.10.24 of node is current and tested with this code.

Success?

Then the following commands can now be run.

NB: There seems to be some confusion over the use of node or nodejs 
due to package name clashes on some distributions. Try nodejs if 
node is not found.


	node js/serv.js

Runs the main server.


	node js/serv.js --port=1337 --database=db/dstore.sqlite

Runs the server with some options that could also have been set in 
the config.json file.


	node js/cmd.js init


Clears the database and creates the default tables ready to be 
filled. Alternatively, you could just delete the dstore.sqlite file 
for a full reset. The best thing to do is delete the .sqlite file 
and then run init.


	node js/cmd.js import "tmp/bd.xml"

Populate the database from just the named xml file which is good 
for simple tests.


	../bin/dstore_reset

Will delete and reset the current database, IE create the table 
structures but it will be empty.


	../bin/dstore_reset
	../bin/dstore_import_bd_ug_hn

This clears the database and then downloads and imports data for 
Bangladesh, Uganda and Honduras. It's probably best to have a look 
at the scripta and see what it does rather than just run it blindly. 
This script caches downloads in cache so rm the cache directory to 
update the data.


	../bin/dstore_clearcache

Use the clearcache script to clear the download cach so you get 
fresher data the next time you import. Otherwise the above scripts 
will reuse their last download.


	../bin/dstore_reset
	../bin/dstore_clearcache
	../bin/dstore_import_full

This is another script that imports all IATI data from the datastore 
and will chug away downloading and processing for a couple of hours. 
Using up around 3gig of disk space (currently, this number will go 
up). This uses a download cache so if you skip the clearcache line 
then it will reimport your last import. If you skip the reset line 
then you will refresh a currently active database, this is safe to 
do while dstore is currently running and servng data.

	

It is recommended that you only import data you wish to use and be 
aware that these are just example/test scripts. That will be 
replaced with a slightly better import system in the future.




