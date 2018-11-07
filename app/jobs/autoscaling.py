#!/usr/bin/env python
import json
import os
import sys
import subprocess
import time
import hashlib
import random
import threading
import datetime
import dateutil.parser
from operator import itemgetter
from functools import wraps

# As opposed to "development", where different containers belong to different developers.
MULTICONTAINER_ENVIRONMENTS = ["staging", "prod"]


# If you are running into problems with this autoscaler, just delete this tag from
# any affected autoscaling group, and it will be left alone.  The value is a list
# of environments permitted to trigger scaling, usually just "prod".
SCALING_PERMISSION_TAG = "IDSeqEnvsThatCanScale"


SCALING_METRIC_TAG_PREFIX = "IDSeqScalingData_"
SCALING_METRIC_TAG_FORMAT = SCALING_METRIC_TAG_PREFIX + "{environment}"

# A value recorded this many minutes earlier will be ignored
EXPIRATION_PERIOD_MINUTES = 60

DEBUG = False


## constants specific to draining / safe scale-down:
GRACE_PERIOD_SECONDS__JOB_DISPATCH_LAG = 300
GRACE_PERIOD_SECONDS__JOB_TAG_KEEP_ALIVE = 300


## EXPLANATION OF STATE TRANSITIONS FOR GSNAP/RAPSEARCH MACHINES
'''
{ service: gsnap-prod-initializing, ProtectedFromScaleIn: True }
Initializing. Scale-in protection automatically granted at birth.
    |
    V
{ service: gsnap-prod, ProtectedFromScaleIn: True }
In service, accepting chunks. Scale-in protection present.
    |
    V
{ service: gsnap-prod, ProtectedFromScaleIn: True,
  RunningIDseqBatchJob_X1: Y1, RunningIDseqBatchJob_X2: Y2, ...
}
Processing chunks.
    |
    V
{ service: gsnap-prod, draining: T0, ProtectedFromScaleIn: True }
Draining. Scale-in protection still present.
Can still accept chunks for up to min_draining_wait seconds after entering this state.
Can still finish running chunks for up to (min_draining_wait + job_tag_expiration) seconds after entering this state.
    |
    V
{ service: gsnap-prod, draining: T0, ProtectedFromScaleIn: False }
Discarded. Scale-in protection withdrawn on transition to this state.
'''


def retry(operation, randgen=random.Random().random):
    # Note the use of a separate random generator for retries so transient
    # errors won't perturb other random streams used in the application.
    @wraps(operation)
    def wrapped_operation(*args, **kwargs):
        remaining_attempts = 3
        delay = 1.0
        while remaining_attempts > 1:
            try:
                return operation(*args, **kwargs)
            except:
                time.sleep(delay * (1.0 + randgen()))
                delay *= 3.0
                remaining_attempts -= 1
        # The last attempt is outside try/catch so caller can handle exception
        return operation(*args, **kwargs)
    return wrapped_operation


@retry
def aws_command(command_str):
    return subprocess.check_output(command_str, shell=True)


def find_asg(asg_list, name_prefix):
    matching = []
    for asg in asg_list:
        if asg['AutoScalingGroupName'].startswith(name_prefix):
            matching.append(asg)
    assert len(matching) == 1
    return matching[0]


def at_most(upper_limit):
    return lambda n: min(n, upper_limit)


def at_least(lower_limit):
    return lambda n: max(n, lower_limit)


def exactly(value):
    return lambda _n: value


def get_tag(asg, tag_key):
    for tag in asg['Tags']:
        if tag['Key'] == tag_key:
            return tag['Value']
    return None


def get_tags_by_prefix(asg, tag_key_prefix):
    results = {}
    for tag in asg['Tags']:
        if tag['Key'].startswith(tag_key_prefix):
            assert tag['Key'] not in results
            results[tag['Key']] = tag['Value']
    return results


def set_tag(asg, key, value):
    cmd = "aws autoscaling create-or-update-tags --tags ResourceId={asg_name},ResourceType=auto-scaling-group,Key={key},Value={value},PropagateAtLaunch=false"
    cmd = cmd.format(asg_name=asg['AutoScalingGroupName'], key=key, value=value)
    if DEBUG:
        print cmd
    aws_command(cmd)


def set_metric_value(asg, value, my_environment):
    tag_key = SCALING_METRIC_TAG_FORMAT.format(environment=my_environment)
    # parsed in update_metric_values
    tag_value = "{unixtime:d}::{value:d}".format(unixtime=unixtime_now(), value=int(value))
    set_tag(asg, tag_key, tag_value)
    return (tag_key, tag_value)


