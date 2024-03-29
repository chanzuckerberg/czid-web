require "rails_helper"

RSpec.describe DeletionValidationService, type: :service do
  create_users

  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }

  context "when no workflow is passed in" do
    it "raises an error" do
      expect do
        DeletionValidationService.call(
          query_ids: [],
          user: @joe,
          workflow: nil
        )
      end.to raise_error(DeletionValidationService::WorkflowMissingError)
    end
  end

  context "when no sample ids are passed in" do
    it "returns an object with empty arrays of ids" do
      validate_samples = DeletionValidationService.call(
        query_ids: [],
        user: @joe,
        workflow: "short-read-mngs"
      )
      expect(validate_samples[:valid_ids]).to be_empty
      expect(validate_samples[:invalid_sample_ids]).to be_empty
    end
  end

  # Validating sample ids for pipeline runs (short and long read mNGS)
  context "when sample ids and workflow are passed in for mNGS workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @joe_complete_sample = create(:sample, project: @project,
                                             user: @joe,
                                             name: "completed Illumina mNGs sample",
                                             pipeline_runs_data: [{ finalized: 1, technology: illumina }])
      @joe_in_prog_sample = create(:sample, project: @project,
                                            user: @joe,
                                            name: "in-progress Illumina mNGS sample",
                                            pipeline_runs_data: [{ finalized: 0, technology: illumina }])
      @joe_rerunning_sample = create(:sample, project: @project,
                                              user: @joe,
                                              name: "rerunning Illumina mNGS sample",
                                              pipeline_runs_data: [
                                                { finalized: 0, technology: illumina, deprecated: false },
                                                { finalized: 1, technology: illumina, deprecated: true },
                                              ])
      @joe_rerun_sample = create(:sample, project: @project,
                                          user: @joe,
                                          name: "rerun Illumina mNGS sample",
                                          pipeline_runs_data: [
                                            { finalized: 1, technology: illumina, deprecated: false },
                                            { finalized: 1, technology: illumina, deprecated: true },
                                          ])
      @joe_failed_upload = create(:sample, project: @project,
                                           user: @joe,
                                           name: "failed upload Illumina mNGS sample",
                                           upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_FAILED)
      @joe_stalled_upload = create(:sample, project: @project,
                                            user: @joe,
                                            name: "stalled upload Illumina mNGS sample",
                                            upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_STALLED)

      @admin_complete_sample = create(:sample, project: @project, user: @admin,
                                               name: "completed admin Illumina mNGS sample",
                                               pipeline_runs_data: [{ finalized: 1, technology: illumina }])
      @admin_in_prog_sample = create(:sample, project: @project, user: @admin,
                                              name: "in-progress admin Illumina mNGS sample",
                                              pipeline_runs_data: [{ finalized: 0, technology: illumina }])

      @sample_ids = [
        @joe_complete_sample.id,
        @joe_in_prog_sample.id,
        @joe_rerunning_sample.id,
        @admin_complete_sample.id,
        @admin_in_prog_sample.id,
        @joe_rerun_sample.id,
        @joe_failed_upload.id,
        @joe_stalled_upload.id,
      ]
    end

    context "when user is not an admin" do
      before do
        @validate_sample_response = DeletionValidationService.call(
          query_ids: @sample_ids,
          user: @joe,
          workflow: "short-read-mngs"
        )
      end

      it "returns successfully for valid inputs" do
        expect(@validate_sample_response[:error]).to be(nil)
        expect(@validate_sample_response[:valid_ids]).not_to be(nil)
        expect(@validate_sample_response[:invalid_sample_ids]).not_to be(nil)
      end

      it "should not include the same sample id in valid and invalid sample arrays" do
        expect(@validate_sample_response[:valid_ids] & @validate_sample_response[:invalid_sample_ids]).to be_empty
      end

      it "filters out samples with in-progress pipeline runs" do
        expect(@validate_sample_response[:invalid_sample_ids]).to include(@joe_in_prog_sample.id, @admin_in_prog_sample.id)
      end

      it "filters out samples uploaded by other users" do
        expect(@validate_sample_response[:invalid_sample_ids]).to include(@admin_complete_sample.id, @admin_in_prog_sample.id)
      end

      it "filters out rerunning samples in progress" do
        expect(@validate_sample_response[:invalid_sample_ids]).to include(@joe_rerunning_sample.id)
      end

      it "allows user to access their own samples with no in-progress pipeline runs" do
        expect(@validate_sample_response[:valid_ids]).to include(@joe_complete_sample.id)
      end

      it "allows deletion of runs on samples with deprecated pipeline runs" do
        expect(@validate_sample_response[:valid_ids]).to include(@joe_rerun_sample.id)
      end

      it "allows deletion of samples that failed to upload (no pipeline runs)" do
        expect(@validate_sample_response[:valid_ids]).to include(@joe_failed_upload.id)
      end

      it "does not allow deletion of samples with upload stalled" do
        expect(@validate_sample_response[:invalid_sample_ids]).to include(@joe_stalled_upload.id)
      end
    end

    context "when user is an admin" do
      before do
        @validate_sample_response = DeletionValidationService.call(
          query_ids: @sample_ids,
          user: @admin,
          workflow: "short-read-mngs"
        )
      end

      it "return successfully for valid inputs" do
        expect(@validate_sample_response[:error]).to be(nil)
        expect(@validate_sample_response[:valid_ids]).not_to be(nil)
        expect(@validate_sample_response[:invalid_sample_ids]).not_to be(nil)
      end

      it "should not include the same sample id in valid and invalid sample arrays" do
        expect(@validate_sample_response[:valid_ids] & @validate_sample_response[:invalid_sample_ids]).to be_empty
      end

      it "allows the admin to delete their own uploaded samples" do
        expect(@validate_sample_response[:valid_ids]).to include(@admin_complete_sample.id)
      end

      it "does not allow admin to delete completed samples uploaded by other users" do
        expect(@validate_sample_response[:valid_ids]).not_to include(@joe_complete_sample.id)
      end

      it "filters out samples with in-progress pipeline runs" do
        expect(@validate_sample_response[:invalid_sample_ids]).to include(@admin_in_prog_sample.id)
      end
    end
  end

  # Validating workflow run ids for workflow runs (CG, AMR)
  context "when workflow run ids and workflow are passed in" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @joe_sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1")
      @completed_joe_wr1 = create(:workflow_run, sample: @joe_sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

      @joe_sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2")
      @failed_joe_wr = create(:workflow_run, sample: @joe_sample2, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:failed])

      @joe_sample3 = create(:sample, project: @project, user: @joe, name: "Joe sample 3")
      @in_prog_joe_wr = create(:workflow_run, sample: @joe_sample3, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:running])

      @joe_rerun_sample = create(:sample, project: @project, user: @joe, name: "Joe rerun sample")
      @deprecated_wr = create(:workflow_run, sample: @joe_rerun_sample, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded], deprecated: true)
      @rerun_wr = create(:workflow_run, sample: @joe_rerun_sample, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded], deprecated: false)

      @joe_sample4 = create(:sample, project: @project, user: @joe, name: "Joe sample 4")
      @amr_wr = create(:workflow_run, sample: @joe_sample4, user_id: @joe.id, workflow: WorkflowRun::WORKFLOW[:amr], status: WorkflowRun::STATUS[:succeeded])

      @joe_sample5 = create(:sample, project: @project, user: @joe, name: "Joe sample 5", upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_FAILED)
      @historical_failed_upload_wr = create(:workflow_run, sample: @joe_sample5, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:created])

      @joe_stalled_upload = create(:sample, project: @project, user: @joe, name: "Joe sample 6", upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_STALLED)
      @stalled_upload_wr = create(:workflow_run, sample: @joe_stalled_upload, workflow: consensus_genome, status: WorkflowRun::STATUS[:created])

      @admin_sample1 = create(:sample, project: @project, user: @admin, name: "Admin sample 1")
      @completed_admin_wr = create(:workflow_run, sample: @admin_sample1, user_id: @admin.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

      @admin_sample2 = create(:sample, project: @project, user: @admin, name: "Admin sample 2")
      @in_prog_admin_wr = create(:workflow_run, sample: @admin_sample2, user_id: @admin.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:running])

      @workflow_run_ids = [
        @completed_joe_wr1.id,
        @in_prog_joe_wr.id,
        @failed_joe_wr.id,
        @completed_admin_wr.id,
        @in_prog_admin_wr.id,
        @amr_wr.id,
        @rerun_wr.id,
        @historical_failed_upload_wr.id,
        @stalled_upload_wr.id,
      ]

      @completed_joe_wr2 = create(:workflow_run, sample: @joe_sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
    end

    context "when user is not an admin" do
      before do
        @validate_wr_response = DeletionValidationService.call(
          query_ids: @workflow_run_ids,
          user: @joe,
          workflow: consensus_genome
        )
      end

      it "allows the user to delete their own completed workflow runs" do
        expect(@validate_wr_response[:valid_ids]).to include(@completed_joe_wr1.id, @failed_joe_wr.id)
      end

      it "filters out workflow runs on samples uploaded by another user" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@completed_admin_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).to include(@completed_admin_wr.sample_id)
      end

      it "filters out in progress workflow runs" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@in_prog_joe_wr.id, @in_prog_admin_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).to include(@in_prog_joe_wr.sample_id, @in_prog_admin_wr.sample_id)
      end

      it "filters out workflow runs with a different workflow" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@amr_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).to include(@amr_wr.sample_id)
      end

      it "returns only the specified workflow runs when multiple active CG workflow runs exist on one sample" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@completed_joe_wr2.id)
        expect(@validate_wr_response[:invalid_sample_ids]).not_to include(@completed_joe_wr2.sample_id)
      end

      it "allows deletion of runs on samples with deprecated workflow runs" do
        expect(@validate_wr_response[:valid_ids]).to include(@rerun_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).not_to include(@rerun_wr.sample_id)
      end

      it "allows deletion of historical CG samples that failed to upload" do
        expect(@validate_wr_response[:valid_ids]).to include(@historical_failed_upload_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).not_to include(@historical_failed_upload_wr.sample_id)
      end

      it "does not allow deletion of workflow runs for samples with upload stalled" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@stalled_upload_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).to include(@joe_stalled_upload.id)
      end
    end

    context "when user is an admin" do
      before do
        @validate_wr_response = DeletionValidationService.call(
          query_ids: @workflow_run_ids,
          user: @admin,
          workflow: consensus_genome
        )
      end

      it "allows the admin to delete their own completed workflow runs" do
        expect(@validate_wr_response[:valid_ids]).to include(@completed_admin_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).not_to include(@completed_admin_wr.sample_id)
      end

      it "does not allow the admin to delete in-progress runs" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@in_prog_admin_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).to include(@in_prog_admin_wr.sample_id)
      end

      it "does not allow the admin to delete others' runs" do
        expect(@validate_wr_response[:valid_ids]).not_to include(@completed_joe_wr1.id, @failed_joe_wr.id)
        expect(@validate_wr_response[:invalid_sample_ids]).to include(@completed_joe_wr1.sample_id, @failed_joe_wr.sample_id)
      end
    end
  end
end
