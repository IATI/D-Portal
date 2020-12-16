
export DSTORE_PG="?"
export DSTORE_PGRO="postgres://readonly:secret@localhost:5432/dstore"
export PGUSER="vagrant"
export PGPASS="vagrant"
export PGDATABASE="dstore"
export PGHOST="/var/run/postgresql"


# use env.local.sh to override the above with local values


if test -f "/portald/box/env.local.sh"; then

source "/portald/box/env.local.sh"

fi
