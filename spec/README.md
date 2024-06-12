- This folder contains tests for RSpec. Add all new tests here.
- See also testing guidelines in `DEV_GUIDELINES.md`

## Tips and tricks
- To run the RSpec suite:
  - `make rspec`
- To run a specific file:
  - `docker compose --env-file .env.localdev exec web rspec path/to/file/file.rb`
  - Ex: `docker compose --env-file .env.localdev exec web rspec spec/services/pipeline_report_service_spec.rb`
- To reset the test database:
  - `make local-db-create-schema rails_env=test`
  - See also: `bin/setup-shared`
- You can debug controller/request spec responses by printing out the `response.body`.
- If you're getting 302 Redirect controller/request responses:
  - Don't forget to `sign_in` the user. Ex: `before do { sign_in @user }`
- Note on `let` definitions:
  - `let` is lazily-evaluated, so it doesn't execute until the first time the variable is used. You can use `let!` instead to force invocation, or call the variables in your spec with an unused variable `_`. Ex: `_ = [run1, run2, run3, run4]`
