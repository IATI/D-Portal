


Can mostly follow the basic machine setup as seen in Vagrant.sh

	sudo apt install -y gcc-5 g++-5 build-essential byobu nodejs npm postgresql-9.6 postgresql-contrib-9.6




May need to move postgres database to another directory, some machines 
are setup with a small / and bigger drives mounted elsewhere. Also make 
sure it is UTF8

	sudo service postgresql stop
	rm -rf /home/postgres
	mkdir /home/postgres
	sudo chown -R postgres:postgres /home/postgres
	sudo -u postgres /usr/lib/postgresql/9.6/bin/initdb -D /home/postgres --locale en_US.UTF-8 


Then edit /etc/postgresql/9.6/main/postgresql.conf and make sure 
data_directory is set to new location before starting it again

	sudo service postgresql start
