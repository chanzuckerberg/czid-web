#!/bin/bash

set -euxo pipefail

brew services start elasticsearch
brew services start redis
brew services start mysql

yq -yi '.development.host="127.0.0.1" | .test.host="127.0.0.1"' config/database.yml
sed -i -e 's/redis:6379/localhost:6379/' config/initializers/redis.rb
sed -i -e '/TaxonLineage/ d' lib/tasks/create_elasticsearch_indices.rake

trap cleanup INT EXIT

cleanup() {
    kill -TERM 0
    wait
}

"$(dirname $0)/entrypoint.sh" "rake db:migrate"
"$(dirname $0)/entrypoint.sh" "rake create_elasticsearch_indices"
"$(dirname $0)/entrypoint.sh" "COUNT=2 rake resque:workers" &
"$(dirname $0)/entrypoint.sh" rake result_monitor &
"$(dirname $0)/entrypoint.sh" rake pipeline_monitor &
"$(dirname $0)/entrypoint.sh" rails server
