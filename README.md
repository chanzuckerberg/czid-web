# ID Portal ![travis ci build status](https://travis-ci.org/chanzuckerberg/idseq-web.svg?branch=master)

This app stores and analyzes the output from the infectious disease pipeline.

## Setup

Everything you need to get started should be in `./bin/setup`.  If there's anything missing, please edit and submit a pull request.

To get a local instance running, just do:

1. `bin/setup`
1. `open http://localhost:3000 in your browser`

## Running Tests

`docker-compose run web rails test`

## Deployment

1. decide what docker tag you want to deploy (see https://hub.docker.com/r/chanzuckerberg/idseq-web/tags/)
1. `bundle exec bin/deploy ENV TAG`

## Upload data

There is an example of the JSON for uploading pipeline results in `test/output.json`. To test locally you can run:

>curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d @output.json http://localhost:3000/pipeline_outputs.json
