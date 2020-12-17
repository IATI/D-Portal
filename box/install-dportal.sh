cd `dirname $0`


sudo apt install -y curl
sudo apt install -y parallel
sudo npm install -g forever

sudo rm /dportal
sudo ln -s `readlink -f ..` /dportal
mkdir -p /dportal/logs

source ./env.sh



bash /dportal/box/dstore-create



/dportal/npm-install


sudo cp dportal-initd /etc/init.d/dportal

sudo update-rc.d dportal defaults
sudo update-rc.d dportal enable

sudo /etc/init.d/dportal start


