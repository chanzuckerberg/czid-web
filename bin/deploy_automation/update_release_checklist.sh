#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Updates the release checklist with all release fixes that have been created since
# the beginning of the current version
main() {
  _git_fetch_and_cleanup

  declare checklist_json; checklist_json=$(_get_current_release_checklist_json)

  declare checklist_html_url=""
  declare checklist_api_url=""
  declare checklist_body=""

  # If no checklist exists, initialize variables for creating a new checklist
  if [ "$checklist_json" == "null" ]; then
    _log "No release checklist found. Preparing to create a new checklist."
    "$SCRIPT_DIR/make_release_checklist.sh"
    checklist_json=$(_get_current_release_checklist_json)
    if [ "$checklist_json" == "null" ]; then
      _log "Failed to create a new release checklist."
      exit 0
    fi
  fi

  checklist_html_url=$(jq -er .html_url <<< "$checklist_json")
  checklist_api_url=$(jq -er .url <<< "$checklist_json")
  checklist_body=$(jq -er .body <<< "$checklist_json")


  _log "Checking if updates are required in release checklist"

  declare source_commit
  declare target_commit
  declare new_checklist_body="${checklist_body}"

  # Check for release fixes
  # Check for any commits created after current version initial tag
  source_commit=$(_get_latest_commit $(_get_current_version_initial_tag staging))
  target_commit=$(_get_latest_commit "origin/$STAGING_BRANCH")
  _trace "Checking release fixes (commits $source_commit..$target_commit)"
  new_checklist_body=$(__add_commits_to_checklist_body "$source_commit" "$target_commit" "$new_checklist_body")

  # Check for hot fixes
  # Any commit made to prod branch after the initial deployment to prod
  declare prod_initial_tag; prod_initial_tag=$(_get_current_version_initial_tag prod)
  source_commit=$(_get_latest_commit "$prod_initial_tag")
  target_commit=$(_get_latest_commit "origin/$PROD_BRANCH")
  _trace "Checking hot fixes (commits $source_commit..$target_commit)"
  new_checklist_body=$(__add_commits_to_checklist_body "$source_commit" "$target_commit" "$new_checklist_body")

  # If changes have been detected
  if [ "$new_checklist_body" != "$checklist_body" ]
  then
    >&2 echo "Updating release checklist body for $checklist_api_url ..."
    declare response_json;
    if response_json=$(
      http --ignore-stdin --check-status --timeout=30 PATCH "$checklist_api_url" \
        Accept:application/vnd.github.shadow-cat-preview+json \
        Authorization:"token $GITHUB_TOKEN" \
        body="${new_checklist_body}" \
        draft=true
    ); then
      _log "Updated. Checklist url: $checklist_html_url"
    else
      _exit_with_err_msg "ERROR updating release checklist. Error code: $?. Details: $response_json"
    fi
  else
    _log "No changes detected to release checklist. Checklist url: $checklist_html_url"
  fi
}


__add_commits_to_checklist_body() {
  declare source_commit="$1"
  declare target_commit="$2"
  declare new_checklist_body="$3"

  declare old_IFS="$IFS"
  IFS=$'\n'
  for commit in $(git log --date-order --abbrev=8 --pretty=format:$'* [ ] %h - % %s %d (%cD) **%an**' "${source_commit}..${target_commit}")
  do
    declare sha="${commit:6:8}"
    if ( grep -qE '^\* \[.\]\s*'"$sha"' - ' <<< "$new_checklist_body" )
    then
      _trace "- commit $sha is already present in the checklist"
    else
      _trace "- commit $sha is not present in the checklist - adding"
      new_checklist_body+=$'\n'$commit
    fi
  done
  IFS="$old_IFS"
  echo "$new_checklist_body"
}

main "$@"
