#!/bin/sh
if test -z "$ENVIRONMENT"; then
    # If ENVIRONMENT not set, assume local development
    export ENVIRONMENT=dev
fi
echo ENVIRONMENT is set to \"$ENVIRONMENT\"

if [ "$OFFLINE" = "1" ]
then
    echo Offline mode detected
    exec bundle exec "$@"
else
    # Use Chamber to inject secrets via environment variables.
    echo Chamber will reading entries from AWS SSM /idseq-$ENVIRONMENT-web/
    exec chamber exec idseq-$ENVIRONMENT-web -- bundle exec "$@"
fi
