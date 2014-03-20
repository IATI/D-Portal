How to modify and test the texts in ctrack
==========================================
 
First you need to perform the setup described in 

https://github.com/IATI/IATI-Country-Tracker/blob/master/documents/ctrack_localtest.md

to prepare a working command line envionment where the following can 
be run.

Again any code below assumes you are located in the ctrack directory.

The files found in ctrack/text contain all the html and english text 
strings used in the ctrack project.

These files all have a chunk based system where multiple named 
chunks are defined in each file. Each chunk is started by a line 
that begins with a # followed by the name of the chunk being 
defined. All lines of text following this represent the content of 
that chunk. EG.

	#nameofchunk
	This is the content of the chunk.

Each chunk can recursively mention other chunks simply by using the 
chunkname encased in {} for instance.

	#myname
	Bob
	#greeting
	Hello {myname}.

This would allow the greeting chunk to expand to "Hello Bob." when used.

In order to handle simple localisation all english language chunks 
are contained in a file called eng.txt French in fra.txt and Spanish 
in spa.txt This allows a change of language just by deciding which 
one of these files to use at runtime.

You may edit the various chunks in these files to contain whatever 
you want and thus completely change all the text displayed within 
the ctrack project.


1. Check out code
=================

This will get the latest version of the files from github. You 
probably want to make sure you are up to date before making any edits.

	git pull


2. Make and test changes
========================

Just edit the files in ctrack/text with a text editor.

Follow the steps described in

https://github.com/IATI/IATI-Country-Tracker/blob/master/documents/ctrack_localtest.md

to run the server and test your changes.

When you are happy with the changes you have made you are now ready 
to try and check them in.


3. Check in changes
===================

	git add .
	git commit .
	git push

It is rather likely that these git commands will go hideously wrong 
and confuse you. Personally I recomend taking a backup of the files 
you are editing and if things do not go ok just emailing them to one 
of the more technical project members. Git is, I'm afraid, a rather 
complicated mess and it is very easy for new users to break things.

Other reading would be githubs how to git, help center 
https://help.github.com/ which may help you or confuse you further.


4. Debug Mode
===================

Change the tongue to "non" to view references for where these
translations are on the web page.

eg. http://d-portal.org/html/uganda/?tongue=non#view=main
