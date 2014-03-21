This is the website presented at d-portal.org and is a static 
website built using the same chunk based template system as the ctrack 
project so we can make use of some of the same translations.

The serv directory contains the final static website we will be 
serving publicly.

The text directory contains global input html chunks and translated 
copy-text to keep it all in one place for easy adjustments. These 
provide the default global namespace.

The html directory contains .html files that will be expanded into 
the serv directory using their parent files (we scan up directories) 
and globally defined chunks in the text directory.

dirname.html or dirname/index.html are considered the same parent 
file, which means index.html is a special name (as it always has 
been on the web).

When serving we create translated versions of the files in serv/eng 
serv/fra etc directories.

