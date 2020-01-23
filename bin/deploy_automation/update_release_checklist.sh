#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")  
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Updates the release checklist with all release fixes that have been created since
# the beginning of the current version
main() {
  git fetch --all
  declare source_commit="${1:-$(_get_latest_commit "origin/$MASTER_BRANCH")}"
  declare target_commit="${2:-$(_get_latest_commit "origin/$STAGING_BRANCH")}"

  declare checklist_json; checklist_json=$(_get_current_release_checklist_json)
  declare checklist_html_url; checklist_html_url=$(jq -er .html_url <<< "$checklist_json")
  declare checklist_api_url; checklist_api_url=$(jq -er .url <<< "$checklist_json")
  declare checklist_body; checklist_body=$(jq -er .body <<< "$checklist_json")

  _log "Checking if updates are required in release checklist"

  _trace "Checking commits $source_commit..$target_commit"
  declare changed=0
  oldIFS=$IFS; IFS=$'\n'
  for commit in $(git log --date-order --pretty=format:$'* [ ] %h - % %s %d (%cD) **%an**' "${source_commit}..${target_commit}")
  do
    declare sha="${commit:6:8}"
    if ( grep -qE '^\* \[.\]\s*'"$sha"' - ' <<< "$checklist_body" )
    then
      _trace "- commit $sha is already present in the checklist"
    else
      _trace "- commit $sha is not present in the checklist - adding"
      checklist_body+=$'\n'$commit
      changed=1
    fi
  done
  IFS=$oldIFS; 

  if [ $changed -eq 1 ]
  then
    >&2 echo "Updating release checklist body for $checklist_api_url ..."
    declare response_json;
    if response_json=$(
      http --ignore-stdin --check-status --timeout=30 PATCH "$checklist_api_url" \
        Accept:application/vnd.github.shadow-cat-preview+json \
        Authorization:"token $GITHUB_TOKEN" \
        body="${checklist_body}" \
        draft=true
    ); then
      _log "Updated. Checklist url: $checklist_html_url"
    else
      _exit_with_err_msg "ERROR updating release checklist . Error code: $?. Details: $response_json"
    fi
  else
    _log "No changes detected to release checklist. Checklist url: $checklist_html_url"
  fi
}


main "$@"
