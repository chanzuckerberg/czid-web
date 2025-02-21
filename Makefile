SHELL := /bin/bash

# This Makefile has several helpful shortcuts to make local development easier!

OFFLINE?= 0
### Shortcuts for running docker compose with the necessary environment vars and flags
### Run containers with short-lived credentials
export docker_compose:=$(if $(filter 1,$(OFFLINE)), \
	OFFLINE=$(OFFLINE) docker compose --env-file web.env, \
	export $$(cat .env.localdev); aws-oidc exec -- docker compose --env-file web.env)

### Run any commands (mostly docker-compose exec) that don't need aws creds, because running containers already have the creds they need.
export docker_compose_simple:=$(if $(filter 1,$(OFFLINE)), \
	docker compose, \
	export $$(cat .env.localdev); docker compose)
### We need this one to run the webapp with long-lived credentials
export docker_compose_long:=$(if $(filter 1,$(OFFLINE)), \
	OFFLINE=$(OFFLINE) docker compose --env-file web.env, \
	export $$(cat .env.localdev); aws-oidc exec --session-duration=12h exec -- docker compose --env-file web.env)

### Default AWS profile for working with local dev
export AWS_DEV_PROFILE=idseq-dev

### Tell docker compose to use buildkit when building docker images.
export DOCKER_BUILDKIT:=1
export COMPOSE_DOCKER_CLI_BUILD:=1
export COMPOSE_PROFILES ?= local-lambdas

rails_env ?= development

### HELPFUL #################################################
.PHONY: help
help: ## display help for this makefile
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Make the version of the Makefile a dependency for the `.env.localdev` target.
# This way each time the Makefile gets updated, the .env.localdev file does as well.
Makefile:
	@echo

# Check if server-domain.env exists before adding it as a dependency
ifeq ($(wildcard server-domain.env),server-domain.env)
  ENV_LOCALDEV_DEPS += server-domain.env
endif

.env.localdev: Makefile $(ENV_LOCALDEV_DEPS) # Write useful env vars to ".env.localdev" so we can use them later.
	@if [ "$(OFFLINE)" = "1" ]; then \
		echo "Skipping .env.localdev generation in offline mode"; \
	else \
		export AWS_ACCOUNT_ID=$$(aws sts get-caller-identity --profile $(AWS_DEV_PROFILE) | jq -r .Account); \
		if [ -n "$${AWS_ACCOUNT_ID}" ]; then \
			echo AWS_ACCOUNT_ID=$${AWS_ACCOUNT_ID} > .env.localdev; \
			echo AWS_REGION=us-west-2 >> .env.localdev; \
			echo AWS_PROFILE=$(AWS_DEV_PROFILE) >> .env.localdev; \
			echo DEPLOYMENT_ENVIRONMENT=dev >> .env.localdev; \
		else \
			false; \
		fi; \
		if [ -f server-domain.env ]; then \
			cat server-domain.env >> .env.localdev; \
		fi \
	fi

.PHONY: local-init
local-init: ## Set up a local dev environment
	if [ $(OFFLINE) == "1" ]; then \
		$(MAKE) local-build; \
	else \
		$(MAKE) .env.localdev; \
		$(MAKE) local-pull; \
		. .env.localdev; \
	fi 
	exit

	
	if [ "$$(uname -s)" == "Darwin" ]; then \
		OFFLINE=$(OFFLINE) ./bin/setup-macos; \
	else \
		OFFLINE=$(OFFLINE) ./bin/setup-ubuntu; \
	fi

.PHONY: local-migrate
local-migrate: .env.localdev ## Run database schema and data migrations
	$(docker_compose) run --rm web bin/rails db:migrate:with_data RAILS_ENV=development

.PHONY: local-migrate-down
local-migrate-down: .env.localdev ## revert a migration; Usage: make local-migrate-down version=319487398
	$(docker_compose) run --rm web sh -c 'bin/rails db:environment:set RAILS_ENV=development && rails db:migrate:down VERSION=$(version)'

.PHONY: local-migrate-without-data
local-migrate-without-data: .env.localdev ## Run database schema and data migrations; Usage make local-migrate-without-data [rails_env=env]
	$(docker_compose) run --rm -e RAILS_ENV=$(rails_env) web bin/rails db:migrate

.PHONY: local-seed-migrate
local-seed-migrate: .env.localdev ## Run seed migrations
	$(docker_compose) run --rm web bin/rails seed:migrate RAILS_ENV=development

