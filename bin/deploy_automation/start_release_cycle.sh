#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Start a new release cycle:
# - Create a new staging tag, pointing to HEAD of master branch. 
#   The name of this tag bumps minor version from previous staging tag
#   (ex: if previous staging version is v0.24.1_staging_...,
#        this step will create tag v0.25_staging_...)
# - Set HEAD of `staging` branch to point to this new tag
# - Create new release checklist with all changes that are now
#   in staging and not yet in prod
main() {
  _git_fetch_and_cleanup

  # Ensure current branch is not staging
  # This command will set staging HEAD to a different commit,
  # and we want to be in a different branch to prevent any issues.  
  _assert_current_branch_is_not "staging"

  # make sure release checklist doesn't exist yet
  _assert_no_release_checklist

  declare staging_tag_version; staging_tag_version="$(_get_latest_version "$STAGING_BRANCH")"
  declare prod_tag_version; prod_tag_version="$(_get_latest_version "$PROD_BRANCH")"

  # Check if tag versions match for prod and staging
  if [ "$staging_tag_version" != "$prod_tag_version" ]; then
    declare msg="ASSERTION ERROR - $STAGING_BRANCH and $PROD_BRANCH tag versions should match. "
    msg+="When the release cycle is closed, any fixes should have been applied to both enviroments (prod and staging), "
    msg+="and versions should have been bumped accordingly. This mismatch could mean this flow is incomplete."
    _exit_with_err_msg "$msg"
  fi

  # Bump tag version
  declare next_version; next_version=$(_bump_version_string "$staging_tag_version" 2)
  _log "Bumping $STAGING_BRANCH from version $staging_tag_version to $next_version"

  # create a new tag to make staging point to latest commit from master
  declare tag; tag="$(_format_version_tag "${next_version}" "${STAGING_ENV}")"
  _log "Creating tag ${tag} pointing to the top of ${MASTER_BRANCH} branch..."
  git tag -a -m "Started release cycle $next_version" "${tag}" "origin/$MASTER_BRANCH"

  # point staging branch head to master
  declare sha; sha=$(git log -n1 "${tag}" --format=%h)
  _log "Pointing ${STAGING_BRANCH} branch to tag ${tag}..."
  git branch -f "${STAGING_BRANCH}" "${sha}"

  # Update remote with new tag and branch head
  git push --atomic -f origin "${tag}" "${STAGING_BRANCH}"

  # make a new release checklist
  "$SCRIPT_DIR/make_release_checklist.sh"

  # deploy instructions
  _log "Release cycle ready. Please deploy ${tag} ($(git log -n1 "${tag}" --format=%h)) to ${STAGING_ENV}"
}

main "$@"
