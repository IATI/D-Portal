echo
echo "Updating stats"
echo

cd dportal/production/D-Portal-Logs/
git pull
cd ../../..

cp dportal/production/cron.log dportal/production/D-Portal-Logs/cron.log
dstore/dstore stats ../dportal/production/D-Portal-Logs/stats.json
dflat/dflat stats ../dportal/production/D-Portal-Logs/stats.json
dflat/dflat stats ../dportal/production/D-Portal-Logs --publishers


cd dportal/production/D-Portal-Logs/
git add .
git commit -m.
git pull
git push



