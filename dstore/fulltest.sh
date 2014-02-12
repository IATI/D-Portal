
node serv.js --cmd init

for f in ../../iati-lua/cache/*.xml
do
#	echo "$f"
	node serv.js --cmd import --xmlfile "$f" || exit 1
done
