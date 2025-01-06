#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Close release cycle
# - Update the current release checklist with any release fixes
# - Make sure all items from current release checklist are checked
# - Create a new tag for `prod` pointing to HEAD of `staging`,
#   preserving version number (ex: if staging version is v0.24.1_staging_...,
#   this step will create a v0.24.1_prod_... tag)
# - Set HEAD of prod branch to this new tag
# Note: You need to manually deploy after this task
main() {
  _git_fetch_and_cleanup

  # Ensure current branch is not prod
  # This command will set prod HEAD to a different commit,
  # and we want to be in a different branch to prevent any issues.
  _assert_current_branch_is_not "prod"

  # Update release checklist
  "$SCRIPT_DIR/update_release_checklist.sh"

  # Load current checklist
  declare checklist_json; checklist_json=$(_get_current_release_checklist_json)

  if [ "$checklist_json" == "null" ]; then
    _log "No release checklist found. Skipping validation and closing release cycle."
  else
    declare checklist_body; checklist_body=$(jq -er .body <<< "$checklist_json")
    declare checklist_html_url; checklist_html_url=$(jq -er .html_url <<< "$checklist_json")

    # Verify if there is at least one item in the checklist
    if ! ( grep -qE '^\s*\*\s*\[[xX ]+\]' <<< "$checklist_body" ); then
      _exit_with_err_msg "INVALID STATE: Couldn't find any items in the release checklist." \
                         "Please check $checklist_html_url and restart the process"
    fi

    # Verify if there are unchecked items left
    if ( grep -qE '^\s*\*\s*\[[^xX]\]' <<< "$checklist_body" ); then
      _exit_with_err_msg "INVALID STATE: There are unchecked items in the release checklist." \
                         "Please check $checklist_html_url and restart the process"
    fi
  fi

  # Create a new tag for `prod` pointing to HEAD of `staging`
  declare staging_tag_version; staging_tag_version="$(_get_latest_version staging)"
  declare tag; tag="$(_format_version_tag "${staging_tag_version}" "${PROD_BRANCH}")"
  _log "Creating tag ${tag} to point ${PROD_BRANCH} to the head of ${STAGING_BRANCH} branch..."
  git tag -a -m "Release $staging_tag_version" "${tag}" "origin/$STAGING_BRANCH"
  sleep 5

  # Validate the tag and commit hash
  declare sha; sha=$(_get_latest_commit "${tag}")
  if [ -z "$sha" ]; then
    _log "ERROR: Target commit hash (sha) for prod is undefined. Exiting to avoid branch deletion."
    exit 1
  fi
  if ! git show-ref --quiet "refs/tags/${tag}"; then
    _log "ERROR: Tag ${tag} was not created successfully. Exiting to avoid branch issues."
    exit 1
  fi

  # Ensure the prod branch exists locally before updating
  if ! git show-ref --quiet "refs/heads/${PROD_BRANCH}"; then
    _log "ERROR: Local ${PROD_BRANCH} branch does not exist. Exiting to avoid branch issues."
    exit 1
  fi

  # Set HEAD of prod branch to this new tag
  _log "Pointing ${PROD_BRANCH} branch to tag ${tag} (${sha})."
  git branch -f "${PROD_BRANCH}" "${sha}"
  sleep 5

  # Update remote with new tag and branch head
  _log "Pushing tag ${tag} and branch ${PROD_BRANCH} to remote..."
  git push --atomic -f origin "${tag}" "${PROD_BRANCH}" || {
    _log "ERROR: Failed to push changes to remote. Exiting."
    exit 1
  }
  sleep 5

  # deploy instructions
  _log "Release cycle $staging_tag_version successfully closed." \
       "Please deploy ${tag} ($(git log -n1 "${tag}" --format=%h --abbrev=8)) to ${PROD_ENV}"
}

main "$@"
