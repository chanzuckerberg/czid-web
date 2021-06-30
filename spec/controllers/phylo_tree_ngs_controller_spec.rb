require 'rails_helper'

RSpec.describe PhyloTreeNgsController, type: :controller do
  create_users

  describe "GET index" do
    let(:fake_sfn_name) { "fake_sfn_name" }
    let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
    let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }

    before do
      sign_in @joe

      @project_one = create(:project, users: [@joe])
      sample_one = create(:sample, project: @project_one)
      @pr_one = create(:pipeline_run, sample: sample_one)

      sample_two = create(:sample, project: @project_one)
      @pr_two = create(:pipeline_run, sample: sample_two)
      @taxon_lineage_one = create(:taxon_lineage, taxid: 1)

      @project_two = create(:project, users: [@joe])
      sample_three = create(:sample, project: @project_two)
      @pr_three = create(:pipeline_run, sample: sample_three)

      admin_project = create(:project, users: [@admin])
      admin_sample_one = create(:sample, project: admin_project)
      @admin_pr_one = create(:pipeline_run, sample: admin_sample_one)

      admin_sample_two = create(:sample, project: admin_project)
      @admin_pr_two = create(:pipeline_run, sample: admin_sample_two)
      admin_inputs_json = { pipeline_run_ids: [@admin_pr_one.id, @admin_pr_two.id], tax_id: 2 }
      @taxon_lineage_two = create(:taxon_lineage, taxid: 2)

      @phylo_tree_one = create(:phylo_tree_ng,
                               user: @joe,
                               project: @project_one,
                               pipeline_runs: [@pr_one],
                               name: "Phylo tree ng 1",
                               status: WorkflowRun::STATUS[:failed],
                               sfn_execution_arn: fake_sfn_execution_arn,
                               inputs_json: { pipeline_run_ids: [@pr_one.id, @pr_two.id], tax_id: 1 })

      @phylo_tree_two = create(:phylo_tree_ng,
                               user: @joe,
                               project: @project_one,
                               pipeline_runs: [@pr_two],
                               name: "Phylo tree ng 2",
                               status: WorkflowRun::STATUS[:running],
                               sfn_execution_arn: fake_sfn_execution_arn,
                               inputs_json: { pipeline_run_ids: [@pr_one.id, @pr_two.id], tax_id: 2 })

      @phylo_tree_three = create(:phylo_tree_ng,
                                 user: @joe,
                                 project: @project_two,
                                 pipeline_runs: [@pr_three],
                                 name: "Phylo tree ng 3",
                                 status: WorkflowRun::STATUS[:succeeded],
                                 sfn_execution_arn: fake_sfn_execution_arn,
                                 inputs_json: { pipeline_run_ids: [@pr_three.id], tax_id: 1 })

      create(:phylo_tree_ng,
             user: @admin,
             project: admin_project,
             pipeline_runs: [@admin_pr_one],
             name: "Phylo tree ng 4",
             status: WorkflowRun::STATUS[:succeeded],
             sfn_execution_arn: fake_sfn_execution_arn,
             inputs_json: admin_inputs_json)

      create(:phylo_tree_ng,
             user: @admin,
             project: admin_project,
             pipeline_runs: [@admin_pr_one],
             name: "Phylo tree ng 5",
             status: WorkflowRun::STATUS[:succeeded_with_issue],
             sfn_execution_arn: fake_sfn_execution_arn,
             inputs_json: admin_inputs_json)

      create(:phylo_tree_ng,
             user: @admin,
             project: admin_project,
             pipeline_runs: [@admin_pr_two],
             name: "Phylo tree ng 6",
             status: WorkflowRun::STATUS[:succeeded_with_issue],
             sfn_execution_arn: fake_sfn_execution_arn,
             inputs_json: admin_inputs_json)
    end

    context "fetching phylo_tree_ngs in basic mode" do
      it "returns only basic fields" do
        get :index, format: :json

        expect(response).to have_http_status :ok

        json_response = JSON.parse(response.body, symbolize_names: true)
        phylo_tree_ng = json_response[:phyloTrees].first

        expect(json_response[:project]).to be_nil
        expect(json_response[:taxonName]).to be_nil
        expect(json_response[:phyloTrees].pluck(:id)).to contain_exactly(@phylo_tree_one.id, @phylo_tree_two.id, @phylo_tree_three.id)
        expect(phylo_tree_ng.keys).to contain_exactly(:id, :name, :updated_at, :user)
        expect(phylo_tree_ng).to include_json(
          id: phylo_tree_ng[:id],
          name: phylo_tree_ng[:name],
          updated_at: phylo_tree_ng[:updated_at],
          user: phylo_tree_ng[:user]
        )
      end
    end

    context "filtering" do
      context "no filters applied" do
        it "returns only viewable phylo_tree_ngs" do
          get :index, format: :json

          expect(response).to have_http_status :ok

          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response[:project]).to be_nil
          expect(json_response[:taxonName]).to be_nil
          expect(json_response[:phyloTrees].pluck(:id)).to contain_exactly(@phylo_tree_one.id, @phylo_tree_two.id, @phylo_tree_three.id)
        end
      end

      context "multiple filters applied" do
        it "filters by taxId and projectId" do
          get :index, format: :json, params: { taxId: 2, projectId: @project_one.id }

          expect(response).to have_http_status :ok
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response[:project][:id]).to eq(@project_one.id)
          expect(json_response[:taxonName]).to eq(@taxon_lineage_two.name)
          expect(json_response[:phyloTrees].pluck(:id)).to contain_exactly(@phylo_tree_two.id)
        end
      end

      context "filtering by taxId" do
        it "errors if taxId specified is a human taxId" do
          get :index, format: :json, params: { taxId: 9605 }

          expect(response).to have_http_status :forbidden
          expect(JSON.parse(response.body, symbolize_names: true)[:message]).to eq("Human taxon ids are not allowed")
        end

        it "finds phylo tree ngs that have the correct taxId" do
          get :index, format: :json, params: { taxId: 1 }

          expect(response).to have_http_status :ok
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response.keys).to contain_exactly(:taxonName, :phyloTrees, :project)
          expect(json_response[:project]).to be_nil
          expect(json_response[:taxonName]).to eq(@taxon_lineage_one.name)
          expect(json_response[:phyloTrees].pluck(:id)).to contain_exactly(@phylo_tree_one.id, @phylo_tree_three.id)
        end

        it "includes taxonName in response" do
          get :index, format: :json, params: { taxId: 1 }

          expect(response).to have_http_status :ok
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response.keys).to contain_exactly(:taxonName, :phyloTrees, :project)
          expect(json_response[:project]).to be_nil
          expect(json_response[:phyloTrees]).to_not be_nil
          expect(json_response[:taxonName]).to eq(@taxon_lineage_one.name)
        end
      end

      context "filtering by projectId" do
        it "includes project in response" do
          get :index, format: :json, params: { projectId: @project_one.id }

          expect(response).to have_http_status :ok
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response.keys).to contain_exactly(:taxonName, :phyloTrees, :project)
          expect(json_response[:project][:id]).to eq(@project_one.id)
          expect(json_response[:taxonName]).to be_nil
          expect(json_response[:phyloTrees]).to_not be_nil
        end

        it "finds phylo tree ngs that have the correct projectId" do
          get :index, format: :json, params: { projectId: @project_one.id }

          expect(response).to have_http_status :ok
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response.keys).to contain_exactly(:taxonName, :phyloTrees, :project)
          expect(json_response[:project][:id]).to eq(@project_one.id)
          expect(json_response[:taxonName]).to be_nil
          expect(json_response[:phyloTrees].pluck(:id)).to contain_exactly(@phylo_tree_one.id, @phylo_tree_two.id)
        end
      end
    end
  end

  describe "GET validate_name" do
    before do
      sign_in @joe
      create(:phylo_tree_ng, name: "existing_name")
    end

    context "with unique name" do
      it "is valid" do
        name = "unique_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: name)
      end
    end

    context "with duplicate name" do
      it "is valid" do
        name = "existing_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: name)
      end
    end

    context "with duplicate name after sanitization" do
      it "is valid" do
        unsanitized_name = "sanitize/ name'"
        sanitized_name = "sanitize  name"

        get :validate_name, params: { format: "json", name: unsanitized_name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: sanitized_name)
      end
    end

    context "with empty name" do
      it "is not valid" do
        name = ""

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: false, sanitizedName: name)
      end
    end
  end

  describe "PUT rerun" do
    let(:phylo_tree) { create(:phylo_tree_ng) }

    context "from regular user" do
      before do
        sign_in @joe
      end

      it "redirects the user" do
        put :rerun, params: { id: phylo_tree.id }

        expect(response).to have_http_status(:redirect)
      end
    end

    context "from admin user" do
      before do
        sign_in @admin
      end

      it "calls rerun on the phylo tree" do
        create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: "fake-arn")
        create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: "phylotree-ng"), value: "0.0.1")

        put :rerun, params: { id: phylo_tree.id }

        expect(response).to have_http_status(:success)
      end

      it "returns an error if the phylo tree is not found" do
        put :rerun, params: { id: 0 }

        expect(response).to have_http_status(:internal_server_error)
      end

      it "returns an error if the rerun dispatch fails" do
        put :rerun, params: { id: phylo_tree.id }

        expect(response).to have_http_status(:internal_server_error)
      end
    end
  end
end
