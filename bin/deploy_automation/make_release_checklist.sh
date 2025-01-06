#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Compare staging to prod and create a draft pull request in github
# with commits that are only in staging
main() {
  _git_fetch_and_cleanup

  # make sure release checklist doesn't exist yet
  _assert_no_release_checklist

  declare major_minor_version; major_minor_version="$(_get_latest_version "$STAGING_BRANCH" | cut -d. -f1-2)"
  __make_release_checklist "$STAGING_BRANCH" "$PROD_BRANCH" "[RELEASE_CHECKLIST] - v${major_minor_version}"
}

__make_release_checklist() {
  declare source_branch="$1"
  declare target_branch="$2"
  declare title="$3"

  declare source_commit; source_commit=$(_get_latest_commit "origin/$source_branch")
  declare target_commit; target_commit=$(_get_latest_commit "origin/$target_branch")

  # Check if there are any commits between source and target
  declare commit_count; commit_count=$(git rev-list "${target_commit}..${source_commit}" | wc -l)
  if [ "$commit_count" -eq "0" ]; then
    _log "No new commits found between ${target_branch} and ${source_branch}. Skipping release checklist creation."
    exit 0
  fi

  declare release_checklist_body; release_checklist_body=$(
    echo "# Release checklist"
    echo "_Please check your commits after testing. Do not checkoff commits which have dependencies that are not yet deployed in prod:_"
    git log --date-order --abbrev=8 --pretty=format:$'### %an\t* [ ] %h - % %s %d (%cD)' "${target_commit}..${source_commit}" \
      | awk -F $'\t' '{ a[$1] = a[$1] "\n" $2; } END { for (i in a) print i a[i]; }'
    echo
    echo "_(included commits: ($source_commit)..($target_commit), created on $(date '+%Y-%m-%d %H:%M:%S'))_"
    echo
    echo "# Release/Hot fixes"
    echo '_Make sure all your release/hot fixes are listed here. Check your commits after testing and cherry-picking to staging/main accordingly. Do not checkoff commits which have dependencies that are not yet deployed in prod:_'
  )

  _log "Creating release checklist..."
  _log "Source commit: ($source_commit)"
  _log "Target commit: ($target_commit)"
  _log "Release checklist body:\n$release_checklist_body"

  declare response_json
  if response_json=$(
    # see https://developer.github.com/v3/pulls/#create-a-pull-request
    http --ignore-stdin --check-status --timeout=30 POST "${GITHUB_REPOSITORY_API}/pulls" \
      "Accept:application/vnd.github.shadow-cat-preview+json" \
      "Authorization:token $GITHUB_TOKEN" \
      "title=${title}" \
      "head=${source_branch}" \
      "base=${target_branch}" \
      "body=${release_checklist_body}" \
      draft=true
  ); then
    declare url; url=$(jq -e .html_url <<< "$response_json")
    _log "Release checklist created: $url"
  else
    _exit_with_err_msg "ERROR creating release checklist. Error code: $?. Details: $response_json"
  fi
}

main "$@"
