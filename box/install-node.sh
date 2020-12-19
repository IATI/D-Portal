cd `dirname $0`

echo " installing node from deb.nodesource.com "

# just in case we have old cruft confusing things
rm -rf ../node_modules
rm ../package-lock.json


sudo apt-get install -y nodejs

#npm seem broken in vagrant so lets use yarn

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt-get install -y yarn

