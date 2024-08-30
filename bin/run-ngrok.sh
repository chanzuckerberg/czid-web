#!/bin/bash

# Navigate to the root directory
cd "$(dirname "$0")/.."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo "Error: ngrok is not installed. Please install ngrok and try again."
  exit 1
fi

# Check if server-domain.env exists
if [ ! -f server-domain.env ]; then
  echo "Error: server-domain.env file is required for this script"
  exit 1
fi

# Extract the domain from server-domain.env by removing the env var and URL prefix
DOMAIN=$(sed 's/^SERVER_DOMAIN=https:\/\///' server-domain.env)

# Run ngrok with the extracted domain
ngrok http --domain="$DOMAIN" 3001