.PHONY: local-seed-migrate-rollback
local-seed-migrate-rollback: .env.localdev ## Rollback latest seed migration
	$(docker_compose) run --rm web bin/rails seed:rollback RAILS_ENV=development

.PHONY: local-seed-migrate-version
local-seed-migrate-version: .env.localdev ## Run seed migrations; Usage: make local-seed-migrate-version version=20200517175758_seed_migration_file_name.rb
	$(docker_compose) run --rm web bin/rails seed:migrate MIGRATION=$(version) RAILS_ENV=development

.PHONY: local-seed-rollback
local-seed-rollback: .env.localdev ## Rollback the most recent seed migration
	$(docker_compose) run --rm web bin/rails seed:rollback RAILS_ENV=development

.PHONY: local-generate-migration
local-generate-migration: .env.localdev ## Generate a migration; Usage: make local-generate-migration migration_name=backpopulate_data
	$(docker_compose) run web rails g migration $(migration_name)

.PHONY: local-generate-data-migration
local-generate-data-migration: .env.localdev ## Generate a data migration; Usage: make local-generate-data-migration migration_name=backpopulate_data
	$(docker_compose) run web rails g data_migration $(migration_name)

.PHONY: local-generate-seed-migration
local-generate-seed-migration: .env.localdev ## Generate a seed migration; Usage: make local-generate-seed-migration migration_name=backpopulate_data
	$(docker_compose) run web rails g seed_migration $(migration_name)

.PHONY: local-db-drop
local-db-drop: .env.localdev ## Wipe out the local db for a fresh start
	$(docker_compose) run --rm -e RAILS_ENV=development web bin/rails db:drop

.PHONY: local-db-reset
local-db-reset: .env.localdev ## Reset (drop, create, load schema, run seeds) the local db
	$(docker_compose) run --rm -e RAILS_ENV=development web bin/rails db:reset

.PHONY: local-db-setup
local-db-setup: .env.localdev ## Set up (create, load schema, run seeds) the local db
	$(docker_compose) run --rm -e RAILS_ENV=development web bin/rails db:setup

.PHONY: local-db-create-schema
local-db-create-schema: .env.localdev ## Create the local db and load the current schema (without seed data); Usage make local-db-create-schema [rails_env=env]
	$(docker_compose) run --rm -e RAILS_ENV=$(rails_env) web bin/rails db:create db:schema:load

.PHONY: local-import-taxon-lineage-slice
local-import-taxon-lineage-slice: .env.localdev ## Import a slice of taxon lineage data from S3 into the local db
	$(docker_compose) run --rm -e RAILS_ENV=development web bin/rails taxon_lineage_slice:import_data_from_s3

.PHONY: local-create-taxon-lineages-slice-elasticsearch-index
local-create-taxon-lineages-slice-elasticsearch-index: .env.localdev ## Create the taxon lineages slice elasticsearch index
	$(docker_compose) run --rm -e RAILS_ENV=development web bin/rails taxon_lineage_slice:create_taxon_lineage_slice_es_index

.PHONY: local-import-staging-data
local-import-staging-data: .env.localdev ## Import staging data into the local mysql db. This takes about an hour!!
	@if [ -e .database_imported ]; then echo "The database is already populated - please run 'rm .database_imported' and try again if you really want to replace it."; exit 1; fi
	if [ ! -e idseq_development.sql.gz ]; then \
	    $(docker_compose_simple) exec web mysqldump -h db -u root idseq_development | gzip -c > idseq_development.sql.gz; \
	fi
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --no-data '
			'--ignore-table=idseq_staging._new_names '\
	    '--ignore-table=idseq_staging._new_taxid_lineages '\
	    '--ignore-table=idseq_staging._new_taxon_lineages '\
	    '--ignore-table=idseq_staging.taxon_lineages_new '\
	    '--ignore-table=idseq_staging.taxon_lineages_old '\
			'-h $$RDS_ADDRESS -u $$DB_USERNAME --password=$$DB_PASSWORD idseq_staging '\
			'| gzip -c' > idseq_staging_tables.sql.gz
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --lock-tables=false --no-create-info '\
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

