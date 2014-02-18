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

Q
=

We move activity data into an SQLITE cache and then provide a thin 
abstraction to this data, basically a "safe" way of building an SQL 
query from a URL and returning this data in a number of formats.

This is intended to be used client side in web apps so defaults to 
JSON or JSONP.

The main API is exposed on the /q base url with various ways of 
sending variables to it and returns data in the following formats 
based on the URL.

	/q.json
	/q

Returns JSON or JSONP (JSONP is flagged by callback arg) data

	/q.xml

Returns cooked XML, this also automagically themes and displays 
itself when viewed in a browser but the result is still valid XML. 
Its called cooked because its not the exact same XML that you would 
get from the publisher, instead attempts have been made to clean it 
up, force some elements to exist and provide explicit defaults to aid 
with parsing.

	/q.raw.xml

Returns the xml data as you would find it when downloading direct 
from the publisher. ( A "dstore_slug" attribute may have been added 
to iati-activity which records where the activity was imported from.

	/q.csv

Returns a CSV style file where the first row is column labels. Data 
is UTF8 and seperated by , with rows terminated by \n. Some strings 
may be wrapped in " if they include embeded newlines. These strings 
will escape " using double " eg """" would be a string containing 
one single ". This is "standard" CSV data or as standard as CSV files 
get.


The SELECT part of an SQL statement.
====================================

	/q?select=aid

Which columns seperated by , that you wish to select from the table, 
if not provided then is defaults to * which means everything. The 
valid values here depend on which tables you are querying.

Some special values are (without the day_length restraint it would 
be rather slow as it considers every activitiy in the database)

	/q?select=stats&day_length=365

stats can only be used on its own and causes an automatic build of  
MAX() MIN() AVG() TOTAL() COUNT() COUNT(DISTINCT) agregate functions 
for each column. Try it to see what it returns.

	/q?select=aid,count&day_length=365

count may be mixed with other column names and returns the COUNT(*) 
be aware that this triggers the collapsing of all rows so probably 
should be included with a groupby.

All the possible column names for each table can be found by 
querying a table and looking at the returned json.

	/q?from=activities&limit=1

The FROM part of an SQL statement.
==================================

	/q?from=activities

Choose which table to query from ( activities , transactions , 
budgets , country , sector , location , slugs ). If not provided 
then it defaults to activities. Multiple tables can by seperated by 
, and a join will be attempted, however this will only work well 
with some combinations.

The main tables ( activities , transactions , budgets )  can be 
joind to one or more of the sub tables ( country , sector , location 
)

for instance

	/q?from=activities,country,sector,location

Because of the way joins work each activity may be returned multiple 
times, once for every unique combination of sub tables so only join 
with tables that you need to query.

The slugs table is metadata helping to keep track of which activity 
was imported from which file, unless you are interested in 
development it is not something you will need to select.


