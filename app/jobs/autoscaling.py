#!/usr/bin/env python
import json
import sys
import subprocess
import time
import random
from operator import itemgetter
from functools import wraps
from collections import defaultdict, Counter
import dateutil.parser

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
    return subprocess.check_output(command_str, shell=True)

def at_most(upper_limit):
    return lambda n: min(n, upper_limit)

def at_least(lower_limit):
    return lambda n: max(n, lower_limit)

def exactly(value):
    return lambda _n: value

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

def delete_tags_from_instances(instance_ids, tag_keys):
    if not instance_ids or not tag_keys:
        return
    cmd = "aws ec2 delete-tags --resources {list_instances} --tags {list_tags}"
    cmd = cmd.format(list_instances=' '.join(instance_ids), list_tags=' '.join(['Key='+tag for tag in tag_keys]))
    aws_command(cmd)

def get_asg_list():
    asg_json = aws_command("aws autoscaling describe-auto-scaling-groups")
    asg_list = json.loads(asg_json).get('AutoScalingGroups', [])
    return asg_list

def required_capacity(num_jobs):
    if num_jobs == 0:
        result = exactly(0)
    elif num_jobs == 1:
        # Often a test job or automatic benchmark job
        result = exactly(4)
    elif 1 < num_jobs <= 6:
        result = exactly(8)
    else:
        # This means, as long as we're in this regime, a DesiredCapacity > 24 set manually by the operator
        # will be respected and not scaled down until we exit this regime.
        result = at_least(24)
    return result

def autoscaling_update(my_num_jobs, my_environment,
                       max_job_dispatch_lag_seconds, job_tag_prefix,
                       job_tag_keep_alive_seconds, draining_tag):
    '''
    Plan and perform an update to the GSNAP/RAPSEARCH ASGs.
    Note: Will not scale up for jobs originating in a development environment.
          You can provision machines for development jobs by manually setting MinSize on the ASGs,
          which is respected by this autoscaler.
    '''

    asg_list = get_asg_list()
    tag_list = get_tag_list()
    gsnap_ASG = ASG("gsnapl", my_environment, asg_list, tag_list, draining_tag, job_tag_prefix, max_job_dispatch_lag_seconds, job_tag_keep_alive_seconds)
    rapsearch_ASG = ASG("rapsearch2", my_environment, asg_list, tag_list, draining_tag, job_tag_prefix, max_job_dispatch_lag_seconds, job_tag_keep_alive_seconds)
    if not (gsnap_ASG.can_scale and rapsearch_ASG.can_scale):
        print "Scaling by agents of {my_environment} is not permitted.".format(my_environment=my_environment)
        return

    print "{my_num_jobs} jobs are in progress.".format(my_num_jobs=my_num_jobs)
    compute_num_instances = required_capacity(my_num_jobs)
    for service_ASG in [gsnap_ASG, rapsearch_ASG]:
        print "--- Analyzing the {instance_name} ASG ---".format(instance_name=service_ASG.instance_name)
        num_desired = service_ASG.num_desired_instances()
        healthy_instances, draining_instances, discarded_instances, terminating_instances, is_valid_classification = service_ASG.classify_instances()
        num_healthy = len(healthy_instances)
        num_draining = len(draining_instances)
        print "CURRENTLY:"
        print "The desired capacity is {num_desired}.".format(num_desired=num_desired)
        print "There are {num_healthy} healthy instances: {healthy_instances}.".format(num_healthy=num_healthy, healthy_instances=healthy_instances)
        print "There are {num_draining} draining instances: {draining_instances}.".format(num_draining=num_draining, draining_instances=draining_instances)
        print "There are {num_discarded} discarded instances: {discarded_instances}.".format(num_discarded=num_discarded, discarded_instances=discarded_instances)
        print "There are {num_terminating} terminating instances: {terminating_instances}.".format(num_terminating=len(terminating_instances), terminating_instances=terminating_instances)
        if not is_valid_classification:
            print "WARNING: some instances were classified into multiple states or none. This should never happen."

        print "MOVING FORWARD:"
        raw_new_num_desired = compute_num_instances(num_desired)
        print "In principle, the desired capacity needs to be {raw_new_num_desired}.".format(raw_new_num_desired=raw_new_num_desired)
        new_num_desired = service_ASG.clamp_to_valid_range(raw_new_num_desired)
        print "Enforcing the MinSize and MaxSize set by the operator, the desired capacity should be set to {new_num_desired}.".format(new_num_desired=new_num_desired)
        if new_num_desired > num_desired and num_discarded != 0:
            print ("Some instances have not yet moved from 'discarded' to 'terminating' state by AWS. "
                   "Postponing DesiredCapacity increase to the next incarnation to avoid creating zombie instances.")
        else:
            print "Applying DesiredCapacity {new_num_desired}.".format(new_num_desired=new_num_desired)
            service_ASG.set_desired_capacity(new_num_desired)

        print "HEALTHY <--> DRAINING transitions:"
        service_ASG.draining_instances = draining_instances
        if new_num_desired < num_healthy:
            num_to_drain = num_healthy - new_num_desired
            print "{num_to_drain} instances need to be drained.".format(num_to_drain=num_to_drain)
            instances_to_drain = service_ASG.start_draining(num_to_drain)
            print "Moved {instances_to_drain} from 'healthy' to 'draining' state.".format(instances_to_drain=instances_to_drain)
        elif new_num_desired > num_healthy:
            num_to_rescue = min(new_num_desired - num_healthy, num_draining)
            print "{num_to_rescue} instances need to stop draining.".format(num_to_rescue=num_to_rescue)
            instances_to_rescue = service_ASG.stop_draining(num_to_rescue)
            print "Moved {instances_to_rescue} from 'draining' to 'healthy' state.".format(instances_to_rescue=instances_to_rescue)
        else:
            print "No instances need to make a HEALTHY <--> DRAINING transition."

        print "DRAINING --> DISCARDED transitions:"
        instances_to_discard = service_ASG.discard_if_safe()
        num_to_discard = len(instances_to_discard)
        if num_to_discard > 0:
            print "{num_to_discard} instances have finished draining and can be discarded: {instances_to_discard}.".format(num_to_discard=num_to_discard, instances_to_discard=instances_to_discard)
        else:
            print "No instances are ready to move from draining to discard state."

