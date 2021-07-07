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
