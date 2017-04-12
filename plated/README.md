# Plated-Example

A boilerplate for a static website hosted on github; ie. http://username.github.io/new-repo

## Dependencies

Plated assumes you are comfortable with the command line and requires the following installed

- [git](https://git-scm.com/downloads) ```sudo apt-get install git```
- [node](https://nodejs.org) ```sudo apt-get install nodejs-legacy npm```

_Commands above are for debian/ubuntu. For other operating systems, please the use the links provided._

# How to plated^

Here is a step by step guide to use this project as a starter for a github hosted website.

1. Visit https://github.com/new/import, 
paste `https://github.com/xriss/plated-example` into the URL and 
create a name for your new repository. Click **Begin import**.

    ![plated-eg](https://cloud.githubusercontent.com/assets/1515961/21818265/07abc360-d75f-11e6-8260-bf842eb2f7aa.png)

2. Edit the plated/settings **file** in your new project and change 
/plated-example to /your-project-name or if you are creating a 
yourname.github.io user or organisation site then change it to /

    ![settings](https://cloud.githubusercontent.com/assets/1515961/21817287/57385988-d75b-11e6-8a61-ac33fd259e78.png)
    
3. Goto the settings page for your new project and change the git hub
pages source to use the master branch /docs folder.

4. You can now use your new project as described at the start of this 
readme to create your own website on github pages. Be sure to run the 
plated/upgrade script first to install the node required dependencies.


Alternatively an easy way to pull all of the files from this project 
into an existing project is

`git pull git@github.com:xriss/plated-example --allow-unrelated-histories`

But beware of merge conflicts, where both projects contain the same 
file, you will probably conflict with this README.md file which can 
obviously just be replaced with your own version. Make sure you have 
node_modules listed in your .gitignore file.

	git pull git@github.com:xriss/plated-example

Can also be used to update the ```plated/*``` scripts later on.


# Scripts

Plated is a node app.

Please make sure node is available and node dependencies have been installed using ```plated/upgrade```.

The following scripts may be run from this projects **root directory**.

---

	plated/upgrade

&#8627; This will install or upgrade plated using npm.  
**Run this once for the scripts to work.** Run this later to upgrade to the latest version.

---

	plated/build

&#8627; **Run this once to build the website.**

---

	plated/start

&#8627; This runs ```plated/watch``` and ```plated/serv``` simultaneously.  
**This is the main script. It should be left running in the command line.**

Run this to build and view your website locally whilst you edit it.

---

	plated/watch

&#8627; Watches the ```plated/source``` directory and continuously build the static 
website when files are changed.  
_(optional if ```plated/start``` is running)_

---

	plated/serv

&#8627; Start a simple static server locally, visit 
http://0.0.0.0:8000/plated-example/ in your browser to view your 
site.  
_(optional if ```plated/start``` is running)_

---

	plated/publish

&#8627; Builds your website and then does a git add/commit/pull/push of all files to github.  
**Run this to publish your pages to github. View your changes on your shiny new website!**

You may want to do this manually for more control; _ie. add commit comments, etc._

---

	plated/pull

&#8627; Pull the latest changes direct from the plated-example repository and 
attempts to ignore possible conflicts outside of this plated directory.

_This should pick up small bug fixes in these scripts without 
breaking anything else._

---

	plated/settings

&#8627; This contains settings used by all the other scripts and should not be 
run directly.

---

The website is generated into /docs from files found in /plated/source.

If you want to publish this project using a different repository name, 
be sure to adjust ```PLATED_ROOT=/plated-example``` in the plated/settings file from 
/plated-example to the new github name.

If publishing to your main github page; eg. _xriss.github.io_ then 
this should be set to ```/``` only. This is the root directory that your 
site is published to on github.

If you want to build into a different local directory, alter ```PLATED_OUTPUT=../docs``` 
in the plated/settings file to point somewhere else. 

```diff
- DANGER THE OUTPUT DIRECTORY WILL BE DELETED ON BUILD
```
    

# Links

Visit https://github.com/xriss/plated for plated documentation.
