FROM ruby:2.4

# Install apt based dependencies required to run Rails as
# well as RubyGems. As the Ruby image itself is based on a
# Debian image, we use apt-get to install those.
RUN apt-get update && apt-get install -y build-essential nodejs mysql-client python-dev python-pip apt-transport-https

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list


RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get update && apt-get install -y nodejs yarn
RUN pip install --upgrade pip 
RUN pip install --upgrade setuptools
RUN pip install --upgrade pyOpenSSL
RUN pip install --upgrade aegea

# Install chamber, for pulling secrets into the container.
ADD https://github.com/segmentio/chamber/releases/download/v2.2.0/chamber-v2.2.0-linux-amd64 /bin/chamber
RUN chmod +x /bin/chamber

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

# Copy the main application.
COPY . ./

RUN yarn install
RUN mkdir -p app/assets/dist && yarn run build-img && ls -l app/assets/dist/

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
