#!/usr/bin/env python
import os
import sys
import json

import unittest
import botocore

from mock import patch, call

# This is not a python package, so we need some hack to import class under test
project_root_dir_name = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/../../")
python_file_dir_name = project_root_dir_name + "/app/jobs/" # batch_autoscaling.py
sys.path.append(python_file_dir_name)

# Class under test
import batch_autoscaling # pylint: disable=wrong-import-position, import-error

FAKE_RESPONSE_METADATA = {
    'RetryAttempts': 0,
    'HTTPStatusCode': 200,
    'RequestId': '12345678-abcd-def0-1234-567890abcdef',
    'HTTPHeaders': {'content-type': 'application/json'}
}

FAKE_EMPTY_LIST_JOBS_RESPONSE = {
    'jobSummaryList': [],
    'ResponseMetadata': FAKE_RESPONSE_METADATA
}

FAKE_LIST_JOBS_RESPONSE = {
    'jobSummaryList': [
        {'status': 'RUNNABLE', 'jobName': 'job-name-1', 'createdAt': 1561155711844, 'jobId': '11111111-abcd-ffff-1111-abcdabcd0001'},
        {'status': 'RUNNABLE', 'jobName': 'job-name-2', 'createdAt': 1561155811844, 'jobId': '11111111-abcd-ffff-1111-abcdabcd0002'}
    ],
    'ResponseMetadata': FAKE_RESPONSE_METADATA
}

FAKE_QUEUE_NAME = 'fake-job-queue'
FAKE_COMPUTE_ENVIRONMENT_NAME = 'fake-compute-environment'
FAKE_REGION = 'us-east-1'
FAKE_ACCOUNT = '123456789012'

FAKE_COMPUT_ENVIRONMENT_ARN = "arn:aws:batch:{region}:{account}:compute-environment/{compute_env}".format(region=FAKE_REGION, account=FAKE_ACCOUNT, compute_env=FAKE_COMPUTE_ENVIRONMENT_NAME)

FAKE_DESCRIBE_JOB_QUEUES_RESPONSE = {
    "jobQueues": [
        {
            "status": "VALID",
            "jobQueueArn": "arn:aws:batch:{region}:{account}:job-queue/{queue}".format(region=FAKE_REGION, account=FAKE_ACCOUNT, queue=FAKE_QUEUE_NAME),
            "computeEnvironmentOrder": [
                { "computeEnvironment": FAKE_COMPUT_ENVIRONMENT_ARN }
            ],
            "jobQueueName": FAKE_QUEUE_NAME
        }
    ],
    "ResponseMetadata": FAKE_RESPONSE_METADATA
}

FAKE_CANNOT_UPDATE_EXCEPTION = botocore.exceptions.ClientError(
    {
        'Error': {
            'Code': 'ClientException',
            'Message': 'Cannot update, compute environment ... is being modified.'
        },
        'ResponseMetadata': {
            'HTTPHeaders': FAKE_RESPONSE_METADATA['HTTPHeaders']
        }
    }, 'UpdateComputeEnvironment'
)

FAKE_BATCH_CONFIGURATIONS = [
    {
        'queue_name': FAKE_QUEUE_NAME,
        'vcpus': 12,
        'region': FAKE_REGION
    }
]

FAKE_DESCRIBE_COMPUTE_ENVIRONMENTS = {
    "ResponseMetadata": FAKE_RESPONSE_METADATA,
    "computeEnvironments": [
        {
            "computeEnvironmentName": "davidcruz-compute-environment",
            "computeResources": {
                "desiredvCpus": 0,
                "maxvCpus": 40,
                "minvCpus": 0
            }
        }
    ]
}

