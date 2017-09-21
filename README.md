Issues
===================
Please be aware that we use Github Issues for **discussion** and not every issue represents a bug.  
If you have any questions about d-portal, please raise an [*issue*](https://github.com/devinit/D-Portal/issues/new). We very much welcome comments and feedback!


![d-portal logo](https://raw.githubusercontent.com/devinit/D-Portal/master/ctrack/art/dp_git_logo.460.png)
 
Search IATI data on development and humanitarian activities on specific events or themes more easily on d-portal.

Visit the site at http://d-portal.org/

**We are currently in BETA. While d-portal is publicly available, it is not considered finished. You may experience bugs and missing features, but that is why we need your feedback and support.**


Features
===================

- Explore IATI data for both countries and publishers.
- Updates everyday GMT +0 with new data from the IATI Registry.
- [DStore](https://github.com/devinit/D-Portal/tree/master/dstore) is an
 optimized nodejs + PostgreSQL + SQLite database for use in real time queries.
- [Q](https://github.com/devinit/D-Portal/blob/master/documents/dstore_q.md) allows queries via simple but complex filters.
- [SAVi](https://github.com/devinit/D-Portal/blob/master/documents/savi.md) xml simplifies IATI xml to aid legibility for casual users.
- [Localization](https://github.com/devinit/D-Portal/blob/master/documents/translations.md) ready means adding translations of different languages a breeze.
- [Themeing](https://github.com/devinit/D-Portal/blob/master/documents/customisation.md) options for customised versions of d-portal.
- [Chart.js](https://github.com/devinit/D-Portal/blob/master/documents/customisation.md#chartjs) for fully customisable graphs.
- [Generator](https://github.com/devinit/D-Portal/blob/master/documents/ctrack_generator.md) allows easy embedding of IATI content in blog posts and websites.
- [Dash](https://github.com/devinit/D-Portal/blob/master/documents/dash.md) explores the *gaps*, highlights quality of data being published and displayed on d-portal.org
- Easily create [news posts](https://github.com/devinit/D-Portal/blob/master/documents/dstore_blog.md) using Markdown.
- [Install](https://github.com/devinit/D-Portal/blob/master/documents/ctrack_localtest.md) your own d-portal.
- Open source with [The MIT License](http://opensource.org/licenses/MIT).


Directory Structure
===================

[/dstore](https://github.com/devinit/D-Portal/tree/master/dstore) contains server side javascript for xml manipulation and 
parsing of iati data.  See the readme in that directory for more 
information. This is needed to run the Q queries on your own host.

[/ctrack](https://github.com/devinit/D-Portal/tree/master/ctrack) contains client side javascript and css for displaying 
information direct from the datastore in browser. See the README in 
that directory for more information. This is needed to build and 
deploy a customized d-portal browser tool.

[/dportal](https://github.com/devinit/D-Portal/tree/master/dportal) contains javascript that builds the static information and 
example site you will find deployed at http://d-portal.org/ 

[/bin](https://github.com/devinit/D-Portal/tree/master/bin) contains helper scripts.

[/documents](https://github.com/devinit/D-Portal/tree/master/documents) contains some documentation.


Updates
===================

d-portal.org is currently being developed and designed so things
are constantly changing. Thank you for your patience and understanding.

If you have a suggestion or feedback, or would just like to partake in discussions on d-portal, join in by creating a new issue [here](https://github.com/devinit/D-Portal/issues).

Subscribe to our mailing list for announcements on current development by [joining the Google Group](https://groups.google.com/forum/?hl=en-GB#!forum/d-portal-list).

If you are interested in finding out more or part-funding d-portal, please contact support@iatistandard.org


Database Logs
===================

We are tracking the nightly imports of IATI data being 
published to d-portal.org [here](https://github.com/xriss/D-Portal-Logs).


