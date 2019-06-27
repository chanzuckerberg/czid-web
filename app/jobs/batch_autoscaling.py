import sys
import boto3

def get_compute_environment_capacity(compute_environment_name, region):
    batch_client = boto3.client('batch', region_name=region)
    response = batch_client.describe_compute_environments(computeEnvironments=[compute_environment_name])
    compute_resources = response['computeEnvironments'][0]['computeResources']
    return {'minvCpus': compute_resources['minvCpus'], 'maxvCpus': compute_resources['maxvCpus']}


def set_compute_environment_min_capacity(vcpu_min_capacity, compute_environment_name, region):
    batch_client = boto3.client('batch', region_name=region)
    batch_client.update_compute_environment(computeEnvironment=compute_environment_name, computeResources={'minvCpus': vcpu_min_capacity})


def check_pending_jobs_counts(queue_name, region, job_status_list=('RUNNABLE', 'STARTING', 'RUNNING')):
    return {job_status: get_jobs_count(queue_name, region, job_status) for job_status in job_status_list}


def autoscale_compute_environments(batch_configurations, dry_run=False):
    results = []
    for bc in batch_configurations:
        try:
            process_results = process_batch_configuration(bc, dry_run)
            results.append({'batch_configuration': bc, 'process_results': process_results})
        except Exception as e:
            error_type = str(type(e))
            error_args = e.args
            results.append({ 'batch_configuration': bc, "error_type": error_type, "error_args": error_args})
    return results


def process_batch_configuration(batch_configuration, dry_run=False):
    job_vcpus, queue_name, region = (batch_configuration[i] for i in ('vcpus', 'queue_name', 'region'))
    compute_environment_name = find_compute_environment_name(queue_name, region)
    current_capacity = get_compute_environment_capacity(compute_environment_name, region)
    current_vcpu_min, current_vcpu_max = (current_capacity[i] for i in ('minvCpus', 'maxvCpus'))

    pending_jobs_counts = check_pending_jobs_counts(queue_name, region)
    total_jobs_count = sum(pending_jobs_counts.values())
    total_jobs_vcpu = total_jobs_count * job_vcpus

    new_vcpu_min = min(total_jobs_vcpu, current_vcpu_max)

    if (new_vcpu_min != current_vcpu_min) and not dry_run:
        changed = True
        set_compute_environment_min_capacity(new_vcpu_min, compute_environment_name, region)
    else:
        changed = False

    return {
        'current_vcpu_max': current_vcpu_max,
        'total_jobs_count': total_jobs_count,
        'total_jobs_vcpu': total_jobs_vcpu,
        'old_vcpu_min': current_vcpu_min,
        'new_vcpu_min': new_vcpu_min,
        'changed': changed
    }


def get_jobs_count(queue_name, region, job_status):
    batch_client = boto3.client('batch', region_name=region)
    response = batch_client.list_jobs(jobQueue=queue_name,
                                      maxResults=10000,
                                      jobStatus=job_status)
    return len(response['jobSummaryList'])


def find_compute_environment_name(job_queues_name, region):
    batch_client = boto3.client('batch', region_name=region)
    response = batch_client.describe_job_queues(jobQueues=[job_queues_name])
    job_queue_description = response['jobQueues'][0]
    compute_environment_order = job_queue_description['computeEnvironmentOrder']
    if len(compute_environment_order) > 1:
        raise Exception('Batch queue {queue_name} has more than one compute environment. Not supported by autoscaler.py')
    compute_environment_arn = compute_environment_order[0]['computeEnvironment']
    compute_environment_name = compute_environment_arn.split('/')[1]
    return compute_environment_name
