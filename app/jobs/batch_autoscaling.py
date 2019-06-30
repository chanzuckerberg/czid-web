import traceback
import boto3

SCALING_PERMISSION_TAG = 'IDSeqEnvsThatCanScale'

def get_compute_environment_configuration(compute_environment_name, region):
    batch_client = boto3.client('batch', region_name=region)
    response = batch_client.describe_compute_environments(computeEnvironments=[compute_environment_name])
    compute_environment_data = response['computeEnvironments'][0]
    compute_resources = compute_environment_data['computeResources']
    scaling_permission = _get_scaling_permission(compute_resources)
    return {'minvCpus': compute_resources['minvCpus'], 'maxvCpus': compute_resources['maxvCpus'], 'scaling_permission': scaling_permission}

def _get_scaling_permission(compute_resources):
    scaling_permission = 'tags' in compute_resources and SCALING_PERMISSION_TAG in compute_resources['tags']
    return scaling_permission

def _set_compute_environment_min_capacity(vcpu_min_capacity, compute_environment_name, region):
    batch_client = boto3.client('batch', region_name=region)
    batch_client.update_compute_environment(computeEnvironment=compute_environment_name, computeResources={'minvCpus': vcpu_min_capacity})


def _check_pending_jobs_counts(queue_name, region, job_status_list=('RUNNING', 'STARTING', 'RUNNABLE')):
    return {job_status: _get_jobs_count(queue_name, region, job_status) for job_status in job_status_list}


def autoscale_compute_environments(batch_configurations):
    results = []
    for bc in batch_configurations:
        try:
            process_results = process_batch_configuration(bc)
            results.append({'batch_configuration': bc, 'process_results': process_results})
        except Exception as e:
            error_type = str(type(e))
            error_args = e.args
            results.append({'batch_configuration': bc, "error_type": error_type, "error_args": error_args, "traceback": traceback.format_exc(e)})
    return results


def calc_auto_scaling_recommendation(pending_jobs_counts, job_vcpus, current_vcpu_min, current_vcpu_max, scaling_permission):
    total_jobs_count = sum(pending_jobs_counts.values())
    total_jobs_vcpu = total_jobs_count * job_vcpus

    new_vcpu_min = min(total_jobs_vcpu, current_vcpu_max)

    change = scaling_permission and (new_vcpu_min != current_vcpu_min)

    return {
        'change': change,
        'new_vcpu_min': new_vcpu_min
    }


def process_batch_configuration(batch_configuration):
    job_vcpus, queue_name, region = (batch_configuration[i] for i in ('vcpus', 'queue_name', 'region'))
    compute_environment_name = _find_compute_environment_name(queue_name, region)
    current_configuration = get_compute_environment_configuration(compute_environment_name, region)
    current_vcpu_min, current_vcpu_max, scaling_permission = (current_configuration[i] for i in ('minvCpus', 'maxvCpus', 'scaling_permission'))
    pending_jobs_counts = _check_pending_jobs_counts(queue_name, region)

    autoscaling_recommendation = calc_auto_scaling_recommendation(pending_jobs_counts, job_vcpus, current_vcpu_min, current_vcpu_max, scaling_permission)

    if autoscaling_recommendation['change']:
        _set_compute_environment_min_capacity(autoscaling_recommendation['new_vcpu_min'], compute_environment_name, region)

    return {'current_configuration': current_configuration, 'compute_environment_name': compute_environment_name, 'pending_jobs_counts': pending_jobs_counts, 'autoscaling_recommendation': autoscaling_recommendation}


def _get_jobs_count(queue_name, region, job_status):
    batch_client = boto3.client('batch', region_name=region)
    response = batch_client.list_jobs(jobQueue=queue_name,
                                      maxResults=10000,
                                      jobStatus=job_status)
    return len(response['jobSummaryList'])


def _find_compute_environment_name(job_queues_name, region):
    batch_client = boto3.client('batch', region_name=region)
    response = batch_client.describe_job_queues(jobQueues=[job_queues_name])
    job_queue_description = response['jobQueues'][0]
    compute_environment_order = job_queue_description['computeEnvironmentOrder']
    if len(compute_environment_order) > 1:
        raise Exception('Batch queue {queue_name} has more than one compute environment. Not supported by autoscaler.py')
    compute_environment_arn = compute_environment_order[0]['computeEnvironment']
    compute_environment_name = compute_environment_arn.split('/')[1]
    return compute_environment_name
