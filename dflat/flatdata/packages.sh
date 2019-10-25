
cd `dirname $0`

if [ "$1" = "debug" ] ; then
	bash packages.parse
else
	cat packages.parse | sort -R | parallel -j 0 --bar
fi

