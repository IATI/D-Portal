DStore subsidizes the iati-datastore with an optimized nodejs + 
SQLite version for use in real time Country Tracker queries.

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

Populate the database from just the provided xml file, good for 
simple tests.


Q
=

We move activity data into an SQLite cache and then provide a thin 
abstraction to this data; basically a "safe" way of building an SQL 
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
It's called cooked because it's not the exact same XML that you would 
get from the publisher. Instead, attempts have been made to clean it 
up, force some elements to exist and provide explicit defaults to aid 
with parsing.

	/q.raw.xml

Returns the xml data as you would find it when downloading direct 
from the publisher. (A "dstore_slug" attribute may have been added 
to iati-activity which records where the activity was imported from.)

	/q.csv

Returns a CSV style file where the first row is column labels. Data 
is UTF8 and seperated by , with rows terminated by \n. Some strings 
may be wrapped in " if they include embedded newlines. These strings 
will escape " using double " eg """" would be a string containing 
one single ". This is "standard" CSV data or as standard as CSV files 
get.


The SELECT part of an SQL statement.
====================================

	/q?select=aid,title,description

Include column names seperated by a comma (,) that you wish to select
from the table. If column names are not provided, this defaults to
an asterisk (*) which means everything. The valid values here depend
on which tables you are querying.


Some special values are

	/q?select=stats&day_length=365

stats can only be used on its own and causes an automatic build of 
MAX() MIN() AVG() TOTAL() COUNT() COUNT(DISTINCT) aggregate functions 
for each column. (without the day_length restraint, it would be 
rather slow as it would consider every activitiy in the database)

Try it to see what it returns.



	/q?select=aid,count&day_length=365

count may be mixed with other column names and returns the COUNT(*)
Be aware that this triggers the collapsing of all rows so it should
probably be included with a groupby.



	/q?from=transactions,country&select=aid,day,percent_of_usd&day_gteq=2013-01-01&day_lt=2014-01-01
	/q?from=transactions,country&select=aid,day,percent_of_value&day_gteq=2013-01-01&day_lt=2014-01-01

percent_of_usd or percent_of_value can be used to automatically take 
a proportion of money based on the percentage assigned to it in the 
joined table. So if you join to a country that has been given 50% of 
an activitiy, it will return half the values.

This works with multiple joins allowing you to drill down to the
appropriate numbers.



	/q?from=transactions,country&select=aid,count,day,sum_of_percent_of_usd&day_gteq=2013-01-01&day_lt=2014-01-01
	/q?from=transactions,country&select=aid,count,day,sum_of_percent_of_value&day_gteq=2013-01-01&day_lt=2014-01-01

sum_of_percent_of_usd or sum_of_percent_of_value will return a sum 
of the percent_of calculation. So the above queries will add up all 
the transactions found in 2013. It should be limited to certain 
transaction types and grouped by country to be useful information.



All the possible column names for each table can be found by 
querying a table and looking at the returned JSON.

	/q?from=activities&limit=1
	/q?from=transactions&limit=1
	/q?from=budgets&limit=1




The FROM part of an SQL statement.
==================================

	/q?from=activities

Choose which table to query from ( activities , transactions , 
budgets , country , sector , location , slugs ). If a table is not
provided, it defaults to activities. Multiple tables can by seperated
by a comma (,) and a join will be attempted.

However, this will only work well with some combinations.

The main tables ( activities , transactions , budgets )  can be 
joined to one or more of the sub tables ( country , sector , location 
).

For instance

	/q?from=activities,country,sector,location

Because of the way joins work, each activity may be returned multiple 
times and once for every unique combination of sub tables so only join 
with tables that you need to query.

The slugs table is metadata helping to keep track of which activity 
was imported from which file. Unless you are interested in 
development, it is not something you will need to select.




The WHERE part of an SQL statement.
===================================

This is built from multiple parts of the query. At its most basic, 
you can request that a column matches a simple value by just 
including the name of that column and the value that must match.



	/q?from=activities&aid=US-1-2010015530
	
Will pick a single activity of the given aid (IATI Activity ID)



	/q?from=activities&aid=US-1-2010015530|GB-1-114209-101

Multiple values can be seperated by | and either will match, so the 
above will pull out the two activities of the given ids.



	/q?from=transactions&day=2012-01-01
	
Day comparisons can be provided as simple dates that will 
automatically be converted to a simple number stored in the database. 
This simple number is the number of days since 1970-01-01 UTC
multiplied by 60*60*24 to convert to seconds and become a
standard UNIX timestamp.

As well as picking exact matches, a number of modifiers can be added 
to the name to perform simple searches or less than or more than 
comparisons.



Here are all the possible postfixes and the SQL they map to.
You will find examples of these postfixes scattered throughout 
the example queries.



	/q?from=transactions&day_lt=2012-01-01

	_lt			<
	
Less than.



	/q?from=transactions&day_gt=2012-01-01

	_gt			>
	
Greater than.



	/q?from=transactions&day_lteq=2012-01-01

	_lteq		<=
	
Less than or equal.



	/q?from=transactions&day_gteq=2012-01-01

	_gteq		>=
	
Greater than or equal.



	/q?from=transactions&day_nteq=2012-01-01

	_nteq		!=

Not equal to.



	/q?from=transactions&day_eq=2012-01-01

	_eq			=
	
Equal to. This is the same as not having a postfix.



	/q?from=transactions&description_glob=*Quarter*

	_glob		GLOB

A wildcard match where * and ? can be used for multiple or single 
characters.



	/q?from=transactions&description_like=%25CRS%25

	_like		LIKE

A wildcard match where % and _ can be used for multiple or single 
characters. Unlike _glob, this also ignores case (uppercase or
lowercase if you stick to the english alphabet).
The % probably needs to be escaped to %25 in the url as above.



	/q?from=transactions&description_null
	
	_null		IS NULL

Sometimes the value is missing and this makes it possible to find
those missing values.



	/q?from=transactions&description_not_null

	_not_null	IS NOT NULL

You can use this query to ignore missing values in your search.




The GROUP BY part of an SQL statement.
======================================

	/q?select=count,description&from=transactions&groupby=description

When counting or adding up values, it is often neccesary to group by 
columns with the same values. The above example groups transactions by
their description and counts the occurance of each.



	/q?select=count,currency,code&from=transactions&groupby=currency,code

Multiple column names seperated by a comma (,) can be used in a group by.
The above counts the frequency of transactions currency and code 
combinations.



The ORDER BY part of an SQL statement.
======================================

	/q?orderby=aid
	
Sort by ids ascending, so from low to high. This is the default.



	/q?orderby=aid-
	
Sort by ids descending, so from high to low.



	/q?orderby=day_start,day_end

Multiple column names can also be given seperated by a comma (,)
