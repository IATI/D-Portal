
sudo apt-get update

echo " install build system "

sudo apt-get install -y build-essential

echo " setting default DSTORE_PG , must be done before byobu breaks .profile "
echo "export DSTORE_PG=\"?\" " >> /home/vagrant/.profile
echo "export DSTORE_PGRO=\"postgres://readonly:secret@localhost:5432/dstore\" " >> /home/vagrant/.profile
echo "export DSTORE_DEBUG=1 " >> /home/vagrant/.profile

echo " install and enable byobu "

sudo apt-get install -y byobu
sudo -u vagrant -H bash -c "byobu-enable"



echo " apt install node npm"

sudo apt-get install -y npm
sudo apt-get install -y nodejs


echo " install postgres "

sudo apt-get install -y postgresql
sudo apt-get install -y postgresql-contrib

# this hack will probably get us the version number...
PGVER=`ls /etc/postgresql/`

sudo pg_dropcluster --stop $PGVER main
sudo pg_createcluster --locale en_US.UTF-8 --start $PGVER main


echo " attempting to setup postgres "

PGMAIN=/etc/postgresql/$PGVER/main
PGUSER=vagrant
PGPASS=vagrant

echo '#HAXTBH' >> $PGMAIN/postgresql.conf
echo 'max_wal_senders=1' >> $PGMAIN/postgresql.conf
echo 'wal_level=hot_standby' >> $PGMAIN/postgresql.conf
echo 'synchronous_commit = off' >> $PGMAIN/postgresql.conf
echo 'work_mem = 128MB' >> $PGMAIN/postgresql.conf

echo "hostssl dstore readonly 0.0.0.0/0 md5" >> $PGMAIN/pg_hba.conf

echo '#HAXTBH' >> $PGMAIN/pg_hba.conf
echo 'local replication all peer' >> $PGMAIN/pg_hba.conf
/etc/init.d/postgresql restart

sudo -u postgres bash -c "psql -c \"CREATE USER $PGUSER WITH SUPERUSER PASSWORD '$PGPASS';\""
sudo -u postgres bash -c "psql -c \"CREATE USER readonly WITH LOGIN PASSWORD 'secret' NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION VALID UNTIL 'infinity';\""

sudo -u postgres createdb dstore

sudo -u postgres bash -c "psql -c \"CREATE EXTENSION IF NOT EXISTS citext;\" dstore "
sudo -u postgres psql -c "ALTER DATABASE dstore OWNER TO $PGUSER;"
sudo -u postgres psql --dbname=dstore -c "GRANT ALL PRIVILEGES ON DATABASE dstore TO $PGUSER;"

sudo -u postgres psql --dbname=dstore -c "REVOKE CREATE ON SCHEMA public FROM public;"

sudo -u postgres psql --dbname=dstore -c "GRANT CONNECT ON DATABASE dstore TO readonly;"
sudo -u postgres psql --dbname=dstore -c "GRANT USAGE ON SCHEMA public TO readonly;"
sudo -u postgres psql --dbname=dstore -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;"

sudo -u postgres psql --dbname=dstore -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;"

sudo -u postgres psql -l

#DSTORE_PGRO=postgres://readonly:secret@localhost:5432/dstore

#
# more things to do on the live server...
#
# sudo -u postgres bash -c "psql -c \"CREATE USER root WITH SUPERUSER PASSWORD 'password';\""
# sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dstore TO root;"
# sudo -u postgres psql -l


# apparently this one is also vitally important in sysctl
# vm.overcommit_memory = 2

# create a readonly user



