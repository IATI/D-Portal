sudo apt-get update

echo " install postgres "

sudo apt-get install -y postgresql postgresql-contrib


echo " install and enable byobu "

sudo apt-get install -y byobu
sudo -u vagrant -H bash -c "byobu-enable"


echo " install node npm nvm "

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.1/install.sh | bash
. ~/.nvm/nvm.sh
nvm install stable
nvm use stable

n=$(which node)
n=${n%/bin/node}
chmod -R 755 $n/bin/*
sudo cp -r $n/{bin,lib,share} /usr/local


echo " attempting to setup postgres "

pgmain=/etc/postgresql/9.1/main

echo '#HAXTBH' >> $pgmain/postgresql.conf
echo 'max_wal_senders=1' >> $pgmain/postgresql.conf
echo 'wal_level=hot_standby' >> $pgmain/postgresql.conf

echo '#HAXTBH' >> $pgmain/pg_hba.conf
echo 'local replication all peer' >> $pgmain/pg_hba.conf
/etc/init.d/postgresql restart

sudo -u postgres bash -c "psql -c \"CREATE USER vagrant WITH SUPERUSER PASSWORD 'vagrant';\""

