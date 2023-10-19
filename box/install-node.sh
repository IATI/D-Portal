cd `dirname $0`

echo " installing node "


# just in case of old versions
sudo apt-get remove -y libnode*
sudo apt-get remove -y nodejs
sudo apt-get remove -y npm
sudo apt-get remove -y yarn
sudo apt autoremove -y



sudo apt-get install -y nodejs npm

