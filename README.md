# ID Portal ![travis ci build status](https://travis-ci.org/chanzuckerberg/idseq-web.svg?branch=master)

This app stores and analyzes the output from the infectious disease pipeline.

## Setup

Everything you need to get started should be in `./bin/setup`.  If there's anything missing, please edit and submit a pull request.

To get a local instance running, just do:

1. `bin/setup`
1. `open http://localhost:3000 in your browser`

To enable the automatic pipeline processing, you will need to

1.  Put the following environmental variables into `config/initializers/app_environment_variables.rb`

```
ENV['AWS_ACCESS_KEY_ID'] = <YOUR_AWS_KEY>
ENV['AWS_SECRET_ACCESS_KEY'] = <YOUR_AWS_SECRET>
ENV['AWS_DEFAULT_REGION'] = 'us-west-2'
ENV['IDSEQ_S3_SCRIPT_LOC'] = 's3://czbiohub-infectious-disease/bin/pipeline.py'

```
1. Run `docker-compose up`


## Running Tests

`docker-compose run web rails test`

## Deployment

1. decide what docker tag you want to deploy (see https://hub.docker.com/r/chanzuckerberg/idseq-web/tags/)
1. `bundle exec bin/deploy ENV TAG`


## Submit a sample

1. Follow the pipeline processing setup as mentioned above
1. `pip install git+https://github.com/chanzuckerberg/idseq-cli.git`
1. `idseq -t idseq1234 -p 'Awesome Project' -s test2 -u localhost:3000 -e fake@example.com --r1 <fastq1.gz> --r2 <fastq2.gz>`


## Upload data (deprecated)

There is an example of the JSON for uploading pipeline results in `test/output.json`. To test locally you can run:

>curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d @output.json http://localhost:3000/pipeline_outputs.json
