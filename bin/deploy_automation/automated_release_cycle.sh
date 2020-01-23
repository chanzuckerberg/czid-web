#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")  
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Execute release cycle basic automation
# - Close previous release cycle
# - Opens a new release cycle
# - Prints deployment commands to be executed in a separate terminal
main() {
  _log "**** CHECKING TAG VERSIONS FOR RELEASE/HOT FIXES ****"
  "$SCRIPT_DIR/patch_branch_version_tags.sh"

  _log "**** CLOSING RELEASE CYCLE ****"
  "$SCRIPT_DIR/close_release_cycle.sh"

  _log "**** STARTING NEW RELEASE CYCLE ****"
  "$SCRIPT_DIR/start_release_cycle.sh"

  declare staging_tag; staging_tag="$(_get_latest_tag "$STAGING_ENV")"
  declare prod_tag; prod_tag="$(_get_latest_tag "$PROD_ENV")"

  declare msg;
  msg="**** READY FOR DEPLOYMENT ****${LF}"
  msg+="${YELLOW}PLEASE EXECUTE THE FOLLOWING COMMANDS${LF}"
  msg+="./bin/deploy_automation/deploy_tag.sh staging '${staging_tag}'${LF}"
  msg+="./bin/deploy_automation/deploy_tag.sh prod '${prod_tag}'"
  _log "$msg"
}

main "$@"