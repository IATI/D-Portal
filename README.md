![d-portal logo](https://raw.githubusercontent.com/devinit/D-Portal/master/ctrack/art/dp_git_logo.460.png)
 
d-portal.org is a country-based information platform that tracks
resource flows. It is aimed at providing line ministries,
parliamentarians and civil society with information that can assist
with the planning and monitoring of development activities.
 
One of its aims is to build a re-usable piece of code that can be 
easily hosted by anyone, anywhere and that will tell an interesting 
story using IATI data.
 
The live version lives at http://d-portal.org/

d-portal.org is currently being developed and designed so things are constantly changing.

If you would like to keep up to date with discussions on d-portal, join the [mailing list](https://groups.google.com/forum/#!forum/d-portal-list).

We also post daily logs of the nightly import of new IATI data being published to d-portal.org [here](https://groups.google.com/forum/#!forum/d-portal-logs).


Directory Structure
===================

/ctrack contains client side javascript and css for displaying 
information direct from the datastore in browser. See the readme in 
that directory for more information. This is needed to build and 
deploy a customized d-portal browser tool.

/dstore contains server side javascript for xml manipulation and 
parsing of iati data.  See the readme in that directory for more 
information. This is needed to run the Q queries on your own host.

/dportal contains javascript that builds the static information and 
example site you will find deployed at http://d-portal.org/ 

/bin contains helper scripts.

/documents contains documentation

