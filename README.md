# Plated-Example


Plated is a node app, please make sure that it is installed in the 
plated directory after checkout EG:

	git clone https://github.com/xriss/plated-example.git 
	cd plated-example
	cd plated
	npm install


The following scripts may then be run.


	plated/build

Build the static website.


	plated/watch

Watch the plated/source directory and rebuild when files are changes.


	plated/serve

Start a simple static server locally, visit 
http://0.0.0.0:8000/plated-example/ in your browser to view your 
site.


The website is generated in docs from files found in plated/source. The 
docs folder is used for easy publishing using github pages. Select 
master branch /docs folder as the source of your github pages under 
project configuration. Now you can build and git commit changes to 
publish to github pages.


If you want to publish this project using a different repository name 
be sure to adjust PLATED_ROOT=/plated-example in the plated/settings file from 
/plated-example to the new github name. If publishing to your main 
github page eg xriss.github.io then this should be set to / only.

Here is a step by step guide to use this project as a starter for a github hosted website.

1. Visit https://github.com/new to **Create repository**.

2. Click **Import code** at the bottom, paste 
https://github.com/xriss/plated-example into the url on the next page and **Begin import**.

![import](https://cloud.githubusercontent.com/assets/1515961/21817101/8a256684-d75a-11e6-8898-d08ca1ed740f.png)

3. Edit the plated/settings **file** in your new project and change 
/plated-example to /your-project-name or if you are creating a 
yourname.github.io user or organisation site then change it to /

![settings](https://cloud.githubusercontent.com/assets/1515961/21817287/57385988-d75b-11e6-8a61-ac33fd259e78.png)

	This is the root directory that your site is published to on github.

4. Goto the settings page for your new project and change the git hub
pages source to use the master branch /docs folder.

5. You can now use your new project as described at the start of this 
readme to create your own website on github pages. Be sure to run 
npm-install inside the plated directory first.


Alternatively an easy way to pull all of the files from this project 
into an existing project is

	git pull git@github.com:xriss/plated-example --allow-unrelated-histories

But beware of merge conflicts, where both projects contain the same 
files. An even easier action is just to download this project as a zip 
and paste the plated directory into your existing project.


Visit https://github.com/xriss/plated for plated documentation.
