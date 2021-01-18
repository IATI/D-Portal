cd `dirname $0`

echo " installing node from deb.nodesource.com "


# just in case of old versions
sudo apt-get remove -y libnode*
sudo apt-get remove -y nodejs
sudo apt-get remove -y npm
sudo apt-get remove -y yarn
sudo apt autoremove -y


curl -sL https://deb.nodesource.com/setup_current.x | sudo -E bash -

sudo apt-get install -y nodejs

#npm is auto installed from nodesource
#sudo apt-get install -y npm



#npm seem broken in vagrant so maybe use yarn instead?

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt-get install -y yarn
