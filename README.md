![d-portal logo](https://raw.githubusercontent.com/devinit/D-Portal/master/ctrack/art/dp_git_logo.460.png)
 
d-portal.org is a country-based information platform that tracks
resource flows. It is aimed at providing line ministries,
parliamentarians and civil society with information that can assist
with the planning and monitoring of development activities.

The live version lives at http://d-portal.org/

One of its aims is to build a re-usable piece of code that can be 
easily hosted by anyone, anywhere and that will tell an interesting 
story using IATI data.


Features
===================

- Explore IATI data for both countries and publishers.
- Updates everyday GMT +0 with new data from the IATI Datastore.
- [DStore](https://github.com/devinit/D-Portal/tree/master/dstore) is an
 optimized nodejs + SQLite database for use in real time queries.
- [Q](https://github.com/devinit/D-Portal/blob/master/documents/dstore_q.md) allows queries via simple but complex filters.
- [SAVi](https://github.com/devinit/D-Portal/blob/master/documents/savi.md) xml simplifies IATI xml to aid legibility for casual users.
- [Localization](https://github.com/devinit/D-Portal/blob/master/documents/translations.md) ready means adding translations of different languages a breeze.
- [Themeing](https://github.com/devinit/D-Portal/blob/master/documents/customisation.md) options for customised versions of d-portal.
- [Chart.js](https://github.com/devinit/D-Portal/blob/master/documents/customisation.md#chartjs) for fully customisable graphs.
- [Generator](https://github.com/devinit/D-Portal/blob/master/documents/ctrack_generator.md) allows easy embedding of IATI content in blog posts and websites.
- [Dash](https://github.com/devinit/D-Portal/blob/master/documents/dash.md) explores the *gaps*, highlights quality of data being published and displayed on d-portal.org
- Easily create [news posts](https://github.com/devinit/D-Portal/blob/master/documents/dstore_blog.md) using Markdown.
- Open source with [The MIT License](http://opensource.org/licenses/MIT).


Directory Structure
===================

[/ctrack](https://github.com/devinit/D-Portal/tree/master/ctrack) contains client side javascript and css for displaying 
information direct from the datastore in browser. See the readme in 
that directory for more information. This is needed to build and 
deploy a customized d-portal browser tool.

[/dstore](https://github.com/devinit/D-Portal/tree/master/dstore) contains server side javascript for xml manipulation and 
parsing of iati data.  See the readme in that directory for more 
information. This is needed to run the Q queries on your own host.

[/dportal](https://github.com/devinit/D-Portal/tree/master/dportal) contains javascript that builds the static information and 
example site you will find deployed at http://d-portal.org/ 

[/bin](https://github.com/devinit/D-Portal/tree/master/bin) contains helper scripts.

[/documents](https://github.com/devinit/D-Portal/tree/master/documents) contains documentation


Updates
===================

d-portal.org is currently being developed and designed so things
are constantly changing.

If you would like to keep up to date with discussions on d-portal, 
join the [mailing list](https://groups.google.com/forum/#!forum/d-portal-list).

We also post daily logs of the nightly import of new IATI data being 
published to d-portal.org [here](https://groups.google.com/forum/#!forum/d-portal-logs).

