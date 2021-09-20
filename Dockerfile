FROM ruby:2.7-buster

# Install apt based dependencies required to run Rails as
# well as RubyGems. As the Ruby image itself is based on a
# Debian image, we use apt-get to install those.
RUN apt-get update && \
    apt-get install -y \
      build-essential \
      python3-dev \
      python3-pip \
      lsb-release \
      apt-transport-https

# This section is for the purpose of installing the non-MariaDB mysql-client /
# mysqldump utility. The default-mysql-client package is actually
# mariadb-client, and we found some incompatibility with virtual generated
# columns when importing into non-MariaDB MySQL Community Server.
RUN wget https://dev.mysql.com/get/mysql-apt-config_0.8.18-1_all.deb
RUN DEBIAN_FRONTEND=noninteractive apt install ./mysql-apt-config_0.8.18-1_all.deb
RUN apt-get update && apt-get install -y mysql-client

# Install node + npm
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

# Install pip
RUN pip3 install --upgrade pip

# Install chamber, for pulling secrets into the container.
RUN curl -L https://github.com/segmentio/chamber/releases/download/v2.2.0/chamber-v2.2.0-linux-amd64 -o /bin/chamber
RUN chmod +x /bin/chamber

COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Configure the main working directory. This is the base
# directory used in any further RUN, COPY, and ENTRYPOINT
# commands.
RUN mkdir -p /app
WORKDIR /app

# Copy the Gemfile as well as the Gemfile.lock and install
# the RubyGems. This is a separate step so the dependencies
# will be cached unless changes to one of those two files
# are made.
COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install --jobs 20 --retry 5

# Do the same for node packages, allowing them to be cached
RUN npm update -g
COPY package.json package-lock.json ./
RUN npm install --no-optional

# Generate the app's static resources using npm/webpack
# Increase memory available to node to 6GB (from default 1.5GB). At this time, our self-hosted Github runner has ~16GB.
ENV NODE_OPTIONS "--max_old_space_size=6144"
# Only copy what is required so we don't need to rebuild when we are only updating the api
COPY app/assets app/assets
COPY webpack.config.common.js webpack.config.prod.js .babelrc ./
# Generate assets
RUN mkdir -p app/assets/dist && npm run build-img && ls -l app/assets/dist/

# Copy the main application.
COPY . ./

ARG GIT_COMMIT
ENV GIT_VERSION ${GIT_COMMIT}

# Expose port 3000 to the Docker host, so we can access it
# from the outside.
EXPOSE 3000

# Configure an entry point, so we don't need to specify
# "bundle exec" or "chamber" for each of our commands.
ENTRYPOINT ["bin/entrypoint.sh"]

# The main command to run when the container starts. Also
# tell the Rails dev server to bind to all interfaces by
# default.
CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3000"]
