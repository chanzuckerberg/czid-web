#!/usr/bin/env python
import json
import os
import sys
import subprocess
import time
import hashlib
import random
from functools import wraps


# As opposed to "development", where different containers belong to different developers.
MULTICONTAINER_ENVIRONMENTS = ["production", "alpha"]


# If you are running into problems with this autoscaler, just delete this tag from
# any affected autoscaling group, and it will be left alone.  The value is a list
# of environments permitted to trigger scaling, usually just "production".
SCALING_PERMISSION_TAG = "IDSeqEnvsThatCanScale"


SCALING_METRIC_TAG_PREFIX = "IDSeqScalingData_"
SCALING_METRIC_TAG_FORMAT = SCALING_METRIC_TAG_PREFIX + "{environment}"


# A value recorded this many minutes earlier will be ignored
EXPIRATION_PERIOD_MINUTES = 60


DEBUG = False


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
    return subprocess.check_output(command_str.split())


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
    tag_value = "{unixtime:d}::{value:d}".format(unixtime=int(time.time()), value=int(value))
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
        if time.time() - unixtime < EXPIRATION_PERIOD_MINUTES * 60:
            results[k] = int(parts[1])
        else:
            expired_keys.append(k)
            if DEBUG:
                print "Expired value {} for key {}".format(v, k)
    delete_expired_metric_tags(asg, expired_keys)
    return results


def count_healthy_instances(asg):
    # This will become more useful when we start scaling down
    num_healthy = 0
    for inst in asg["Instances"]:
        if inst["HealthStatus"] == "Healthy" and inst["LifecycleState"] != "Terminating":
            num_healthy += 1
    return num_healthy


def set_desired_capacity(asg, compute_desired_instances, my_environment):
    can_scale = permission_to_scale(asg, my_environment)
    asg_name = asg['AutoScalingGroupName']
    num_healthy = count_healthy_instances(asg)
    previous_desired = int(asg.get("DesiredCapacity", asg.get("MinSize", 0)))
    # Manually input DesiredCapacity will never be reduced so long as there are pending jobs.
    num_desired = compute_desired_instances(previous_desired)
    if num_desired == previous_desired:
        action = "should remain"
    else:
        action = "should change to"
    cmd = "aws autoscaling set-desired-capacity --auto-scaling-group-name {asg_name} --desired-capacity {num_desired}"
    cmd = cmd.format(asg_name=asg_name, num_desired=num_desired)
    msg = "Autoscaling group {asg_name} has {num_healthy} healthy instance(s). Desired capacity {action} {num_desired}."
    if not can_scale:
        msg += " However, scaling by agents of {} is not permitted.".format(my_environment)
    print msg.format(asg_name=asg_name, num_healthy=num_healthy, action=action, num_desired=num_desired)
    if can_scale:
        if DEBUG:
            print cmd
        aws_command(cmd)


def autoscaling_update(my_num_jobs, my_environment="development"):
    if my_environment not in MULTICONTAINER_ENVIRONMENTS:
        # Distinguish different developers' environments based on hostname
        hostname = (
            os.environ.get("HOSTNAME") or
            os.environ.get("HOST") or
            subprocess.check_output(["hostname"]).strip()
        )
        # sha hexdigest is used to sanitize the hostname so it's safe for tags
        my_environment += "_" + hashlib.sha224(hostname).hexdigest()[:10]
    asg_json = aws_command("aws autoscaling describe-auto-scaling-groups")
    asg_list = json.loads(asg_json).get('AutoScalingGroups', [])
    gsnap_asg = find_asg(asg_list, "gsnapl-asg-production")
    rapsearch2_asg = find_asg(asg_list, "rapsearch2-asg-production")
    mvals = update_metric_values(gsnap_asg, my_num_jobs, my_environment)
    num_jobs = sum(mvals.values())
    print json.dumps(mvals, indent=2)
    print "ASG tags indicate {num_jobs} running job(s) across {num_env} environments above.".format(num_jobs=num_jobs, num_env=len(mvals))
    if DEBUG:
        print json.dumps(gsnap_asg, indent=2)
        print json.dumps(rapsearch2_asg, indent=2)
    # This is a very basic heuristic.
    if num_jobs == 0:
        set_desired_capacity(gsnap_asg, exactly(0), my_environment)
        set_desired_capacity(rapsearch2_asg, exactly(0), my_environment)
    elif 1 <= num_jobs <= 5:
        set_desired_capacity(gsnap_asg, at_least(4), my_environment)
        set_desired_capacity(rapsearch2_asg, at_least(12), my_environment)
    else:
        set_desired_capacity(gsnap_asg, at_least(12), my_environment)
        set_desired_capacity(rapsearch2_asg, at_least(36), my_environment)


if __name__ == "__main__":
    assert len(sys.argv) > 2
    assert sys.argv[1] in ("update", "debug")
    assert sys.argv[2].isdigit()
    if sys.argv[1] == "debug":
        DEBUG = True
    autoscaling_update(int(sys.argv[2]), *sys.argv[3:])
