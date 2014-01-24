Country tracker, Client side Javascript and CSS view of the 
iati-datastore.

Installing
==========

Install node and run the script install_node_modules to install some modules 
that bake.js requires.


Installing Node
===============

sudo apt-get install nodejs-legacy

Will work on debian systems, however the version may be old and any 
problems you encounter with node are probably solved by update to a 
recent version which is best done by an install from source. I 
recomend v0.10.24 which is current and tested with this code.


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



