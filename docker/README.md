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

- `Could not find gem-1.2.0 in any of the sources (Bundler::GemNotFound)`
  - When a gem is added or updated, you need to update the Docker image as well.
- Standard method is to rebuild the image:
  - `aws-oidc exec -- docker-compose build web`
- To avoid rebuilding your web image temporarily (e.g. after someone adds to the Gemfile), you can try this with your running container:
  - `aws-oidc exec -- docker-compose run --entrypoint='' web bundle install`
- **Recommended**: Usually you can pull the latest image from AWS ECR (if working off `main`) and downloading is likely faster than rebuilding:
  - `ACCOUNT_ID=$(aws sts get-caller-identity --query="Account" | tr -d '\"')`
  - `aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web`
  - `docker pull $ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/idseq-web:compose`
  - `aws-oidc exec -- docker-compose up web`

### Avoiding Docker

- We practice container-based development locally for reproducibility (if the Docker app works locally it should work everywhere else). However, you can avoid Docker if you want a lighter setup.
- Example to run Rails natively without Docker:
  - `alias local-idseq='REDISCLOUD_URL="redis://127.0.0.1:6379" DB_HOST=127.0.0.1 chamber exec idseq-dev-web -- $@'`
  - `local-idseq rails server`

### Read-only file system @ rb_sysopen - /app/Gemfile.lock

- `'rescue in filesystem_access': There was an error accessing ``/app/Gemfile.lock``. (Bundler::GenericSystemCallError) The underlying system error is Errno::EROFS: Read-only file system @ rb_sysopen - /app/Gemfile.lock`
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
