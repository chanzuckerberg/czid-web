#!/bin/bash

set -eo pipefail

if [[ $# == 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "Usage: $0 cluster_name task_name command ..." 1>&2
    echo "Example: $0 prod idseq-prod-web rails console" 1>&2
    echo "Run '$0 cluster_name' to see the list of tasks" 1>&2
    exit
fi

cluster=$1
shift

if [[ -z "$BLESS_CONFIG" ]] && [[ -f "$(dirname $0)/../../idseq-infra/blessconfig.yml" ]]; then
    export BLESS_CONFIG="$(dirname $0)/../../idseq-infra/blessconfig.yml"
elif [[ -z "$BLESS_CONFIG" ]]; then
    echo "Please set the environment variable BLESS_CONFIG to the location of the idseq-infra/blessconfig.yml file" 1>&2
    exit
fi

tasks=$(aegea ecs tasks --cluster $cluster --desired-status RUNNING --json | jq -r .[].taskDefinitionArn | cut -f 2 -d / | cut -f 1 -d : | sort | uniq)

if [[ $# == 0 ]]; then
    echo -e "ECS tasks running in $cluster:\n$tasks"
    exit
else
    export task=$1
    shift
fi

task_arn=$(aegea ecs tasks --cluster $cluster --desired-status RUNNING --json | jq -r '.[]|select(.taskDefinitionArn|test("task-definition/" + env.task + ":"))|.taskArn' | head -n 1)
container_instance_arn=$(aws ecs describe-tasks --cluster $cluster --tasks $task_arn | jq -r .tasks[0].containerInstanceArn)
instance_id=$(aws ecs describe-container-instances --cluster $cluster --container-instances "$container_instance_arn" | jq -r .containerInstances[0].ec2InstanceId)
docker_container_id=$(aws ecs describe-tasks --cluster $cluster --tasks $task_arn | jq -r .tasks[0].containers[0].runtimeId)
if [[ $cluster == "idseq-public-ecs" ]]; then cluster="public"; fi
aws s3 cp "s3://idseq-secrets/idseq-${cluster}.pem" - | ssh-add -
aegea ssh --no-ssm -t ec2-user@$instance_id docker exec -it $docker_container_id bin/entrypoint.sh "$@"