def environment(tag):
    return tag[len(SCALING_METRIC_TAG_PREFIX):]


def delete_expired_metric_tags(asg, garbage_tag_keys):
    # Gargbage collect expired development (non-cloud) environment tags so as to stay below the aws 50 tags limit.
    garbage_tags = []
    tag_pattern = "ResourceId={asg_name},ResourceType=auto-scaling-group,Key={key}"
    for gtk in garbage_tag_keys:
        if environment(gtk) not in MULTICONTAINER_ENVIRONMENTS:
            garbage_tags.append(tag_pattern.format(asg_name=asg['AutoScalingGroupName'], key=gtk))
    if garbage_tags:
        cmd = "aws autoscaling delete-tags --tags " + " ".join(garbage_tags)
        if DEBUG:
            print cmd
        aws_command(cmd)


def permission_to_scale(asg, my_environment):
    allowed_envs = get_tag(asg, SCALING_PERMISSION_TAG)
    if allowed_envs == None:
        # Let's hope this never overwrites anything important.
        # set_tag(asg, SCALING_PERMISSION_TAG, "joe_test_123")
        return False
    return my_environment in set(s.strip() for s in allowed_envs.split(","))


def update_metric_values(asg, value, my_environment):
    mvals = get_tags_by_prefix(asg, SCALING_METRIC_TAG_PREFIX)
    my_key, my_val = set_metric_value(asg, value, my_environment)
    mvals[my_key] = my_val
    if DEBUG:
        print json.dumps(mvals, indent=2)
    results = {}
    expired_keys = []
    for k, v in mvals.items():
        parts = v.split("::")
        unixtime = int(parts[0])
        if unixtime_now() - unixtime < EXPIRATION_PERIOD_MINUTES * 60:
            results[k] = int(parts[1])
        else:
            expired_keys.append(k)
            if DEBUG:
                print "Expired value {} for key {}".format(v, k)
    delete_expired_metric_tags(asg, expired_keys)
    return results


def count_healthy_instances(asg, tag_list, draining_tag):
    draining_instance_ids = get_draining_servers(asg, tag_list, draining_tag).keys()
    num_draining = len(draining_instance_ids)
    num_healthy = 0
    for inst in asg["Instances"]:
        if inst["InstanceId"] not in draining_instance_ids and \
            inst["ProtectedFromScaleIn"] and inst["HealthStatus"] == "Healthy" and inst["LifecycleState"] != "Terminating":
            num_healthy += 1
    return num_healthy, num_draining


def get_previous_desired(asg):
    return int(asg.get("DesiredCapacity", asg.get("MinSize", 0)))


def clamp_to_valid_range(asg, desired_capacity):
    min_size = int(asg.get("MinSize", desired_capacity))
    max_size = int(asg.get("MaxSize", desired_capacity))
    if desired_capacity < min_size:
        print "Clamping {} up to {}".format(desired_capacity, min_size)
        desired_capacity = min_size
    if desired_capacity > max_size:
        print "Clamping {} down to {}".format(desired_capacity, max_size)
        desired_capacity = max_size
    return desired_capacity


def set_desired_capacity(asg, asg_instance_name, tag_list, draining_tag, compute_desired_instances, can_scale=True):
    asg_name = asg['AutoScalingGroupName']
    num_healthy, num_draining = count_healthy_instances(asg, tag_list, draining_tag)
    previous_desired = get_previous_desired(asg)
    # Manually input MinCapacity will never be reduced so long as there are pending jobs.
    num_desired = clamp_to_valid_range(asg, compute_desired_instances(previous_desired))
    if num_desired == previous_desired:
        action = "should remain"
    else:
        action = "should change to"
    cmd = "aws autoscaling set-desired-capacity --auto-scaling-group-name {asg_name} --desired-capacity {num_desired}"
    cmd = cmd.format(asg_name=asg_name, num_desired=num_desired)
    msg = "Autoscaling group {asg_name} has {num_healthy} healthy and {num_draining} draining instance(s). Desired capacity {action} {num_desired}."
    print msg.format(asg_name=asg_name, num_healthy=num_healthy, num_draining=num_draining, action=action, num_desired=num_desired)
    if can_scale:
        if DEBUG:
            print cmd
        if num_desired < num_healthy:
            start_draining(asg_instance_name, draining_tag, num_healthy - num_desired)
        elif num_desired > num_healthy:
            stop_draining(asg, tag_list, draining_tag, num_desired - num_healthy)
        aws_command(cmd)


