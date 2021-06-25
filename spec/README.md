- This folder contains tests for RSpec. Add all new tests here.
- See also testing guidelines in `DEV_GUIDELINES.md`

## Tips and tricks
- To run the RSpec suite:
  - `aws-oidc exec -- docker-compose run web "rspec"`
- To run a specific file:
  - `aws-oidc exec -- docker-compose run web "rspec path/to/file/file.rb"`
  - Ex: `aws-oidc exec -- docker-compose run web "rspec spec/controllers/workflow_runs_controller_spec.rb"`
- To reset the test database:
  - `aws-oidc exec -- docker-compose run -e RAILS_ENV=test web rake db:drop db:create db:migrate`
  - See also: `bin/setup-shared`