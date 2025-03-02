require "rails_helper"

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
        expect(phylo_tree_ng.keys).to contain_exactly(:id, :name, :updated_at, :user, :nextGeneration)
        expect(phylo_tree_ng).to include_json(
          id: phylo_tree_ng[:id],
          name: phylo_tree_ng[:name],
          updated_at: phylo_tree_ng[:updated_at],
          user: phylo_tree_ng[:user],
          nextGeneration: true
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

  describe "get information for selecting new pipeline runs to create a tree from" do
    before do
      sign_in @joe

      # Create taxon_lineages for a few species/genus.
      @species_a = create(:taxon_lineage, tax_name: "species a", taxid: 1, species_taxid: 1, species_name: "species a", genus_taxid: 10, superkingdom_taxid: 2)
      @species_b = create(:taxon_lineage, tax_name: "species a", taxid: 2, species_taxid: 2, species_name: "species b", genus_taxid: 10, superkingdom_taxid: 2)
      @genus = create(:taxon_lineage, tax_name: "test genus", taxid: 10, genus_taxid: 10, superkingdom_taxid: 2)

      # Create projects and samples belonging to a normal user.
      @project = create(:project, users: [@joe], name: "new tree project")
      @sample_one = create(:sample, project: @project, name: "sample_one", metadata_fields: {
                             collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab",
                           })
      @pr_one = create(:pipeline_run,
                       sample: @sample_one,
                       job_status: "CHECKED",
                       taxon_counts_data: [
                         { taxon_name: @species_a.tax_name, tax_level: 1, nt: 70 },
                         { taxon_name: @species_b.tax_name, tax_level: 1, nr: 100 },
                       ],
                       wdl_version: "6.0.0")
      @sample_two = create(:sample, project: @project, name: "sample_two", metadata_fields: {
                             collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab",
                           })
      @pr_two = create(:pipeline_run,
                       sample: @sample_two,
                       job_status: "CHECKED",
                       taxon_counts_data: [
                         { taxon_name: @species_a.tax_name, tax_level: 1, nt: 70 },
                         { taxon_name: @species_b.tax_name, tax_level: 1, nr: 100 },
                       ],
                       wdl_version: "6.0.0")

      @project_other = create(:project, users: [@joe], name: "other project")
      @sample_three = create(:sample, project: @project_other, name: "sample_three", metadata_fields: {
                               collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab",
                             })
      @pr_three = create(:pipeline_run,
                         sample: @sample_three,
                         job_status: "CHECKED",
                         taxon_counts_data: [
                           { taxon_name: @species_a.tax_name, tax_level: 1, nt: 70 },
                           { taxon_name: @species_b.tax_name, tax_level: 1, nr: 100 },
                         ],
                         wdl_version: "6.0.0")
      @sample_four = create(:sample, project: @project_other, name: "sample_four", metadata_fields: {
                              collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab",
                            })
      @pr_four = create(:pipeline_run,
                        sample: @sample_four,
                        job_status: "CHECKED",
                        taxon_counts_data: [
                          { taxon_name: @species_a.tax_name, tax_level: 1, nt: 70 },
                          { taxon_name: @species_b.tax_name, tax_level: 1, nr: 100 },
                        ],
                        wdl_version: "6.0.0")

      # Create contigs, taxon byteranges, and accession coverage stats for Joe's samples.
      2.times do
        create(:contig, pipeline_run_id: @pr_one.id, species_taxid_nt: @species_a.species_taxid, genus_taxid_nt: @species_a.genus_taxid)
      end
      5.times do
        create(:contig, pipeline_run_id: @pr_one.id, species_taxid_nt: @species_b.species_taxid, genus_taxid_nt: @species_b.genus_taxid)
      end

      create(:contig, pipeline_run_id: @pr_three.id, species_taxid_nt: @species_a.species_taxid, genus_taxid_nt: @species_a.genus_taxid)

      create(:taxon_byterange,
             taxid: 1,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 70,
             pipeline_run_id: @pr_one.id)

      create(:taxon_byterange,
             taxid: 2,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 100,
             pipeline_run_id: @pr_one.id)

      create(:taxon_byterange,
             taxid: 10,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 100,
             pipeline_run_id: @pr_one.id)

      create(:taxon_byterange,
             taxid: 1,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 70,
             pipeline_run_id: @pr_two.id)

      create(:taxon_byterange,
             taxid: 1,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 70,
             pipeline_run_id: @pr_three.id)

      create(:accession_coverage_stat, pipeline_run: @pr_one, coverage_breadth: 0.5, taxid: 1, num_contigs: 2)
      create(:accession_coverage_stat, pipeline_run: @pr_one, coverage_breadth: 0.1, taxid: 2, num_contigs: 5)

      # Create a sample and project belonging to an admin.
      @project_admin = create(:project, users: [@admin], name: "admin-restricted project")
      @sample_admin = create(:sample, project: @project_admin, name: "sample_admin", metadata_fields: {
                               collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab",
                             })
      @pr_admin = create(:pipeline_run,
                         sample: @sample_admin,
                         job_status: "CHECKED",
                         taxon_counts_data: [
                           { taxon_name: @species_a.tax_name, tax_level: 1, nt: 10 },
                           { taxon_name: @species_b.tax_name, tax_level: 1, nr: 10 },
                         ],
                         wdl_version: "6.0.0")
      # Create contigs, taxon byteranges, and accession coverage stats for the admin's sample.
      create(:contig, pipeline_run_id: @pr_admin.id, species_taxid_nt: @species_a.species_taxid, genus_taxid_nt: @species_a.genus_taxid)

      create(:taxon_byterange,
             taxid: 1,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 70,
             pipeline_run_id: @pr_admin.id)

      create(:taxon_byterange,
             taxid: 10,
             hit_type: TaxonCount::COUNT_TYPE_NT,
             first_byte: 0,
             last_byte: 100,
             pipeline_run_id: @pr_admin.id)

      create(:accession_coverage_stat, pipeline_run: @pr_admin, coverage_breadth: 0.25, taxid: 1, num_contigs: 1)
    end

    context "fetching eligible sample ids given new phylo tree parameters" do
      it "errors if taxId specified is a human taxId" do
        get :new_pr_ids, format: :json, params: { taxId: 9605, projectId: @project.id, getAdditionalSamples: false }

        expect(response).to have_http_status :forbidden
        expect(JSON.parse(response.body, symbolize_names: true)[:message]).to eq("Human taxon ids are not allowed")
      end

      it "includes coverage breadths in response" do
        get :new_pr_ids, format: :json, params: { projectId: @project.id, taxId: 1, getAdditionalSamples: false }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)

        expect(json_response.keys).to contain_exactly(:pipelineRunIds, :coverageBreadths, :runsWithContigs)
        expect(json_response[:coverageBreadths]).to eq({ @pr_one.id.to_s => 0.5, @pr_two.id.to_s => 0.0 }.symbolize_keys)
      end

      it "includes all project pipeline run ids if project-specific runs were requested" do
        get :new_pr_ids, format: :json, params: { projectId: @project.id, taxId: 1, getAdditionalSamples: false }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)

        expect(json_response.keys).to contain_exactly(:pipelineRunIds, :coverageBreadths, :runsWithContigs)
        expect(json_response[:pipelineRunIds]).to eq([@pr_one.id, @pr_two.id])
      end

      it "only includes pipeiline run ids with at least one contig if additional samples were requested" do
        get :new_pr_ids, format: :json, params: { projectId: @project.id, taxId: 1, getAdditionalSamples: true }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)

        expect(json_response.keys).to contain_exactly(:pipelineRunIds, :coverageBreadths)
        expect(json_response[:pipelineRunIds]).to eq([@pr_three.id])
      end

      it "includes ids for the subset of runs with contigs if project-specific runs were requested" do
        get :new_pr_ids, format: :json, params: { projectId: @project.id, taxId: 1, getAdditionalSamples: false }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)

        expect(json_response.keys).to contain_exactly(:pipelineRunIds, :coverageBreadths, :runsWithContigs)
        expect(json_response[:runsWithContigs]).to eq([@pr_one.id])
      end

      it "only includes non-soft-deleted pipeline runs if additional samples were requested" do
        @pr_three.update(deleted_at: Time.now.utc)

        get :new_pr_ids, format: :json, params: { projectId: @project.id, taxId: 1, getAdditionalSamples: true }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)

        expect(json_response.keys).to contain_exactly(:pipelineRunIds, :coverageBreadths)
        expect(json_response[:pipelineRunIds]).to be_empty
      end

      it "only includes non-soft-deleted pipeline runs if project-specific runs were requested" do
        @pr_one.update(deleted_at: Time.now.utc)

        get :new_pr_ids, format: :json, params: { projectId: @project.id, taxId: 1, getAdditionalSamples: false }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)

        expect(json_response.keys).to contain_exactly(:pipelineRunIds, :coverageBreadths, :runsWithContigs)
        expect(json_response[:pipelineRunIds]).to eq([@pr_two.id])
      end
    end

    context "fetching pipeline run information" do
      it "includes correct sample info in response to a species taxId" do
        expected_samples_info = {
          name: "sample_one",
          project_id: @project.id,
          host: @sample_one.host_genome_name,
          project_name: "new tree project",
          pipeline_run_id: @pr_one.id,
          pipeline_version: @pr_one.wdl_version,
          sample_id: @sample_one.id,
          tissue: "Nasopharyngeal Swab",
          location: "New York, USA",
          num_contigs: 2,
          coverage_breadth: 0.5,
        }

        get :new_pr_info, format: :json, params: { getAdditionalSamples: false, pipelineRunIds: [@pr_one.id], taxId: 1 }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)
        sample_info = json_response[:samples][0]

        expect(json_response.keys).to contain_exactly(:samples)
        expect(sample_info.except(:created_at)).to eq(expected_samples_info)
        # Workaround to compare two timestamps
        expect(Time.parse(sample_info[:created_at]).to_i).to eq(Time.parse(@sample_one.created_at.to_s).to_i)
      end

      it "includes correct sample info in response to a genus taxId" do
        expected_samples_info = {
          name: "sample_one",
          project_id: @project.id,
          host: @sample_one.host_genome_name,
          project_name: "new tree project",
          pipeline_run_id: @pr_one.id,
          pipeline_version: @pr_one.wdl_version,
          sample_id: @sample_one.id,
          tissue: "Nasopharyngeal Swab",
          location: "New York, USA",
          num_contigs: 7,
        }

        get :new_pr_info, format: :json, params: { getAdditionalSamples: false, pipelineRunIds: [@pr_one.id], taxId: 10 }

        expect(response).to have_http_status :ok
        json_response = JSON.parse(response.body, symbolize_names: true)
        sample_info = json_response[:samples][0]

        expect(json_response.keys).to contain_exactly(:samples)
        expect(sample_info.except(:created_at, :coverage_breadth)).to eq(expected_samples_info)
        # Float precision testing quirk; we round to the nearest tenth of a percent for display.
        expect(sample_info[:coverage_breadth]).to be_within(0.0001).of(0.1)
        # Workaround to compare two timestamps
        expect(Time.parse(sample_info[:created_at]).to_i).to eq(Time.parse(@sample_one.created_at.to_s).to_i)
      end
    end
  end

  describe "POST create" do
    before do
      sign_in @joe

      @project = create(:project, users: [@joe])
      sample_one = create(:sample, project: @project)
      @pr_one = create(:pipeline_run, sample: sample_one)

      sample_two = create(:sample, project: @project)
      @pr_two = create(:pipeline_run, sample: sample_two)

      create(:taxon_lineage, taxid: 1, tax_name: "some species", superkingdom_name: "Viruses")
      create(:taxon_lineage, taxid: 20, genus_taxid: 20, species_taxid: 2, tax_name: "some genus", superkingdom_name: "Viruses")

      admin_project = create(:project, users: [@admin])
      admin_sample_one = create(:sample, project: admin_project)
      @admin_pr_one = create(:pipeline_run, sample: admin_sample_one)

      create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: "fake:sfn:arn")
      create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: "phylotree-ng"), value: "1.0.0")

      allow(S3Util).to receive(:get_s3_file)
        .and_return(
          { "1" =>
            { "best_accessions" =>
              [{ "id" => "A1.1",
                 "name" => "Taxon 1 top accession, complete genome\n",
                 "num_contigs" => 30,
                 "num_reads" => 100,
                 "score" => 28_000,
                 "coverage_depth" => 15.5, },
               { "id" => "A2.2",
                 "name" => "Taxon 1 accession, complete genome",
                 "num_contigs" => 2,
                 "num_reads" => 0,
                 "score" => 4500,
                 "coverage_depth" => 1.7, },],
              "num_accessions" => 2, },
            "2" =>
            { "best_accessions" =>
              [{ "id" => "B1.1",
                 "name" => "Taxon 2 top accession, complete genome\n",
                 "num_contigs" => 30,
                 "num_reads" => 100,
                 "score" => 28_000,
                 "coverage_depth" => 15.5, }],
              "num_accessions" => 1, }, }.to_json
        )
    end

    context "user creates a phylo tree using their samples" do
      it "should create and dispatch a new phylo tree ng" do
        phylo_tree_ng_params = {
          pipelineRunIds: [@pr_one.id, @pr_two.id],
          taxId: 1,
          name: "new_tree",
          projectId: @project.id,
          userId: @joe.id,
        }

        post :create, params: phylo_tree_ng_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        phylo_tree_ng = PhyloTreeNg.find(json_response["phylo_tree_id"])

        # Verify that the phylo tree was created correctly.
        expect(phylo_tree_ng).not_to eq(nil)
        expect(phylo_tree_ng.name).to eq("new_tree")
        expect(phylo_tree_ng.project_id).to eq(@project.id)
        expect(phylo_tree_ng.user_id).to eq(@joe.id)
        expect(phylo_tree_ng.status).to eq(WorkflowRun::STATUS[:running])
        expect(phylo_tree_ng.tax_id).to eq(1)
        expect(phylo_tree_ng.inputs_json["pipeline_run_ids"]).to eq([@pr_one.id, @pr_two.id])
        expect(phylo_tree_ng.inputs_json["superkingdom_name"]).to eq("viruses")
        expect(phylo_tree_ng.inputs_json["additional_reference_accession_ids"]).to eq(["A1.1"])
      end

      it "should create and dispatch a new phylo tree ng with a genus reference taxon" do
        phylo_tree_ng_params = {
          pipelineRunIds: [@pr_one.id, @pr_two.id],
          taxId: 20,
          name: "new_tree",
          projectId: @project.id,
          userId: @joe.id,
        }

        post :create, params: phylo_tree_ng_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        phylo_tree_ng = PhyloTreeNg.find(json_response["phylo_tree_id"])

        # Verify that the phylo tree was created correctly.
        expect(phylo_tree_ng).not_to eq(nil)
        expect(phylo_tree_ng.name).to eq("new_tree")
        expect(phylo_tree_ng.project_id).to eq(@project.id)
        expect(phylo_tree_ng.user_id).to eq(@joe.id)
        expect(phylo_tree_ng.status).to eq(WorkflowRun::STATUS[:running])
        expect(phylo_tree_ng.tax_id).to eq(20)
        expect(phylo_tree_ng.inputs_json["pipeline_run_ids"]).to eq([@pr_one.id, @pr_two.id])
        expect(phylo_tree_ng.inputs_json["superkingdom_name"]).to eq("viruses")
        expect(phylo_tree_ng.inputs_json["additional_reference_accession_ids"]).to eq(["B1.1"])
      end
    end

    context "user tries creating a phylo tree using an admin's sample" do
      it "should return an unauthorized error" do
        phylo_tree_ng_params = {
          pipelineRunIds: [@pr_one.id, @admin_pr_one.id],
          taxId: 1,
          name: "new_tree",
          projectId: @project.id,
          userId: @joe.id,
        }

        post :create, params: phylo_tree_ng_params

        expect(response).to have_http_status :unauthorized
      end
    end
  end

  describe "GET validate_name" do
    before do
      sign_in @joe
      create(:phylo_tree_ng, name: "existing_name")
      create(:phylo_tree_ng, name: "Phylo tree ng 1")
    end

    context "with unique name" do
      it "is valid" do
        name = "unique_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: name)
      end

      it "is case sensitive" do
        name = "Unique_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: name)
      end
    end

    context "with same name as an existing phylo tree NG" do
      it "is invalid" do
        name = "existing_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: false, sanitizedName: name)
      end
    end

    context "with same name as an existing old phylo tree" do
      before do
        create(:phylo_tree, name: "existing_old_tree")
      end

      it "is invalid" do
        name = "existing_old_tree"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: false, sanitizedName: name)
      end
    end

    context "with duplicate name after sanitization" do
      it "is invalid" do
        unsanitized_name = "Phylo/tree'ng 1"
        sanitized_name = "Phylo tree ng 1"

        get :validate_name, params: { format: "json", name: unsanitized_name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: false, sanitizedName: sanitized_name)
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

  describe "GET show" do
    let(:fake_sfn_name) { "fake_sfn_name" }
    let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
    let(:fake_s3_path) { "s3://fake_bucket/fake/path".freeze }
    let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
    let(:fake_sfn_execution_description) do
      {
        execution_arn: fake_sfn_execution_arn,
        input: "{}",
        # AWS SDK rounds to second
        start_date: Time.zone.now.round,
        state_machine_arn: fake_sfn_arn,
        status: "SUCCEEDED",
        output: JSON.dump({ "Result": { "phylotree.clustermap_svg": fake_s3_path } }),
      }
    end
    let(:fake_species) { "some species" }
    let(:fake_genus) { "some genus" }

    before do
      sign_in @joe

      create(:taxon_lineage, taxid: 1, tax_name: fake_species, species_taxid: 1, genus_taxid: 2)
      create(:taxon_lineage, taxid: 2, tax_name: fake_genus, genus_taxid: 2)

      project_one = create(:project, users: [@joe])
      sample_one = create(:sample, project: project_one)
      pr_one = create(:pipeline_run, sample: sample_one)
      create(:taxon_count, tax_id: 1, pipeline_run_id: pr_one.id, tax_level: 1)

      sample_two = create(:sample, project: project_one)
      pr_two = create(:pipeline_run, sample: sample_two)
      create(:taxon_count, tax_id: 2, pipeline_run_id: pr_two.id, tax_level: 2)

      @phylo_tree_one = create(:phylo_tree_ng,
                               user: @joe,
                               project: project_one,
                               pipeline_runs: [pr_one],
                               name: "Phylo tree ng 1",
                               s3_output_prefix: fake_s3_path,
                               sfn_execution_arn: fake_sfn_execution_arn,
                               status: WorkflowRun::STATUS[:succeeded],
                               inputs_json: { pipeline_run_ids: [pr_one.id], tax_id: 1 })

      @pt_mock_results = {
        newick: "(26813:358.92523,(26603:0.0,26663:0.0,26715:0.0,26745:0.0,26809:0.0):358.92523,NCBI_NT_accession_LM9974131:358.93127);",
        ncbi_metadata: "{\"NCBI_NT_accession_LM9974131\": {\"name\": \"Pseudomonas sp. 12M76_air genome assembly PRJEB5504_assembly_1, scaffold CONTIG000001\", \"accession\": \"LM997413.1\"}}",
      }

      create(:accession_coverage_stat, pipeline_run: pr_one, coverage_breadth: 0.5, taxid: 1)

      @phylo_tree_two = create(:phylo_tree_ng,
                               user: @joe,
                               project: project_one,
                               pipeline_runs: [pr_two],
                               name: "Phylo tree ng 2",
                               sfn_execution_arn: fake_sfn_execution_arn,
                               status: WorkflowRun::STATUS[:succeeded],
                               inputs_json: { pipeline_run_ids: [pr_two.id], tax_id: 2 })

      create(:accession_coverage_stat, pipeline_run: pr_two, coverage_breadth: 0.0, taxid: 1)

      @created_tree = create(:phylo_tree_ng,
                             user: @joe,
                             project: project_one,
                             pipeline_runs: [pr_one],
                             name: "Phylo tree ng 1",
                             sfn_execution_arn: fake_sfn_execution_arn,
                             status: WorkflowRun::STATUS[:created],
                             inputs_json: { pipeline_run_ids: [pr_one.id], tax_id: 1 })

      @running_tree = create(:phylo_tree_ng,
                             user: @joe,
                             project: project_one,
                             pipeline_runs: [pr_one],
                             name: "Phylo tree ng 1",
                             sfn_execution_arn: fake_sfn_execution_arn,
                             status: WorkflowRun::STATUS[:running],
                             inputs_json: { pipeline_run_ids: [pr_one.id], tax_id: 1 })

      @failed_tree = create(:phylo_tree_ng,
                            user: @joe,
                            project: project_one,
                            pipeline_runs: [pr_one],
                            name: "Phylo tree ng 1",
                            sfn_execution_arn: fake_sfn_execution_arn,
                            status: WorkflowRun::STATUS[:failed],
                            inputs_json: { pipeline_run_ids: [pr_one.id], tax_id: 1 })
    end

    context "successful phylo_tree_ng has a species level taxon of interest" do
      it "can see phylo_tree_ng and includes parent_taxid" do
        expect_any_instance_of(PhyloTreeNg).to receive(:results).and_return(@pt_mock_results)
        get :show, params: { id: @phylo_tree_one.id, format: "json" }

        expect(response).to have_http_status :ok
        pt = JSON.parse(response.body)

        expect(pt.keys).to contain_exactly("id", "name", "tax_id", "tax_level", "tax_name", "newick", "status", "user", "parent_taxid", "sampleDetailsByNodeName", "nextGeneration")
        expect(pt.keys).not_to include("log_url", "sfn_execution_arn", "s3_output_prefix")
        expect(pt["tax_level"]).to eq(1)
      end
    end

    context "successful phylo_tree_ng has a genus level taxon of interest" do
      it "can see phylo_tree_ng" do
        expect_any_instance_of(PhyloTreeNg).to receive(:results).and_return(@pt_mock_results)
        get :show, params: { id: @phylo_tree_two.id, format: "json" }

        expect(response).to have_http_status :ok
        pt = JSON.parse(response.body)

        expect(pt.keys).to contain_exactly("id", "name", "tax_id", "tax_level", "tax_name", "newick", "status", "user", "sampleDetailsByNodeName", "nextGeneration")
        expect(pt["tax_level"]).to eq(2)
      end
    end

    context "samples too divergent to produce phylo_tree_ng" do
      it "returns link to clustermap svg" do
        @mock_aws_clients = {
          s3: Aws::S3::Client.new(stub_responses: true),
          states: Aws::States::Client.new(stub_responses: true),
          sts: Aws::STS::Client.new(stub_responses: true),
        }
        allow(AwsClient).to receive(:[]) { |client|
          @mock_aws_clients[client]
        }

        expect_any_instance_of(PhyloTreeNg).to receive(:results).and_raise(SfnExecution::OutputNotFoundError.new(PhyloTreeNg::OUTPUT_NEWICK, PhyloTreeNg::DOWNLOADABLE_OUTPUTS))
        expect_any_instance_of(SfnExecution).to receive(:sfn_archive_from_s3).and_return(fake_sfn_execution_description)

        get :show, params: { id: @phylo_tree_one.id, format: "json" }

        expect(response).to have_http_status :ok
        pt = JSON.parse(response.body)

        expect(pt.keys).to contain_exactly("id", "name", "tax_id", "status", "tax_name", "clustermap_svg_url", "nextGeneration", "has_low_coverage")
        expect(pt["has_low_coverage"]).to eq(false)
      end

      it "returns if the samples had low coverage breadth" do
        @mock_aws_clients = {
          s3: Aws::S3::Client.new(stub_responses: true),
          states: Aws::States::Client.new(stub_responses: true),
          sts: Aws::STS::Client.new(stub_responses: true),
        }
        allow(AwsClient).to receive(:[]) { |client|
          @mock_aws_clients[client]
        }

        expect_any_instance_of(PhyloTreeNg).to receive(:results).and_raise(SfnExecution::OutputNotFoundError.new(PhyloTreeNg::OUTPUT_NEWICK, PhyloTreeNg::DOWNLOADABLE_OUTPUTS))
        expect_any_instance_of(SfnExecution).to receive(:sfn_archive_from_s3).and_return(fake_sfn_execution_description)

        get :show, params: { id: @phylo_tree_two.id, format: "json" }

        expect(response).to have_http_status :ok
        pt = JSON.parse(response.body)

        expect(pt.keys).to contain_exactly("id", "name", "tax_id", "status", "tax_name", "clustermap_svg_url", "nextGeneration", "has_low_coverage")
        expect(pt["has_low_coverage"]).to eq(true)
      end
    end

    ["CREATED", "RUNNING", "FAILED"].each do |state_name, tree|
      it "serves a tree in #{state_name} state" do
        states = { "CREATED" => @created_tree, "RUNNING" => @running_tree, "FAILED" => @failed_tree }
        tree = states[state_name]

        get :show, params: { id: tree.id, format: "json" }

        expect(response).to have_http_status :ok
        pt = JSON.parse(response.body)

        expect(pt).to include(
          "name" => tree.name,
          "status" => tree.status,
          "tax_name" => fake_species
        )
      end
    end

    context "with admin user" do
      before do
        sign_in @admin
      end

      it "shows admin-only fields" do
        expect_any_instance_of(PhyloTreeNg).to receive(:results).and_return(@pt_mock_results)
        get :show, params: { id: @phylo_tree_one.id, format: "json" }

        expect(response).to have_http_status :ok
        pt = JSON.parse(response.body)

        expect(pt.keys).to include("log_url", "sfn_execution_arn", "s3_output_prefix")
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
        json_response = JSON.parse(response.body)
        expect(json_response).to include("id", "status" => "success")
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

  describe "GET choose_taxon" do
    let(:query) { "E coli" }
    let(:args) { "species,genus" }
    let(:tax_levels) { ["species", "genus"] }
    let(:fake_results) do
      [
        {
          "title" => "Escherichia coli",
          "description" => "Taxonomy ID: 562",
          "taxid" => 562,
          "level" => "species",
        },
        {
          "title" => "Mycolicibacterium",
          "description" => "Taxonomy ID: 1866885",
          "taxid" => 1_866_885,
          "level" => "genus",
        },
      ]
    end

    let(:forbidden_project) { create(:project) }
    let(:forbidden_sample) { create(:sample, project: forbidden_project) }

    let(:allowed_project) { create(:project, users: [@joe]) }
    let(:allowed_sample) { create(:sample, project: allowed_project) }

    context "from regular user" do
      before do
        sign_in @joe
      end

      it "returns no results for an empty request" do
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(nil, nil, {}).and_call_original

        get :choose_taxon

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq({})
      end

      it "serves results for a simple query" do
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(query, nil, {}).and_return(fake_results)

        get :choose_taxon, params: { query: query }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq(fake_results)
      end

      it "raises an error for invalid project id" do
        expect do
          get :choose_taxon, params: { query: query, projectId: forbidden_project.id }
        end.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "limits results by project id" do
        project_id = allowed_project.id
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(query, nil, { project_id: project_id }).and_return(fake_results)

        get :choose_taxon, params: { query: query, projectId: project_id }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq(fake_results)
      end

      it "limits results by sample id" do
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(query, nil, hash_including(:samples)).and_return(fake_results)

        get :choose_taxon, params: { query: query, sampleId: allowed_sample.id }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq(fake_results)
      end

      it "filters out invalid sample ids" do
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(query, nil, { samples: match_array([]) }).and_return(fake_results)

        get :choose_taxon, params: { query: query, sampleId: forbidden_sample.id }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq(fake_results)
      end

      it "allows valid taxonomy levels in args" do
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(query, tax_levels, hash_including(:samples)).and_return(fake_results)

        get :choose_taxon, params: { query: query, args: "species,genus", sampleId: allowed_sample.id }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq(fake_results)
      end

      it "ignores invalid taxonomy levels" do
        expect_any_instance_of(ElasticsearchHelper).to receive(:taxon_search).with(query, [], hash_including(:samples)).and_return(fake_results)

        get :choose_taxon, params: { query: query, args: "ordo", sampleId: allowed_sample.id }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq(fake_results)
      end
    end
  end

  describe "GET download" do
    let(:project) { create(:project, users: [@joe]) }
    let(:sample) { create(:sample, project: project) }
    let(:pipeline_run) { create(:pipeline_run, sample: sample) }

    let(:allowed_tree) { create(:phylo_tree_ng, user: @joe, project: project, pipeline_runs: [pipeline_run], name: "Test Tree") }
    let(:forbidden_tree) { create(:phylo_tree_ng) }
    let(:s3_path) { "s3://fake/path/phylotree.nwk" }

    context "from regular user" do
      before do
        sign_in @joe
      end

      it "gets a requested download link" do
        expect_any_instance_of(PhyloTreeNg).to receive(:output_path).with(PhyloTreeNg::OUTPUT_NEWICK).and_return(s3_path)
        expect_any_instance_of(PipelineOutputsHelper).to receive(:get_presigned_s3_url).with(s3_path: s3_path, filename: "Test Tree_phylotree.nwk").and_call_original

        get :download, params: { id: allowed_tree.id, output: PhyloTreeNg::OUTPUT_NEWICK }

        expect(response).to have_http_status(:redirect)
      end

      it "errors on a disallowed tree" do
        expect do
          get :download, params: { id: forbidden_tree.id }
        end.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "errors on a non-existent tree" do
        expect do
          get :download, params: { id: 0 }
        end.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "errors on empty output name" do
        get :download, params: { id: allowed_tree.id }

        expect(response).to have_http_status(:internal_server_error)
      end

      it "errors on an invalid output name" do
        get :download, params: { id: allowed_tree.id, output: "fake-output" }

        expect(response).to have_http_status(:internal_server_error)
      end

      it "errors if the data is not available" do
        expect_any_instance_of(PhyloTreeNg).to receive(:output_path).with(PhyloTreeNg::OUTPUT_NEWICK).and_return(s3_path)
        expect_any_instance_of(PipelineOutputsHelper).to receive(:get_presigned_s3_url).with(s3_path: s3_path, filename: "Test Tree_phylotree.nwk")

        get :download, params: { id: allowed_tree.id, output: PhyloTreeNg::OUTPUT_NEWICK }

        expect(response).to have_http_status(:internal_server_error)
      end
    end
  end
end
