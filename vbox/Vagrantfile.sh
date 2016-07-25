
sudo apt-get update

echo " install build system "

sudo apt-get install -y gcc-5 g++-5 build-essential


echo " install and enable byobu "

sudo apt-get install -y byobu
sudo -u vagrant -H bash -c "byobu-enable"



echo " hard install node npm nvm"

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.1/install.sh | NVM_DIR=/usr/local/nvm PROFILE=/etc/bash.bashrc bash
. /usr/local/nvm/nvm.sh
nvm install 6
nvm use 6

# create node executable
echo "#!/bin/bash
export NVM_DIR=\"/usr/local/nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
node \$@" > /usr/local/bin/node
chmod +x /usr/local/bin/node

# create npm executable
echo "#!/bin/bash
export NVM_DIR=\"/usr/local/nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
npm \$@" > /usr/local/bin/npm
chmod +x /usr/local/bin/npm


echo " install postgres "

sudo apt-get install -y postgresql-9.5 postgresql-contrib-9.5 

sudo pg_dropcluster --stop 9.5 main
sudo pg_createcluster --locale en_US.UTF-8 --start 9.5 main


echo " attempting to setup postgres "

PGMAIN=/etc/postgresql/9.5/main
PGUSER=vagrant
PGPASS=vagrant

echo '#HAXTBH' >> $PGMAIN/postgresql.conf
echo 'max_wal_senders=1' >> $PGMAIN/postgresql.conf
echo 'wal_level=hot_standby' >> $PGMAIN/postgresql.conf

echo '#HAXTBH' >> $PGMAIN/pg_hba.conf
echo 'local replication all peer' >> $PGMAIN/pg_hba.conf
/etc/init.d/postgresql restart

sudo -u postgres bash -c "psql -c \"CREATE USER $PGUSER WITH SUPERUSER PASSWORD '$PGPASS';\""

sudo -u postgres createdb dstore
sudo -u postgres bash -c "psql -c \"CREATE EXTENSION IF NOT EXISTS citext;\" dstore "
sudo -u postgres psql -l

