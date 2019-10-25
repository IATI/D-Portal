
cd `dirname $0`

if [ "$1" = "debug" ] ; then
	bash downloads.curl
else
	cat downloads.curl | sort -R | parallel -j 0 --bar
fi

cat downloads/*.log >downloads.curl.log

