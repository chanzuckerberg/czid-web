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
                                   name: "completed Illumina mNGs sample 1",
                                   deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @sample1.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: Sample.name,
               soft_deleted_at: 5.minutes.ago)
        @pr1 = create(:pipeline_run,
                      sample: @sample1,
                      technology: illumina,
                      finalized: 1,
                      sfn_execution_arn: fake_sfn_execution_arn,
                      deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @pr1.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: PipelineRun.name,
               soft_deleted_at: 5.minutes.ago)

        @sample2 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 2")
        @pr2 = create(:pipeline_run,
                      sample: @sample2,
                      technology: illumina,
                      finalized: 1,
                      sfn_execution_arn: fake_sfn_execution_arn,
                      deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @pr2.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: PipelineRun.name,
               soft_deleted_at: 5.minutes.ago)
        @wr2 = create(:workflow_run, sample: @sample2, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

        @phylo_tree = create(:phylo_tree, user_id: @joe.id, name: "Test Phylo Tree", pipeline_runs: [@pr1, @pr2])
        @phylo_tree_ng = create(:phylo_tree_ng, user_id: @joe.id, name: "Test Phylo Tree Ng", pipeline_runs: [@pr1, @pr2], s3_output_prefix: "s3://fake_bucket/fake/path")
      end

      it "successfully destroys valid pipeline runs" do
        object_ids = [@pr1.id, @pr2.id]
        sample_ids = [@sample1.id, @sample2.id]
        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)

        expect { @pr1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @pr2.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "triggers S3 file deletion for pipeline runs and samples if applicable" do
        object_ids = [@pr1.id, @pr2.id]
        sample_ids = [@sample1.id]
        expect(S3Util).to receive(:delete_s3_prefix).with(@pr1.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with(@pr2.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/phylo_trees/#{@phylo_tree.id}")
        expect(S3Util).to receive(:delete_s3_prefix).with(@phylo_tree_ng.s3_output_prefix)
        expect(S3Util).to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample1.sample_path}/")
        expect(S3Util).not_to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample2.sample_path}/")
        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
      end

      it "destroys the samples only if deleted_at is not nil" do
        object_ids = [@pr1.id, @pr2.id]
        sample_ids = [@sample1.id, @sample2.id]
        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)

        # should destroy sample 1 but not sample 2
        expect { @sample1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @sample2.reload }.not_to raise_error
      end

      it "logs to cloudwatch twice if error occurs when destroying pipeline run" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]
        allow_any_instance_of(PipelineRun).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_message).with("Failed to destroy PipelineRun after 1 attempts, retrying", exception: ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error).with("Bulk Deletion Error: Failed to destroy PipelineRun after 2 attempts.",
                                                    exception: ActiveRecord::RecordNotDestroyed,
                                                    object_id: @pr1.id,
                                                    workflow: short_read_mngs)

        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        expect { @pr1.reload }.not_to raise_error
      end

      it "logs to cloudwatch twice if error occurs when destroying sample" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]
        allow_any_instance_of(Sample).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_message).with("Failed to destroy Sample after 1 attempts, retrying", exception: ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error).with("Bulk Deletion Error: Failed to destroy Sample after 2 attempts.",
                                                    exception: ActiveRecord::RecordNotDestroyed,
                                                    object_id: @sample1.id,
                                                    workflow: short_read_mngs)

        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        expect { @sample1.reload }.not_to raise_error
      end

      it "updates the hard_deleted_at field on the DeletionLog for the pipeline run if deletion was successful" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]

        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @pr1.id, object_type: PipelineRun.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_within(1.minute).of(Time.now.utc)
      end

      it "does not update the hard_deleted_at field on the DeletionLog for the pipeline run if deletion failed" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]

        allow_any_instance_of(PipelineRun).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @pr1.id, object_type: PipelineRun.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_nil
      end

      it "raises an error if no DeletionLog is found for the run" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]

        allow(DeletionLog).to receive(:find_by).and_return(nil)
        expect do
          HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        end.to raise_error("GDPR soft deletion log not found for PipelineRun with id #{@pr1.id} and user #{@joe.id}")
      end

      it "updates the hard_deleted_at field on the DeletionLog for the sample if deletion was successful" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]

        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @sample1.id, object_type: Sample.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_within(1.minute).of(Time.now.utc)
      end

      it "does not update the hard_deleted_at field on the DeletionLog for the sample if deletion failed" do
        object_ids = [@pr1.id]
        sample_ids = [@sample1.id]

        allow_any_instance_of(Sample).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @sample1.id, object_type: Sample.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_nil
      end
    end

    context "when sample ids are passed in but no run ids are passed in" do
      before do
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "Illumina sample with no pipeline runs",
                                   deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @sample1.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: Sample.name,
               soft_deleted_at: 5.minutes.ago)
        object_ids = []
        sample_ids = [@sample1.id]
        HardDeleteObjects.perform(object_ids, sample_ids, short_read_mngs, @joe.id)
      end

      it "successfully destroys the samples" do
        expect { @sample1.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "updates the hard_deleted_at field on the DeletionLog for the sample" do
        log = DeletionLog.find_by(object_id: @sample1.id, object_type: Sample.name, user_id: @joe.id)
        expect(log.hard_deleted_at).to be_within(1.minute).of(Time.now.utc)
      end
    end

    context "when workflow run ids are passed in" do
      before do
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1", deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @sample1.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: Sample.name,
               soft_deleted_at: 5.minutes.ago)
        @wr1 = create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded], deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @wr1.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: WorkflowRun.name,
               soft_deleted_at: 5.minutes.ago)
        @sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2")
        @wr2 = create(:workflow_run, sample: @sample2, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded], deleted_at: 5.minutes.ago)
        create(:deletion_log,
               object_id: @wr2.id,
               user_id: @joe.id,
               user_email: @joe.email,
               object_type: WorkflowRun.name,
               soft_deleted_at: 5.minutes.ago)
        @wr3 = create(:workflow_run, sample: @sample2, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
      end

      it "successfully destroys workflow runs" do
        object_ids = [@wr1.id, @wr2.id]
        sample_ids = [@sample1.id, @sample2.id]
        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)

        expect { @wr1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @wr2.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "triggers S3 file deletion for workflow runs and samples if applicable" do
        object_ids = [@wr1.id, @wr2.id]
        sample_ids = [@sample1.id, @sample2.id]
        expect(S3Util).to receive(:delete_s3_prefix).with(@wr1.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with(@wr2.sfn_output_path)
        expect(S3Util).to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample1.sample_path}/")
        expect(S3Util).not_to receive(:delete_s3_prefix).with("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample2.sample_path}/")
        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
      end

      it "destroys the samples only if there are no remaining pipeline or workflow runs" do
        object_ids = [@wr1.id, @wr2.id]
        sample_ids = [@sample1.id, @sample2.id]
        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)

        # should destroy sample 1 but not sample 2
        expect { @sample1.reload }.to raise_error(ActiveRecord::RecordNotFound)
        expect { @sample2.reload }.not_to raise_error
      end

      it "logs to cloudwatch if error occurs when destroying workflow run" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]
        allow_any_instance_of(WorkflowRun).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_message).with("Failed to destroy WorkflowRun after 1 attempts, retrying", exception: ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error).with("Bulk Deletion Error: Failed to destroy WorkflowRun after 2 attempts.",
                                                    exception: ActiveRecord::RecordNotDestroyed,
                                                    object_id: @wr1.id,
                                                    workflow: consensus_genome)

        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        expect { @wr1.reload }.not_to raise_error
      end

      it "logs error to cloudwatch if error occurs when destroying sample" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]
        allow_any_instance_of(Sample).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_message).with("Failed to destroy Sample after 1 attempts, retrying", exception: ActiveRecord::RecordNotDestroyed)
        expect(LogUtil).to receive(:log_error).with("Bulk Deletion Error: Failed to destroy Sample after 2 attempts.",
                                                    exception: ActiveRecord::RecordNotDestroyed,
                                                    object_id: @sample1.id,
                                                    workflow: consensus_genome)

        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        expect { @sample1.reload }.not_to raise_error
      end

      it "updates the hard_deleted_at field on the DeletionLog for the workflow run if deletion was successful" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]

        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @wr1.id, object_type: WorkflowRun.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_within(1.minute).of(Time.now.utc)
      end

      it "does not update the hard_deleted_at field on the DeletionLog for the workflow run if deletion failed" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]

        allow_any_instance_of(WorkflowRun).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @wr1.id, object_type: WorkflowRun.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_nil
      end

      it "raises an error if no DeletionLog is found for the run" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]

        allow(DeletionLog).to receive(:find_by).and_return(nil)
        expect do
          HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        end.to raise_error("GDPR soft deletion log not found for WorkflowRun with id #{@wr1.id} and user #{@joe.id}")
      end

      it "updates the hard_deleted_at field on the DeletionLog for the sample if deletion was successful" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]

        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @sample1.id, object_type: Sample.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_within(1.minute).of(Time.now.utc)
      end

      it "does not update the hard_deleted_at field on the DeletionLog for the sample if deletion failed" do
        object_ids = [@wr1.id]
        sample_ids = [@sample1.id]

        allow_any_instance_of(Sample).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)
        HardDeleteObjects.perform(object_ids, sample_ids, consensus_genome, @joe.id)
        deletion_log = DeletionLog.find_by(object_id: @sample1.id, object_type: Sample.name, user_id: @joe.id)
        expect(deletion_log.hard_deleted_at).to be_nil
      end
    end

    it "raises error and logs it if error occurs while performing deletions" do
      allow(HardDeleteObjects).to receive(:hard_delete).and_raise("Error")
      expect(LogUtil).to receive(:log_error)
      expect do
        HardDeleteObjects.perform([], [], consensus_genome, @joe.id)
      end.to raise_error("Error")
    end
  end
end
