cd `dirname $0`

echo " installing dportal dependencies "

./install-node.sh
./install-postgres.sh
./install-nginx.sh
./install-dportal.sh

