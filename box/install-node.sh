cd `dirname $0`

echo " installing node from deb.nodesource.com "

# just in case we have old cruft confusing things
rm -rf ../node_modules
rm ../package-lock.json



sudo apt-get install -y python

curl -sL https://deb.nodesource.com/setup_current.x | sudo -E bash -


bash -c " sudo apt-get install -y nodejs "

bash -c " sudo npm install -g npm "

