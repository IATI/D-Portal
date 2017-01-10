# Plated-Example


Plated is a node app, please make sure that it is installed after checkout EG:

	git clone https://github.com/xriss/plated-example.git 
	cd plated-example
	npm install


The following scripts may then be run.


	./build

Build the static website.


	./watch

Watch the source directory and rebuild when files are changes.


	./serve

Start a simple static server locally, visit 
http://0.0.0.0:8000/plated-example/ in your browser to view your 
site.


The website is generated in docs from files found in source. The docs 
folder is used for easy publishing using github pages. Select master 
branch /docs folder as the source of your github pages under project 
configuration. Now you can build and git commit changes to publish to 
github pages.


If you want to publish this project using a different repository name 
be sure to adjust PLATED_ROOT=/plated-example in the settings file from 
/plated-example to the new github name. If publishing to your main 
github page eg xriss.github.io then this should be set to / only.


Visit https://github.com/xriss/plated for plated documentation.
