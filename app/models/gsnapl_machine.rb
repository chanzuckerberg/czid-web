require 'json'
class GsnaplMachine < ApplicationRecord
  has_many :gsnapl_runs, dependent: :destroy

  def self.clean
    stdout, _stderr, status = Open3.capture3("aws ec2 describe-instance-status --instance-ids #{instance_id}")
    return destroy unless status.exitstatus.zero?
    instance_json = JSON.parse(stdout)
    state = instance_json["InstanceStatuses"][0]["InstanceState"]["Name"]
    destroy unless state == "running"
    # To do: restart the aws_batch_job_ids that were on the instance that disappeared
  end
end
