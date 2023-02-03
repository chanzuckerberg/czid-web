#!/bin/bash
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
source "$SCRIPT_DIR/_global_vars.sh"
source "$SCRIPT_DIR/_shared_functions.sh"

# Deploy a git rev to an environment.
# This command will wait for the commit of this git rev
# to be available in Docker hub and passed all checks in github before deploying it
main() {
  declare force=${force:-false};
  while getopts "f" opt; do
    # Ex: ./deploy_rev.sh -f ...
    case ${opt} in
      f )
        force=true
        shift $((OPTIND-1))
        ;;
    esac
  done
  declare env="$1" # staging / prod
  declare git_rev="$2" # https://git-scm.com/docs/git-rev-parse#_specifying_revisions
  declare deployed_by="$3" # the name of the developer who triggered the deployment
  declare deployment_reason="$4" # why the deployment is being triggered

  _git_fetch_and_cleanup

  declare sha; sha=$(git log -n1 "${git_rev}" --format=%h --abbrev=8)
  declare docker_image="${ECR_REPOSITORY_NAME}:sha-$sha"

  _log "Starting deployment of $git_rev (sha-$sha) to $env"

  _log "Checking if docker image $docker_image is available"
  if ! __retry 15 60 __docker_tag_exists "${ECR_REPOSITORY_NAME}" "sha-$sha"; then
    _exit_with_err_msg "Couldn't find image ${docker_image} in docker hub"
  fi

  if [ "$force" == true ] ; then
    _log "WARNING: Force deploy mode detected. Please use this sparingly"
    _log "Skipping Github state check"
  else
    _log "Checking if Github commit ${sha} in a valid state"
    if ! __retry 15 60 __check_commit_state "${sha}" "$env"; then
      _exit_with_err_msg "Commit ${sha} is in an invalid state. Aborting deployment. More details at $GITHUB_REPOSITORY_URL/commits/${env}"
    fi
  fi

  _log "Creating deployment event on Github"
  declare github_deploy_id=$(__start_github_deploy "${sha}" "$env")

  "$SCRIPT_DIR/../deploy" "$env" "sha-$sha" "$deployed_by" "$deployment_reason"

  _log "Marking successful deploy on Github"
  __finish_github_deploy "$github_deploy_id"
}

__docker_tag_exists() {
  declare repository_name="$1"
  declare tag="$2"
  aws ecr describe-images --repository-name "$repository_name" --image-ids imageTag="$tag" | jq -e
}

__check_commit_state() {
  declare sha="$1"
  declare branch="$2"
  # Get everything after `origin/` since the Github API will fail to find the workflow runs for a branch name prefixed with `origin/`
  declare git_rev_without_origin_prefix=${git_rev/origin\/}

  # Fetch latest idseq-web build Docker image (build-docker-image.yml) workflow run for the branch being deployed
  build_docker_images_workflow_run_response=$(http --ignore-stdin --timeout 30 --check-status -b GET \
              "$GITHUB_REPOSITORY_API/actions/workflows/build-docker-image.yml/runs" \
              branch==$git_rev_without_origin_prefix \
              Authorization:"token $GITHUB_TOKEN" \
              Accept:application/vnd.github.v3+json)

  if jq -re '.workflow_runs[0] | select(.conclusion != "success")' <<< "$build_docker_images_workflow_run_response"; then
    _trace "The build-docker-image.yml workflow for commit ${sha} in branch ${branch} has either failed or is still in progress. More details at $GITHUB_REPOSITORY_URL/commits/${branch}"
    return 1
  fi

  # Fetch latest idseq-web check (check.yml) workflow run for the branch being deployed
  check_workflow_run_response=$(http --ignore-stdin --timeout 30 --check-status -b GET \
            "$GITHUB_REPOSITORY_API/actions/workflows/check.yml/runs" \
            branch==$git_rev_without_origin_prefix \
            Authorization:"token $GITHUB_TOKEN" \
            Accept:application/vnd.github.v3+json)

  if jq -re '.workflow_runs[0] | select(.conclusion != "success")' <<< "$check_workflow_run_response"; then
    _trace "The check.yml workflow for commit ${sha} in branch ${branch} has either failed or is still in progress. More details at $GITHUB_REPOSITORY_URL/commits/${branch}"
    return 1
  fi
}

__start_github_deploy() {
  declare sha="$1"
  declare env="$2"

  deployment_args=$(jq -n ".auto_merge=false | .ref=\"${sha}\" | .environment=\"${env}\" | .required_contexts=[]")
  response_json=$(gh api repos/:owner/:repo/deployments --input - <<< "$deployment_args")
  jq '.id' <<< "$response_json"
}

__finish_github_deploy() {
  declare deploy_id="$1"

  status_args=$(jq -n ".state=\"success\"")
  gh api repos/:owner/:repo/deployments/$deploy_id/statuses --input - <<< "$status_args"
}

__retry() {
  declare attempts="$1"
  declare sleep_seconds="${2}"
  declare cmd="${*:3}"

  declare n=0
  declare exit_code
  until [[ $n -ge $attempts ]]; do
    { $cmd && exit_code=0 && break; } || {
      exit_code=$?
      ((n++))
      _trace "Command failed with exit code $exit_code. Waiting ${sleep_seconds} seconds before next attempt ($n of $attempts)"
      sleep "$sleep_seconds";
    }
  done
  return $exit_code
}

main "$@"
