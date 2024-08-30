# CZ ID E2E testing

Playwright & Saucelabs setup

Playwright is an end-to-end test framework that enables us to write e2e tests. Saucelabs is a test executer and reporter. Saucelabs will execute the Playwright tests and generate insightful reports such as Job History, Trends, Coverage, Recordings of tests, and more...

## Running tests
### Github Actions
To run all tests that have been automated, you can use the [e2e-automation GitHub Action](https://github.com/chanzuckerberg/czid-web-private/actions/workflows/e2e-automation.yml). The results of this Github Action will send a message in the #proj-id Slack channel with a link of the Github Action run where you can click into and review the results of the tests.

1. Click "Run workflow"
2. If you're working on the tests on a branch, specify the branch you're using. Otherwise leave as `main`
3. Select the environment to execute the tests against. Default is `staging`

### CLI

#### Configuration

Playwright will log in as a user in the CZ ID web app and perform operations to validate functionality (via tests). To execute the tests locally, you will need the appropriate packages installed and login credentials. You can configure the user account that Playwright uses to log in with the instructions below:

#### Installing packages

1. `cd e2e`
2. `npm i` to install the Playwright from the package.json.

#### Credentials
##### Executing tests against the staging environment

1. Set staging credentials

    ```bash
    make set-staging-credentials
    ```

To execute all tests in the WGS download test suite (must be in the `e2e` directory -- `cd e2e`):
* `NODE_ENV=staging npx playwright test --headed -c ./setup/staging.config.ts tests/*/*.spec.ts -g "Download: WGS"`

Run an individual test by doing a grep for the test name like `Smoke Test: Bulk Download viral-consensus-genome Intermediate Output Files`
* `NODE_ENV=staging npx playwright test --headed -c ./setup/staging.config.ts tests/*/*.spec.ts -g "Smoke Test: Bulk Download viral-consensus-genome Intermediate Output Files"`


## Useful commands

Listing all tests (must be in the `e2e` directory):
* `NODE_ENV=staging npx playwright test --headed -c ./setup/staging.config.ts tests/*/*.spec.ts --list`

Listing all tests in a particular test suite (e.g. `"Download: WGS"` test suite)
* `NODE_ENV=staging npx playwright test --headed -c ./setup/staging.config.ts tests/*/*.spec.ts -g "Download: WGS" --list`

Install saucelabs:
* `npm install -g saucectl`

Execute tests in suacelabs:
* `saucectl run -c ./setup/saucelabs.staging.yml`
