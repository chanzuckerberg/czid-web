 # Dev Guidelines for working with the database

## Guidelines for new tables and columns

- Use `null: false` wherever possible, unless you need the empty state. This saves you from needing to check for presence with every use. It also saves you from `null` comparison gotchas (e.g. `= NULL`, needing `IS NULL` or `IS NOT NULL`).
- Include a schema `comment` on everything but the simplest columns. Even a short explanation can provide context.
- If you will be querying two or more fields together frequently, make sure to include a composite or compound index. The left-prefix rule means that prefix subsets can be used standalone (e.g. `t.index ["host_genome_id", "metadata_field_id"]` also functions as an index just for `host_genome_id`.)

## Database Schema Migration Safety

- Writing safe, zero-downtime DB migrations requires special attention, particularly on large tables such as `taxon_counts` or frequently accessed fields. During deployment, there can be a  old and new versions of the code running against unmigrated or migrated versions of the DB, or a migration could lock columns/tables that are needed to fulfill requests.
- This [CZI blog post describes the problem](https://medium.com/czi-technology/db-migrations-and-push-safety-in-rails-508bc877dd7e), and the team as previously conducted a [post-mortem on 
igrations` gem documentation describes potentially dangerous operations and provides safer recommmendations](https://github.com/ankane/strong_migrations#checks).  This gem will automatically raise an error if it detects a dangerous migration when they are run.
  - Sometimes it is necessary to perform a dangerous action in a migration.  As [documented in the strong migrations documentation, migrations steps can be marked as safe by wrapping them in a `safety_assured` block](https://github.com/ankane/strong_migrations#assuring-safety)

    ```ruby
    class MySafeMigration < ActiveRecord::Migration[7.0]
      def change
        safety_assured { remove_column :users, :some_column }
      end
    end
    ```

## Schema vs data migrations

- Active Record migrations are intended to capture database schema changes.  It's generally not recomended to perform data change migrations using Active Record migrations, primarily due to the data being invalid if the schema changes.
- For data migrations, CZ ID uses [the `data_migrate` gem](https://github.com/ilyakatz/data-migrate), which provides structure and interface for performing data migrations in a very similar to data migrations.
- [More information on Active Record migrations](https://czi.quip.com/N5eMAFsZ47jX/Rails-Database-migrations)
- To run data migrations, append `:with_data` to standard `db:migrate` rake tasks (e.g. `bin/rails db:migrate:with_data`), or use the specific data rake tasks documented in the gem (such as `bin/rails data:migrate`).

## Tips and tricks

### Production

- Please AVOID manually reverting and re-applying migrations in production. The tips in `Applying migrations` and `Rolling back migrations` are meant for non-prod.
- If you need to unblock a deploy, please hotfix the troubled migration to make it runnable.
- If you revert migrations in production, the `health_check` will fail with this error and the servers will be taken out of rotation:

    ```text
    health_check failed:

    Migrations are pending. To resolve this issue, run:

        bin/rails db:migrate RAILS_ENV=prod

You have 3 pending migrations:
...
    ```

- If a migration fails to complete, you need to do manual cleanup of any partial changes (e.g. drop column in MySQL Workbench). If you run rollback, it tries to undo the last _successful_ migration.

### Applying migrations

- This means there is a migration that hasn't been run on your local database yet:
  - `ActiveRecord::PendingMigrationError - Migrations are pending. To resolve this issue, run: bin/rails db:migrate RAILS_ENV=development`
- To apply pending migrations:
  - `aws-oidc exec -- docker-compose run web "rake db:migrate:with_data"`
- The `test` database for local tests is separate as well, so you may need:
  - `aws-oidc exec -- docker-compose run web "RAILS_ENV=test rake db:migrate:with_data"`

### Rolling back migrations

- You can also undo migrations. For migrations with an `update` method, the operations are expected to be automatically `reversible` by ActiveRecord. Otherwise there should be an `up` and `down` method, and rollback runs the `down` method.
- Example: To undo the last migration:
  - `aws-oidc exec -- docker-compose run web "rake db:rollback:with_data STEP=1"`
- It can be useful to apply-undo-apply a new migration you are adding to verify it is safe.
- `db:migrate:redo` will do a rollback and then migrate back up again.

### Debugging migration issues in development (locally or GitHub Actions)

- Starting from the first failed migration (after successful `migrated`) and first error message from the top, go line by line through the backtrace until you find the first line that originates from our code.
- Focus on this line and alternative ways to write the migration operations that may work around the issue. It may help to place any `update` calls in a separate migration so that it is in a different database transaction.
- There may sometimes be hidden issues in the migration history (e.g. your column was deleted) or in the callbacks/validations on setting some values.
- If you get errors about columns/indexes involved in your migration not existing, this may mean that your migration ran but was not recorded as having run (e.g. the column was already renamed so the old name does not exist). If this is just a local issue, you could comment out the lines and then run `migrate` anyway so that the migration is marked as recorded but it skips that operation.
- If one part of a migration fails, the lines above it in the migration will likely still have been applied. You may need to manually drop tables or indexes to try again. Example:

    ```bash
    # Open mysql console:
    aws-oidc exec -- docker-compose run web "mysql -h db -u root"

    show databases;
    use idseq_development;   # or idseq_test
    drop table table_to_drop;
    ```
