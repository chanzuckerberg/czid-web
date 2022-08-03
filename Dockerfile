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

# Install node + npm
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Use a more recent version of npm
RUN npm i -g npm@8.5.5

# Install pip
RUN pip3 install --upgrade pip

# Install chamber, for pulling secrets into the container.
RUN curl -L https://github.com/segmentio/chamber/releases/download/v2.10.8/chamber-v2.10.8-linux-amd64 -o /bin/chamber
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
RUN gem install bundler

# allow nokogiri to install on arm64 / M1 Macs
RUN bundle config set force_ruby_platform true
RUN bundle install --jobs 20 --retry 5

# Copy package.json and install packages, allowing the
# dependencies to be cached
COPY package.json package-lock.json ./

# Copy aws-sdk-js-v3 packages that are installed from file
COPY vendor/aws-sdk-js-v3/* ./vendor/aws-sdk-js-v3/

RUN npm install --no-optional

# This section is for the purpose of installing the non-MariaDB mysql-client /
# mysqldump utility. The default-mysql-client package is actually
# mariadb-client, and we found some incompatibility with virtual generated
# columns when importing into non-MariaDB MySQL Community Server.
# More info about mysql apt repository: https://dev.mysql.com/doc/mysql-apt-repo-quick-guide/en/
ARG MYSQL_APT_DEB=mysql-apt-config_0.8.22-1_all.deb
RUN wget https://dev.mysql.com/get/${MYSQL_APT_DEB}
RUN echo "mysql-apt-config mysql-apt-config/select-server select mysql-5.7" | debconf-set-selections && \
  DEBIAN_FRONTEND=noninteractive apt install ./${MYSQL_APT_DEB}

# mysql-client does not exist for M1 Macs / arm64, so force debian to install an amd64 version
RUN DPKG_ARCH=$(dpkg --print-architecture ) && if [ $DPKG_ARCH = arm64 ]; then dpkg --add-architecture amd64; fi

RUN apt-get update && \
  apt-get install -y mysql-community-client mysql-client

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

