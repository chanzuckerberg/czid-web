# ID Portal ![travis ci build status](https://travis-ci.org/chanzuckerberg/idseq-web.svg?branch=master)

This app stores and analyzes the output from the infectious disease pipeline.


## Setup

To get a local `development` instance running on a Mac OS X computer, just do:
```
    bin/setup
```

Then open `http://localhost:3000` in your browser.

Everything you need to get started should be in `./bin/setup`.   If there's anything missing, please edit and submit a pull request.


## Testing

```
    docker-compose run web rails test
```

## Environments

In addition to using your local `development` instance, you may obtain access to some shared cloud environments, as follows.

1. Obtain the appropriate PEM key and save it as `idseq_<env>_key.pem`.
1. `chmod 600 idseq_<env>_key.pem`
1. `ssh-add idseq_<env>_key.pem`

You can now run a non-interactive command on a cloud web container like so  
`bin/clam <env> 'echo $HOSTNAME'`


## Interactive shells

1. `docker-compose exec web bash` for a shell in your local `development` env.
1. `bin/shell dev bash` for a shell in the cloud `dev` env.

Useful commands inside an interactive shell:

1. `rails console` for ruby interpreter.
1. `rails db -p` for mysql client console.  The `-p` is important in cloud environments.

Sometimes you may be prompted to run a migration or configuration command like `bin/rails db:migrate RAILS_ENV=development`. Make sure to run that inside an interactive shell for the appropriate environment.


## DB backup/restore within and across environments

1. Backup your local `development` DB into a local file:  
`docker-compose exec web mysqldump -h db -u root idseq_development > idseq_development.sql`
1. Backup cloud `dev` DB into a local file:  
`bin/clam dev 'mysqldump -h $RDS_ADDRESS -u $DB_USERNAME --password=$DB_PASSWORD idseq_dev | gzip -c' | gzip -dc > idseq_dev.sql`
1. Overwrite your local `development` DB with data from given backup file:  
`docker-compose exec web "cat idseq_dev.sql | mysql -h db -u root --database idseq_development"`


## Deployment

1. decide what docker tag you want to deploy (see https://hub.docker.com/r/chanzuckerberg/idseq-web/tags/)
1. `bundle exec bin/deploy ENV TAG`


## Submit a sample

1. Make sure your AWS CLI is properly configured. i.e. `~/.aws/credentials` and `~/.aws/config` are setup correctly (you may need to follow site-specific instructions for how to do that).
1. `pip install git+https://github.com/chanzuckerberg/idseq-cli.git`
1. `idseq -t idseq1234 -p 'Awesome Project' -s test2 -u localhost:3000 -e fake@example.com --r1 <fastq1.gz> --r2 <fastq2.gz>`


## Upload data (deprecated)

There is an example of the JSON for uploading pipeline results in `test/output.json`. To test locally you can run:

>curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d @output.json http://localhost:3000/pipeline_outputs.json
