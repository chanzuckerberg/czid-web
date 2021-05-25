require "rails_helper"

RSpec.shared_examples "private action" do |action, options = {}|
  # options:
  # * admin_only : boolean
  # * action type : ['GET', 'PUT']
  options[:action_type] ||= "GET"

  context "Joe" do
    before do
      sign_in @joe
    end

    describe "#{options[:action_type]} /#{action}" do
      context "for workflow run from own sample" do
        it options[:admin_only] ? "returns not found error" : "succeeds" do
          project = create(:project, users: [@joe])
          sample = create(:sample, project: project, user: @joe)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          if options[:admin_only]
            # redirected to root
            expect(response).to redirect_to root_path
          else
            expect(response).to have_http_status :ok
          end
        end
      end

      context "for workflow run from another user's sample" do
        it "returns not found error" do
          project = create(:project)
          sample = create(:sample, project: project)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :not_found
          expect(JSON.parse(response.body, symbolize_names: true)[:status]).to eq("Workflow Run not found")
        end
      end
    end
  end

  context "Admin" do
    before do
      sign_in @admin
    end

    describe "GET /#{action}" do
      context "for workflow run from own sample" do
        it "succeeds" do
          project = create(:project, users: [@admin])
          sample = create(:sample, project: project, user: @admin)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
        end
      end

      context "for workflow run from another user's sample" do
        it "succeeds" do
          project = create(:project)
          sample = create(:sample, project: project)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
        end
      end
    end
  end
end

