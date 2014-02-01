DStore subsidizes the iati-datastore with an optimized nodejs + 
sqlite version for use in real time country tracker queries.


Assuming you are on a Debian derivative.

../bin/getapts
npm install

will get you nodejs from a new ppa and install the require modules. 
Any problems encountered at this stage are probably due to an old 
version of nodejs being installed via apt-get. If you have problems 
or are not on debian then try building the latest stable version of 
node rather than using apt-get, v0.10.24 is current and tested as of 
the now.

Success?

Then the following commands can now be run.

NB: There seems to be some confusiuon over the use of node or nodejs 
due to package name clashes. So try nodejs if node is not found.


node serv.js

Runs the main server, possible options which can be set on the 
commandline or in the config.json file are.

--port=1337
--database=db/dstore.sqlite


node serv.js --cmd init

Clears the database and creates the default tables ready to be 
filled, alternatively you could just delete the dstore.sqlite file 
for a full reset.


node serv.js --cmd import --xmlfile "tmp/bd.xml"

Populate the database from just the provided xml file, good for 
simple tests.

