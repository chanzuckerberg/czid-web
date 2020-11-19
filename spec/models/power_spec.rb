require 'rails_helper'
require "webmock/rspec"

RSpec.describe Power, type: :model do
  let(:current_user) { create(:user) }
  let(:current_power) { Power.new(current_user) }
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project, user: current_user) }
  let(:workflow_run) { create(:workflow_run, sample: sample) }

  describe "#samples_workflow_runs" do
    it "gets workflow runs viewable to the user and belonging to the samples" do
      samples = Sample.where(id: sample.id)
      relation = WorkflowRun.where(id: workflow_run.id)
      expect(WorkflowRun).to receive(:viewable).with(current_user).and_return(relation)

      expect(current_power.samples_workflow_runs(samples)).to match_array(relation)
    end
  end
end
