D-Portal
====================

This is a project to build a re-usable piece of code that can be 
easily hosted by anyone, anywhere and that will tell an interesting 
story using IATI data.

The live version lives at
http://d-portal.org/

Please remember that this is a work in progress so it may break or
change at any moment.


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
