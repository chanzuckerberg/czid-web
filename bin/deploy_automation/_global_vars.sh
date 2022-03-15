#!/bin/bash
export PROD_BRANCH="prod"
export PROD_ENV="prod"
export STAGING_BRANCH="staging"
export STAGING_ENV="staging"
export MAIN_BRANCH="main"
export GITHUB_TOKEN; GITHUB_TOKEN=${GITHUB_TOKEN:-$(cut -f 3 -d : ~/.git-credentials | cut -f 1 -d @)}
export GITHUB_REPOSITORY_API="https://api.github.com/repos/chanzuckerberg/czid-web-private"
export GITHUB_REPOSITORY_URL="https://github.com/chanzuckerberg/czid-web-private"
export ECR_REPOSITORY_NAME="idseq-web"

# Special chars
export TAB=$'\t'
export LF=$'\n'

# Color vars
export BLACK; BLACK="$( { tty -s && tput setaf 0; } || true )"
export RED; RED="$( { tty -s && tput setaf 1; } || true )"
export GREEN; GREEN="$( { tty -s && tput setaf 2; } || true )"
export YELLOW; YELLOW="$( { tty -s && tput setaf 3; } || true )"
export BLUE; BLUE="$( { tty -s && tput setaf 4; } || true )"
export MAGENTA; MAGENTA="$( { tty -s && tput setaf 5; } || true )"
export CYAN; CYAN="$( { tty -s && tput setaf 6; } || true )"
export WHITE; WHITE="$( { tty -s && tput setaf 7; } || true )"
export BOLD; BOLD="$( { tty -s && tput bold; } || true )"
export RESET; RESET="$( { tty -s && tput sgr0; } || true )"
