## Setup For External Users

1. Git clone repo
```
git clone git@github.com:chanzuckerberg/czid-web.git
cd czid-web
```

2. Create docker containers with:
```
export OFFLINE=1
make local-init
```

This takes around 15 minutes

3. Start the docker containers with:

```
make local-start-webapp
```

4. Download and start graphql-federation-service
```
git clone git@github.com:chanzuckerberg/czid-graphql-federation-server.git
cd czid-graphql-federation-server
make local-init
```