
sudo apt-get update

echo " install build system "

sudo apt-get install -y build-essential


echo " adding env should be done before byobu breaks .profile "

echo "source /host/box/env.sh " >> /home/vagrant/.profile


echo " install and enable byobu "

sudo apt-get install -y byobu
sudo -u vagrant -H bash -c "byobu-enable"


echo " we will use /portald on live server "
sudo rm /portald
sudo ln -s /host /portald


echo " installing all "
bash /host/box/all.sh


echo
echo " test this server at http://10.42.52.99/ "
echo

