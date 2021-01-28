#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Execute release cycle basic automation
# - Ensure any patch versions have been properly bumped during this cycle
#   - Whenever a release/hot fix is made, we need a new tag accounting for that change. Although bumping these versions should be part of regular release/hot fix procedures, we want to make sure we are not leaving anything behind.
# - Close previous release cycle
#   - Update the current release checklist with any release fixes
#   - Make sure all items from current release checklist are checked
#   - Create a new tag for prod pointing to HEAD of  staging, preserving version number (ex: if staging version is v0.24.1_staging_..., this step will create a v0.24.1_prod_... tag)
#   - Set HEAD of prod branch to this new tag
# - prod branch is now ready to be deployed (note: we are currently executing this step after starting a new release cycle, because it is more convenient when executing it manually)
# - Start a new release cycle
#   - Create a new staging tag, pointing to HEAD of main branch. The name of this tag bumps minor version from previous staging tag  (ex: if previous staging version is v0.24.1_staging_..., this step will create tag v0.25_staging_...)
#   - Set HEAD of staging branch to point to this new tag
#   - Create new release checklist with all changes that are now in staging and not yet in prod
# - Staging branch is now ready to be deployed (note we are deploying both prod and staging versions here, because it is more convenient when executing it manually)


main() {
  _git_fetch_and_cleanup

  # Ensure current branch is not prod or staging
  # This command will set prod and staging HEADs to other commits,
  # and we want to be in a different branch to prevent any issues.
  _assert_current_branch_is_not "prod" "staging"

  _log "**** CHECKING TAG VERSIONS FOR RELEASE/HOT FIXES ****"
  "$SCRIPT_DIR/patch_branch_version_tags.sh"
  _trace ""

  _log "**** CHECKING RELEASE CYCLE STATE ****"
  declare current_release_state; current_release_state=$(__check_release_state)
  _log "Current release cycle state: $current_release_state"
  _trace ""

  _log "**** CLOSING RELEASE CYCLE ****"
  if [ "$current_release_state" != "closed" ]; then
    "$SCRIPT_DIR/close_release_cycle.sh"
  else
    _log "${YELLOW}WARNING: Current release cycle seems to be already closed. Skipping this step."
  fi
  _trace ""

  _log "**** STARTING NEW RELEASE CYCLE ****"
  "$SCRIPT_DIR/start_release_cycle.sh"
  _trace ""

  _log "**** READY FOR DEPLOYMENT ****"
  _log "New tags: ${YELLOW}" \
       "$(_get_latest_tag "$PROD_ENV")    $(_get_latest_tag "$STAGING_ENV")"
}

__check_release_state() {
  declare current_prod_version; current_prod_version=$(_get_latest_version "${PROD_ENV}")
  declare current_staging_version; current_staging_version=$(_get_latest_version "${STAGING_ENV}")
  declare checklist_json; checklist_json=$(_fetch_current_release_checklist_from_github)
  declare highest_version; highest_version=$(sort -rV <( printf "%s\n" "$current_prod_version" "$current_staging_version" ) | head -n 1)
  declare latest_staging_tag; latest_staging_tag=$(_get_latest_tag "${STAGING_ENV}")
  declare latest_staging_tag_commit; latest_staging_tag_commit=$(_get_latest_commit "origin/${STAGING_BRANCH}")
  declare latest_staging_commit; latest_staging_commit=$(_get_latest_commit "origin/${STAGING_BRANCH}")

  _trace "current_prod_version=$current_prod_version"
  _trace "current_staging_version=$current_staging_version"
  _trace "highest_version=$highest_version"
  _trace "latest_staging_tag=$latest_staging_tag ($latest_staging_tag_commit)"
  _trace "latest_staging_commit=$latest_staging_commit"
  _trace "checklist_json=$(jq -c . <<<"$checklist_json" | cut -c 1-40)"

  if [ "$checklist_json" == "null" ] \
     && [ ! -z "$current_staging_version" ] \
     && [ "$current_staging_version" == "$current_prod_version" ] \
     && [ "$latest_staging_tag_commit" == "$latest_staging_commit" ]; then
    echo "closed"
  elif [ "$checklist_json" != "null" ] && \
       [ "$current_staging_version" == "$highest_version" ]; then
    echo "open"
  else
    echo "unknown"
  fi
}


main "$@"
