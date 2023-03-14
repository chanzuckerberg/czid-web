require "rails_helper"

RSpec.describe HardDeleteObjects, type: :job do
  create_users

  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }
  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:amr) { WorkflowRun::WORKFLOW[:amr] }
  let(:short_read_mngs) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn".freeze }

  describe "#perform" do
    context "when pipeline run ids are passed in" do
      before do
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 1")
        @pr1 = create(:pipeline_run, sample: @sample1, technology: illumina, finalized: 1, sfn_execution_arn: fake_sfn_execution_arn)

        @sample2 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 2")
        @pr2 = create(:pipeline_run, sample: @sample2, technology: illumina, finalized: 1, sfn_execution_arn: fake_sfn_execution_arn)
        @wr2 = create(:workflow_run, sample: @sample2, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
      end

      it "raises error if no deletable objects are found" do
        object_ids = [-1]
        expect do
          HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)
        end.to raise_error("Not all ids correspond to deletable objects")
      end

      it "raises error if not all ids correspond to deletable objects" do
        object_ids = [@pr1.id, -1]
        expect do
          HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)
        end.to raise_error("Not all ids correspond to deletable objects")
      end

      it "successfully destroys valid pipeline runs" do
        object_ids = [@pr1.id, @pr2.id]
        HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)

        expect { @pr1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @pr2.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "triggers S3 file deletion for pipeline runs and samples if applicable" do
        object_ids = [@pr1.id, @pr2.id]
        expect(S3Util).to receive(:delete_s3_prefix).with(@pr1.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with(@pr2.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample1.sample_path}/")
        expect(S3Util).not_to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample2.sample_path}/")
        HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)
      end

      it "destroys the samples only if there are no remaining pipeline or workflow runs" do
        object_ids = [@pr1.id, @pr2.id]
        HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)

        # should destroy sample 1 but not sample 2
        expect { @sample1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @sample2.reload }.not_to raise_error
      end

      it "logs to cloudwatch if error occurs when destroying pipeline run" do
        object_ids = [@pr1.id]
        allow_any_instance_of(PipelineRun).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error)

        HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)
        expect { @pr1.reload }.not_to raise_error
      end

      it "logs error to cloudwatch if error occurs when destroying sample" do
        object_ids = [@pr1.id]
        allow_any_instance_of(Sample).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error)

        HardDeleteObjects.perform(object_ids, short_read_mngs, @joe.id)
        expect { @sample1.reload }.not_to raise_error
      end
    end

    context "when workflow run ids are passed in" do
      before do
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1")
        @wr1 = create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

        @sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2")
        @wr2 = create(:workflow_run, sample: @sample2, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
        @wr3 = create(:workflow_run, sample: @sample2, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
      end

      it "raises error if no deletable objects are found" do
        object_ids = [-1]
        expect do
          HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)
        end.to raise_error("Not all ids correspond to deletable objects")
      end

      it "raises error if not all ids correspond to deletable objects" do
        object_ids = [@wr1.id, -1]
        expect do
          HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)
        end.to raise_error("Not all ids correspond to deletable objects")
      end

      it "successfully destroys workflow runs" do
        object_ids = [@wr1.id, @wr2.id]
        HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)

        expect { @wr1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @wr2.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "triggers S3 file deletion for workflow runs and samples if applicable" do
        object_ids = [@wr1.id, @wr2.id]
        expect(S3Util).to receive(:delete_s3_prefix).with(@wr1.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with(@wr2.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample1.sample_path}/")
        expect(S3Util).not_to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample2.sample_path}/")
        HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)
      end

      it "destroys the samples only if there are no remaining pipeline or workflow runs" do
        object_ids = [@wr1.id, @wr2.id]
        HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)

        # should destroy sample 1 but not sample 2
        expect { @sample1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @sample2.reload }.not_to raise_error
      end

      it "logs to cloudwatch if error occurs when destroying workflow run" do
        object_ids = [@wr1.id]
        allow_any_instance_of(WorkflowRun).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error)

        HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)
        expect { @wr1.reload }.not_to raise_error
      end

      it "logs error to cloudwatch if error occurs when destroying sample" do
        object_ids = [@wr1.id]
        allow_any_instance_of(Sample).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error)

        HardDeleteObjects.perform(object_ids, consensus_genome, @joe.id)
        expect { @sample1.reload }.not_to raise_error
      end
    end

    it "raises error and logs it if error occurs while performing deletions" do
      allow(HardDeleteObjects).to receive(:hard_delete_objects).and_raise("Error")
      expect(LogUtil).to receive(:log_error)
      expect do
        HardDeleteObjects.perform([], consensus_genome, @joe.id)
      end.to raise_error("Error")
    end
  end
end
