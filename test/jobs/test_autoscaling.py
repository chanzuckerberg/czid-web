#!/usr/bin/env python
import unittest

from mock import patch, call

# Class under test
import autoscaling # pylint: disable=import-error

FAKE_CONFIG = {
    'mode': 'update',
    'gsnapl': {
        'num_chunks': 3,
        'max_concurrent': 10
    },
    'rapsearch2': {
        'num_chunks': 2,
        'max_concurrent': 10
    },
    'my_environment': 'test',
    'max_job_dispatch_lag_seconds': 900,
    'job_tag_prefix': 'RunningIDseqBatchJob_',
    'job_tag_keep_alive_seconds': 600,
    'draining_tag': 'draining'
}

FAKE_TAGS = '''
{  
    "Tags":[  
        {  
            "ResourceType":"instance",
            "ResourceId":"i-abcdef0123456789a",
            "Key":"Name",
            "Value":"rapsearch2-asg-test"
        },
        {  
            "ResourceType":"instance",
            "ResourceId":"i-abcdef0123456789a",
            "Key":"RunningIDseqBatchJob_23456789-0abc-def0-1234-56789abcdef0_chunk0",
            "Value":"1562192894"
        },
        {  
            "ResourceType":"instance",
            "ResourceId":"i-abcdef0123456789a",
            "Key":"RunningIDseqBatchJob_23456789-0abc-def0-1234-56789abcdef0_chunk1",
            "Value":"1562192897"
        },
        {  
            "ResourceType":"instance",
            "ResourceId":"i-abcdef0123456789a",
            "Key":"aws:autoscaling:groupName",
            "Value":"rapsearch2-asg-test-20180515203257249900000002"
        },
        {  
            "ResourceType":"instance",
            "ResourceId":"i-abcdef0123456789a",
            "Key":"env",
            "Value":"test"
        },
        {  
            "ResourceType":"instance",
            "ResourceId":"i-abcdef0123456789a",
            "Key":"service",
            "Value":"rapsearch-test"
        }
    ]
}
'''

FAKE_AUTOSCALING_GROUPS = '''
{
    "AutoScalingGroups": [
        {
            "DesiredCapacity": 0, 
            "Tags": [
                {
                    "ResourceType": "auto-scaling-group", 
                    "ResourceId": "gsnapl-asg-test-20180515202849638100000002", 
                    "PropagateAtLaunch": false, 
                    "Value": "test", 
                    "Key": "IDSeqEnvsThatCanScale"
                }, 
                {
                    "ResourceType": "auto-scaling-group", 
                    "ResourceId": "gsnapl-asg-test-20180515202849638100000002", 
                    "PropagateAtLaunch": true, 
                    "Value": "test", 
                    "Key": "env"
                }
            ],
            "AutoScalingGroupName": "gsnapl-asg-test-20180515202849638100000002", 
            "Instances": []
        },
        {
            "DesiredCapacity": 1, 
            "Tags": [
                {
                    "ResourceType": "auto-scaling-group", 
                    "ResourceId": "rapsearch2-asg-test-20180515203257249900000002", 
                    "PropagateAtLaunch": false, 
                    "Value": "test", 
                    "Key": "IDSeqEnvsThatCanScale"
                },
                {
                    "ResourceType": "auto-scaling-group", 
                    "ResourceId": "rapsearch2-asg-test-20180515203257249900000002", 
                    "PropagateAtLaunch": true, 
                    "Value": "test", 
                    "Key": "env"
                }
            ], 
            "AutoScalingGroupName": "rapsearch2-asg-test-20180515203257249900000002", 
            "Instances": [
                {
                    "ProtectedFromScaleIn": true, 
                    "AvailabilityZone": "us-west-2c", 
                    "InstanceId": "i-abcdef0123456789a", 
                    "HealthStatus": "Healthy", 
                    "LifecycleState": "InService", 
                    "LaunchConfigurationName": "rapsearch2-lc-20190621235241872300000001"
                }
            ]
        }
    ]
}
'''


class TestAutoscaling(unittest.TestCase):
    '''Tests for /app/jobs/autoscaling.py'''

    @staticmethod
    def _stubbed_aws_command(command_str):
        if command_str == "aws autoscaling describe-auto-scaling-groups":
            return FAKE_AUTOSCALING_GROUPS
        elif command_str == "aws ec2 describe-tags --filters 'Name=resource-type,Values=instance' --no-paginate":
            return FAKE_TAGS
        print "---- Mock execution:" + command_str + " ----"
        return None

    @patch('autoscaling.aws_command', side_effect=_stubbed_aws_command.__func__)
    @patch('autoscaling.unixtime_now', return_value=1562192901)
    @patch('autoscaling.ASG.set_desired_capacity')
    def test_autoscaling_update_1(self, mock_asg_set_desired_capacity, *_):
        '''WHEN Instance is not draining AND it is running chunks that haven't expired yet THEN it should scale to desired capacity'''
        autoscaling.autoscaling_update(FAKE_CONFIG)

        mock_asg_set_desired_capacity.assert_has_calls([
            call(1),
            call(1)
        ])


if __name__ == '__main__':
    unittest.main()
