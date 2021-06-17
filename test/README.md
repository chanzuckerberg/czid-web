- This folder contains tests for Minitest, the default Rails testing suite. The team decided to switch to RSpec instead around May 2019.
- Don't add new tests here. Instead, find the equivalent file in `spec` (for RSpec) or start a new equivalent file.
- We are keeping these files around for the test coverage, and they are still run in CI. However, relevant tests should be moved over to `spec` opportunistically.

## Tips and tricks

- To run the Minitest suite:
  - `aws-oidc exec -- docker-compose run web "RAILS_ENV=test rake test"`