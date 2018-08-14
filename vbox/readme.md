
We use vagrant to keep a postgres install contained to a virtual machine, 
to set this all up first cd into this directory and run

	vagrant up

this will provision the box so make sure that it worked so pay 
attention to any errors and that you have vagrant installed as many 
things can go wrong here...

if that worked then the following must be run before you can do 
anything else.

first install node dependencies, this will write into node_packages of 
your git repo and you will no longer be able to run the non postgres 
sqlite version locally without running npm_install again on your local 
machine.

	./bin npm_install


then initialise the postgres database

	./bin dstore_reset




from now on we can use the ./bin script to run scripts from the bin 
directory inside this vbox using postgres.

	./bin

will list all the scripts you may run like this eg ./bin dstore will 
run dstore and let you import some data.


for a basic setup to test with try the following

import some data

	./bin dstore_import_bd_ug_hn
	

build ctrack

	./bin build


serv ctrack and dstore (postgres version)

	./bin serv