def unixtime_now():
    return int(time.time())


def iso2unixtime(iso_str):
    return int(dateutil.parser.parse(iso_str).strftime('%s'))


def get_instance_tags():
    '''
    Return a list of tags, of the form:
    [
      {"Key": ..., "ResourceId": ..., "ResourceType": ..., "Value": ...},
      {"Key": ..., "ResourceId": ..., "ResourceType": ..., "Value": ...},
      ...
    ]
    '''
    cmd = "aws ec2 describe-tags --filters 'Name=resource-type,Values=instance' --no-paginate"
    tag_dict = json.loads(aws_command(cmd))
    return tag_dict["Tags"]


def instances_in(asg):
    return [item["InstanceId"] for item in asg["Instances"]]


def find_tags_for_instances_in(asg, tag_list):
    instance_ids = instances_in(asg)
    return [tag for tag in tag_list if tag["ResourceId"] in instance_ids]


def add_draining_tag(instance_ids, draining_tag):
    cmd = "aws ec2 create-tags --resources {list_instances} --tags Key={draining_tag},Value={timestamp}"
    cmd = cmd.format(list_instances=' '.join(instance_ids), draining_tag=draining_tag, timestamp=unixtime_now())
    aws_command(cmd)


def remove_draining_tag(instance_ids, draining_tag):
    delete_tags_from_instances(instance_ids, [draining_tag])


def start_draining(asg_instance_name, draining_tag, num_instances):
    instance_ids = instances_to_drain(asg_instance_name, draining_tag, num_instances)
    if instance_ids:
        print "Starting to drain the following instances: " + ",".join(instance_ids)
        add_draining_tag(instance_ids, draining_tag)


def stop_draining(asg, tag_list, draining_tag, num_instances):
    instance_ids = instances_to_rescue(asg, tag_list, draining_tag, num_instances)
    if instance_ids:
        print "Stopping drainage of the following instances: " + ",".join(instance_ids)
        remove_draining_tag(instance_ids, draining_tag)


def instances_to_drain(asg_instance_name, draining_tag, num_instances):
    cmd = "aws ec2 describe-instances --filters 'Name=tag:Name,Values={asg_instance_name}' --query 'Reservations[*].Instances[*].[InstanceId,LaunchTime,Tags]' --no-paginate"
    cmd = cmd.format(asg_instance_name=asg_instance_name)
    aws_response = json.loads(aws_command(cmd))
    zipped_instance_ids_and_launch_times = [(instance[0], iso2unixtime(instance[1]))
        for instance_list in aws_response
        for instance in instance_list
        if draining_tag not in [tag["Key"] for tag in instance[2]]
    ]
    instance_ids_sorted_by_increasing_launch_time = [item[0] for item in sorted(zipped_instance_ids_and_launch_times, key=itemgetter(1))]
    return instance_ids_sorted_by_increasing_launch_time[:num_instances]


def instances_to_rescue(asg, tag_list, draining_tag, num_instances):
    '''
    Rescue the instances that have been draining for the least amount of time.
    That way we can probably terminate the non-rescued instances sooner.
    '''
    draining_instances = get_draining_servers(asg, tag_list, draining_tag)
    draining_instances_sorted = [key for key, value in sorted(draining_instances.items(), key=itemgetter(1), reverse=True)]
    return draining_instances_sorted[:num_instances]


def get_draining_servers(asg, tag_list, draining_tag):
    ''' returns a map of draining instance IDs to the time they started draining '''
    protected_instance_ids = [inst["InstanceId"] for inst in asg["Instances"] if inst["ProtectedFromScaleIn"]]
    instance_dict = { item['ResourceId']: int(item['Value']) for item in tag_list if item['Key'] == draining_tag and item['ResourceId'] in protected_instance_ids }
    return instance_dict


def count_running_alignment_jobs(asg, tag_list, job_tag_prefix, job_tag_expiration):
    ''' returns a map of instance IDs to number of jobs running on the instance '''
    instance_ids = instances_in(asg)
    count_dict = { id: 0 for id in instance_ids }
    expired_jobs = []
    for item in tag_list:
        if item['Key'].startswith(job_tag_prefix):
            job_tag = item['Key']
            instance_id = item['ResourceId']
            unixtime = int(item['Value'])
            if unixtime_now() - unixtime < job_tag_expiration:
                count_dict[instance_id] += 1
            else:
                expired_jobs.append(job_tag)
    if expired_jobs:
        print "The following job tags have expired and will be deleted: " + ", ".join(expired_jobs)
        delete_tags_from_instances(instance_ids, expired_jobs)
    return count_dict


