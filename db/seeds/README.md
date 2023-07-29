# Seeding Test Data in CZ ID

Having a database seed can be useful for two main reasons:
1. Initializing the web application locally with ease
2. Seeding data that Playwright E2E test cases depend on

As the web app evolves and we add more Playwright E2E tests, we may need to add more data into our seed such that the tests have all required data in the database.

## How Seed Migrations work

Call a factory inside a seed migration to incrementally build the seeded database. Tools: [FactoryBot](https://github.com/thoughtbot/factory_bot_rails) (sponsored open source project) with [Seed Migrations](https://github.com/pboling/seed_migration). 

We’re currently using FactoryBot to stub data for our Rspec unit tests. We actively maintain our existing factories so we could continuously expand our test coverage when new functionality is introduced. We should reuse our existing factories to create a maintainable Rails seed that stays up-to-date whenever we make schema or data changes.

Seed migrations follow the same concept as creating a schema or data migration. Run the seed migrations in the CICD environment to populate the DB. **If you've ever created a Rails schema or data migration, you'll easily learn how to create a seed migration.** 


### Creating a Seed Migration

```
aws-oidc exec -- docker-compose run web rails g seed_migration AddBaselineSeedData
```

 A new file will be created under db/data/ using rails migration  convention: db/seeds/20230614162007_add_baseline_seed_data.rb

### Run pending migrations
```
aws-oidc exec -- docker-compose run web rails seed:migrate
```

### Running a specific migration
```
aws-oidc exec -- docker-compose run web rails seed:migrate MIGRATION=20140407162007_add_foo.rb
```

### Rolling back the last migration
```
aws-oidc exec -- docker-compose run web rails seed:rollback
```

### Rolling back more than one migration at the same time
```
aws-oidc exec -- docker-compose run web rails seed:rollback STEP=3 # rollback last 3 migrations
```

### Rollback a specific migration
```
aws-oidc exec -- docker-compose run web rails seed:rollback MIGRATION=20140407162007_add_foo.rb
```

## FAQ
### What is FactoryBot.`find_or_create`?
`FactoryBot.find_or_create` is a custom FactoryBot strategy that will either find or create the model. This prevents inserting the same data in the database if it already exists. The definition of the custom find_or_create method can be found [here](https://github.com/chanzuckerberg/czid-web-private/blob/main/config/initializers/factory_bot.rb)

### How can I setup my local dev environment to use the seeded database so I can expirement with it locally?
```
# Backup your local development DB into a local file (so you can restore your current db if needed). This may take some time if your local database is large.
docker-compose exec web mysqldump -h db -u root idseq_development | gzip -c > idseq_development.sql.gz

# Replace your current database with the seeded database
aws-oidc exec -- docker-compose run web rails db:drop db:create db:migrate
aws-oidc exec -- docker-compose run web rails db:migrate:with_data
aws-oidc exec -- docker-compose run web rails seed:migrate
```

To revert back to your old database:
`aws-oidc exec -- docker-compose run web "gzip -dc idseq_development.sql.gz | mysql -h db -u root --database idseq_development"`
