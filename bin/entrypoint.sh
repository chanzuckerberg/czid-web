#!/bin/sh

if test -z "$ENVIRONMENT"; then
    # If ENVIRONMENT not set (e.g. local development), don't call chamber
    exec bundle exec "$@"
else
    # Use Chamber to inject secrets via environment variables.
    exec chamber exec idseq-$ENVIRONMENT-web -- bundle exec "$@"
fi