def delete_tags_from_instances(instance_ids, tag_keys):
    if not instance_ids or not tag_keys:
        return
    cmd = "aws ec2 delete-tags --resources {list_instances} --tags {list_tags}"
    cmd = cmd.format(list_instances=' '.join(instance_ids), list_tags=' '.join(['Key='+tag for tag in tag_keys]))
    aws_command(cmd)
   

def remove_termination_protection(instance_ids, asg):
    if not instance_ids:
        return
    cmd = "aws autoscaling set-instance-protection --instance-ids {list_instances} --auto-scaling-group-name {asg_name} --no-protected-from-scale-in"
    cmd = cmd.format(list_instances=' '.join(instance_ids), asg_name=asg['AutoScalingGroupName'])
    aws_command(cmd)


def check_draining_servers(asg, tag_list, draining_tag, job_tag_prefix, job_tag_expiration, min_draining_wait, can_scale):
    drain_date_by_instance_id = get_draining_servers(asg, tag_list, draining_tag)
    num_jobs_by_instance_id = count_running_alignment_jobs(asg, tag_list, job_tag_prefix, job_tag_expiration)
    instance_ids_to_terminate = []
    current_timestamp = unixtime_now()
    for instance_id, drain_date in drain_date_by_instance_id.items():
        draining_interval = current_timestamp - drain_date
        num_jobs = num_jobs_by_instance_id[instance_id]
        if num_jobs == 0 and draining_interval > min_draining_wait:
            instance_ids_to_terminate.append(instance_id)
    if instance_ids_to_terminate:
        print "The following instances are ready to be terminated: " + ", ".join(instance_ids_to_terminate)
        if can_scale:
            remove_termination_protection(instance_ids_to_terminate, asg)

def count_running_batch_jobs():
    queues_lock = threading.RLock()
    queues = {"idseq_himem": [],
              "idseq": []}
    errors = []
    def list_jobs(q):
        try:
            job_list = aws_command("aws batch list-jobs --job-queue {q} --job-status RUNNING".format(q=q))
            with queues_lock:
                queues[q] = json.loads(job_list)
        except:
            with queues_lock:
                errors.append(q)
    threads = [threading.Thread(target=list_jobs, args=[q]) for q in queues]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    if errors:
        return None
    return sum(len(job_list["jobSummaryList"]) for job_list in queues.itervalues())


