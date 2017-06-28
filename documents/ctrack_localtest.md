
# How to Install and Setup a test server

First you need to install git and node this is a different problem 
depending on which operating system you are using and only needs to 
be done once so please check and follow the steps bellow carefully.

Github also has a help page for setting up git so you can have a 
little read of that first to give you an idea of what you are about 
to install.

https://help.github.com/articles/set-up-git

## Table of contents
  - [Install on Ubuntu](#1-installing-git-and-node-on-ubuntu)
  - [Install on Windows](#2-prepare-the-required-node-modules)
  - [Run a local server](#3-run-the-localhost-server)
  - [Refresh the server](#4-refresh-the-localhost-server)
  - [Ongoing usage](#5-in-the-future)
  - [Testing local data](#6-testing-local-data)
  - [Import local data to view on d-portal](#7-import-local-data-view-on-d-portal)


## 1. Installing git and node on Ubuntu

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


## 1. Installing git and node on Windows

Download and install git and node for windows from the following 
locations, just go with the default settings when the installers asks 
you a complicated looking question and you will be fine.

http://git-scm.com/download/win

http://nodejs.org/download/

Now run "git bash" this can be found in your startmenu under git on 
windows 7 and below or searched for on windows 8 and above. When run 
it should open up a command line window, this is the window you need 
to type the commands on this page into.

Finally we need to grab the code with the following command

	git clone https://github.com/devinit/D-Portal

and then move into the D-Portal directory

	cd D-Portal

The other steps below begin with a CD command as a reminder of where 
you are expected to run them from. If you are already in the right 
directory then the CD may be skipped and should not be run twice.


## 2. Prepare the required node modules.

This only needs to be run once, it will download and install the 
node modules that ctrack depends upon.

	cd D-Portal
	./install_deps
	
This will chug away for a little while downloading code.


## 3. Run the localhost server.

This is only going to run ctrack module, the extra opton tells it to 
visit d-portal to fetch the data so you do not need to install or 
update the dstore data just to test ctrack.

	cd D-Portal
	./serv -q http://d-portal.org/

If all goes well then ctrack should be available, from your machine 
in your browser at the following url

http://localhost:1408/


## 4. Refresh the localhost server.

Press Control + C to stop this server and then just run the command 
again to start it up again. Since this also builds you should make 
changes to the source then stop the server (ctrl c) and run it again 
in order to see your updates. Pressing up arrow is an easy way to 
get the last typed in command without having to type it in again.


## 5. In the future

After rebooting your machine you will not need to perform all the 
above steps just the following:

  - Open a command line  (_see [Step 1](#1-installing-git-and-node-on-ubuntu) for help on how to do this on your operating system_)
  - ```cd``` into the ctrack directory (_see [Step 1](#1-installing-git-and-node-on-ubuntu) for more help_)
  - Now you can repeat Steps 3 and 4 to run the server again.


## 6. Testing local data

We can also import xml activities into a local database to view and 
test using the following commands.

	cd D-Portal/dstore
	./dstore init

Creates or resets the local database, this must be run once before 
importing data and should be run before importing new data if you want 
to make sure that only the new data is included.

	
**There are a [few scripts in here](https://github.com/devinit/D-Portal/tree/master/bin) that can be run to download and import 
data to the local database.**

	cd D-Portal/bin
	./dstore_import_bd_ug_hn
	
Downloads and imports data for these respective countries from IATI Datastore, one country at a time.  
_This is the recommended option for filling up a test database._

	cd D-Portal/bin
	./dstore_import_full
	
Downloads and imports all the data from the IATI Datastore, one country at a time.  
_This option will take a relatively long time to process and will use up a lot of disc space._

	cd D-Portal/dstore
	./dstore import activity_data.xml

Import the file "activity_data.xml" into the local database. You may do 
this many times and all the data will be merged.

	cd D-Portal
	./serv

This runs the server using the local database, so it will only show 
data that has been imported. it may be accessed, stopped and restarted as 
described in [Step 3](#3-run-the-localhost-server) and [Step 4](#4-refresh-the-localhost-server).



## 7. Import local data, view on d-portal

Once you import some data, you can then view this on your local version of d-portal. This will **not** upload your data to the live d-portal website.

	cd D-Portal/bin
	./dstore_reset
	
This resets the database and empties the ```cache``` folder.

	cd D-Portal/bin
	./dstore_import_cache
	
This imports **all** XML files in the ```cache``` folder to the database.

	http://localhost:1408/ctrack.html#view=dash
	
Go to **Dash** to view the imported XML.  
    - Click on the ```publisher name``` to view your newly imported data in d-portal  
    - Click on the ```publisher id``` to view more stats about your newly imported data

