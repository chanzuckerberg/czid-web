#!/usr/bin/env python
import unittest
import botocore

from mock import patch

# Class under test
import batch_autoscaling # pylint: disable=import-error

FAKE_LIST_JOBS_RESPONSE = {'jobSummaryList': [{'status': 'RUNNING', 'jobName': 'job-name-1', 'createdAt': 1561155711844, 'jobId': '11111111-abcd-ffff-1111-abcdabcd0001'},
                                              {'status': 'RUNNING', 'jobName': 'job-name-2', 'createdAt': 1561155811844, 'jobId': '11111111-abcd-ffff-1111-abcdabcd0002'}]}

FAKE_LIST_JOBS_RESPONSE_EMPTY = {'jobSummaryList': []}

FAKE_QUEUE_NAME = 'fake-job-queue'
FAKE_COMPUTE_ENVIRONMENT_NAME = 'fake-compute-environment'
FAKE_REGION = 'us-east-1'
FAKE_ACCOUNT = '123456789012'

FAKE_COMPUTE_ENVIRONMENT_ARN = "arn:aws:batch:{region}:{account}:compute-environment/{compute_env}".format(region=FAKE_REGION, account=FAKE_ACCOUNT, compute_env=FAKE_COMPUTE_ENVIRONMENT_NAME)

FAKE_DESCRIBE_JOB_QUEUES_RESPONSE = {"jobQueues": [{"status": "VALID",
                                                    "jobQueueArn": "arn:aws:batch:{region}:{account}:job-queue/{queue}".format(region=FAKE_REGION, account=FAKE_ACCOUNT, queue=FAKE_QUEUE_NAME),
                                                    "computeEnvironmentOrder": [
                                                        {"computeEnvironment": FAKE_COMPUTE_ENVIRONMENT_ARN}
                                                    ],
                                                    "jobQueueName": FAKE_QUEUE_NAME}]}

FAKE_CANNOT_UPDATE_EXCEPTION = botocore.exceptions.ClientError({'Error': {'Code': 'ClientException', 'Message': 'Cannot update, compute environment ... is being modified.'}}, 'UpdateComputeEnvironment')

FAKE_BATCH_CONFIGURATIONS = [{'queue_name': FAKE_QUEUE_NAME, 'vcpus': 12, 'region': FAKE_REGION}]

FAKE_DESCRIBE_COMPUTE_ENVIRONMENTS_SCALING_TAG_SET = {"computeEnvironments": [{"computeEnvironmentName": FAKE_COMPUTE_ENVIRONMENT_NAME,
                                                                               "computeEnvironmentArn": FAKE_COMPUTE_ENVIRONMENT_ARN,
                                                                               "computeResources": {"desiredvCpus": 0, "maxvCpus": 40, "minvCpus": 0,
                                                                                                    "tags": {"IDSeqEnvsThatCanScale": "1"}}}]}

FAKE_DESCRIBE_COMPUTE_ENVIRONMENTS_NO_SCALING_TAG = {"computeEnvironments": [{"computeEnvironmentName": FAKE_COMPUTE_ENVIRONMENT_NAME,
                                                                              "computeEnvironmentArn": FAKE_COMPUTE_ENVIRONMENT_ARN,
                                                                              "computeResources": {"desiredvCpus": 0, "maxvCpus": 40, "minvCpus": 0,
                                                                                                   "tags": {}}}]}