RSpec.describe WorkflowRunsController, type: :controller do
  create_users

  context "Access control" do
    before do
      allow_any_instance_of(WorkflowRun).to receive(:rerun)
    end

    # access control tests
    include_examples "private action", :show
    include_examples "private action", :results
    include_examples "private action", :rerun, admin_only: true
  end

  # Actions that are common to all users
  with_signed_in_users(:joe, :admin) do |username|
    context "User #{username}" do
      describe "GET index for my_data domain" do
        before do
          other_user = create(:user)
          project_with_errored_sample = create(:project, users: [@user])
          errored_sample = create(:sample, project: project_with_errored_sample, upload_error: Sample::DO_NOT_PROCESS)
          @errored_workflow_run = create(:workflow_run, sample_id: errored_sample.id)

          my_projects = [
            project_with_errored_sample,
            create(:project, users: [@user], samples_data: [
                     {
                       user: @user,
                       host_genome_name: "Human",
                       metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" },
                       number_of_workflow_runs: 3,
                       sample_notes: "these are some sample notes",
                       name: "Test Sample 1",
                     },
                   ]),
            create(:project, users: [other_user, @user], samples_data: [{ user: @user, number_of_workflow_runs: 3 }]),
            create(:public_project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 2 }]),
            create(:project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 1 }]),
          ]

          other_user_project = create(:project, users: [other_user])
          other_user_sample = create(:sample, project: other_user_project)
          @other_user_workflow_run = create(:workflow_run, sample: other_user_sample)

          create(:public_project)
          create(:project)

          sample_ids = my_projects.map(&:sample_ids).flatten
          @expected_workflow_runs = WorkflowRun.where(sample_id: sample_ids)
        end

        it "should not see workflow runs from other users" do
          get :index, params: { domain: "my_data", format: "basic" }

          json_response = JSON.parse(response.body)
          workflow_runs = json_response["workflow_runs"]
          workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

          expect(workflow_run_ids).to_not include(@other_user_workflow_run.id)
        end

        it "sees all basic fields with 'basic' format" do
          get :index, params: { domain: "my_data", format: "basic" }

          json_response = JSON.parse(response.body)
          workflow_runs = json_response["workflow_runs"]
          workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

          response_workflow_run = workflow_runs[0]
          expected_workflow_run = WorkflowRun.find(response_workflow_run["id"])

          expect(json_response.keys).to eq(["workflow_runs"])
          expect(workflow_runs.count).to eq(@expected_workflow_runs.count)
          expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          expect(response_workflow_run).to include_json(cached_results: expected_workflow_run.cached_results,
                                                        created_at: expected_workflow_run.created_at.as_json,
                                                        inputs: {
                                                          technology: expected_workflow_run.get_input("technology"),
                                                          wetlab_protocol: expected_workflow_run.get_input("wetlab_protocol"),
                                                          medaka_model: expected_workflow_run.get_input("medaka_model"),
                                                        }.as_json,
                                                        status: expected_workflow_run.status,
                                                        id: expected_workflow_run.id,
                                                        workflow: expected_workflow_run.workflow)
        end

        it "sees basic fields with sample info included with 'with_sample_info' format" do
          get :index, params: { domain: "my_data", format: "with_sample_info" }

          json_response = JSON.parse(response.body)
          workflow_runs = json_response["workflow_runs"]
          workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

          response_workflow_run = workflow_runs[0]
          expected_workflow_run = WorkflowRun.find(response_workflow_run["id"])
          expected_sample = expected_workflow_run.sample
          expected_sample_attributes = [:id, :created_at, :host_genome_id, :name, :private_until, :project_id, :sample_notes]
          expected_sample_info = expected_sample.slice(expected_sample_attributes)
          expected_sample_info["public"] = expected_sample.project.public_access
          metadata_by_sample_id = Metadatum.by_sample_ids([expected_sample.id])

          expect(json_response.keys).to eq(["workflow_runs"])
          expect(workflow_runs.count).to eq(@expected_workflow_runs.count)
          expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          expect(response_workflow_run).to include_json(id: expected_workflow_run.id,
                                                        cached_results: expected_workflow_run.cached_results,
                                                        created_at: expected_workflow_run.created_at.as_json,
                                                        status: expected_workflow_run.status,
                                                        workflow: expected_workflow_run.workflow,
                                                        inputs: {
                                                          technology: expected_workflow_run.get_input("technology"),
                                                          wetlab_protocol: expected_workflow_run.get_input("wetlab_protocol"),
                                                          medaka_model: expected_workflow_run.get_input("medaka_model"),
                                                        }.as_json,
                                                        sample: {
                                                          info: expected_sample_info.as_json,
                                                          metadata: metadata_by_sample_id[expected_sample.id].as_json,
                                                          project_name: expected_sample.project.name,
                                                          uploader: { id: expected_sample.user.id, name: expected_sample.user.name }.as_json,
                                                        }.as_json)
        end

        context "when a sample upload error occurs" do
          it "sees basic fields with sample info included with 'with_sample_info' format and a result_status_description is included" do
            get :index, params: { domain: "my_data", format: "with_sample_info" }

            json_response = JSON.parse(response.body)
            workflow_runs = json_response["workflow_runs"]
            workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

            response_workflow_run = workflow_runs.find { |wr| wr["id"] == @errored_workflow_run.id }
            expected_workflow_run = WorkflowRun.find(response_workflow_run["id"])
            expected_sample = expected_workflow_run.sample
            expected_sample_attributes = [:id, :created_at, :host_genome_id, :name, :private_until, :project_id, :sample_notes]
            expected_sample_info = expected_sample.slice(expected_sample_attributes)
            expected_sample_info["public"] = expected_sample.project.public_access
            expected_sample_info["result_status_description"] = "SKIPPED"
            metadata_by_sample_id = Metadatum.by_sample_ids([expected_sample.id])

            expect(json_response.keys).to eq(["workflow_runs"])
            expect(workflow_runs.count).to eq(@expected_workflow_runs.count)
            expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
            expect(response_workflow_run).to include_json(id: expected_workflow_run.id,
                                                          cached_results: expected_workflow_run.cached_results,
                                                          created_at: expected_workflow_run.created_at.as_json,
                                                          status: expected_workflow_run.status,
                                                          workflow: expected_workflow_run.workflow,
                                                          inputs: {
                                                            technology: expected_workflow_run.get_input("technology"),
                                                            wetlab_protocol: expected_workflow_run.get_input("wetlab_protocol"),
                                                            medaka_model: expected_workflow_run.get_input("medaka_model"),
                                                          }.as_json,
                                                          sample: {
                                                            info: expected_sample_info.as_json,
                                                            metadata: metadata_by_sample_id[expected_sample.id].as_json,
                                                            project_name: expected_sample.project.name,
                                                            uploader: { id: expected_sample.user.id, name: expected_sample.user.name }.as_json,
                                                          }.as_json)
          end
        end
      end

      describe "GET index for public domain" do
        before do
          other_user = create(:user)
          public_projects = [
            create(:public_project, users: [@user], samples_data: [
                     {
                       user: @user,
                       host_genome_name: "Human",
                       metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" },
                       number_of_workflow_runs: 3,
                       sample_notes: "these are some sample notes",
                       name: "Test Sample 1",
                     },
                   ]),
            create(:public_project),
            create(:public_project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 1 }]),
            create(:public_project, users: [other_user], samples_data: [{ user: other_user, number_of_workflow_runs: 4 }]),
          ]

          private_project = create(:project, users: [other_user, @user])
          private_sample = create(:sample, project: private_project)
          @private_workflow_run = create(:workflow_run, sample: private_sample)
          create(:project, users: [other_user, @user], samples_data: [{ user: @user, number_of_workflow_runs: 3 }])
          create(:project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 1 }])
          create(:project, users: [other_user])
          create(:project)

          sample_ids = public_projects.map(&:sample_ids).flatten
          @expected_workflow_runs = WorkflowRun.where(sample_id: sample_ids)
        end

        it "should not see private workflow runs" do
          get :index, params: { domain: "public", format: "basic" }

          json_response = JSON.parse(response.body)
          workflow_runs = json_response["workflow_runs"]
          workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

          expect(workflow_run_ids).to_not include(@private_workflow_run.id)
        end

        it "sees all basic fields when 'basic' format is specified" do
          get :index, params: { domain: "public", format: "basic" }

          json_response = JSON.parse(response.body)
          workflow_runs = json_response["workflow_runs"]
          workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

          response_workflow_run = workflow_runs[0]
          expected_workflow_run = WorkflowRun.find(response_workflow_run["id"])

          expect(json_response.keys).to eq(["workflow_runs"])
          expect(workflow_runs.count).to eq(@expected_workflow_runs.count)
          expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          expect(response_workflow_run).to include_json(cached_results: expected_workflow_run.cached_results,
                                                        created_at: expected_workflow_run.created_at.as_json,
                                                        inputs: {
                                                          technology: expected_workflow_run.get_input("technology"),
                                                          wetlab_protocol: expected_workflow_run.get_input("wetlab_protocol"),
                                                          medaka_model: expected_workflow_run.get_input("medaka_model"),
                                                        }.as_json,
                                                        status: expected_workflow_run.status,
                                                        id: expected_workflow_run.id,
                                                        workflow: expected_workflow_run.workflow)
        end

        it "sees basic fields with sample info included when 'with_sample_info' format is specified" do
          get :index, params: { domain: "public", format: "with_sample_info" }

          json_response = JSON.parse(response.body)
          workflow_runs = json_response["workflow_runs"]
          workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

          response_workflow_run = workflow_runs[0]
          expected_workflow_run = WorkflowRun.find(response_workflow_run["id"])
          expected_sample = expected_workflow_run.sample
          expected_sample_attributes = [:id, :created_at, :host_genome_id, :name, :private_until, :project_id, :sample_notes]
          expected_sample_info = expected_sample.slice(expected_sample_attributes)
          expected_sample_info["public"] = expected_sample.project.public_access
          metadata_by_sample_id = Metadatum.by_sample_ids([expected_sample.id])

          expect(json_response.keys).to eq(["workflow_runs"])
          expect(workflow_runs.count).to eq(@expected_workflow_runs.count)
          expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          expect(response_workflow_run).to include_json(id: expected_workflow_run.id,
                                                        cached_results: expected_workflow_run.cached_results,
                                                        created_at: expected_workflow_run.created_at.as_json,
                                                        status: expected_workflow_run.status,
                                                        workflow: expected_workflow_run.workflow,
                                                        inputs: {
                                                          technology: expected_workflow_run.get_input("technology"),
                                                          wetlab_protocol: expected_workflow_run.get_input("wetlab_protocol"),
                                                          medaka_model: expected_workflow_run.get_input("medaka_model"),
                                                        }.as_json,
                                                        sample: {
                                                          info: expected_sample_info.as_json,
                                                          metadata: metadata_by_sample_id[expected_sample.id].as_json,
                                                          project_name: expected_sample.project.name,
                                                          uploader: { id: expected_sample.user.id, name: expected_sample.user.name }.as_json,
                                                        }.as_json)
        end
      end

      ["my_data", "public"].each do |domain|
        ["basic", "with_sample_info"].freeze.each do |format_param|
          context "sample filters" do
            before do
              create(:public_project, users: [@user], samples_data: [
                       {
                         user: @user,
                         host_genome_name: "Bear",
                         metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" },
                         number_of_workflow_runs: 4,
                         name: "Test Sample 6",
                       },
                       {
                         user: @user,
                         host_genome_name: "Cow",
                         metadata_fields: { collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab" },
                         number_of_workflow_runs: 1,
                         name: "Test Sample 7",
                       },
                     ])
              create(:public_project, users: [@user], samples_data: [
                       {
                         user: @user,
                         host_genome_name: "Mosquito",
                         metadata_fields: { collection_location: "Los Angeles, USA", sample_type: "Brain" },
                         number_of_workflow_runs: 2,
                         name: "Test Sample 8",
                       },
                     ])
            end

            context "filtering by sample host" do
              it "returns correct workflow runs in domain '#{domain}' with format '#{format_param}'" do
                sample_filters = {
                  host: HostGenome.find_by(name: "Bear").id,
                }
                workflow_run_filters = {
                  workflow: WorkflowRun::WORKFLOW[:consensus_genome],
                }

                get :index, params: { domain: domain, format: format_param, workflow_run_filters: workflow_run_filters, sample_filters: sample_filters }

                json_response = JSON.parse(response.body)

                workflow_runs = json_response["workflow_runs"]
                workflow_runs_workflow = workflow_runs.map { |wr| wr["workflow"] }.uniq
                workflow_run_ids = workflow_runs.map { |wr| wr["id"] }
                sample_ids = WorkflowRun.where(id: workflow_run_ids).pluck(:sample_id).uniq
                samples = Sample.where(id: sample_ids)
                sample_host_genomes = samples.map(&:host_genome_name).uniq

                expect(json_response.keys).to eq(["workflow_runs"])
                expect(workflow_runs_workflow).to eq([WorkflowRun::WORKFLOW[:consensus_genome]])
                expect(sample_host_genomes).to eq(["Bear"])
              end
            end

            context "filtering by sample location_v2" do
              it "returns correct workflow runs in domain '#{domain}' with format '#{format_param}'" do
                sample_filters = {
                  locationV2: "New York, USA",
                }
                workflow_run_filters = {
                  workflow: WorkflowRun::WORKFLOW[:consensus_genome],
                }

                get :index, params: { domain: domain, format: format_param, workflow_run_filters: workflow_run_filters, sample_filters: sample_filters }

                json_response = JSON.parse(response.body)

                workflow_runs = json_response["workflow_runs"]
                workflow_runs_workflow = workflow_runs.map { |wr| wr["workflow"] }.uniq
                workflow_run_ids = workflow_runs.map { |wr| wr["id"] }
                sample_ids = WorkflowRun.where(id: workflow_run_ids).pluck(:sample_id).uniq
                collection_locations = Metadatum.where(sample_id: sample_ids, key: "collection_location_v2").pluck(:string_validated_value).uniq

                expect(json_response.keys).to eq(["workflow_runs"])
                expect(workflow_runs_workflow).to eq([WorkflowRun::WORKFLOW[:consensus_genome]])
                expect(collection_locations).to eq([sample_filters[:locationV2]])
              end
            end

            context "filtering by sample type" do
              it "returns the correct workflow runs in domain '#{domain}' with format '#{format_param}'" do
                sample_filters = {
                  tissue: "Brain",
                }
                workflow_run_filters = {
                  workflow: WorkflowRun::WORKFLOW[:consensus_genome],
                }

                get :index, params: { domain: domain, format: format_param, workflow_run_filters: workflow_run_filters, sample_filters: sample_filters }

                json_response = JSON.parse(response.body)

                workflow_runs = json_response["workflow_runs"]
                workflow_runs_workflow = workflow_runs.map { |wr| wr["workflow"] }.uniq
                workflow_run_ids = workflow_runs.map { |wr| wr["id"] }
                sample_ids = WorkflowRun.where(id: workflow_run_ids).pluck(:sample_id).uniq
                sample_types = Metadatum.where(sample_id: sample_ids, key: "sample_type").pluck(:string_validated_value).uniq

                expect(json_response.keys).to eq(["workflow_runs"])
                expect(workflow_runs_workflow).to eq([WorkflowRun::WORKFLOW[:consensus_genome]])
                expect(sample_types).to eq([sample_filters[:tissue]])
              end
            end
          end

          context "workflow run filters" do
            before do
              public_project = create(:public_project, users: [@user])
              create(:sample, project: public_project, name: "Test Sample 9", workflow_runs_data: [
                       { workflow: WorkflowRun::WORKFLOW[:consensus_genome] },
                       { workflow: WorkflowRun::WORKFLOW[:short_read_mngs] },
                       { workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: true },
                     ])
            end

            context "filtering by workflow" do
              it "returns correct and non-deprecated workflow runs in domain '#{domain}' with format '#{format_param}'" do
                workflow_run_filters = {
                  workflow: WorkflowRun::WORKFLOW[:consensus_genome],
                }

                get :index, params: { domain: domain, format: format_param, workflow_run_filters: workflow_run_filters }

                json_response = JSON.parse(response.body)

                workflow_runs = json_response["workflow_runs"]
                has_deprecated_workflow_run = workflow_runs.map { |wr| WorkflowRun.find(wr["id"]).deprecated }.include?(true)
                workflow_runs_workflow = workflow_runs.map { |wr| wr["workflow"] }.uniq

                expect(json_response.keys).to eq(["workflow_runs"])
                expect(has_deprecated_workflow_run).to eq(false)
                expect(workflow_runs_workflow).to eq([WorkflowRun::WORKFLOW[:consensus_genome]])
              end
            end
          end
        end
      end

      ["basic", "with_sample_info"].each do |format_param|
        describe "GET index for my_data domain with format '#{format_param}'" do
          before do
            other_user = create(:user)
            my_projects = [
              create(:project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 3 }]),
              create(:project, users: [other_user, @user], samples_data: [{ user: @user, number_of_workflow_runs: 3 }]),
              create(:public_project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 2 }]),
              create(:project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 1 }]),
            ]

            create(:project, users: [other_user])
            create(:public_project)
            create(:project)

            sample_ids = my_projects.map(&:sample_ids).flatten
            @expected_workflow_runs = WorkflowRun.where(sample_id: sample_ids)
          end

          it "sees own workflow runs" do
            get :index, params: { domain: "my_data", format: format_param }

            json_response = JSON.parse(response.body)
            workflow_runs = json_response["workflow_runs"]
            workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

            expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          end

          it "sees own workflow runs with a list of all workflow run ids" do
            get :index, params: { domain: "my_data", format: format_param, listAllIds: true }

            json_response = JSON.parse(response.body)
            workflow_runs = json_response["workflow_runs"]
            workflow_run_ids = workflow_runs.map { |wr| wr["id"] }
            all_workflow_run_ids = json_response["all_workflow_run_ids"]

            expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
            expect(all_workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          end
        end

        describe "GET index for public domain with format '#{format_param}'" do
          before do
            other_user = create(:user)
            public_projects = [
              create(:public_project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 2 }]),
              create(:public_project),
              create(:public_project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 1 }]),
              create(:public_project, users: [other_user], samples_data: [{ user: other_user, number_of_workflow_runs: 4 }]),
            ]

            create(:project, users: [other_user, @user], samples_data: [{ user: @user, number_of_workflow_runs: 3 }])
            create(:project, users: [@user], samples_data: [{ user: @user, number_of_workflow_runs: 1 }])
            create(:project, users: [other_user])
            create(:project)

            sample_ids = public_projects.map(&:sample_ids).flatten
            @expected_workflow_runs = WorkflowRun.where(sample_id: sample_ids)
          end

          it "sees public workflow runs" do
            get :index, params: { domain: "public", format: format_param }

            json_response = JSON.parse(response.body)
            workflow_runs = json_response["workflow_runs"]
            workflow_run_ids = workflow_runs.map { |wr| wr["id"] }

            expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          end

          it "sees public workflow runs with a list of all workflow run ids" do
            get :index, params: { domain: "public", format: format_param, listAllIds: true }

            json_response = JSON.parse(response.body)
            workflow_runs = json_response["workflow_runs"]
            workflow_run_ids = workflow_runs.map { |wr| wr["id"] }
            all_workflow_run_ids = json_response["all_workflow_run_ids"]

            expect(workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
            expect(all_workflow_run_ids).to contain_exactly(*@expected_workflow_runs.pluck(:id))
          end
        end
      end
    end
  end

  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET /results" do
      before do
        @project = create(:project, users: [@joe])
        @sample = create(:sample, project: @project, user: @joe)
      end

      context "for consensus genome workflow" do
        it "returns success response" do
          workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get :results, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
          json = JSON.parse(response.body, symbolize_names: true)
          expect(json.keys).to contain_exactly(:coverage_viz, :quality_metrics, :taxon_info)
        end
      end

      context "for short_read_mngs pipeline" do
        it "returns not found error" do
          workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:short_read_mngs])

          get :results, params: { id: workflow_run.id }

          expect(response).to have_http_status :not_found
          expect(JSON.parse(response.body, symbolize_names: true)[:status]).to eq("Workflow Run action not supported")
        end
      end
    end

    describe "GET /zip_link" do
      before do
        project = create(:project, users: [@joe])
        @sample = create(:sample, project: project)
        @sample_without_workflow_run = create(:sample, project: project)
        @workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])
      end

      it "redirects to the path generated" do
        fake_aws_link = "fake_aws_link"
        expect_any_instance_of(ConsensusGenomeWorkflowRun).to receive(:zip_link).and_return(fake_aws_link)

        get :zip_link, params: { id: @workflow_run.id }

        expect(response).to have_http_status :redirect
        expect(response.headers["Location"]).to include(fake_aws_link)
      end

      it "returns an error if no path generated" do
        get :zip_link, params: { id: @workflow_run.id }

        expect(response).to have_http_status :not_found
        expect(JSON.parse(response.body, symbolize_names: true)[:status]).to eq("Output not available")
      end
    end
  end

  context "Admin" do
    before do
      sign_in @admin
    end

    describe "PUT /rerun" do
      before do
        @project = create(:project, users: [@joe])
        @sample = create(:sample, project: @project, user: @joe)
        @workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])
      end

      it "creates a new workflow run, dispatches and deprecates previous run" do
        expect(SfnCGPipelineDispatchService).to receive(:call).with(instance_of(WorkflowRun))

        put :rerun, params: { id: @workflow_run.id }

        result_workflow_runs = @sample.workflow_runs
        expect(@sample.workflow_runs.count).to eq(2)

        expect(result_workflow_runs[0].id).to eq(@workflow_run.id)
        expect(result_workflow_runs[0].deprecated).to eq(true)

        expect(result_workflow_runs[1].deprecated).to eq(false)
      end
    end
  end
end
