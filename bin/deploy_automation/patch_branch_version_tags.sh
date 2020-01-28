#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Checks prod and staging branchs to detect eventual additional commits after last tag.
# If there are additional commits, create a new tag for that environment and bump the
# patch version (ex: v0.24_staging_... -> v0.24.1_staging_...)
main() {
  git fetch --all

  __patch_version_tag "$STAGING_BRANCH" "$STAGING_ENV" "Release fix"
  __patch_version_tag "$PROD_BRANCH" "$PROD_ENV" "Hot fix"
}

__patch_version_tag() {
  declare branch_name="$1"
  declare env_name="$2"
  declare fix_name="$3"

  _log "Checking tag versions for '$env_name'"

  declare tag_name; tag_name="$(_get_latest_tag "$env_name")"
  declare tag_version; tag_version="$(_get_latest_version "$env_name")"
  declare tag_commit; tag_commit="$(_get_latest_commit "$tag_name")"
  declare branch_commit; branch_commit="$(_get_latest_commit "origin/$branch_name")"

  if [ -z "$tag_name" ] || [ -z "$tag_commit" ] || [ -z "$branch_commit" ]; then
    _exit_with_err_msg "Information is missing. tag_name=[$tag_name], tag_commit=[$tag_commit], branch_commit=[$branch_commit]"
  fi

  if [ "$tag_commit" != "$branch_commit" ]; then
    _log "There are additional commits in branch '$branch_name' since tag '$tag_name'. Bumping patch version."
    declare next_version; next_version="$(_bump_version_string "$tag_version" 3)"
    declare next_tag; next_tag="$(_format_version_tag "${next_version}" "${env_name}")"
    git tag -af -m "$fix_name $next_version" "${next_tag}" "origin/$branch_name"
    git push -f origin "${next_tag}"
    _log "Branch '$branch_name' tag bumped to '$next_tag'."
  else
    _log "Branch '$branch_name' is already in the correct version. Keeping tag $tag_name."
  fi
}

main "$@"
