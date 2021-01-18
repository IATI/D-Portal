cd `dirname $0`

source ./env.sh

# incase we are trying to replace
sudo /etc/init.d/dportal-instance stop


sudo cp initd-dportal-instance /etc/init.d/dportal-instance

sudo update-rc.d dportal-instance defaults
sudo update-rc.d dportal-instance enable

#this will have been accidental stopped
sudo /etc/init.d/dportal start

sudo /etc/init.d/dportal-instance start


