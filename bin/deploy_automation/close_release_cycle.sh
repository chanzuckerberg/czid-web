#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Close release cycle
# - Update release checklist with release fixes
# - Verify if all items from release checklist are checked
# - Create a new tag for prod using same version as staging
# - Reset prod branch to this new tag
# Note: You need to manually deploy after this task
main() {
  git fetch --all

  # Update release checklist
  "$SCRIPT_DIR/update_release_checklist.sh"

  # Load current checklist
  declare checklist_json; checklist_json=$(_get_current_release_checklist_json)
  declare checklist_body; checklist_body=$(jq -er .body <<< "$checklist_json")
  declare checklist_html_url; checklist_html_url=$(jq -er .html_url <<< "$checklist_json")

  # Verify if there is at least one item in the check list
  if ! ( grep -qE '^\s*\*\s*\[[xX ]+\]' <<< "$checklist_body" ); then
    _exit_with_err_msg "INVALID STATE: Couldn't find any items in the release checklist. Please check $checklist_html_url"
  fi

  # Verify if there are unchecked items left
  if ( grep -qE '^\s*\*\s*\[[^xX]\]' <<< "$checklist_body" ); then
    _exit_with_err_msg "INVALID STATE: There are unchecked items in the release checklist. Please check $checklist_html_url"
  fi

  # create a new tag for prod pointing prod to head of staging branch
  declare staging_tag_version; staging_tag_version="$(_get_latest_version staging)"
  declare tag; tag="$(_format_version_tag "${staging_tag_version}" "${PROD_BRANCH}")"
  _log "Creating tag ${tag} to point ${PROD_BRANCH} to the head of ${STAGING_BRANCH} branch..."
  git tag -af -m "Release $staging_tag_version" "${tag}" "origin/$STAGING_BRANCH"
  git push -f origin "${tag}"

  # reset prod branch head to staging
  declare sha; sha=$(git log -n1 "${tag}" --format=%h)
  _log "Pointing prod branch to tag ${tag}..."
  git branch -f "${PROD_BRANCH}" "${sha}"
  git push -f origin "${PROD_BRANCH}"

  # deploy instructions
  _log "Release cycle $staging_tag_version successfully closed."
}

main "$@"
