sudo apt-get update

echo " install postgres "

sudo apt-get install -y postgresql postgresql-contrib


echo " install and enable byobu "

sudo apt-get install -y byobu
sudo -u vagrant -H bash -c "byobu-enable"


echo " install node npm nvm "

sudo -u vagrant -H bash -c " wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.26.1/install.sh | bash "
sudo -u vagrant -H bash -c " . ~/.nvm/nvm.sh ; nvm install stable ; nvm use stable "

