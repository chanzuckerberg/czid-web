#!/bin/bash

# Traps error codes to provide better error context
_trap_err() {
  declare exit_code=$?
  declare fn=( "${FUNCNAME[@]:1}" )
  if [ "$exit_code" != 0 ] && [ "$exit_code" != 99 ]; then
    >&2 printf "\n${RED}ERROR: failed to execute command \"%s\". Exit code %d. Invoked from %s.${RESET}\n" "$BASH_COMMAND" "${exit_code}" "${fn[*]} $0"
  fi
  exit $exit_code
}
trap '_trap_err' EXIT

_exit_with_err_msg() {
  >&2 printf "\n\n${CYAN}[%s]: ${BOLD}${RED}ERROR: %s${RESET}\n\n" "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"
  exit 99
}

_log() {
  >&2 printf "${CYAN}[%s]: ${BOLD}${GREEN}%s${RESET}\n" "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"
}

_trace() {
  >&2 printf "${RESET}%s\n" "$*"
}

_get_latest_commit() {
  declare git_rev="$1" # https://git-scm.com/docs/git-rev-parse#_specifying_revisions
  git log -n 1 --pretty=format:"%h" "$git_rev" --abbrev=8
}

_fetch_current_release_checklist_from_github() {
  # Fetch current release checklist using github API and prints a json object.
  # If there is no checklist available it will print json object "null" (without quotes)
  declare url="${GITHUB_REPOSITORY_API}/pulls?state=open"
  _trace "Fetching [RELEASE_CHECKLIST] draft pull request from repo $GITHUB_REPOSITORY_URL/pulls"
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
  declare checklist_json; checklist_json=$(_fetch_current_release_checklist_from_github)
  if [ "$checklist_json" == "null" ]; then
    _log "WARNING: No release checklist found. Continuing without updating checklist."
    echo "null"
  else
    echo "$checklist_json"
  fi
}

_get_latest_version() {
  declare env_name="${1:-staging}"
  _get_latest_tag "$env_name" \
    | perl -pe 's/^v([\.0-9]+)_.*$/\1.0.0.0/' \
    | cut -d. -f1-3
}

_get_current_version_initial_tag() {
  declare env_name="${1:-staging}"

  declare latest_version; latest_version=$(_get_latest_version "$env_name")
  declare major_minor_version; major_minor_version=$(cut -d. -f1-2 <<< "$latest_version")
  git tag -l --sort=-version:refname "v${major_minor_version}*_${env_name}_*" | tail -n 1
}

_get_latest_tag() {
  declare env_name="${1:-staging}"
  _log "DEBUG: _get_latest_tag called with env_name='$env_name'"
  local tags
  tags=$(git tag -l --sort=-version:refname "v*_${env_name}_*")
  if [ -z "$tags" ]; then
    _log "WARNING: No tags found for environment '$env_name'."
    echo ""
    return 0
  fi
  echo "$tags" | head -n 1
}

_bump_version_string() {
  declare from_version="$1"
  declare field="$2" # 1: major, 2: minor, 3: patch
  echo "${from_version}.0.0.0" | \
    awk -v i="$field" -F. '{$i = $i + 1; for(j=i+1;j<=NF;j++){$j="0";}} 1' | \
    sed 's/ /./g' | \
    cut -d. -f1-3
}

_format_version_tag() {
  declare version="$1"
  declare env="$2"
  echo "v${version}_${env}_$(date '+%Y-%m-%d')"
}

_assert_current_branch_is_not() {
  declare branch_names=("${@}")

  declare current_branch; current_branch=$(git rev-parse --abbrev-ref HEAD)
  declare branch_name
  for branch_name in "${branch_names[@]}"; do
    if [[ "$current_branch" == "$branch_name" ]]; then
      _exit_with_err_msg "INVALID CURRENT BRANCH: You cannot run this command when" \
                         "your current branch is '$current_branch'." \
                         "Please, checkout a different branch (other than [${branch_names[@]}])."
    fi
  done
}

_git_fetch_and_cleanup() {
  # fetch from remote origin
  git fetch origin

  # remove any dangling version tags not present in remote origin
  # (this could happen if a previous run failed to push tags to remote)
  declare dangling_tags; dangling_tags=$(
    grep -vxFf  \
      <(git ls-remote --tags origin | cut -f 2 | sed -E 's/^refs\/tags\///') \
      <(git tag -l \
          | grep -E '^v(?:[0-9]+\.){1,2}(?:[0-9]+)_[^_]+_[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      ) \
      || [[ $? == 1 ]]
  )
  if [ ! -z "$dangling_tags" ]; then
    _trace "Found some dangling version tags not present in remote origin. Removing..."
    git tag -d "$dangling_tags"
  fi
}
