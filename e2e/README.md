# playwright
## installation
1. `cd e2e`
2. `npm i` to install the Playwright from the package.json.
3. `cp .env.staging.template .env.staging`, then update your credentials in the new file. Make sure this file is in .gitignore

## running tests
To run Playwright tests you will need to specify the config file. We have created NPM scripts to make like a bit easier:

`npm run e2e:<environment>` - runs playwright tests against staging environment in headed browser
`npm run e2e:<environment>:headless` - same as above but headless
`npm run e2e:<environment>:debug` - runs Playwright in debug mode

Where `environment` is `staging`, `local`, `sandbox`

## running report
`npm run e2e:report` opens test results report in the browser