class TestAutoscaling(unittest.TestCase):
    '''Tests for /app/jobs/autoscaling.py'''

    @patch('batch_autoscaling.get_jobs_count', side_effect=[10, 5, 2])
    def test_check_pending_jobs_counts(self, _mock_list_queue_jobs_count):
        result = batch_autoscaling.check_pending_jobs_counts(FAKE_QUEUE_NAME, FAKE_REGION, job_status_list=('RUNNABLE', 'STARTING', 'RUNNING'))

        self.assertEqual(result, {'RUNNABLE': 10, 'STARTING': 5, 'RUNNING': 2})


    @patch('batch_autoscaling.boto3.client')
    def test_get_jobs_count(self, _mock_boto3):
        _mock_boto3.return_value.list_jobs.return_value = FAKE_LIST_JOBS_RESPONSE

        result = batch_autoscaling.get_jobs_count(FAKE_QUEUE_NAME, FAKE_REGION, 'RUNNABLE')

        self.assertEqual(result, 2)


    @patch('batch_autoscaling.boto3.client')
    def test_set_compute_environment_min_capacity(self, _mock_boto3):
        batch_autoscaling.set_compute_environment_min_capacity(20, FAKE_COMPUTE_ENVIRONMENT_NAME, FAKE_REGION)

        _mock_boto3.return_value.update_compute_environment.assert_called_once_with(
            computeEnvironment=FAKE_COMPUTE_ENVIRONMENT_NAME, computeResources={'minvCpus': 20}
        )


    @patch('batch_autoscaling.boto3.client')
    def test_get_compute_environment_capacity(self, _mock_boto3):
        _mock_boto3.return_value.describe_compute_environments.return_value = FAKE_DESCRIBE_COMPUTE_ENVIRONMENTS

        result = batch_autoscaling.get_compute_environment_capacity(FAKE_COMPUTE_ENVIRONMENT_NAME, FAKE_REGION)

        self.assertEqual(result, {'minvCpus': 0, 'maxvCpus': 40})


    @patch('batch_autoscaling.boto3.client')
    def test_find_compute_environment_names(self, _mock_boto3):
        _mock_boto3.return_value.describe_job_queues.return_value = FAKE_DESCRIBE_JOB_QUEUES_RESPONSE

        result = batch_autoscaling.find_compute_environment_name(FAKE_QUEUE_NAME, FAKE_REGION)

        self.assertEqual(result, FAKE_COMPUTE_ENVIRONMENT_NAME)


    @patch('batch_autoscaling.find_compute_environment_name', return_value=FAKE_COMPUTE_ENVIRONMENT_NAME)
    @patch('batch_autoscaling.get_compute_environment_capacity', return_value={'minvCpus': 36, 'maxvCpus': 40})
    @patch('batch_autoscaling.check_pending_jobs_counts', return_value={'RUNNABLE': 1, 'STARTING': 1, 'RUNNING': 1})
    @patch('batch_autoscaling.set_compute_environment_min_capacity', side_effect=Exception("shouldn't be invoked"))
    def test_process_batch_configuration_1(self, *_):
        '''new capacity is same as current'''
        result = batch_autoscaling.process_batch_configuration(FAKE_BATCH_CONFIGURATIONS[0])

        self.assertEqual(result, {'current_vcpu_max': 40, 'new_vcpu_min': 36, 'old_vcpu_min': 36, 'total_jobs_count': 3, 'total_jobs_vcpu': 36, 'changed': False})


    @patch('batch_autoscaling.find_compute_environment_name', return_value=FAKE_COMPUTE_ENVIRONMENT_NAME)
    @patch('batch_autoscaling.get_compute_environment_capacity', return_value={'minvCpus': 10, 'maxvCpus': 40})
    @patch('batch_autoscaling.check_pending_jobs_counts', return_value={'RUNNABLE': 2})
    @patch('batch_autoscaling.set_compute_environment_min_capacity')
    def test_process_batch_configuration_2(self, _mock_set_compute_environment_min_capacity, *_):
        '''new capacity is higher'''
        result = batch_autoscaling.process_batch_configuration(FAKE_BATCH_CONFIGURATIONS[0])

        _mock_set_compute_environment_min_capacity.assert_called_once_with(24, FAKE_COMPUTE_ENVIRONMENT_NAME, FAKE_REGION)
        self.assertEqual(result, {'current_vcpu_max': 40, 'new_vcpu_min': 24, 'old_vcpu_min': 10, 'total_jobs_count': 2, 'total_jobs_vcpu': 24, 'changed': True})


    @patch('batch_autoscaling.find_compute_environment_name', return_value=FAKE_COMPUTE_ENVIRONMENT_NAME)
    @patch('batch_autoscaling.get_compute_environment_capacity', return_value={'minvCpus': 30, 'maxvCpus': 40})
    @patch('batch_autoscaling.check_pending_jobs_counts', return_value={'RUNNABLE': 1})
    @patch('batch_autoscaling.set_compute_environment_min_capacity')
    def test_process_batch_configuration_3(self, _mock_set_compute_environment_min_capacity, *_):
        '''new capacity is lower'''
        result = batch_autoscaling.process_batch_configuration(FAKE_BATCH_CONFIGURATIONS[0])

        _mock_set_compute_environment_min_capacity.assert_called_once_with(12, FAKE_COMPUTE_ENVIRONMENT_NAME, FAKE_REGION)
        self.assertEqual(result, {'current_vcpu_max': 40, 'new_vcpu_min': 12, 'old_vcpu_min': 30, 'total_jobs_count': 1, 'total_jobs_vcpu': 12, 'changed': True})



    @patch('batch_autoscaling.find_compute_environment_name', return_value=FAKE_COMPUTE_ENVIRONMENT_NAME)
    @patch('batch_autoscaling.get_compute_environment_capacity', return_value={'minvCpus': 12, 'maxvCpus': 40})
    @patch('batch_autoscaling.check_pending_jobs_counts', return_value={'RUNNABLE': 3, 'STARTING': 4, 'RUNNING': 12})
    @patch('batch_autoscaling.set_compute_environment_min_capacity')
    def test_process_batch_configuration_5(self, _mock_set_compute_environment_min_capacity, *_):
        '''new capacity capped to max'''
        result = batch_autoscaling.process_batch_configuration(FAKE_BATCH_CONFIGURATIONS[0])

        _mock_set_compute_environment_min_capacity.assert_called_once_with(40, FAKE_COMPUTE_ENVIRONMENT_NAME, FAKE_REGION)
        self.assertEqual(result, {'current_vcpu_max': 40, 'new_vcpu_min': 40, 'old_vcpu_min': 12, 'total_jobs_count': 19, 'total_jobs_vcpu': 228, 'changed': True})


    @patch('batch_autoscaling.boto3.client', side_effect=FAKE_CANNOT_UPDATE_EXCEPTION)
    def test_autoscale_compute_environments_1(self, _):
        '''Error executing autoscale'''
        result = batch_autoscaling.autoscale_compute_environments(FAKE_BATCH_CONFIGURATIONS)

        self.assertEqual(result[0]['error_type'], "<class 'botocore.exceptions.ClientError'>")
        self.assertRegexpMatches(result[0]['error_args'][0], 'Cannot update')


if __name__ == '__main__':
    unittest.main()
