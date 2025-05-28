#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Start a new release cycle:
# - Create a new staging tag, pointing to HEAD of main branch.
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
  declare should_make_release_checklist=${1:-false}
  declare staging_tag_version; staging_tag_version="$(_get_latest_version "$STAGING_BRANCH")"
  declare prod_tag_version; prod_tag_version="$(_get_latest_version "$PROD_BRANCH")"

  # Check if tag versions match for prod and staging
  # Debug: Log the tag versions before comparison
  _log "DEBUG: Staging tag version: $staging_tag_version"
  _log "DEBUG: Prod tag version: $prod_tag_version"
  if [ "$staging_tag_version" != "$prod_tag_version" ]; then
    declare msg="ASSERTION ERROR - $STAGING_BRANCH and $PROD_BRANCH tag versions should match. "
    msg+="When the release cycle is closed, any fixes should have been applied to both enviroments (prod and staging), "
    msg+="and versions should have been bumped accordingly. This mismatch could mean this flow is incomplete."
    _exit_with_err_msg "$msg"
  fi

  # Check if the remote staging branch exists.
  if ! git show-ref --verify --quiet "refs/remotes/origin/$STAGING_BRANCH"; then
    _log "No remote branch found for origin/$STAGING_BRANCH. Creating it from origin/$MAIN_BRANCH."
    # If staging does not exist, create it from the current main branch.
    git branch "$STAGING_BRANCH" "origin/$MAIN_BRANCH"
  else
    # If staging exists, check if there are any new commits in main that are not in staging.
    declare commit_count; commit_count=$(git rev-list "origin/$STAGING_BRANCH".."origin/$MAIN_BRANCH" | wc -l)
    if [ "$commit_count" -eq "0" ]; then
      _log "No new commits found from origin/${MAIN_BRANCH} to origin/${STAGING_BRANCH}. Staging branch will remain the same."
      return 0
    fi
  fi

  # Bump tag version
  declare next_version; next_version=$(_bump_version_string "$staging_tag_version" 2)
  _log "Bumping $STAGING_BRANCH from version $staging_tag_version to $next_version"

  # create a new tag to make staging point to latest commit from main
  declare tag; tag="$(_format_version_tag "${next_version}" "${STAGING_ENV}")"
  _log "Creating tag ${tag} pointing to the top of ${MAIN_BRANCH} branch..."
  git tag -a -m "Started release cycle $next_version" "${tag}" "origin/$MAIN_BRANCH"
  sleep 5


  # Get the commit hash for the tag
  declare sha; sha=$(git log -n1 "${tag}" --format=%h --abbrev=8)

  # Validate the tag and commit hash
  if [ -z "$sha" ]; then
    _log "ERROR: Target commit hash (sha) for staging is undefined. Exiting to avoid branch deletion."
    exit 1
  fi
  if ! git show-ref --quiet "refs/tags/${tag}"; then
    _log "ERROR: Tag ${tag} was not created successfully. Exiting to avoid branch issues."
    exit 1
  fi

  # point staging branch head to main
  _log "Updating ${STAGING_BRANCH} branch to point to tag ${tag} (${sha})."
  git branch -f "${STAGING_BRANCH}" "${sha}"
  sleep 5
  # Update remote with new tag and branch head

  # Push the changes to the remote
  _log "Pushing tag ${tag} and branch ${STAGING_BRANCH} to remote..."
  git push --atomic -f origin "${tag}" "${STAGING_BRANCH}:refs/heads/${STAGING_BRANCH}"

  if [ "$should_make_release_checklist" == true ]; then
    # make a new release checklist
    "$SCRIPT_DIR/make_release_checklist.sh"
  fi

  # deploy instructions
  _log "Release cycle ready." \
       "Please deploy ${tag} ($(git log -n1 "${tag}" --format=%h --abbrev=8)) to ${STAGING_ENV}"
}

main "$@"
