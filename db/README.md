## Migration safety

- Writing safe, zero-downtime DB migrations requires special attention, particularly on large tables such as `taxon_counts` or frequently accessed fields. This is because there could be a mismatch between the old and new versions of the code during the deployment, or a migration could lock columns/tables that are needed to fulfill requests.
- Ideally, operations such as renaming a column are split across multiple _code deploys_ (not just multiple pull requests).
- CZI blog post describing the problem: https://medium.com/czi-technology/db-migrations-and-push-safety-in-rails-508bc877dd7e
- See potentially dangerous operations here and recommmendations: https://github.com/ankane/strong_migrations#checks (We may adopt this Gem!)
- Related IDseq post-mortem: https://czi.quip.com/SZigAbUTTNGa

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

### Debugging migration issues in development (locally or GitHub Actions)

- Starting from the first failed migration (after successful `migrated`) and first error message from the top, go line by line through the backtrace until you find the first line that originates from our code.
- Focus on this line and alternative ways to write the migration operations that may work around the issue. It may help to place any `update` calls in a separate migration so that it is in a different database transaction.
- There may sometimes be hidden issues in the migration history (e.g. your column was deleted) or in the callbacks/validations on setting some values.
- If you get errors about columns/indexes involved in your migration not existing, this may mean that your migration ran but was not recorded as having run (e.g. the column was already renamed so the old name does not exist). If this is just a local issue, you could comment out the lines and then run `migrate` anyway so that the migration is marked as recorded but it skips that operation.
