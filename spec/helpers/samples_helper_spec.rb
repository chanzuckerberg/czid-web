require "rails_helper"
require "webmock/rspec"

RSpec.describe SamplesHelper, type: :helper do
  describe "#upload_samples_with_metadata" do
    context "with basespace samples" do
      let(:fake_access_token) { "fake_access_token" }
      let(:fake_dataset_id) { "fake_dataset_id" }
      let(:fake_sample_name) { "fake_sample_name" }

      before do
        @project = create(:public_project)
        @joe = create(:joe)
        @host_genome = create(:host_genome, user: @joe)
      end

      let(:basespace_sample_attributes) do
        [
          {
            basespace_access_token: fake_access_token,
            basespace_dataset_id: fake_dataset_id,
            host_genome_id: @host_genome.id,
            name: fake_sample_name,
            project_id: @project.id,
          },
        ]
      end

      let(:metadata_attributes) do
        {
          fake_sample_name.to_s => {
            "Fake Metadata Field One" => "CSF",
            "Fake Metadata Field Two" => "DNA",
          },
        }
      end

      it "saved successfully" do
        # Set up mocks
        expect(Resque).to receive(:enqueue).with(
          TransferBasespaceFiles, anything, fake_dataset_id, fake_access_token
        ).exactly(1).times

        response = helper.upload_samples_with_metadata(
          basespace_sample_attributes,
          metadata_attributes,
          @joe
        )

        expect(response["samples"].length).to be 1
        expect(response["errors"].length).to be 0

        created_sample = response["samples"][0]

        expect(created_sample.name).to eq(fake_sample_name)
        expect(created_sample.host_genome.id).to be @host_genome.id
        expect(created_sample.host_genome.user).to eq(@joe)
        expect(created_sample.project.id).to be @project.id
        expect(created_sample.bulk_mode).to be nil
        expect(created_sample.uploaded_from_basespace).to be 1
        expect(created_sample.user).to eq(@joe)

        expect(Metadatum.where(sample_id: created_sample.id).length).to be 2
        expect(Metadatum.where(sample_id: created_sample.id, key: "Fake Metadata Field One").length).to be 1
        expect(Metadatum.where(sample_id: created_sample.id, key: "Fake Metadata Field One")[0].raw_value).to eq("CSF")
        expect(Metadatum.where(sample_id: created_sample.id, key: "Fake Metadata Field Two").length).to be 1
        expect(Metadatum.where(sample_id: created_sample.id, key: "Fake Metadata Field Two")[0].raw_value).to eq("DNA")
      end

      it "fails if basespace_access_token is not provided" do
        response = helper.upload_samples_with_metadata(
          basespace_sample_attributes.map { |sample| sample.reject { |key, _| key == :basespace_access_token } },
          metadata_attributes,
          @joe
        )

        expect(response["samples"].length).to be 0
        expect(response["errors"]).to eq([
                                           ErrorHelper::SampleUploadErrors.missing_input_files_or_basespace_params(fake_sample_name),
                                         ])
      end

      it "fails if basespace_dataset_id is not provided" do
        response = helper.upload_samples_with_metadata(
          basespace_sample_attributes.map { |sample| sample.reject { |key, _| key == :basespace_dataset_id } },
          metadata_attributes,
          @joe
        )

        expect(response["samples"].length).to be 0
        expect(response["errors"]).to eq([
                                           ErrorHelper::SampleUploadErrors.missing_input_files_or_basespace_params(fake_sample_name),
                                         ])
      end
    end

    context "adding new host genomes" do
      let(:fake_sample_name) { "fake_sample_name" }

      before do
        @project = create(:public_project)
        @admin = create(:admin)
      end

      def sample_attributes(host_genome_name)
        [
          {
            basespace_access_token: "fake_access_token",
            basespace_dataset_id: "fake_dataset_id",
            # No host_genome_id to force creating a new one
            host_genome_name: host_genome_name,
            name: fake_sample_name,
            project_id: @project.id,
          },
        ]
      end

      let(:metadata_attributes) do
        {
          # No metadata because we only care about host_genome_name
          fake_sample_name.to_s => {},
        }
      end

      it "creates a new host genome if none exists" do
        host_genome_name = "Test Host"
        expect(HostGenome.find_by(name: host_genome_name)).to be nil

        response = helper.upload_samples_with_metadata(
          sample_attributes(host_genome_name),
          metadata_attributes,
          @admin
        )

        expect(response["samples"].length).to be 1
        expect(response["errors"].length).to be 0

        created_sample = response["samples"][0]

        expect(created_sample.host_genome.name).to eq(host_genome_name)

        host_genome = HostGenome.find_by(name: host_genome_name)
        expect(host_genome).to be_truthy
        expect(host_genome.ercc_only?).to be true
        expect(host_genome.user).to eq(@admin)
      end

      it "raises an error if the host genome name is bad" do
        message = "Validation failed: Name of host organism allows only word, period, dash or space chars, and must start with a word char."
        host_genome_name = "~~~bad name~~~"
        expect(HostGenome.find_by(name: host_genome_name)).to be nil

        response = helper.upload_samples_with_metadata(
          sample_attributes(host_genome_name),
          metadata_attributes,
          @admin
        )

        expect(response["samples"].length).to be 0
        expect(response["errors"].length).to be 1
        expect(response["errors"]).to eq([message])

        expect(HostGenome.find_by(name: host_genome_name)).to be nil
      end
    end
  end

  describe "#add_sample_count_to_taxa_with_contigs" do
    let(:taxon_list) do
      [
        {
          "title" => "Taxon 1",
          "description" => "Description for Taxon 1",
          "taxid" => 1,
          "level" => "species",
        },
        {
          "title" => "Taxon 2",
          "description" => "Description for Taxon 2",
          "taxid" => 2,
          "level" => "species",
        },
        {
          "title" => "Taxon 3",
          "description" => "Description for Taxon 3",
          "taxid" => 101,
          "level" => "genus",
        },
        {
          "title" => "Taxon 4",
          "description" => "Description for Taxon 4",
          "taxid" => 102,
          "level" => "genus",
        },
      ]
    end

    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
      @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
      @sample_three = create(:sample, project: @project, name: "Test Sample Three",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])

      # A taxid can either by genus or species level, but not both.
      create(:contig, pipeline_run_id: @sample_one.first_pipeline_run.id, species_taxid_nt: 1, species_taxid_nr: 2, genus_taxid_nt: 101, genus_taxid_nr: 101)
      create(:contig, pipeline_run_id: @sample_two.first_pipeline_run.id, species_taxid_nt: 1, species_taxid_nr: 1, genus_taxid_nt: 102, genus_taxid_nr: 103)
      create(:contig, pipeline_run_id: @sample_three.first_pipeline_run.id, species_taxid_nt: 2, species_taxid_nr: 1, genus_taxid_nt: 101, genus_taxid_nr: 101)
      create(:contig, pipeline_run_id: @sample_three.first_pipeline_run.id, species_taxid_nt: 2, species_taxid_nr: 3, genus_taxid_nt: 102, genus_taxid_nr: 104)
    end

    it "returns correct counts in the basic case" do
      response = helper.add_sample_count_to_taxa_with_contigs(taxon_list, Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id]))

      expect(response[0]["taxid"]).to be 1
      expect(response[0]["sample_count"]).to be 3
      expect(response[1]["taxid"]).to be 2
      expect(response[1]["sample_count"]).to be 2
      expect(response[2]["taxid"]).to be 101
      expect(response[2]["sample_count"]).to be 2
      expect(response[3]["taxid"]).to be 102
      expect(response[3]["sample_count"]).to be 2
    end

    it "doesn't count samples that weren't passed in" do
      response = helper.add_sample_count_to_taxa_with_contigs(taxon_list, Sample.where(id: [@sample_one.id, @sample_two.id]))

      expect(response[0]["taxid"]).to be 1
      expect(response[0]["sample_count"]).to be 2
      expect(response[1]["taxid"]).to be 2
      expect(response[1]["sample_count"]).to be 1
      expect(response[2]["taxid"]).to be 101
      expect(response[2]["sample_count"]).to be 1
      expect(response[3]["taxid"]).to be 102
      expect(response[3]["sample_count"]).to be 1
    end
  end

  describe "#generate_sample_list_csv" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])
      create(:metadata_field, name: "sample_type", is_required: 1, is_default: 1, is_core: 1, default_for_new_host_genome: 1)
      # while normally required, this field is expected to be not required here
      MetadataField.where(name: "collection_location_v2").update(is_required: 0)
      @sample_one = create(:sample, project: @project, name: "Test Sample 1",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                    metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", custom_field_one: "Value One" })
      @sample_two = create(:sample, project: @project, name: "Test Sample 2",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                    metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", custom_field_two: "Value Two" })
    end

    it "includes specific metadata fields in basic case" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])
      csv_string = helper.generate_sample_list_csv(samples)
      headers = csv_string.split("\n")[0]
      expect(headers.include?("sample_type")).to be true
      expect(headers.include?("nucleotide_type")).to be true
      expect(headers.include?("collection_location")).to be true
      # Does not include custom metadata
      expect(headers.include?("custom_field_one")).to be false
      expect(headers.include?("custom_field_two")).to be false
    end

    it "includes specific metadata fields in basic case" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])
      csv_string = helper.generate_sample_list_csv(samples, include_all_metadata: true)
      headers = csv_string.split("\n")[0]
      expect(headers.include?("sample_type")).to be true
      expect(headers.include?("collection_location")).to be true
      # Doesn't include nucleotide_type because none of the samples have it
      expect(headers.include?("nucleotide_type")).to be false
      # Includes custom metadata
      expect(headers.include?("custom_field_one")).to be true
      expect(headers.include?("custom_field_two")).to be true
    end
  end

  describe "#filter_by_workflow" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])

      @sample_one = create(:sample, project: @project, name: "Test Sample One", initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs])
      @sample_two = create(:sample, project: @project, name: "Test Sample Two", initial_workflow: WorkflowRun::WORKFLOW[:consensus_genome])
      @sample_three = create(:sample, project: @project, name: "Test Sample Three", initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs])

      # mngs sample with cg workflow_run
      @sample_four = create(:sample, project: @project, name: "Test Sample Four", initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs])
      create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], sample: @sample_four)

      @samples_input = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id, @sample_four])
    end

    it "properly returns only samples with a short-read-mngs workflow" do
      query = [WorkflowRun::WORKFLOW[:short_read_mngs]]
      results = helper.send(:filter_by_workflow, @samples_input, query)
      expect(results.pluck(:id)).to eq([@sample_one.id, @sample_three.id, @sample_four.id])
    end

    it "properly returns only samples with a consensus-genome workflow" do
      query = [WorkflowRun::WORKFLOW[:consensus_genome]]
      results = helper.send(:filter_by_workflow, @samples_input, query)
      expect(results.pluck(:id)).to eq([@sample_two.id, @sample_four.id])
    end

    it "properly returns samples with the short-read-mngs and consensus-genome workflows" do
      query = [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:consensus_genome]]
      results = helper.send(:filter_by_workflow, @samples_input, query)
      expect(results.pluck(:id)).to include(@sample_one.id, @sample_two.id, @sample_three.id, @sample_four.id)
    end

    it "returns an empty response if no sample workflows match the query" do
      query = ["fake_workflow"]
      results = helper.send(:filter_by_workflow, @samples_input, query)
      expect(results).to eq([])
    end
  end

  describe "#top_workflow_runs_multiget" do
    before do
      @project = create(:project)
      @sample = create(:sample, project: @project)
      @workflow_run1 = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], executed_at: Time.now.utc, deprecated: true)
      @workflow_run2 = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:short_read_mngs], executed_at: 1.day.ago)
      @workflow_run3 = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], executed_at: 2.days.ago)
      @workflow_run4 = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], executed_at: 3.days.ago)
    end

    it "returns the latest non-deprecated workflow run per workflow" do
      results = helper.send(:top_workflow_runs_multiget, [@sample.id], WorkflowRun::WORKFLOW[:consensus_genome])
      expect(results[@sample.id]).to eq(@workflow_run3)
    end
  end

  describe "#format_samples" do
    # TODO: Backfill more tests.

    before do
      @project = create(:project)
      @sample1 = create(:sample, project: @project)
      @sample_without_runs = create(:sample, project: @project)
      @sample2 = create(:sample, project: @project)

      create(:pipeline_run, sample_id: @sample2.id, finalized: 1, job_status: PipelineRun::STATUS_CHECKED)
      @mock_cached_results = { "mock_metric" => 10 }
      @mock_inputs_json = { "wetlab_protocol" => ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic], "technology" => ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore] }
      @workflow_run1 = create(:workflow_run, sample: @sample1, workflow: WorkflowRun::WORKFLOW[:consensus_genome], executed_at: Time.now.utc, cached_results: @mock_cached_results.to_json, inputs_json: @mock_inputs_json.to_json)
    end

    it "includes information for consensus genome cached_results" do
      samples = Sample.where(id: @sample1.id)
      results = helper.send(:format_samples, samples)
      expect(results[0]).to include({ WorkflowRun::WORKFLOW[:consensus_genome].to_sym => hash_including({ cached_results: @mock_cached_results, wetlab_protocol: ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic] }) })
    end

    it "returns nil if no cached_results" do
      samples = Sample.where(id: @sample_without_runs.id)
      results = helper.send(:format_samples, samples)
      expect(results[0]).to include({ WorkflowRun::WORKFLOW[:consensus_genome].to_sym => hash_including({ cached_results: nil, wetlab_protocol: nil }) })
    end

    it "returns results for when mNGS workflow specified" do
      samples = Sample.where(id: @sample_without_runs.id)
      results = helper.send(:format_samples, samples)
      expect(results[0].keys).to eq([:db_sample, :metadata, :derived_sample_output, :uploader, :run_info_by_workflow, :"consensus-genome"])
    end

    context "when sequencing technology is present" do
      it "correctly returns the sequencing technology" do
        samples = Sample.where(id: @sample1.id)
        results = helper.send(:format_samples, samples)

        expect(results[0]).to include({ WorkflowRun::WORKFLOW[:consensus_genome].to_sym => hash_including({ technology: :Nanopore }) })
      end
    end

    context "when sequencing technology is not present" do
      it "returns an Illumina default" do
        samples = Sample.where(id: @sample_without_runs.id)
        results = helper.send(:format_samples, samples)

        expect(results[0]).to include({ WorkflowRun::WORKFLOW[:consensus_genome].to_sym => hash_including({ technology: ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:illumina] }) })
      end
    end
  end

  describe "#get_sample_run_info_by_workflow" do
    before do
      @project = create(:project)

      @sample1 = create(:sample, project: @project)
      @pipeline_run1 = create(:pipeline_run, sample_id: @sample1.id, finalized: 1, job_status: PipelineRun::STATUS_CHECKED)

      @sample2 = create(:sample, project: @project)
      create(:workflow_run, sample: @sample2, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:succeeded])

      @sample3 = create(:sample, project: @project)
      create(:pipeline_run, sample_id: @sample3.id, finalized: 1, job_status: PipelineRun::STATUS_CHECKED)
      create(:workflow_run, sample: @sample3, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:succeeded])
    end

    it "returns the correct status for a sample that only has a consensus-genome workflow run" do
      results = helper.send(:get_sample_run_info_by_workflow,
                            sample: @sample2,
                            is_snapshot: false,
                            top_pipeline_run: nil,
                            output_states_by_pipeline_run_id: nil,
                            pipeline_run_stages_by_pipeline_run_id: nil,
                            report_ready_pipeline_run_ids: nil)

      expect(results[WorkflowRun::WORKFLOW[:consensus_genome]].keys).to contain_exactly(:result_status_description)
      expect(results[WorkflowRun::WORKFLOW[:consensus_genome]]).to eq({ result_status_description: SamplesHelper::SFN_STATUS_MAPPING[WorkflowRun::STATUS[:succeeded]] })
    end

    it "returns the correct status for a sample that only has a short-read-mngs pipeline run" do
      expect(helper).to receive(:pipeline_run_info).and_return({
                                                                 finalized: 1,
                                                                 report_ready: true,
                                                                 result_status_description: "COMPLETE",
                                                                 total_runtime: 123,
                                                                 with_assembly: 0,
                                                               })

      results = helper.send(:get_sample_run_info_by_workflow,
                            sample: @sample1,
                            is_snapshot: false,
                            top_pipeline_run: @pipeline_run1,
                            output_states_by_pipeline_run_id: nil,
                            pipeline_run_stages_by_pipeline_run_id: nil,
                            report_ready_pipeline_run_ids: [@pipeline_run1.id])

      expect(results[WorkflowRun::WORKFLOW[:short_read_mngs]].keys).to contain_exactly(:finalized, :report_ready, :result_status_description, :total_runtime, :with_assembly)
      expect(results[WorkflowRun::WORKFLOW[:short_read_mngs]][:result_status_description]).to eq("COMPLETE")
    end

    it "returns the correct statuses for a sample that has both a short-read-mngs pipeline run and consensus-genome workflow run" do
      expect(helper).to receive(:pipeline_run_info).and_return({
                                                                 finalized: 1,
                                                                 report_ready: true,
                                                                 result_status_description: "COMPLETE",
                                                                 total_runtime: 123,
                                                                 with_assembly: 0,
                                                               })

      results = helper.send(:get_sample_run_info_by_workflow,
                            sample: @sample3,
                            is_snapshot: false,
                            top_pipeline_run: @pipeline_run1,
                            output_states_by_pipeline_run_id: nil,
                            pipeline_run_stages_by_pipeline_run_id: nil,
                            report_ready_pipeline_run_ids: [@pipeline_run1.id])

      expect(results[WorkflowRun::WORKFLOW[:short_read_mngs]].keys).to contain_exactly(:finalized, :report_ready, :result_status_description, :total_runtime, :with_assembly)
      expect(results[WorkflowRun::WORKFLOW[:consensus_genome]].keys).to contain_exactly(:result_status_description)
      expect(results[WorkflowRun::WORKFLOW[:short_read_mngs]][:result_status_description]).to eq("COMPLETE")
      expect(results[WorkflowRun::WORKFLOW[:consensus_genome]]).to eq({ result_status_description: SamplesHelper::SFN_STATUS_MAPPING[WorkflowRun::STATUS[:succeeded]] })
    end

    it "returns the correct status for a snapshot sample that has a short-read-mngs pipeline run" do
      expect(helper).to receive(:snapshot_pipeline_run_info).and_return({
                                                                          result_status_description: "COMPLETE",
                                                                        })

      results = helper.send(:get_sample_run_info_by_workflow,
                            sample: @sample1,
                            is_snapshot: true,
                            top_pipeline_run: @pipeline_run1,
                            output_states_by_pipeline_run_id: nil,
                            pipeline_run_stages_by_pipeline_run_id: nil,
                            report_ready_pipeline_run_ids: [@pipeline_run1.id])

      expect(results[WorkflowRun::WORKFLOW[:short_read_mngs]].keys).to contain_exactly(:result_status_description)
      expect(results[WorkflowRun::WORKFLOW[:short_read_mngs]][:result_status_description]).to eq("COMPLETE")
    end
  end
end
