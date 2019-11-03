
# How to Install and Setup a test server

First you need to install git and node this is a different problem 
depending on which operating system you are using and only needs to 
be done once so please check and follow the steps bellow carefully.

Github also has a help page for setting up git so you can have a 
little read of that first to give you an idea of what you are about 
to install.

https://help.github.com/articles/set-up-git

## Table of contents
  - [Install on Ubuntu](#1-install-on-ubuntu)
  - [Install on Windows](#1-install-on-windows)
  - [Download node dependencies](#2-download-node-dependencies)
  - [Import IATI data from IATI Datastore](#3-import-iati-data-from-the-datastore)
  - [Run the localhost server](#4-run-the-localhost-server)
  - [Import any xml data to view on local d-portal](#5-import-any-xml-data-to-view-on-local-d-portal)
  - [Extra](#6-extra)


## 1. Install on Ubuntu

Open a command line and type the following one line at a time to 
create a directory in your home directory containing the project.

	cd ~
	sudo apt-get install git
	git clone https://github.com/devinit/D-Portal
	cd D-Portal
	bin/getapts

In the future you may return to this directory with just the 
following command.

	cd ~/D-Portal


The other steps below begin with a CD command as a reminder of where 
you are expected to run them from. If you are already in the right 
directory then the CD may be skipped and should not be run twice.


## 1. Install on Windows

Download and install git - click 'Next' to all the options to start installation.

http://git-scm.com/download/win (You must **Enable symbolic links**)

Download and install node - click 'Next' to all the options to start installation.

https://nodejs.org/dist/latest-v8.x/node-v8.16.2-x64.msi (64-bit)

Using **Windows PowerShell (Admin)**, type the following and type Y when asked:

	npm install --global windows-build-tools
	
This installs the Windows compiler which is needed for node-expat.

	Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
	
This installs Chocolatey so we can install other needed things for Windows.

	choco install wget
	
This installs wget so we can fetch xml files from the internet.

Now open "git bash" and **Run as administrator**.

This can be found in your startmenu under git on windows 7 and below or
searched for on windows 8 and above. When run it should open up a command
line window, this is the window you need  to type the commands on this page into.

Finally we need to grab the code with the following command

	git clone -c core.symlinks=true https://github.com/devinit/D-Portal

and then move into the D-Portal directory

	cd D-Portal

The other steps below begin with a CD command as a reminder of where 
you are expected to run them from. If you are already in the right 
directory then the CD may be skipped and should not be run twice.


## 2. Download node dependencies

This only needs to be run once, it will download and install the 
node modules that ctrack depends upon.

	npm install
	
This will chug away for a little while downloading code.


## 3. Import IATI data from IATI Datastore

Import some data into a local database to view and 
test using the following commands.

	dstore/dstore init

Creates or resets the local database, this must be run once before 
importing data and should be run before importing new data if you want 
to make sure that only the new data is included.

The following are scripts you can run to import different datasets into the local database.

For now, let's type the following line:

	bin/dstore_import_bd_ug_hn
	
Downloads and imports data for these respective countries from IATI Datastore, one country at a time.  
_This is the recommended option for filling up a test database._


*Optional*

	bin/dstore_import_full
	
Downloads and imports all the data from the IATI Datastore, one country at a time.  
_This option will take a relatively long time to process and will use up a lot of disc space._


## 4. Run the localhost server

	./serv

This runs the server using the local database, so it will only show 
data that has been imported.

If all goes well then ctrack should be available, from your machine 
in your browser at the following url

http://localhost:1408/


## 5. Import any xml data to view on local d-portal

This will **not** upload your data to the live d-portal website.

Copy and paste any xml files into the ```D-Portal/dstore/cache``` folder.

	dstore/dstore import cache/name-of-file.xml

Import "name-of-file.xml" from the ```D-Portal/dstore/cache``` folder into the local database. You may do 
this many times and all the data will be merged.


## 6. Extra

The following are optional scripts that can be run on the database.

	bin/dstore_reset
	
This resets the database and empties the ```cache``` folder.

	bin/dstore_import_cache
	
This imports **all** XML files in the ```cache``` folder to the database.

	http://localhost:1408/ctrack.html#view=dash
	
Go to **Dash** to view the imported XML.  
    - Click on the ```publisher name``` to view your newly imported data in d-portal  
    - Click on the ```publisher id``` to view more stats about your newly imported data

