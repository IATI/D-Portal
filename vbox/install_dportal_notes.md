


Install bits and bobs.

	sudo apt install -y gcc-5 g++-5 build-essential byobu nodejs npm postgresql-9.6 postgresql-contrib-9.6 parallel git curl


Move postgres database to another directory, some machines are setup 
with a small / and bigger drives mounted elsewhere so this lets us put 
it on the right drive. It also gives us a chance to make sure it is set 
to UTF8 by default, the following delets the default and then recreates 
it within /home/postgres with UTF8 text encoding

	sudo service postgresql stop
	sudo pg_dropcluster 9.6 main
	sudo pg_createcluster -d /home/postgres --locale en_US.UTF-8 9.6 main
	sudo service postgresql start
	

Add a user that we will use to run all the node apps.

	sudo adduser ctrack

Give it a good password as you will be able to connect to the server 
using this password and hit return on everything else. In order to 
switch to this user do "sudo -u ctrack -i"


Setup this user with a database login and create a dstore database, 
copy paste the following into a root shell with a random password.

	PGMAIN=/etc/postgresql/9.6/main
	PGUSER=ctrack
	PGPASS=ctrack

	echo '#HAXTBH' >> $PGMAIN/postgresql.conf
	echo 'max_wal_senders=1' >> $PGMAIN/postgresql.conf
	echo 'wal_level=hot_standby' >> $PGMAIN/postgresql.conf
	echo 'synchronous_commit = off' >> $PGMAIN/postgresql.conf
	echo 'work_mem = 128MB' >> $PGMAIN/postgresql.conf

	echo '#HAXTBH' >> $PGMAIN/pg_hba.conf
	echo 'local replication all peer' >> $PGMAIN/pg_hba.conf
	sudo service postgresql restart

	sudo -u postgres bash -c "psql -c \"CREATE USER $PGUSER WITH SUPERUSER PASSWORD '$PGPASS';\""

	sudo -u postgres createdb dstore
	sudo -u postgres bash -c "psql -c \"CREATE EXTENSION IF NOT EXISTS citext;\" dstore "
	sudo -u postgres psql -c "ALTER DATABASE dstore OWNER TO $PGUSER;"
	sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dstore TO $PGUSER;"
	sudo -u postgres psql -l

Enable git access, past a key into github..

	su ctrack
	
	ssh-keygen 
	cat ~/.ssh/id_rsa.pub
	
copypaste that public key into github and git should now be able to 
read write the d-portal repo so install it like so.

	su ctrack
	cd ~
	git clone git@github.com:devinit/D-Portal.git
	cd D-Portal
	./install_deps

Let ctrack know how to connect to postgres and not to use sqlite, add 
the following to the end of your /home/ctrack/.profile

	source ~/D-Portal/bin/server-pg/env.sh





