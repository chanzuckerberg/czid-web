require 'rails_helper'

RSpec.describe AmrHeatmapController, type: :controller do
  create_users

  # Admin context
  context 'Admin user' do
    # create users
    before do
      sign_in @admin
    end

    describe "GET index" do
      it "sees correct AMR data" do
        # Create a test sample (in a project, as required) that contains Amr data.
        # Note that pipeline_runs_data needs to have two attributes in order for the sample
        # to be available for the AmrHeatmapController: a job_status equal to the constant
        # STATUS_CHECKED as defined in the PipelineRun class, and an output_states array
        # containing an OutputState for amr_counts with state equal to the constant
        # STATUS_LOADED as defined in the PipelineRun class.
        create(:project, users: [@admin, @joe], samples_data: [{
                 pipeline_runs_data: [{
                   amr_counts_data: [{
                     gene: "IamA_Gene"
                   }],
                   job_status: PipelineRun::STATUS_CHECKED,
                   output_states_data: [{
                     output: "amr_counts",
                     state: PipelineRun::STATUS_LOADED
                   }]
                 }]
               }])

        # Now that the sample has been created, grab it from the test db
        power = Power.new(@admin) # for safe access
        @viewable_samples = power.viewable_samples
        @sample = @viewable_samples[0] # Because we only have one test sample
        @amr_counts = @sample.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data

        # Hit the controller
        get :index, params: { id: @sample["id"] }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        # The created_at and updated_at fields seem to differ in format (though not content)
        # when this is run, so they are left them out of the comparison.
        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(sample_id: @sample["id"],
                                              sample_name: @sample["name"],
                                              amr_counts: [{
                                                id: @amr_counts["id"],
                                                gene: @amr_counts["gene"],
                                                allele: @amr_counts["allele"],
                                                coverage: @amr_counts["coverage"],
                                                depth: @amr_counts["depth"],
                                                pipeline_run_id: @amr_counts["pipeline_run_id"],
                                                drug_family: @amr_counts["drug_family"]
                                              }])
      end
    end
  end

  # Regular Joe context
  # Ensure that this feature cannot be accessed by non-admin users
  context 'Joe' do
    before do
      sign_in @joe
    end

    describe "GET index" do
      it "should not see any AMR information" do
        # As above
        expected_project = create(:project, users: [@admin, @joe], samples_data: [{
                                    pipeline_runs_data: [{
                                      amr_counts_data: [{
                                        gene: "IamA_Gene"
                                      }],
                                      job_status: PipelineRun::STATUS_CHECKED,
                                      output_states_data: [{
                                        output: "amr_counts",
                                        state: PipelineRun::STATUS_LOADED
                                      }]
                                    }]
                                  }])

        # Now that the sample has been created, grab it from the test db
        power = Power.new(@joe) # for safe access
        @viewable_samples = power.viewable_samples
        @sample = @viewable_samples[0] # Because we only have one test sample
        @amr_counts = @sample.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data

        # Hit the controller, expect a redirect
        get :index, params: { id: expected_project.id }
        expect(response).to redirect_to("/")
      end
    end
  end
end
