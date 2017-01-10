# Plated-Example


This is a node app so please make sure that node is installed after checkout EG:

	git https://github.com/xriss/plated-example.git 
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


If you want to publish this project using a different name be sure to 
adjust PLATED_ROOT=plated-example in the settings file from 
plated-example to the new name.


Visit https://github.com/xriss/plated for plated documentation.
