cd `dirname $0`

source ./env.sh

# incase we are trying to replace
sudo /etc/init.d/dportal-instance stop


sudo cp dportal-instance-initd /etc/init.d/dportal-instance

sudo update-rc.d dportal-instance defaults
sudo update-rc.d dportal-instance enable

sudo /etc/init.d/dportal-instance start


