#!/bin/bash

# Traps error codes to provide better error context
_trap_err() {
  declare exit_code=$?
  declare fn=( "${FUNCNAME[@]:1}" )
  if [ "$exit_code" != 0 ] && [ "$exit_code" != 99 ]; then
    >&2 printf "\nERROR: failed to execute command \"%s\". Exit code %d. Invoked from %s." "$BASH_COMMAND" "${exit_code}" "${fn[*]} $0"
  fi
  exit $exit_code
}
trap '_trap_err' EXIT

_exit_with_err_msg() {
  >&2 printf "\n\n[%s]: ERROR: %s\n\n" "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"
  exit 99
}

_log() {
  >&2 printf "[%s]: %s\n" "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"
}

_get_latest_commit() {
  declare branch_or_tag_name="$1"
  git log -n 1 --pretty=format:"%h" "$branch_or_tag_name"
}

_fetch_current_release_checklist_from_github() {
  # Fetch current release checklist using github API and prints a json object.
  # If there is no checklist available it will print json object "null" (without quotes)
  declare url="${GITHUB_REPOSITORY_API}/pulls?state=open"
  _log "Fetching [RELEASE_CHECKLIST] draft pull request from repo $GITHUB_REPOSITORY_URL/pulls"
  http --ignore-stdin --check-status --timeout=30 \
      GET "$url" "Authorization:token $GITHUB_TOKEN" \
    | jq 'map(select(.title | test("^\\[RELEASE_CHECKLIST\\] ")))[0]'
}

_assert_no_release_checklist() {
  declare checklist_json; checklist_json=$(_fetch_current_release_checklist_from_github)
  if [ "$checklist_json" != "null" ]; then
    _exit_with_err_msg "INVALID STATE. Release list shouldn't exist. $(jq -er .html_url <<< "$checklist_json")"
  fi
}

_get_current_release_checklist_json() {
  if ! (_fetch_current_release_checklist_from_github | jq -e); then
    _exit_with_err_msg "INVALID STATE: Couldn't find an open release checklist."
  fi
}

_get_latest_version() {
  declare env_name="${1:-staging}"
  _get_latest_tag "$env_name" | perl -pe 's/^v([\.0-9]+)_.*$/\1/'
}

_get_latest_tag() {
  declare env_name="${1:-staging}"
  git tag -l --sort=-version:refname "v*_${env_name}_*" | head -n 1
}

_bump_version_string() {
  declare from_version="$1"
  declare field="$2" # 1: major, 2: minor, 3: patch
  echo "${from_version}.0.0.0" | \
    awk -v i="$field" -F. '{$i = $i + 1} 1' | \
    sed 's/ /./g' | \
    cut -d. -f1-"${field}"
}

_format_version_tag() {
  declare version="$1"
  declare env="$2"
  echo "v${version}_${env}_$(date '+%Y-%m-%d')"
}
