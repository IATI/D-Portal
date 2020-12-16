cd `dirname $0`

#sudo apt install -y curl
#sudo apt install -y parallel
#sudo npm install -g forever

sudo rm /portald
sudo ln -s `readlink -f ..` /portald
mkdir -p /portald/logs

../dportal/install_deps

sudo cp dportal-initd /etc/init.d/dportal

sudo update-rc.d dportal defaults
sudo update-rc.d dportal enable

sudo /etc/init.d/dportal start

