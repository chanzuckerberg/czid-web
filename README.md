# ID Portal ![travis ci build status](https://travis-ci.org/chanzuckerberg/idseq-web.svg?branch=master)

This app stores and analyzes the output from the infectious disease pipeline.


## Setup

Everything you need to get started should be in `./bin/setup`.  If there's anything missing, please edit and submit a pull request.

To get a local instance running, just do:

1. `bin/setup`
1. `open http://localhost:3000 in your browser`
1. Run `docker-compose up -d`


## Running Tests

`docker-compose run web rails test`


## Deployment

1. decide what docker tag you want to deploy (see https://hub.docker.com/r/chanzuckerberg/idseq-web/tags/)
1. `bundle exec bin/deploy ENV TAG`


## Submit a sample

1. Make sure your AWS CLI is properly configured. i.e. ~/.aws/credentials are setup correctly
1. `pip install git+https://github.com/chanzuckerberg/idseq-cli.git`
1. `idseq -t idseq1234 -p 'Awesome Project' -s test2 -u localhost:3000 -e fake@example.com --r1 <fastq1.gz> --r2 <fastq2.gz>`


## Upload data (deprecated)

There is an example of the JSON for uploading pipeline results in `test/output.json`. To test locally you can run:

>curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d @output.json http://localhost:3000/pipeline_outputs.json


## Local DB backup and restore

1. Save backup of your local DB  
    `docker-compose run web mysqldump -h db -u root idseq_development > idseq_development.sql`

1. Restore local DB from backup  
    `docker-compose run web "cat idseq_development.sql | mysql -h db -u root --database idseq_development"`


## Access to the cloud environment

1. Obtain the appropriate PEM key and save it as `idseq_<env>_key.pem`.
1. `chmod 600 idseq_<env>_key.pem`
1. `ssh-add idseq_<env>_key.pem`

You can now run a command on the cloud web container like so  
`bin/clam <env> 'echo $HOSTNAME'`


## Replace local data with dump of cloud DEV DB

1. Pull SQL dump from cloud DEV environment  
    `bin/clam dev 'mysqldump -h $RDS_ADDRESS -u $DB_USERNAME --password=$DB_PASSWORD idseq_dev | gzip -c' | gzip -dc > idseq_dev.sql`
1. Backup your local DB  
    `docker-compose run web mysqldump -h db -u root idseq_development > idseq_development.sql`
1. Replace your local data with cloud data  
    `docker-compose run web "cat idseq_dev.sql | mysql -h db -u root --database idseq_development"`


## DB migration issues

Sometimes `bin/setup` or a request will fail, asking you to run  
    `bin/rails db:environment:set RAILS_ENV=development`

Make sure to run that inside the docker container, like so:  
    `docker-compose run web "bin/rails db:environment:set RAILS_ENV=development"`
