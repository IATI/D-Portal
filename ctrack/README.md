Country tracker, Client side Javascript and CSS view of the 
iati-datastore.

Installing
==========

Install node and run the script install_node_modules to install some modules 
that bake.js requires.


Installing Node
===============

../bin/getapts

Will work on ubuntu systems, by adding a newer PPA for node and then 
installing from there. You may prefer to install from source rather 
than add random PPAs. See the nodejs site for how to do this.

Alternatively node can be donwnloaded from http://nodejs.org/download/


Installing Node Modules
=======================

./install_node_modules

Will then install modules needed for bake.js (to create the client 
side app) and serv.js (to run a simple server to serv the app), 
these are build dependencies not runtime dependencies.


Building
========

Use node bake.js to create minified/mangled js files and to create 
auto generated files used in the client. 

Running
=======

You can use "node serv.js" to start a node based webserver and 
publish this *entire* directory as static files at 
http://localhost:1337/ for you to test. This clientside js depends 
upon access to the iati-datastore at 
http://dev.ctrack.iatistandard.org:5000/ if you are running a 
datastore somewhere else then that will need to be adjusted in the 
index.html file.



