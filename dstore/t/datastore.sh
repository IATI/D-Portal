

for (( i=0; i<=2000000; i+=1000 )) ; do

echo ${i}

curl -X GET "https://api.iatistandard.org/datastore/activity/select?q=iati_identifier:*&fl=iati_identifier&sort=iati_identifier%20asc&wt=csv&rows=1000&start=${i}" -H "Cache-Control: no-cache" -H "Ocp-Apim-Subscription-Key: 9a69eb662db147ebad6cbe53ffeaca2c" --output t${i}.csv

done

