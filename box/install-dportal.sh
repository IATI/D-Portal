cd `dirname $0`


sudo apt-get install -y pv
sudo apt-get install -y curl
sudo apt-get install -y parallel

sudo npm install -g forever

sudo rm /dportal
sudo ln -s `readlink -f ..` /dportal
mkdir -p /dportal/logs

source ./env.sh

# incase we are trying to replace
if [ -e "/etc/init.d/dportal" ]; then
	sudo /etc/init.d/dportal stop
fi


/dportal/nvm-install
/dportal/npm-install
/dportal/bin/build


/dportal/box/dstore-create


sudo cp initd-dportal /etc/init.d/dportal

sudo update-rc.d dportal defaults
sudo update-rc.d dportal enable

sudo /etc/init.d/dportal start

#this will have been accidental stopped
#sudo /etc/init.d/dportal-instance start


