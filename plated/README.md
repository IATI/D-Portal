# Plated-Example

A boilerplate for a static website hosted on github; ie. http://username.github.io/new-repo

## Table of contents
  - [Dependencies](#dependencies)
  - [A step by step guide](#a-step-by-step-guide)
  - [Running & testing your new website locally](#run-this-local)
  - [Adding to an existing repository](#adding-plated-example-to-an-existing-repository)
  - [Scripts](#scripts)
  - [Links & license](#would-you-like-to-know-more)

# Dependencies

Plated assumes you are comfortable with the command line and git and requires the following installed

- [git](https://git-scm.com/downloads) ```sudo apt-get install git```
- [node](https://nodejs.org) ```sudo apt-get install nodejs-legacy npm```

_Commands above are for debian/ubuntu. For other operating systems, please the use the links provided._

# A step by step guide

1. Visit https://github.com/new/import
   - Paste `https://github.com/xriss/plated-example` into the URL
   - Create a name for your new repository and click **Begin import**

2. Edit /plated/settings in your new repository
    - Replace ```/plated-example``` with ```/your-new-repo-name```
    - If you're creating a yourname.github.io user or organisation site, change it to ```/```
    
3. Go to ![settings](https://cloud.githubusercontent.com/assets/1515961/25015092/dcf5b398-2069-11e7-9740-424784716088.png)
    - Change the GitHub Pages source to use **master branch /docs folder**
    - Save

4. Woohoo! You should now have a brand new website.
    - Check your URL - http://username.github.io/new-repo
    - Your website should now work and contain the default plated-example landing page.

5. Read [the next bit](#run-this-local) on how to push new changes to update your live website.
    
---


# Run this local

You can test and build your website locally in your preferred browser by running the following scripts in the terminal.   
    
```shell

plated/upgrade	
# Run this first to install the node required dependencies.

plated/build
# Run this at least once to build your website.

plated/start
# Leave this running in a separate tab, it should watch and rebuild your new changes.
# Make sure nothing else is using port http://0.0.0.0:8000.

```

### View your website in a browser at http://0.0.0.0:8000/new-repo
Make sure your browser is not caching content, otherwise your changes will not show up.


```shell

plated/publish
# Run this to push changes to Github.
# Doing this will re-build and update your current website with the new changes.
# Depending on Github, it may take a while for new changes to show up but it shouldn't be too long.

```

---


The website is generated into /docs from files found in /plated/source.

**If you want to publish this project using a different repository name**  
Replace ```PLATED_ROOT=/plated-example``` with ```PLATED_ROOT=/new-repo``` in plated/settings.

**If publishing to your main github page**; eg. _new-repo.github.io_  
Replace ```PLATED_ROOT=/plated-example``` with ```PLATED_ROOT=/``` in plated/settings.

**If you want to build into a different local directory**  
Adjust ```PLATED_OUTPUT=../docs``` to point somewhere else in plated/settings.


```diff
- DANGER THE OUTPUT DIRECTORY WILL BE DELETED ON BUILD
```

# Adding Plated-Example to an existing repository

Run the following to pull the latest version of Plated-Example into an existing repository

`git pull git@github.com:xriss/plated-example --allow-unrelated-histories`

  - Beware of merge conflicts, where both projects contain the same file.
  - You will probably conflict with this README.md file but this can just be replaced with your own version.
  - Make sure you have ```node_modules``` listed in your .gitignore file.
    

# Scripts

Plated is a node app.

Please make sure node is available and node dependencies have been installed using ```plated/upgrade```.

The following scripts may be run from this project's **root directory**.

---

	plated/upgrade

&#8627; This will install or upgrade plated to the latest version using npm.

**Run this once for the scripts to work.** Run this later to upgrade to the latest version.

---

	plated/build

&#8627; **Run this once to build the website.**

---

	plated/start

&#8627; This runs ```plated/watch``` and ```plated/serv``` simultaneously.

**The main script. It should be left running in the command line.**  
Run this to build and view your website locally whilst you edit it. Make sure your browser is not caching the content.

---

	plated/watch

&#8627; Watches the ```plated/source``` directory and continuously build the static 
website when files are changed.

_(Optional if ```plated/start``` is running)_

---

	plated/serv

&#8627; Start a simple static server locally, visit 
http://0.0.0.0:8000/your-new-repo-name/ in your browser to view your 
site.

_(Optional if ```plated/start``` is running)_

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


# Would you like to know more?

Visit https://github.com/xriss/plated for plated documentation. See [LICENSE](https://github.com/xriss/plated-example/blob/master/plated/LICENSE.md) for details.
