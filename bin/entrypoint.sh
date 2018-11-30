#!/bin/sh

echo $(printenv)

exec chamber exec idseq-prod-web -- bundle exec "$@"

#if test -z "$ENVIRONMENT"; then
#    # If ENVIRONMENT not set (e.g. local development), don't call chamber
#    echo "NOT CALLING CHAMBER"
#    exec bundle exec "$@"
#else
#    echo "CALLING WITH CHAMBER"
#    # Use Chamber to inject secrets via environment variables.
#    exec chamber exec idseq-$ENVIRONMENT-web -- bundle exec "$@"
#fi
