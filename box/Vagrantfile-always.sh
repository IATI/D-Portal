
echo " making local mount for node_modules to combat npm problems "

mkdir -p /home/vagrant/vagrant_node_modules
chown vagrant:vagrant /home/vagrant/vagrant_node_modules

mkdir -p /host/node_modules
chown vagrant:vagrant /host/node_modules

sudo mount --bind /home/vagrant/vagrant_node_modules /host/node_modules


