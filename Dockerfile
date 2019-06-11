FROM ruby:2.5

# Install apt based dependencies required to run Rails as
# well as RubyGems. As the Ruby image itself is based on a
# Debian image, we use apt-get to install those.
RUN apt-get update && apt-get install -y build-essential nodejs mysql-client python-dev python-pip apt-transport-https

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get update && apt-get install -y nodejs
RUN pip install --upgrade pip 

COPY requirements.txt ./
RUN pip install -r requirements.txt

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

# Do the same for node packages, allowing them to be cached
RUN npm update -g
COPY package.json package-lock.json ./
RUN npm install

# Copy the main application.
COPY . ./

# Generate the app's static resources using npm/webpack
RUN mkdir -p app/assets/dist && npm run build-img && ls -l app/assets/dist/

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