def autoscaling_update(my_num_jobs, my_environment="development",
                       max_job_dispatch_lag_seconds=900, job_tag_prefix="RunningIDseqBatchJob_",
                       job_tag_keep_alive_seconds=600, draining_tag="draining"):
    min_draining_wait = max_job_dispatch_lag_seconds + GRACE_PERIOD_SECONDS__JOB_DISPATCH_LAG
    job_tag_expiration = job_tag_keep_alive_seconds + GRACE_PERIOD_SECONDS__JOB_TAG_KEEP_ALIVE
    if my_environment in MULTICONTAINER_ENVIRONMENTS:
        asg_env = my_environment
    else:
        # Distinguish different developers' environments based on hostname
        hostname = (
            os.environ.get("HOSTNAME") or
            os.environ.get("HOST") or
            subprocess.check_output(["hostname"]).strip()
        )
        # sha hexdigest is used to sanitize the hostname so it's safe for tags
        my_environment += "_" + hashlib.sha224(hostname).hexdigest()[:10]
        asg_env = 'staging'
    asg_json = aws_command("aws autoscaling describe-auto-scaling-groups")
    asg_list = json.loads(asg_json).get('AutoScalingGroups', [])
    gsnap_instance_name = "gsnapl-asg-" + asg_env
    rapsearch_instance_name = "rapsearch2-asg-" + asg_env
    gsnap_asg = find_asg(asg_list, gsnap_instance_name)
    rapsearch2_asg = find_asg(asg_list, rapsearch_instance_name)
    if DEBUG:
        print json.dumps(gsnap_asg, indent=2)
        print json.dumps(rapsearch2_asg, indent=2)
    mvals = update_metric_values(gsnap_asg, my_num_jobs, my_environment)
    if not DEBUG:
        # when debugging is enabled this would be a duplicate print...
        print json.dumps(mvals, indent=2)
    num_development_jobs = sum(v for k, v in mvals.iteritems() if "development" in k)
    num_real_jobs = sum(mvals.itervalues()) - num_development_jobs
    print "ASG tags indicate {num_jobs} in-progress job(s) across {num_env} environments.".format(num_jobs=num_real_jobs + num_development_jobs, num_env=len(mvals))
    print "From cloud environments: {num_real_jobs}".format(num_real_jobs=num_real_jobs)
    print "From development environments: {num_development_jobs}".format(num_development_jobs=num_development_jobs)
    can_scale = permission_to_scale(gsnap_asg, my_environment)
    if not can_scale:
        print "Scaling by agents of {my_environment} is not permitted.".format(my_environment=my_environment)
        # when debugging is enabled and we can't scale we print the scaling commands without executing them
        # when debugging is disabled and we can't scale we exit early here
        if not DEBUG:
            return
    tag_list = get_instance_tags()
    gsnap_tags = find_tags_for_instances_in(gsnap_asg, tag_list)
    rapsearch_tags = find_tags_for_instances_in(rapsearch2_asg, tag_list)
    check_draining_servers(gsnap_asg, gsnap_tags, draining_tag, job_tag_prefix, job_tag_expiration, min_draining_wait, can_scale)
    check_draining_servers(rapsearch2_asg, rapsearch_tags, draining_tag, job_tag_prefix, job_tag_expiration, min_draining_wait, can_scale)
    if num_real_jobs == 0 and num_development_jobs == 0:
        set_desired_capacity(gsnap_asg, gsnap_instance_name, gsnap_tags, draining_tag, exactly(0), can_scale)
        set_desired_capacity(rapsearch2_asg, rapsearch_instance_name, rapsearch_tags, draining_tag, exactly(0), can_scale)
    elif num_real_jobs == 0 and num_development_jobs > 0:
        count_running_servers = get_previous_desired(gsnap_asg) + get_previous_desired(rapsearch2_asg)
        print "Only development environments are reporting in-progress jobs, and {crs} servers are running.".format(crs=count_running_servers)
        if count_running_servers > 2 or random.random() < 0.2:
            crbj = count_running_batch_jobs()
            if crbj:
                print "{crbj} jobs are running in aws batch queues".format(crbj=crbj)
                # This is an unsafe scaling operation, but the only jobs that can get hurt
                # are development jobs.  Just rerun those.
                set_desired_capacity(gsnap_asg, gsnap_instance_name, gsnap_tags, draining_tag, exactly(1), can_scale)
                set_desired_capacity(rapsearch2_asg, rapsearch_instance_name, rapsearch_tags, draining_tag, exactly(1), can_scale)
            elif crbj == 0:
                print "No jobs are running in batch."
                # in this case num_development_jobs are either zombies or jobs caught in transition
                # between pipeline stages;  the non-zombies won't be hurt, only delayed by this
                set_desired_capacity(gsnap_asg, gsnap_instance_name, gsnap_tags, draining_tag, exactly(0), can_scale)
                set_desired_capacity(rapsearch2_asg, rapsearch_instance_name, rapsearch_tags, draining_tag, exactly(0), can_scale)
            else:
                print "Failed to get information about running jobs in aws batch.  Deferring scaling decision."
        else:
            print "Deferring scaling decision to stay under the rate limit for 'aws batch list-jobs'."
    elif 1 <= num_real_jobs <= 6:
        set_desired_capacity(gsnap_asg, gsnap_instance_name, gsnap_tags, draining_tag, exactly(8), can_scale)
        set_desired_capacity(rapsearch2_asg, rapsearch_instance_name, rapsearch_tags, draining_tag, exactly(8), can_scale)
    else:
        set_desired_capacity(gsnap_asg, gsnap_instance_name, gsnap_tags, draining_tag, at_least(24), can_scale)
        set_desired_capacity(rapsearch2_asg, rapsearch_instance_name, rapsearch_tags, draining_tag, at_least(24), can_scale)


if __name__ == "__main__":
    assert len(sys.argv) > 2
    assert sys.argv[1] in ("update", "debug")
    assert sys.argv[2].isdigit()
    if sys.argv[1] == "debug":
        DEBUG = True
    autoscaling_update(int(sys.argv[2]), *sys.argv[3:])
