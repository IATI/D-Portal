
export DSTORE_PG="?"
export DSTORE_PGRO="postgres://readonly:secret@localhost:5432/dstore"
export PGUSER="vagrant"
export PGPASS="vagrant"
export PGDATABASE="dstore"
export PGHOST="/var/run/postgresql"
export PAGER=
#export GITCRON="PUSH" #read and write git cronjobs


# use env.local.sh to override the above with local values


if test -f "/dportal/box/env.local.sh"; then

source "/dportal/box/env.local.sh"

fi
