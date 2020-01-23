#!/bin/bash
export PROD_BRANCH="prod"
export PROD_ENV="prod"
export STAGING_BRANCH="staging"
export STAGING_ENV="staging"
export MASTER_BRANCH="master"
export GITHUB_TOKEN; GITHUB_TOKEN=${GITHUB_TOKEN:-$(cut -f 3 -d : ~/.git-credentials | cut -f 1 -d @)}
export GITHUB_REMOTE_ORIGIN; GITHUB_REMOTE_ORIGIN=$(git remote get-url origin | perl -ne '/([^\/\:]+\/.+?)(\.git)?$/ && print $1')
export GITHUB_REPOSITORY_API="https://api.github.com/repos/${GITHUB_REMOTE_ORIGIN}"
export GITHUB_REPOSITORY_URL="https://github.com/${GITHUB_REMOTE_ORIGIN}"
export DOCKER_REPOSITORY_NAME="$GITHUB_REMOTE_ORIGIN"

# Special chars
export TAB=$'\t'
export LF=$'\n'

# Color vars
export BLACK=`tput setaf 0`
export RED=`tput setaf 1`
export GREEN=`tput setaf 2`
export YELLOW=`tput setaf 3`
export BLUE=`tput setaf 4`
export MAGENTA=`tput setaf 5`
export CYAN=`tput setaf 6`
export WHITE=`tput setaf 7`
export BOLD=`tput bold`
export RESET=`tput sgr0`