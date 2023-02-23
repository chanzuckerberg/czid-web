SHELL := /bin/bash

# This Makefile has several helpful shortcuts to make local development easier!

### Shortcuts for running docker compose with the necessary environment vars and flags
### Run containers with short-lived credentials
export docker_compose:=export $$(cat .env.localdev); aws-oidc exec -- docker compose --env-file .env.localdev
### Run any commands (mostly docker-compose exec) that don't need aws creds, because running containers already have the creds they need.
export docker_compose_simple:=docker compose --env-file .env.localdev
### We need this one to run the webapp with long-lived credentials
export docker_compose_long:=export $$(cat .env.localdev); aws-oidc exec --session-duration=12h exec -- docker compose --env-file .env.localdev

### Default AWS profile for working with local dev
export AWS_DEV_PROFILE=idseq-dev

### Tell docker compose to use buildkit when building docker images.
export DOCKER_BUILDKIT:=1
export COMPOSE_DOCKER_CLI_BUILD:=1

### HELPFUL #################################################
help: ## display help for this makefile
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: help
.env.localdev: # Write useful env vars to ".env.localdev" so we can use them later.
	export AWS_ACCOUNT_ID=$$(aws sts get-caller-identity --profile $(AWS_DEV_PROFILE) | jq -r .Account); \
	if [ -n "$${AWS_ACCOUNT_ID}" ]; then \
		echo AWS_ACCOUNT_ID=$${AWS_ACCOUNT_ID} > .env.localdev; \
		echo AWS_REGION=us-west-2 >> .env.localdev; \
		echo AWS_PROFILE=$(AWS_DEV_PROFILE) >> .env.localdev; \
		echo DEPLOYMENT_ENVIRONMENT=dev >> .env.localdev; \
	else \
		false; \
	fi

.PHONY: local-init
local-init: .env.localdev ## Set up a local dev environment
	@export $$(cat .env.localdev); \
	if [ "$$(uname -s)" == "Darwin" ]; then \
	    ./bin/setup-macos; \
	else \
	    ./bin/setup-linux; \
	fi

.PHONY: local-import-staging-data
local-import-staging-data: .env.localdev ## Import staging data into the local mysql db. This takes about an hour!!
	@if [ -e .database_imported ]; then echo "The database is already populated - please run 'rm .database.imported' and try again if you really want to replace it."; exit 1; fi
	if [ ! -e idseq_development.sql.gz ]; then \
	    $(docker_compose_simple) exec web mysqldump -h db -u root idseq_development | gzip -c > idseq_development.sql.gz; \
	fi
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --no-data -h $$RDS_ADDRESS -u $$DB_USERNAME --password=$$DB_PASSWORD idseq_staging | gzip -c' > idseq_staging_tables.sql.gz
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --no-create-info '\
	    '--ignore-table=idseq_staging._new_names '\
	    '--ignore-table=idseq_staging._new_taxid_lineages '\
	    '--ignore-table=idseq_staging._new_taxon_lineages '\
	    '--ignore-table=idseq_staging.contigs '\
	    '--ignore-table=idseq_staging.taxon_counts '\
	    '--ignore-table=idseq_staging.taxon_lineages_new '\
	    '--ignore-table=idseq_staging.taxon_lineages_old '\
	    '-h $$RDS_ADDRESS -u $$DB_USERNAME --password=$$DB_PASSWORD idseq_staging '\
	    '| gzip -c' > idseq_staging_data.sql.gz
	$(docker_compose) run --rm web "gzip -dc idseq_staging_tables.sql.gz | mysql -vvv -h db -u root --database idseq_development"
	$(docker_compose) run --rm web "gzip -dc idseq_staging_data.sql.gz | mysql -vvv -h db -u root --database idseq_development"
	$(docker_compose) run --rm web bin/rails db:environment:set RAILS_ENV=development
	$(docker_compose) run --rm web bin/rails create_elasticsearch_indices
	touch .database_imported

.PHONY: local-start
local-start: .env.localdev ## Start localdev containers or refresh credentials
	$(docker_compose_long) up -d

.PHONY: local-stop
local-stop: .env.localdev ## Stop localdev containers
	$(docker_compose_simple) stop

.PHONY: local-dbconsole
local-dbconsole: .env.localdev ## Get a shell on the local mysql db
	$(docker_compose) run --rm web mysql -h db -u root

.PHONY: local-railsc
local-railsc: .env.localdev ## Connect to the local rails console
	$(docker_compose_simple) exec web rails c

.PHONY: local-clean
local-clean: local-stop ## Wipe out the local dev environment (including the db!!)
	$(docker_compose_simple) rm -v
	rm .database_imported

.PHONY: local-pull
local-pull: local-ecr-login ## Pull down the latest upstream docker images to this computer
	$(docker_compose) pull --ignore-pull-failures

.PHONY: rspec
rspec: .env.localdev ## Run rspec
	$(docker_compose_simple) exec web rspec

.PHONY: local-ecr-login
local-ecr-login: .env.localdev ## Log in to ECR
	if PROFILE=$$(aws configure list-profiles | grep $(AWS_DEV_PROFILE)); then \
		aws ecr get-login-password --region us-west-2 --profile $(AWS_DEV_PROFILE) | docker login --username AWS --password-stdin $$(aws sts get-caller-identity --profile $(AWS_DEV_PROFILE) | jq -r .Account).dkr.ecr.us-west-2.amazonaws.com; \
	fi

.PHONY: local-rebuild
local-rebuild: local-ecr-login ## Rebuild containers locally
	$(docker_compose) build
	$(docker_compose_long) up -d

.PHONY: local-logs
local-logs: ## Tail the logs of the dev env containers. ex: make local-logs CONTAINER=web
	$(docker_compose_simple) logs -f $(CONTAINER)