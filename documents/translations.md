Translations d-portal
==========================================

We have a system in place for simple localization for d-portal.

We refer to this system as **tongue** and it can be accessed on the website via a dropdown menu.

Currently, all the translations are provided by Google Translate so will need an actual translator to make sure they are accurate. This is more a proof-of-concept.

Translations are found in the text directory under ctrack.


###Tongue

Each language is a text file with translations attached to a chunk on the website.

This chunk method makes it easy to segregate a specific language in one single file.


###Debug

We have a debugging system in place for easier referencing when translating.

Edit the url to **tongue=non** to be in debug mode; eg. http://d-portal.org/ctrack.html?country=BD&tongue=non#view=main

You should now be able to see the chunk names where the translation will be applied to.
