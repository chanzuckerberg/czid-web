# playwright
## installation
1. `cd e2e`
2. `npm i` to install the Playwright from the package.json.
3. `cp .env.staging.template .env.staging`, then update your credentials in the new file. Make sure this file is in .gitignore
4. Retrieve local login credentials from AWS secrets manager: https://us-west-2.console.aws.amazon.com/secretsmanager/secret?name=czid-login
Then set environment variables in .zshrc:
```
export CZID_USERNAME='<value in secrets>'
export CZID_PASSWORD='<value in secrets>'
```

## running tests
To run Playwright tests you will need to specify the config file. We have created NPM scripts to make like a bit easier:

`npm run e2e:<environment>` - runs playwright tests against staging environment in headed browser
`npm run e2e:<environment>:headless` - same as above but headless
`npm run e2e:<environment>:debug` - runs Playwright in debug mode

Where `environment` is `staging`, `local`, `sandbox`

## running report
`npm run e2e:report` opens test results report in the browser

## download screenshots from github
https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts

# some useful commands
## run migration
aws-oidc exec -- docker-compose run web rails db:migrate
## add user locally
aws-oidc exec -- docker-compose run web rails c
User.create(name: "CZ ID Test Account", role: 0, email:"czid-e2e@chanzuckerberg.com")
## seed data
aws-oidc exec -- docker-compose run web rails db:seed
## start service
aws-oidc exec -- docker-compose  up

