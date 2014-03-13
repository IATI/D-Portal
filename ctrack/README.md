Country tracker, Client side Javascript and CSS view of the 
iati-datastore.

Installing
==========

Install node and run the script install_deps to install node modules 
which this project requires. These are build dependencies. Neither 
node or any modues are needed to run this project as it runs in a 
webpage, node is just used to build from source.


Installing Node
===============

If you are using windows then please start by installing git 
https://help.github.com/articles/set-up-git#platform-windows and 
node http://nodejs.org/download/

git bash which is described under setting up git for windows link 
above should be used to perform the other steps listed bellow. 
Please make sure the commands are issued from within the ctrack 
directory.

For ubuntu based systems runnning the following from this directory

	../bin/getapts

Will work, by adding a newer PPA for node and then installing from 
there. You may prefer to install from source rather than add random 
PPAs. See the nodejs site for how to do this.


Installing Node Modules
=======================

	./install_deps

Will then install modules needed for bake.js (to create the client 
side app) and serv.js (to run a simple server to serv the app), 
these are build dependencies not runtime dependencies.


Building
========

	./build

Will generate json files from raw data, eg it imports the language 
and other template files into the ./json directory. Then it creates 
the final minified/mangled js files in ./jslib that will be used by 
the browser.

	./fetch

Will get the latest codelists and external CRS data that is built 
into ctrack. The downloaded data will be found in ../dstore/json 
which is checked into git so unless major changes have been made 
without any updates to this project then you will not need to run 
this.

Tools
========

	./ctrack
	
Will list available commandline options for the ctrack project, 
these are mostly to do with importing or exporting of data.

	./ctrack import tongue tmp/tongue.csv 
	./ctrack export tongue tmp/tongue.csv 

Import/export a language table from/to a csv file. This is a helper 
script to aid with translation activities. The master langage files 
used are all in text/*.txt but translators may prefer to work with a 
spreadsheet.


Running
=======

	./serv
	
Will start a node based webserver and publish this *entire* 
directory as static files available at http://localhost:1337/ This 
also runs the dstore server providing the q interface at 
http://localhost:1337/q BEWARE if you have not imported any data into 
dstore then this server will be empty.

Either import some data (see the dstore readme) or use the public 
dstore q api located at http://d-portal.org/q instead with the following 
command.

	./serv -q http://d-portal.org/q