.PHONY: local-import-staging-taxon-count-data
local-import-staging-taxon-count-data: .env.localdev ## Import staging data into the local mysql db. This takes about an hour!!
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --lock-tables=false --no-create-info '\
	    '-h $$RDS_ADDRESS -u $$DB_USERNAME --password=$$DB_PASSWORD idseq_staging taxon_counts'\
	    '| gzip -c' > idseq_staging_taxon_count_data.sql.gz
	$(docker_compose) run --rm web "gzip -dc idseq_staging_taxon_count_data.sql.gz | mysql -vvv -h db -u root --database idseq_development"

.PHONY: local-import-staging-data-all
local-import-staging-data-all: .env.localdev ## Import staging data into the local mysql db. This takes about an hour!!
	@if [ -e .database_imported ]; then echo "The database is already populated - please run 'rm .database_imported' and try again if you really want to replace it."; exit 1; fi
	if [ ! -e idseq_development.sql.gz ]; then \
	    $(docker_compose_simple) exec web mysqldump -h db -u root idseq_development | gzip -c > idseq_development.sql.gz; \
	fi
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --no-data -h $$RDS_ADDRESS -u $$DB_USERNAME --password=$$DB_PASSWORD idseq_staging | gzip -c' > idseq_staging_tables.sql.gz
	export $$(cat .env.localdev); bin/clam staging 'mysqldump --lock-tables=false --no-create-info '\
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

.PHONY: local-start-db
local-start-db: .env.localdev ## Start only the db container
	$(docker_compose_simple) up -d db

.PHONY: local-stop
local-stop: .env.localdev ## Stop localdev containers
	$(docker_compose_simple) --profile '*' stop

.PHONY: local-down
local-down: .env.localdev ## Tear down localdev containers (will lose data in containers that are not stored in docker volume)
	$(docker_compose) down

.PHONY: local-console
local-console: .env.localdev ## Get a bash shell on local host
	$(docker_compose) exec web bash

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

.PHONY: local-update-gql-schema
local-update-gql-schema: ## updates gql schema
	npx get-graphql-schema http://localhost:3000/graphqlfed > graphql_schema/czid_graphql_federation_schema.graphql -h "x-graphql-yoga-csrf=csrf"
	$(docker_compose) run web bin/rails czid_graphql_federation:update_schema

.PHONY: rspec
rspec: .env.localdev ## Run rspec
	$(docker_compose_simple) exec web rspec

.PHONY: local-ecr-login
local-ecr-login: .env.localdev ## Log in to ECR
	if PROFILE=$$(aws configure list-profiles | grep $(AWS_DEV_PROFILE)); then \
		aws ecr get-login-password --region us-west-2 --profile $(AWS_DEV_PROFILE) | docker login --username AWS --password-stdin $$(aws sts get-caller-identity --profile $(AWS_DEV_PROFILE) | jq -r .Account).dkr.ecr.us-west-2.amazonaws.com; \
	fi

.PHONY: local-build
local-build: local-ecr-login ## Build containers locally
	$(docker_compose) build

.PHONY: local-rebuild
local-rebuild: local-build ## Rebuild and start containers locally
	$(docker_compose_long) up -d

.PHONY: local-logs
local-logs: ## Tail the logs of the dev env containers. ex: make local-logs CONTAINER=web
	$(docker_compose_simple) logs -f $(CONTAINER)

.PHONY: frontend-lint
frontend-lint:
	npx prettier app/assets/src --ext .js,.jsx,.ts,.tsx --write
	npx eslint app/assets/src e2e --ext .js,.jsx,.ts,.tsx --max-warnings 36 --fix
	npx eslint app/assets/src -c .eslintrc-a11y.json --ext .js,.jsx,.ts,.tsx --max-warnings 129
	exit $(npx depcheck --ignores="core-js" --json | jq '.dependencies | length')
	npx tsc -p ./app/assets/tsconfig.json --noemit
	bin/ts-peek.sh

.PHONY: local-start-webapp
local-start-webapp: local-start ## Start docker containers & webpack server. Web app will be running on http://localhost:3001
	npm start

# sh -c is necessary because zsh requires square brackets to be escaped
.PHONY: local-setup-admin-user
local-setup-admin-user: .env.localdev ## Set up a user for local development; Usage: make local-setup-admin-user user_email="user_email_address" user_name="user name" user_password='password'
	$(docker_compose) run --rm web sh -c 'bin/rails local_user_creation:admin["$(user_email)","$(user_name)"]'
	make -C ./e2e set-local-credentials username='$(user_email)' password='$(user_password)'