class ASG(object):
    r'''
    State machine of EC2 instances within the ASG as relevant to this autoscaler:

                            _________________
                           |                 |    Either initializing or ready to take jobs.
                           |     HEALTHY     |    Scale-in protection automatically granted at birth.
                           |_________________|


        decrease DesiredCapacity  |  / \   increase DesiredCapacity
              add draining_tag    |   |    remove draining_tag
                                 \ /  |

                            _________________     Draining.
                           |                 |    Scale-in protection still present.
                           |    DRAINING     |    May still accept jobs for up to min_draining_wait seconds after entering this state.
                           |_________________|    Can still finish running jobs for up to (min_draining_wait + job_tag_expiration) seconds after entering this state.


                                    |
        remove scale-in protection  |
                                   \ /

                            _________________
                           |                 |   Discarded.
                           |    DISCARDED    |   Scale-in protection removed.
                           |_________________|


                                    |
                                    |    Will terminate because DesiredCapacity < actual number of instances
                                   \ /

                            _________________
                           |                 |
                           |   TERMINATING   |
                           |_________________|
    '''

    # If you are running into problems with this autoscaler, just delete this tag from
    # any affected autoscaling group, and it will be left alone.  The value is a list
    # of environments permitted to trigger scaling, usually just "prod".
    scaling_permission_tag = 'IDSeqEnvsThatCanScale'

    job_dispatch_lag_grace_period_seconds = 300
    job_tag_keep_alive_grace_period_seconds = 300

    def __init__(self, service, environment, asg_list, tag_list, draining_tag, job_tag_prefix, max_job_dispatch_lag_seconds, job_tag_keep_alive_seconds):
        self.draining_instances = []
        self.service = service
        self.environment = environment
        self.draining_tag = draining_tag
        self.job_tag_prefix = job_tag_prefix
        self.max_job_dispatch_lag_seconds = max_job_dispatch_lag_seconds
        self.job_tag_keep_alive_seconds = job_tag_keep_alive_seconds

        self.min_draining_wait = self.max_job_dispatch_lag_seconds + self.job_dispatch_lag_grace_period_seconds
        self.job_tag_expiration = self.job_tag_keep_alive_seconds + self.job_tag_keep_alive_grace_period_seconds
        self.instance_name = self.service + "-asg-" + self.environment

        self.asg, self.instance_ids, self.tags = self.find_attributes(asg_list, tag_list, self.instance_name)
        self.can_scale = self.permission_to_scale(self.asg)


    def permission_to_scale(self, asg):
        def get_tag(asg, tag_key):
            for tag in asg['Tags']:
                if tag['Key'] == tag_key:
                    return tag['Value']
            return None
        allowed_envs = get_tag(asg, self.scaling_permission_tag)
        if allowed_envs == None:
            return False
        return self.environment in set(s.strip() for s in allowed_envs.split(","))

    @staticmethod
    def find_attributes(asg_list, tag_list, instance_name):
        def find_asg():
            matching = []
            for asg in asg_list:
                if asg['AutoScalingGroupName'].startswith(instance_name):
                    matching.append(asg)
            assert len(matching) == 1
            result = matching[0]
            if DEBUG:
                print json.dumps(result, indent=2)
            return result
        def find_instance_ids(asg):
            return [item["InstanceId"] for item in asg["Instances"]]
        def find_tags(instance_ids):
            return [tag for tag in tag_list if tag["ResourceId"] in instance_ids]
        asg = find_asg()
        instance_ids = find_instance_ids(asg)
        tags = find_tags(instance_ids)
        return asg, instance_ids, tags

    def num_desired_instances(self):
        return int(self.asg.get("DesiredCapacity", self.asg.get("MinSize", 0)))

    def tags_by_instance_id(self):
        result = defaultdict(lambda: {})
        for item in self.tags:
            instance_id = item['ResourceId']
            key = item['Key']
            value = item['Value']
            result[instance_id][key] = value
        return result

    def clamp_to_valid_range(self, desired_capacity):
        min_size = int(self.asg.get("MinSize", desired_capacity))
        max_size = int(self.asg.get("MaxSize", desired_capacity))
        if desired_capacity < min_size:
            print "Clamping {} up to {}".format(desired_capacity, min_size)
            desired_capacity = min_size
        if desired_capacity > max_size:
            print "Clamping {} down to {}".format(desired_capacity, max_size)
            desired_capacity = max_size
        return desired_capacity

    def set_desired_capacity(self, new_num_desired):
        cmd = "aws autoscaling set-desired-capacity --auto-scaling-group-name {asg_name} --desired-capacity {new_num_desired}"
        cmd = cmd.format(asg_name=self.asg['AutoScalingGroupName'], new_num_desired=new_num_desired)
        if self.can_scale:
            if DEBUG:
                print cmd
            aws_command(cmd)

    def classify_instances(self):
        healthy_instances = []
        draining_instances = []
        discarded_instances = []
        terminating_instances = []
        corrupt_instances = []
        tag_dict = self.tags_by_instance_id()
        for inst in self.asg["Instances"]:
            instance_id = inst["InstanceId"]
            instance_tags = tag_dict.get(instance_id, {})
            if DEBUG:
                print "{instance_id}: {instance_tags}".format(instance_id=instance_id, instance_tags=instance_tags)
            is_terminating = (inst["LifecycleState"] == "Terminating")
            is_discarded = (not inst["ProtectedFromScaleIn"] and not inst["LifecycleState"] in ["Pending", "Terminating"])
            is_draining = ((inst["ProtectedFromScaleIn"] or inst["LifecycleState"] == "Pending") and
                           self.draining_tag in instance_tags)
            is_healthy = ((inst["ProtectedFromScaleIn"] or inst["LifecycleState"] == "Pending") and
                          not self.draining_tag in instance_tags and
                          inst["HealthStatus"] == "Healthy" and inst["LifecycleState"] != "Terminating")
            if is_terminating:
                terminating_instances.append(instance_id)
            if is_discarded:
                discarded_instances.append(instance_id)
            if is_draining:
                draining_instances.append(instance_id)
            if is_healthy:
                healthy_instances.append(instance_id)
        state_tally = Counter(healthy_instances + draining_instances + discarded_instances + terminating_instances)
        is_valid = all(state_tally[inst] == 1 for inst in self.asg["Instances"])
        return healthy_instances, draining_instances, discarded_instances, terminating_instances, is_valid

    def start_draining(self, num_to_drain):
        def instances_to_drain():
            cmd = "aws ec2 describe-instances --filters 'Name=tag:Name,Values={instance_name}' --query 'Reservations[*].Instances[*].[InstanceId,LaunchTime,Tags]' --no-paginate"
            cmd = cmd.format(instance_name=self.instance_name)
            aws_response = json.loads(aws_command(cmd))
            zipped_instance_ids_and_launch_times = [
                (instance[0], iso2unixtime(instance[1]))
                for instance_list in aws_response
                for instance in instance_list
                if self.draining_tag not in [tag["Key"] for tag in instance[2]]
            ]
            instance_ids_sorted_by_increasing_launch_time = [item[0] for item in sorted(zipped_instance_ids_and_launch_times, key=itemgetter(1))]
            return instance_ids_sorted_by_increasing_launch_time[:num_to_drain]
        def add_draining_tag(instance_ids):
            cmd = "aws ec2 create-tags --resources {list_instances} --tags Key={draining_tag},Value={timestamp}"
            cmd = cmd.format(list_instances=' '.join(instance_ids), draining_tag=self.draining_tag, timestamp=unixtime_now())
            aws_command(cmd)
        instance_ids = instances_to_drain()
        if instance_ids and self.can_scale:
            add_draining_tag(instance_ids)
        return instance_ids

    def get_drainage_times(self):
        ''' returns a map of draining instance IDs to the time they started draining '''
        tag_dict = self.tags_by_instance_id()
        return {instance_id: int(tag_dict[instance_id][self.draining_tag]) for instance_id in self.draining_instances}

    def stop_draining(self, num_to_rescue):
        def instances_to_rescue():
            '''
            Rescue the instances that have been draining for the least amount of time.
            That way we can probably discard the non-rescued instances sooner.
            '''
            drainage_times = self.get_drainage_times()
            draining_instances_sorted = [key for key, _value in sorted(drainage_times.items(), key=itemgetter(1), reverse=True)]
            return draining_instances_sorted[:num_to_rescue]
        def remove_draining_tag(instance_ids):
            delete_tags_from_instances(instance_ids, [self.draining_tag])
        instance_ids = instances_to_rescue()
        if instance_ids and self.can_scale:
            remove_draining_tag(instance_ids)
        return instance_ids

    def discard_if_safe(self):
        def count_running_alignment_jobs():
            ''' returns a map of draining instance IDs to number of jobs still running on the instance '''
            instance_ids = self.draining_instances
            count_dict = {id: 0 for id in instance_ids}
            expired_jobs = []
            for item in self.tags:
                if item['Key'].startswith(self.job_tag_prefix):
                    job_tag = item['Key']
                    inst_id = item['ResourceId']
                    unixtime = int(item['Value'])
                    if unixtime_now() - unixtime < self.job_tag_expiration:
                        count_dict[inst_id] += 1
                    else:
                        expired_jobs.append(job_tag)
            if expired_jobs:
                print "The following job tags have expired and will be deleted: " + ", ".join(expired_jobs)
                delete_tags_from_instances(instance_ids, expired_jobs)
            return count_dict
        def instances_to_discard():
            drain_date_by_instance_id = self.get_drainage_times()
            num_jobs_by_instance_id = count_running_alignment_jobs()
            result = []
            for instance_id, drain_date in drain_date_by_instance_id.items():
                draining_interval = unixtime_now() - drain_date
                num_jobs = num_jobs_by_instance_id[instance_id]
                if num_jobs == 0 and draining_interval > self.min_draining_wait:
                    result.append(instance_id)
            return result
        def remove_termination_protection(instance_ids):
            cmd = "aws autoscaling set-instance-protection --instance-ids {list_instances} --auto-scaling-group-name {asg_name} --no-protected-from-scale-in"
            cmd = cmd.format(list_instances=' '.join(instance_ids), asg_name=self.asg['AutoScalingGroupName'])
            aws_command(cmd)
        instance_ids = instances_to_discard()
        if instance_ids and self.can_scale:
            remove_termination_protection(instance_ids)
        return instance_ids

if __name__ == "__main__":
    assert len(sys.argv) > 2
    assert sys.argv[1] in ("update", "debug")
    assert sys.argv[2].isdigit()
    assert sys.argv[4].isdigit()
    assert sys.argv[6].isdigit()
    if sys.argv[1] == "debug":
        DEBUG = True
    autoscaling_update(int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), sys.argv[5], int(sys.argv[6]), sys.argv[7])
