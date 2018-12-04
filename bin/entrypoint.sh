#!/bin/sh

if test -z "$ENVIRONMENT"; then
    # If ENVIRONMENT not set, use "dev" env
    exec chamber exec idseq-dev-web -- bundle exec "$@"
else
    # Use Chamber to inject secrets via environment variables.
    exec chamber exec idseq-$ENVIRONMENT-web -- bundle exec "$@"
fi
