DStore will replace the iati-datastore with a nodejs + sqlite version for use in country tracker queries.



Assuming you are on a Debian derivative.

./getapts
npm install

will get you nodejs and install the require modules.

Then the following commands can be run.


nodejs serv.js

will run the server


nodejs serv.js --cmd create

will clear the database


nodejs serv.js --cmd import --xmlfile "tmp/bd.xml"

will populate the database from the provided xml file