class TestAutoscaling(unittest.TestCase):
    '''Tests for /app/jobs/autoscaling.py'''

    def test_calc_auto_scaling_recommendation_1(self):
        '''WHEN new capacity is same as current capacity THEN do not recommend a change'''
        result = batch_autoscaling.calc_auto_scaling_recommendation(pending_jobs_counts={'RUNNABLE': 1, 'STARTING': 1, 'RUNNING': 1},
                                                                    current_vcpu_min=36,
                                                                    current_vcpu_max=40, job_vcpus=12, scaling_permission=True)

        self.assertEqual(result, {'change': False, 'new_vcpu_min': 36})


    def test_calc_auto_scaling_recommendation_2(self):
        '''WHEN new capacity is higher than current capacity THEN recommend a change to the higher capacity'''
        result = batch_autoscaling.calc_auto_scaling_recommendation(pending_jobs_counts={'RUNNABLE': 2},
                                                                    current_vcpu_min=10,
                                                                    current_vcpu_max=40, job_vcpus=12, scaling_permission=True)

        self.assertEqual(result, {'change': True, 'new_vcpu_min': 24})


    def test_calc_auto_scaling_recommendation_3(self):
        '''WHEN new capacity is lower than current capacity THEN recommend a change to the lower capacity'''
        result = batch_autoscaling.calc_auto_scaling_recommendation(pending_jobs_counts={'RUNNABLE': 1},
                                                                    current_vcpu_min=30,
                                                                    current_vcpu_max=40, job_vcpus=12, scaling_permission=True)

        self.assertEqual(result, {'change': True, 'new_vcpu_min': 12})


    def test_calc_auto_scaling_recommendation_4(self):
        '''WHEN total pending jobs exceed max capacity AND capacity is lower THEN recommend a change to capped to the maximum capacity'''
        result = batch_autoscaling.calc_auto_scaling_recommendation(pending_jobs_counts={'RUNNABLE': 3, 'STARTING': 4, 'RUNNING': 12},
                                                                    current_vcpu_min=12,
                                                                    current_vcpu_max=40, job_vcpus=12, scaling_permission=True)

        self.assertEqual(result, {'change': True, 'new_vcpu_min': 40})


    def test_calc_auto_scaling_recommendation_5(self):
        '''WHEN scaling permission is not set THEN do not recommend a change'''
        result = batch_autoscaling.calc_auto_scaling_recommendation(pending_jobs_counts={'RUNNABLE': 3, 'STARTING': 4, 'RUNNING': 12},
                                                                    current_vcpu_min=12,
                                                                    current_vcpu_max=40, job_vcpus=12, scaling_permission=False)

        self.assertEqual(result, {'change': False, 'new_vcpu_min': 40})


    def _parameterized_test_process_batch_configuration(self, batch_describe_compute_environments_return_value, should_have_scaling_permission, should_change):
        with patch('batch_autoscaling.boto3.client') as _mock_boto3:
            _mock_boto3.return_value.list_jobs.side_effect = [FAKE_LIST_JOBS_RESPONSE, FAKE_LIST_JOBS_RESPONSE_EMPTY, FAKE_LIST_JOBS_RESPONSE_EMPTY]
            _mock_boto3.return_value.describe_job_queues.return_value = FAKE_DESCRIBE_JOB_QUEUES_RESPONSE
            _mock_boto3.return_value.describe_compute_environments.return_value = batch_describe_compute_environments_return_value

            result = batch_autoscaling.process_batch_configuration(FAKE_BATCH_CONFIGURATIONS[0])

            if should_have_scaling_permission:
                _mock_boto3.return_value.update_compute_environment.assert_called_once_with(computeEnvironment=FAKE_COMPUTE_ENVIRONMENT_NAME, computeResources={'minvCpus': 24})
            else:
                _mock_boto3.return_value.update_compute_environment.assert_not_called()
            self.assertEqual(result, {'autoscaling_recommendation': {'change': should_change, 'new_vcpu_min': 24},
                                      'current_configuration': {'maxvCpus': 40, 'minvCpus': 0, 'scaling_permission': should_have_scaling_permission},
                                      'compute_environment_name': FAKE_COMPUTE_ENVIRONMENT_NAME,
                                      'pending_jobs_counts': {'RUNNING': 2, 'STARTING': 0, 'RUNNABLE': 0}})


    def test_process_batch_configuration_1(self):
        '''WHEN processing batch configuration with scaling tag set THEN invoke dependencies and change the environment'''
        self._parameterized_test_process_batch_configuration(batch_describe_compute_environments_return_value=FAKE_DESCRIBE_COMPUTE_ENVIRONMENTS_SCALING_TAG_SET,
                                                             should_have_scaling_permission=True, should_change=True)

    def test_process_batch_configuration_2(self):
        '''WHEN processing batch configuration with scaling tag not set THEN do not change the environment'''
        self._parameterized_test_process_batch_configuration(batch_describe_compute_environments_return_value=FAKE_DESCRIBE_COMPUTE_ENVIRONMENTS_NO_SCALING_TAG,
                                                             should_have_scaling_permission=False, should_change=False)


    @patch('batch_autoscaling.boto3.client', side_effect=FAKE_CANNOT_UPDATE_EXCEPTION)
    def test_autoscale_compute_environments(self, _):
        '''WHEN any error happens during autoscale for an specific environment THEN return the error message and don't break'''
        result = batch_autoscaling.autoscale_compute_environments(FAKE_BATCH_CONFIGURATIONS)

        self.assertEqual(result[0]['error_type'], "<class 'botocore.exceptions.ClientError'>")
        self.assertRegexpMatches(result[0]['error_args'][0], 'Cannot update')


if __name__ == '__main__':
    unittest.main()
