


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

	source /home/ctrack/D-Portal/bin/server/env.sh


Setup nginx proxy to forward requests from port 80 to 1408 where we run the node app.

	sudo apt install -y nginx-light

Edit /etc/nginx/sites-enabled/default to contain the following proxy configuration.

	upstream nodejsapp {
			server 127.0.0.1:1408;
	}

	server {
			server_name d-portal.org *.d-portal.org;
			location / {
					proxy_set_header X-Real-IP $remote_addr;
					proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
					proxy_set_header Host $http_host;
					proxy_set_header X-NginX-Proxy true;
					proxy_read_timeout 200s;
					proxy_pass http://nodejsapp;
					proxy_redirect off;
			}
	}


Then we should be good to go with accessing the node app via the 
default port. To setup https we use letsencrypt and certbot, install it 
like so.

	sudo apt install -y python-certbot-nginx
	
	sudo certbot --nginx

Which will ask you some questions and then hopefully update the nginx 
configuration to support https.


Get the node app to auto start at server reboots and keep an eye on itself using forever.

	sudo bin/server/daemon_install

Test it starts up OK, this will probably go horribly wrong and need fixing.
	
	/etc/init.d/dportal start
	
Install D-Portal-Logs under production.

	cd dportal/production
	git clone git@github.com:xriss/D-Portal-Logs.git
	
Edit the crontab for ctrack user with 

	crontab -e

and change to look like this.
	
	SHELL=/bin/bash
	PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
	USER=ctrack

	0 0 * * * /home/ctrack/D-Portal/bin/fast_cron
	
