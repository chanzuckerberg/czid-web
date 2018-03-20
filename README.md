# ID Portal ![travis ci build status](https://travis-ci.org/chanzuckerberg/idseq-web.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/chanzuckerberg/idseq-web/badge.svg?branch=master)](https://coveralls.io/github/chanzuckerberg/idseq-web?branch=master)

This app stores and analyzes the output from the infectious disease pipeline.


## Setup

To get a local `development` instance running on a Mac OS X computer, just do:
```
    bin/setup
```
Then run `npm start` in a separate shell and keep it running so frontend changes you make are picked up continuously.

Then open `http://localhost:3000` in your browser.

Everything you need to get started should be in `./bin/setup`.   If there's anything missing, please edit and submit a pull request.


## User account logins

In development environment, you can use the following credentials to login for all the non-read operations:

```
  email: fake@example.com
  password: password
```

After you deploy the code, you will have to log into the rails console into the cluster and create a user credential as follows:

```
idseq-web yf$ bin/shell <cluster> "rails c"
Running via Spring preloader in process 2608
Loading alpha environment (Rails 5.1.4)
irb(main):001:0> User.create(email: 'your@email.com', password: 'yourpass', password_confirmation: 'yourpass', authentication_token: 'your_auth_token')
```

You can then log in with the emaill/password you specified.

## Render a react component
Since rails is serving the bundled js file, you have access to the global `window.react_component` function provided.
Here's an example to render a react component from rails views.

```
<div id="demo_component">
  <%= javascript_tag do %>
    react_component('Demo', {
      pageSize: '<%=@page_size%>',
      pageDescription: '<%= @page_description %>',
      items: JSON.parse('<%= raw escape_json(@items)%>')
    }, 'demo_component');
  <% end %>
</div>
```

Calling the react_component method autoloads the component called `Demo` from the components directory, second parameters is the props you want passed to that component.
And last but not least, the `div` id `demo_component`, was passed as a third parameter, to tell the function where to render the said component. In our case the current div


## Testing

```
    docker-compose run web rails test
```

## Using GIT and GITHUB for development

```
feature_development_loop:

    # Create a new uniquely named private development branch

    git fetch
    git checkout master
    git checkout -b <user>/<new_unique_branch_name> origin/master

    # ... Do your work here. ...
    # ... git add / rm any files, etc ...

    git commit

    # bin/pr rebases on origin/master, runs tests, pushes to github,
    # and opens your browser on a compare page.  From there you can click
    # to create a new pull request, or click to view the existing pr.

    bin/pr

    # You can repeat bin/pr as often as you want while you work on your
    # feature, as you address review comments, etc.

    # After the pull request is approved and merged into master via github,
    # delete its branch from github, and...

    go to feature_development_loop
```

As part of running tests you may be prompted to run
`bundle install`.   Remember to run that inside the web
docker container, like so: `docker-compose exec web bundle install`.

Your branch is pushed with `--force` to github.  That's fine for your own
private branch.   There should be no shared development branches other than
master (or else the process needs to be updated to treat those the same way
as master is treated).


## Environments

In addition to using your local `development` instance, you may obtain access to some shared cloud environments, as follows.

1. Obtain the appropriate PEM key and save it as `idseq_<env>_key.pem`.
1. `chmod 600 idseq_<env>_key.pem`
1. `ssh-add idseq_<env>_key.pem`

You can now run a non-interactive command on a cloud web container like so
`bin/clam <env> 'echo $HOSTNAME'`


## Interactive shells

1. `docker-compose exec web bash` for a shell in your local `development` env.
1. `bin/shell alpha bash` for a shell in the cloud `alpha` env.

Useful commands inside an interactive shell:

1. `rails console` for ruby interpreter.
1. `rails db -p` for mysql client console.  The `-p` is important in cloud environments.

Sometimes you may be prompted to run a migration or configuration command like `bin/rails db:migrate RAILS_ENV=development`. Make sure to run that inside an interactive shell for the appropriate environment.


## DB backup/restore within and across environments

Note that this requires the proper ssh config to access the deployed versions of the site. (Run chanzuckerberg/shared-infra/tools/ssh_config, then `sed -i.bak '/bastion-alpha.idseq.net/d' ~/.ssh/known_hosts` and `sed -i.bak '/bastion-production.idseq.net/d' ~/.ssh/known_hosts`, then get the pem keys from a teammate, then `ssh-add <pem key>`.)

1. Backup your local `development` DB into a local file:
`docker-compose exec web mysqldump -h db -u root idseq_development | gzip -c > idseq_development.sql.gz`
1. Backup cloud `alpha` DB into a local file:
`bin/clam alpha 'mysqldump -h $RDS_ADDRESS -u $DB_USERNAME --password=$DB_PASSWORD idseq_alpha | gzip -c' > idseq_alpha.sql.gz`
1. Overwrite your local `development` DB with data from given backup file:
`docker-compose run web "gzip -dc idseq_alpha.sql.gz | mysql -h db -u root --database idseq_development"`
1. Let RAILS know it's okay to use alpha data locally.
`docker-compose run web bin/rails db:environment:set RAILS_ENV=development`


## Deployment

1. decide what docker tag you want to deploy (see https://hub.docker.com/r/chanzuckerberg/idseq-web/tags/). Do not use "branch-master", which is not always what you think it is; choose one that start with "sha-" and make sure the number is the commit you mean to deploy.
1. `bundle exec bin/deploy ENV TAG`


## Submit a sample

1. Make sure your AWS CLI is properly configured. i.e. `~/.aws/credentials` and `~/.aws/config` are setup correctly (you may need to follow site-specific instructions for how to do that).
1. `pip install git+https://github.com/chanzuckerberg/idseq-cli.git`
1. `idseq -t idseq1234 -p 'Awesome Project' -s test2 -u localhost:3000 -e fake@example.com --r1 <fastq1.gz> --r2 <fastq2.gz>`


## Dependencies

https://github.com/kislyuk/aegea


## ESLint

You can run ESLint for JSX linting checks. Uses our shared .eslintrc settings.

- Manual: `./node_modules/.bin/eslint app/assets/src --ext .js,.jsx`
- Auto-fix dry run: `./node_modules/.bin/eslint app/assets/src --ext .js,.jsx --fix-dry-run`
- Auto-fix: `./node_modules/.bin/eslint app/assets/src --ext .js,.jsx`

- Prettier is another code formatting tool: https://github.com/prettier/prettier
