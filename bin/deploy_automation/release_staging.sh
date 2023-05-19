#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# ./bin/deploy_automation/release_staging.sh
main() {
  _git_fetch_and_cleanup

  # Ensure current branch is not prod or staging
  # This command will set prod and staging HEADs to other commits,
  # and we want to be in a different branch to prevent any issues.
  _assert_current_branch_is_not "prod" "staging"

  # 1. Check if there's any commits to be released from main to staging
  declare commit_count; commit_count=$(git rev-list "origin/$STAGING_BRANCH".."origin/$MAIN_BRANCH" | wc -l)
  if [ "$commit_count" -eq "0" ]; then
    _exit_with_err_msg "origin/${MAIN_BRANCH} doesn't seem to have any additional commits after origin/${STAGING_BRANCH}." \
                       "Cannot start a new release cycle."
  fi

  # 2. Create a new tag pointing to the head of the main branch. Overwrite the existing staging branch with the new tag.
  export staging_tag_version="$(_get_latest_version "staging")"
  export next_version=$(_bump_version_string "$staging_tag_version" 3)
  export tag="$(_format_version_tag "${next_version}" "${STAGING_BRANCH}")"
  git tag -a -m "Started release cycle $next_version" "${tag}" "origin/$MAIN_BRANCH"
  export sha=$(git log -n1 "${tag}" --format=%h --abbrev=8)
  git branch -f "${STAGING_BRANCH}" "${sha}"
  git push --atomic -f origin "${tag}" "${STAGING_BRANCH}"

  # 3. Close the existing release checklist
  declare checklist_json; checklist_json=$(_get_current_release_checklist_json)
  declare checklist_html_url; checklist_html_url=$(jq -er .html_url <<< "$checklist_json")
  declare checklist_api_url; checklist_api_url=$(jq -er .url <<< "$checklist_json")

  >&2 echo "Closing release checklist $checklist_api_url ..."
  declare response_json
  if response_json=$(
    # see https://developer.github.com/v3/pulls/#create-a-pull-request
    http --ignore-stdin --check-status --timeout=30 PATCH "$checklist_api_url" \
      Accept:application/vnd.github.shadow-cat-preview+json \
      Authorization:"token $GITHUB_TOKEN" \
      state="closed" \
      draft=true
  ); then
    _log "Closed existing release checklist. Checklist url: $checklist_html_url"
  else
    _exit_with_err_msg "ERROR closing release checklist. Error code: $?. Details: $response_json"
  fi

  # 4. Run ./bin/deploy_automation/make_release_checklist.sh
  "$SCRIPT_DIR/make_release_checklist.sh"

  sleep 5 # wait for github to process the new checklist
}

main "$@"
