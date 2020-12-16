cd `dirname $0`

echo " installing portald dependencies "

./node.sh
./postgres.sh
./nginx.sh
./dportal.sh

