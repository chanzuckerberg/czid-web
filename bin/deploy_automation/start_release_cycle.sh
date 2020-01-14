#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")  
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Start a new release cycle:
# - points stage branch master
# - creates a new staging version tag
# - creates new release checklist
main() {
  git fetch --all

  # make sure release checklist doesn't exist yet
  _assert_no_release_checklist

  declare staging_tag_version; staging_tag_version="$(_get_latest_version "$STAGING_BRANCH")"
  declare prod_tag_version; prod_tag_version="$(_get_latest_version "$PROD_BRANCH")"

  # Check if tag versions match for prod and staging
  if [ "$staging_tag_version" != "$prod_tag_version" ]; then
    _exit_with_err_msg "ASSERTION ERROR - $STAGING_BRANCH and $PROD_BRANCH tag versions should match."
  fi

  # Bump tag version
  declare next_version; next_version=$(_bump_version_string "$staging_tag_version" 2)
  _log "Bumping $STAGING_BRANCH from version $staging_tag_version to $next_version"

  # create a new tag to make staging point to latest commit from master
  declare tag; tag="$(_format_version_tag "${next_version}" "${STAGING_ENV}")"
  _log "Creating tag ${tag} pointing to the top of ${MASTER_BRANCH} branch..."
  git tag -af -m "Started release cycle $next_version" "${tag}" "origin/$MASTER_BRANCH"
  git push -f origin "${tag}"

  # point staging branch head to master
  declare sha; sha=$(git log -n1 "${tag}" --format=%h)
  _log "Pointing ${STAGING_BRANCH} branch to tag ${tag}..."
  git branch -f "${STAGING_BRANCH}" "${sha}"
  git push -f origin "${STAGING_BRANCH}"

  # make a new release checklist
  "$SCRIPT_DIR/make_release_checklist.sh"

  # # deploy instructions
  _log "Release cycle ready. Please deploy ${tag} ($(git log -n1 "${tag}" --format=%h)) to ${STAGING_ENV}"
}

main "$@"
