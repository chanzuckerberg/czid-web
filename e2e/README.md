# CZ ID E2E testing

Our E2E tests are written in playright

## playwright setup

### Installing packages

1. `cd e2e`
2. `npm i` to install the Playwright from the package.json.

### Configuration

#### Staging

1. `cp .env.staging.template .env.staging`
2. Set credentials must for a **non-admin** account in `USERNAME` and `PASSWORD` in `.env.staging`.

#### Local

1. Retrieve [credentials from AWS secrets manager](https://us-west-2.console.aws.amazon.com/secretsmanager/secret?name=czid-login).
2. Set environment variables in .bashrc/.zshrc:

```bash
export CZID_USERNAME='<value in secrets>'
export CZID_PASSWORD='<value in secrets>'
```

## Running tests

To run Playwright tests you will need to specify the config file. We have created NPM scripts to make like a bit easier:

`npm run pw:<environment>` - runs playwright tests against staging environment in headed browser
`npm run pw:<environment>:headless` - same as above but headless
`npm run pw:<environment>:debug` - runs Playwright in debug mode

Where `environment` is `staging`, `local`, `sandbox`

## Show test report

`npm run pw:report` opens test results report in the browser

## download screenshots from github
https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts

# some useful commands
## stop services
aws-oidc exec -- docker-compose  down
## run migration
aws-oidc exec -- docker-compose run web rails db:drop db:migrate db:seed
## start service
aws-oidc exec -- docker-compose  up
