## Tips and tricks

### Applying migrations
- This means there is a migration that hasn't been run on your local database yet:
  - `ActiveRecord::PendingMigrationError - Migrations are pending. To resolve this issue, run: bin/rails db:migrate RAILS_ENV=development`
- To apply pending migrations:
  - `aws-oidc exec -- docker-compose run web "rake db:migrate"`
- The `test` database for local tests is separate as well, so you may need:
  - `aws-oidc exec -- docker-compose run web "RAILS_ENV=test rake db:migrate"`

### Rolling back migrations
- You can also undo migrations. For migrations with an `update` method, the operations are expected to be automatically `reversible` by ActiveRecord. Otherwise there should be an `up` and `down` method, and rollback runs the `down` method.
- Example: To undo the last migration: 
  - `aws-oidc exec -- docker-compose run web "rake db:rollback STEP=1"`
- It can be useful to apply-undo-apply a new migration you are adding to verify it is safe.
