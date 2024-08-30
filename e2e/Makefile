SHELL := /bin/bash

# This Makefile has several helpful shortcuts to make working with e2e tests easier!

.PHONY: list-e2e-tests
list-e2e-tests: # List all e2e tests
	NODE_ENV=staging npx playwright test -c ./setup/staging.config.ts tests/*/*.spec.ts --list

.PHONY: run-staging-e2e-tests
run-staging-e2e-tests: set-staging-credentials # Run all tests against the staging environment
	NODE_ENV=staging npx playwright test -c ./setup/staging.config.ts tests/*/*.spec.ts

.PHONY: run-local-all-tests
run-local-all-tests: # Run all tests against the local environment
	NODE_ENV=local npx playwright test -c ./setup/local.config.ts tests/*/*.spec.ts

.PHONY: run-local-smoke-tests
run-local-smoke-tests:
	npm run local_smoke_tests

.PHONY: run-local-e2e-tests
run-local-e2e-tests:
	npm run local_e2e_tests

.PHONY: set-staging-credentials
set-staging-credentials: # Set up the czid credentials for the staging environment
	@CZID_CREDENTIALS=$$(AWS_PROFILE=idseq-dev aws secretsmanager get-secret-value --secret-id czid-login | jq -r ".SecretString"); \
	USERNAME=$$(echo "$$CZID_CREDENTIALS" | jq -r ".username"); \
	PASSWORD=$$(echo "$$CZID_CREDENTIALS" | jq -r ".password"); \
	if [ -n "$$CZID_CREDENTIALS" ]; then \
		echo CZID_USERNAME="\"$$USERNAME\"" > .env.staging; \
		echo CZID_PASSWORD="\"$$PASSWORD\"" >> .env.staging; \
	else \
		false; \
	fi

# Run `make -C ../ local-start-webapp`, wait ~2 mins for the web app to start up, then run `make run-local-e2e-tests` in a new terminal
.PHONY: run-upload-tests-locally
run-upload-tests-locally: # Run the upload test suite locally, seeding sample data into the local environment
	NODE_ENV=local npx playwright test --headed --workers 2 -c ./setup/local.config.ts tests/upload/upload-smoke.spec.ts

.PHONY: set-local-credentials
# Run `make set-local-credentials username="your_username" password="your_password"` to set the czid credentials for your local environment
set-local-credentials: # Creates a .env.local file with the provided username and password
	@echo CZID_USERNAME="\"$(username)\"" > .env.local
	@echo CZID_PASSWORD="\"$(password)\"" >> .env.local
