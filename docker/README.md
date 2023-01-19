This folder is just a README for now since `Dockerfile` and `docker-compose.yml` are usually kept in the repository root / top of the build context.

## Tips and tricks

### Basic commands

- We use Docker Compose heavily for different web tasks.
- To start all containers:
  - `aws-oidc --session-duration=12h exec -- docker-compose up -d`
  - `session-duration` is optional. `-d` means detached mode which hides the logs output.
- To start a specific container:
  - `aws-oidc --session-duration=12h exec -- docker-compose up web`
  - Or substitute `web` for another name in `docker-compose`.
- To view running containers:
  - `docker ps`
- To open up bash in a running container:
  - Find the CONTAINER_ID from `docker ps`.
  - Run `docker exec -it CONTAINER_ID bash`
  - Example: `docker exec -it 9bfe0903fde8 bash` but replace the ID.
- To open up bash in a new container:
  - `aws-oidc exec -- docker-compose run web "bash"`
- To open up Rails Console in a new container:
  - `aws-oidc exec -- docker-compose run web "rails c"`
- To open up MySQL console:
  - `aws-oidc exec -- docker-compose run web "mysql -h db -u root"`

### Gem was updated

**Typical error message**: `Could not find gem-1.2.0 in any of the sources (Bundler::GemNotFound)`

**Resolution**: When a gem is added or updated, you need to update the Docker image as well. There are several options for this.

- If working off `main` and gems are not modified locally, pull the latest image from AWS ECR

    ```zsh
    # set AWS account id
    $ ACCOUNT_ID=$(aws sts get-caller-identity --query="Account" | tr -d '\"')
    # login to ecr so pulling cache succeeds
    $ aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web
    # pull from ECR
    $ docker pull $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web:latest
    # start containers
    $ aws-oidc exec -- docker-compose up web
    ```

- If gems are modified locally or pulling from ECR fails, rebuild the image

    ```zsh
    # set AWS account id
    $ ACCOUNT_ID=$(aws sts get-caller-identity --query="Account" | tr -d '\"')
    # login to ecr so pulling cache succeeds
    $ aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web
    # build container
    $ aws-oidc exec -- docker-compose build web
    ```

- To avoid rebuilding your web image temporarily (e.g. after someone adds to the Gemfile), you can try this with your running container
  - `aws-oidc exec -- docker-compose run --entrypoint='' web bundle install`

#### Streamline commands with functions and aliases

Add the following to .zshrc (or rc file for your shell) to run these command more easily

```zsh
function logintoecr {
  ACCOUNT_ID=$(aws sts get-caller-identity --query="Account" | tr -d '\"')
  aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web
}

function pulllatestdocker {
  logintoecr
  docker pull $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web:latest
}

function buildwebcontainer {
  logintoecr
  aws-oidc exec -- docker-compose build web
}

alias bweb="buildwebcontainer"
alias pulldock="pulllatestdocker"
```

### Container environment variables and overrides

- docker-compose overrides can be specified in a `docker-compose.override.yml` file located in the same directory as `docker-compose.yml`.  For more details, see the [docker-compose documentation](https://docs.docker.com/compose/extends/#example-use-case).
- Example of setting environment variables in `docker-compose.override.yml`, useful for API keys or other settings that cannot be committed

```yml
services:
  web:
    environment:
      - ENV_VAR_NAME=env_var_value
```

## Troubleshooting

### Avoiding Docker

- We practice container-based development locally for reproducibility (if the Docker app works locally it should work everywhere else). However, you can avoid Docker if you want a lighter setup.
- Example to run Rails natively without Docker:
  - `alias local-idseq='REDISCLOUD_URL="redis://127.0.0.1:6379" DB_HOST=127.0.0.1 chamber exec idseq-dev-web -- $@'`
  - `local-idseq rails server`

### Read-only file system @ rb_sysopen - /app/Gemfile.lock

- ` 'rescue in filesystem_access': There was an error accessing ``/app/Gemfile.lock``. (Bundler::GenericSystemCallError) The underlying system error is Errno::EROFS: Read-only file system @ rb_sysopen - /app/Gemfile.lock `
  - Try running `bundle install` from outside Docker. The internal Docker filesystem is read-only but Rails is trying to update an outdated Gemfile.lock. The new Gemfile.lock will be synced into the container.

### Redis not able to persist on disk

- `/usr/local/bundle/gems/redis-4.3.1/lib/redis/client.rb:147:in 'call': MISCONF Redis is configured to save RDB snapshots, but it is currently not able to persist on disk. Commands that may modify the data set are disabled, because this instance is configured to report errors during writes if RDB snapshotting fails (stop-writes-on-bgsave-error option). Please check the Redis logs for details about the RDB error. (Redis::CommandError)`
  - Most likely you are out of Docker disk space.
  - Try `docker system prune` or `docker system prune --all`
  - Alternatively you can expand the hard disk allocation given to Docker. On Docker Desktop: Preferences -> Resources -> Advanced -> Disk image size. It will show the used space.

### ActiveRecord::ConnectionNotEstablished - Unknown MySQL server host 'db'

- If you see the above error and `mysql` is failing to come up, you may also be out of Docker disk space.
  - Check if your containers are exiting with `Write error saving DB on disk: No space left on device`
  - Try `docker system prune` or `docker system prune --all`

### AWS credentials issues

- There are a variety of AWS credentials issues that could occur. The first step is to figure out at which level the credentials are broken (your local shell or just inside Docker, or awscli vs AWS SDK Gem API calls).
- `aws sts get-caller-identity` lists your current identity config. See if it's broken in your main shell or only within Docker. Try it within `aws-oidc exec -- docker-compose run container-name-here bash`.
- `aws configure get region` shows what `awscli` thinks is set as the region.
- `aws configure list` is very useful for showing the currently detected settings and their source.
- Use `printenv` or `echo` to see a env variable value, or `env | grep AWS` to list all AWS related variables. For example, there may be some interfering variables such as `AWS_SDK_LOAD_CONFIG` or `AWS_DEFAULT_REGION`.

#### You must specify a region. You can also configure your region by running "aws configure"

- `awscli` is especially picky about credentials, which might be the source of your error if the code invokes `Open3.capture3("aws ...")` (not recommended). `awscli` seems to ignore any `AWS_REGION` env variable.
- Make sure your `~/.aws/config` file has a default profile and default region like this at the top (replace the `...`):

```
[default]
output             = json
credential_process = sh -c 'aws-oidc creds-process --issuer-url=... --client-id=... --aws-role-arn=arn:aws:iam::...:role/... 2> /dev/tty'
region             = us-west-2
```

- You may want to go through aws-oidc setup again: https://github.com/chanzuckerberg/aws-oidc
- Your `~/.aws/config` and `~/.aws/credentials` files are available in the Docker container at `/root/.aws`, so they may be referenced even though the primary credentials come from `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN`.
- From the [AWS CLI docs](https://docs.aws.amazon.com/cli/latest/topic/config-vars.html#id1):
  - Credentials from per-operation or per-function parameters get first priority.
  - Next, credentials from environment variables have precedence over credentials from `~/.aws/credentials` and `~/.aws/config`.
  - Credentials specified in `~/.aws/credentials` have precedence over credentials in `~/.aws/config`.
  - Credentials provided by AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY will override the credentials located in the profile provided by AWS_PROFILE, if all are set.
