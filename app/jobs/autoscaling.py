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

SCALING_ENVIRONMENTS = ["staging", "prod"] # as opposed to 'development'
DEBUG = False

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


def get_tag_list():
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
    draining_instances_sorted = [key for key, _value in sorted(draining_instances.items(), key=itemgetter(1), reverse=True)]
    return draining_instances_sorted[:num_instances]


def get_draining_servers(asg, tag_list, draining_tag):
    ''' returns a map of draining instance IDs to the time they started draining '''
    protected_instance_ids = [inst["InstanceId"] for inst in asg["Instances"] if inst["ProtectedFromScaleIn"]]
    instance_dict = { item['ResourceId']: int(item['Value']) for item in tag_list if item['Key'] == draining_tag and item['ResourceId'] in protected_instance_ids }
    return instance_dict


def count_running_alignment_jobs(asg, tag_list, job_tag_prefix, job_tag_expiration):
    ''' returns a map of instance IDs to number of jobs running on the instance '''
    instance_ids = self.instance_ids
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

def get_asg_list():
    asg_json = aws_command("aws autoscaling describe-auto-scaling-groups")
    asg_list = json.loads(asg_json).get('AutoScalingGroups', [])
    return asg_list

def autoscaling_update(my_num_jobs, my_environment="development",
                       max_job_dispatch_lag_seconds=900, job_tag_prefix="RunningIDseqBatchJob_",
                       job_tag_keep_alive_seconds=600, draining_tag="draining"):
    if my_environment not in SCALING_ENVIRONMENTS:
        return
    print "{my_num_jobs} jobs are in progress.".format(my_num_jobs=my_num_jobs)
    asg_list = get_asg_list()
    tag_list = get_tag_list()
    gsnap_ASG = ASG(...)
    if not gsnap_ASG.can_scale:
        print "Scaling by agents of {my_environment} is not permitted.".format(my_environment=my_environment)
        # when debugging is enabled and we can't scale we print the scaling commands without executing them
        # when debugging is disabled and we can't scale we exit early here
        if not DEBUG:
            return
    print "Required capacity for GSNAP ASG: " + gsnap_ASG.determine_required_capacity()
    gsnap_ASG.set_desired_capacity()

    check_draining_servers(gsnap_asg, gsnap_tags, draining_tag, job_tag_prefix, job_tag_expiration, min_draining_wait, can_scale)
    check_draining_servers(rapsearch2_asg, rapsearch_tags, draining_tag, job_tag_prefix, job_tag_expiration, min_draining_wait, can_scale)

class ASG(object):
    def __init__(self, service, environment, num_jobs, aws_describe_all_asgs, aws_describe_all_tags, draining_tag, job_tag_prefix, max_job_dispatch_lag_seconds, job_tag_keep_alive_seconds):
        self.service = service
        self.environment = environment
        self.num_jobs = num_jobs
        self.aws_describe_all_asgs = aws_describe_all_asgs
        self.aws_describe_all_tags = aws_describe_all_tags
        self.draining_tag = draining_tag
        self.job_tag_prefix = job_tag_prefix
        self.max_job_dispatch_lag_seconds = max_job_dispatch_lag_seconds
        self.job_tag_keep_alive_seconds = job_tag_keep_alive_seconds

        # If you are running into problems with this autoscaler, just delete this tag from
        # any affected autoscaling group, and it will be left alone.  The value is a list
        # of environments permitted to trigger scaling, usually just "prod".
        self.scaling_permission_tag = 'IDSeqEnvsThatCanScale'

        self.job_dispatch_lag_grace_period_seconds = 300
        self.job_tag_keep_alive_grace_period_seconds = 300

        self.min_draining_wait = self.max_job_dispatch_lag_seconds + self.job_dispatch_lag_grace_period_seconds
        self.job_tag_expiration = self.job_tag_keep_alive_seconds + self.job_tag_keep_alive_grace_period_seconds
        self.instance_name = self.service + "-asg-" + self.environment

        self.can_scale = self.permission_to_scale()
        self.asg = self.find_asg()
        self.instance_ids = self.find_instance_ids()
        self.tags = self.find_tags()

        self.desired_capacity = 0

     def permission_to_scale(self):
         def get_tag(asg, tag_key):
             for tag in asg['Tags']:
                 if tag['Key'] == tag_key:
                     return tag['Value']
             return None
         allowed_envs = get_tag(self.asg, self.scaling_permission_tag)
         if allowed_envs == None:
             return False
         return self.environment in set(s.strip() for s in allowed_envs.split(","))

     def find_asg(self):
         matching = []
         for asg in self.aws_describe_all_asgs:
             if asg['AutoScalingGroupName'].startswith(self.instance_name):
                 matching.append(asg)
         assert len(matching) == 1
         result = matching[0]
         if DEBUG:
             print json.dumps(result, indent=2)
         return result

    def find_instance_ids(self):
        return [item["InstanceId"] for item in self.asg["Instances"]]

    def find_tags(self):
        return [tag for tag in self.tag_list if tag["ResourceId"] in self.instance_ids]

    def determine_required_capacity(self):
        if self.num_jobs == 0:
            self.required_capacity = exactly(0)
        elif self.num_jobs == 1:
            # Often a test job or automatic benchmark job
            self.required_capacity = exactly(4)
        elif 1 < self.num_jobs <= 6:
            self.required_capacity = exactly(8)
        else:
            self.required_capacity = at_least(24)
        return self.required_capacity

    def set_desired_capacity(self):
        asg_name = self.asg['AutoScalingGroupName']
        num_healthy, num_draining = self.count_healthy_instances()
        previous_desired = self.get_previous_desired()
        # Manually input MinCapacity will never be reduced so long as there are pending jobs.
        num_desired = self.clamp_to_valid_range(self.required_capacity(previous_desired))
        if num_desired == previous_desired:
            action = "should remain"
        else:
            action = "should change to"
        cmd = "aws autoscaling set-desired-capacity --auto-scaling-group-name {asg_name} --desired-capacity {num_desired}"
        cmd = cmd.format(asg_name=asg_name, num_desired=num_desired)
        msg = "Autoscaling group {asg_name} has {num_healthy} healthy and {num_draining} draining instance(s). Desired capacity {action} {num_desired}."
        print msg.format(asg_name=asg_name, num_healthy=num_healthy, num_draining=num_draining, action=action, num_desired=num_desired)
        if self.can_scale:
            if DEBUG:
                print cmd
            if num_desired < num_healthy:
                self.start_draining(num_healthy - num_desired)
            elif num_desired > num_healthy:
                self.stop_draining(num_desired - num_healthy)
            aws_command(cmd)

    def check_draining_servers():

if __name__ == "__main__":
    assert len(sys.argv) > 2
    assert sys.argv[1] in ("update", "debug")
    assert sys.argv[2].isdigit()
    assert sys.argv[4].isdigit()
    assert sys.argv[6].isdigit()
    if sys.argv[1] == "debug":
        DEBUG = True
    autoscaling_update(int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), sys.argv[5], int(sys.argv[6]), sys.argv[7])
