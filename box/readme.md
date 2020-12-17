
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


finally serv ctrack and dstore (postgres version) with the following 
command

	./bin serv

The IP of the vagrant box is 10.42.52.94 as configured in the 
Vagrantfile so use

	http://10.42.52.94:1408/

to access this server.



Running the ./bin script is a tad slow as it connects to vargant so 
often it makes more sense to just

	vagrant ssh

and then you can run commands directly on the box, navagate to the root 
of this project with a

	cd /host

after which you may run any script in the bin folder like so

	bin/dstore



remember these files are all shared with the host so anychanges there 
will effect your local files, probably not a good idea to run any git 
commands there as it may break git things or your local machine.
