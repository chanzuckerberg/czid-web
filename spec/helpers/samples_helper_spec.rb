require "rails_helper"
require "webmock/rspec"

RSpec.describe SamplesHelper, type: :helper do
  describe "#get_upload_credentials" do
    let(:fake_role_arn) { "dsfsdfsdfs" }
    let(:fake_access_key_id) { "123456789012" }
    let(:current_user) { create(:user) }

    it "returns an access key from assume_role and calls assume_role with the appropriate ARNs" do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])
      input_file = InputFile.new
      input_file.name = "test.fasta"
      input_file.source = "test.fasta"
      input_file.parts = "test.fasta"
      input_file.source_type = "local"
      input_file.upload_client = "cli"
      input_file.file_type = "fastq"
      @sample_one = create(:sample, project: @project, name: "Test Sample", input_files: [input_file])

      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('CLI_UPLOAD_ROLE_ARN').and_return(fake_role_arn)
      mock_client = Aws::STS::Client.new(stub_responses: true)
      creds = mock_client.stub_data(
        :assume_role,
        credentials: {
          access_key_id: fake_access_key_id,
        }
      )
      mock_client.stub_responses(:assume_role, creds)
      allow(AwsClient).to receive(:[]) { |_client|
        mock_client
      }

      creds = get_upload_credentials([@sample_one])
      expect(creds[:credentials][:access_key_id]).to be fake_access_key_id
      expect(mock_client.api_requests.length).to be 1
      request = mock_client.api_requests.first

      action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:CreateMultipartUpload",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts",
      ]
      object_arns = ["arn:aws:s3:::#{ENV['SAMPLES_BUCKET_NAME']}/samples/#{@project.id}/#{@sample_one.id}/fastqs/test.fasta"]
      policy = {
        Version: "2012-10-17",
        Statement: {
          Sid: "AllowSampleUploads",
          Effect: "Allow",
          Action: action,
          Resource: object_arns,
        },
      }
      expect(request[:params][:policy]).to eq(JSON.dump(policy))
    end
  end
  describe "#upload_samples_with_metadata" do
    before do
      @project = create(:public_project)
      @joe = create(:joe)
      @host_genome = create(:host_genome, user: @joe)
    end

    context "with basespace samples" do
      let(:fake_access_token) { "fake_access_token" }
      let(:fake_dataset_id) { "fake_dataset_id" }
      let(:fake_sample_name) { "fake_sample_name" }

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
        expect(LogUtil).to receive(:log_error).and_call_original

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
        expect(LogUtil).to receive(:log_error).and_call_original

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

      context "with local samples" do
        let(:fake_sample_name) { "fake_local_sample_name" }
        let(:fake_input_files_attributes) do
          [
            {
              "source_type": "local",
              "source": "fake_source_R1_001.fastq.gz",
              "parts": "fake_source_R1_001.fastq.gz",
              "upload_client": "web",
              "file_type": "fastq",
            },
            {
              "source_type": "local",
              "source": "fake_source_R2_001.fastq.gz",
              "parts": "fake_source_R2_001.fastq.gz",
              "upload_client": "web",
              "file_type": "fastq",
            },
          ]
        end

        let(:local_cg_sample_attributes) do
          {
            name: fake_sample_name,
            project_id: @project.id,
            host_genome_id: @host_genome.id,
            input_files_attributes: fake_input_files_attributes,
          }
        end

        let(:metadata_attributes) do
          {
            fake_sample_name.to_s => {
              "Fake Metadata Field One" => "CSF",
              "Fake Metadata Field Two" => "DNA",
            },
          }
        end

        it "saves successfully for short-read-mngs workflows" do
          additional_attributes = {
            workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
          }
          sample_attributes = [local_cg_sample_attributes.merge(additional_attributes)]

          response = helper.upload_samples_with_metadata(
            sample_attributes,
            metadata_attributes,
            @joe
          )

          expect(response["samples"].length).to eq(1)
          expect(response["errors"].length).to eq(0)

          created_sample = response["samples"][0]

          expect(created_sample.pipeline_runs.length).to eq(0)
          expect(created_sample.workflow_runs.length).to eq(0)

          expect(created_sample.input_files.length).to eq(2)
          expect(created_sample.input_files.first.presigned_url).to be_nil
          expect(created_sample.input_files.second.presigned_url).to be_nil
        end

        it "returns the sample when re-called with the same sample name if it is not uploaded" do
          additional_attributes = {
            workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
          }
          sample_attributes = [local_cg_sample_attributes.merge(additional_attributes)]

          response = helper.upload_samples_with_metadata(
            sample_attributes,
            metadata_attributes,
            @joe
          )

          expect(response["samples"].length).to eq(1)
          expect(response["errors"].length).to eq(0)

          created_sample = response["samples"][0]

          expect(created_sample.pipeline_runs.length).to eq(0)
          expect(created_sample.workflow_runs.length).to eq(0)

          expect(created_sample.input_files.length).to eq(2)

          response = helper.upload_samples_with_metadata(
            sample_attributes,
            metadata_attributes,
            @joe
          )

          expect(response["samples"].length).to eq(1)
          expect(response["errors"].length).to eq(0)

          created_sample = response["samples"][0]

          expect(created_sample.pipeline_runs.length).to eq(0)
          expect(created_sample.workflow_runs.length).to eq(0)

          expect(created_sample.input_files.length).to eq(2)
        end

        it "saves successfully if technology is provided with consensus genome workflow runs" do
          additional_attributes = {
            technology: ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore],
            wetlab_protocol: ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic],
            workflows: [WorkflowRun::WORKFLOW[:consensus_genome]],
          }
          sample_attributes = [local_cg_sample_attributes.merge(additional_attributes)]

          response = helper.upload_samples_with_metadata(
            sample_attributes,
            metadata_attributes,
            @joe
          )

          expect(response["samples"].length).to eq(1)
          expect(response["errors"].length).to eq(0)

          created_sample = response["samples"][0]
          created_workflow_run = created_sample.workflow_runs.first

          expect(created_sample.pipeline_runs.length).to eq(0)
          expect(created_sample.workflow_runs.length).to eq(1)
          expect(created_sample.name).to eq(fake_sample_name)
          expect(created_sample.host_genome.id).to eq(@host_genome.id)
          expect(created_sample.host_genome.user).to eq(@joe)
          expect(created_sample.project.id).to eq(@project.id)
          expect(created_sample.bulk_mode).to eq(nil)
          expect(created_sample.uploaded_from_basespace).to eq(0)
          expect(created_sample.user).to eq(@joe)

          expect(created_workflow_run.inputs.keys).to eq([
                                                           "accession_id",
                                                           "accession_name",
                                                           "taxon_id",
                                                           "taxon_name",
                                                           "technology",
                                                           "wetlab_protocol",
                                                           "ref_fasta",
                                                           "primer_bed",
                                                           "clearlabs",
                                                           "medaka_model",
                                                           "vadr_options",
                                                         ])

          expect(created_workflow_run.inputs&.[]("wetlab_protocol")).to eq(ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic])
          expect(created_workflow_run.inputs&.[]("technology")).to eq(ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore])
          expect(created_workflow_run.inputs&.[]("medaka_model")).to eq(ConsensusGenomeWorkflowRun::DEFAULT_MEDAKA_MODEL)
          expect(created_workflow_run.inputs&.[]("vadr_options")).to eq(ConsensusGenomeWorkflowRun::DEFAULT_VADR_OPTIONS)
        end

        it "fails if technology is not provided with consensus genome workflow runs" do
          expect(LogUtil).to receive(:log_error).and_call_original

          additional_attributes = { workflows: [WorkflowRun::WORKFLOW[:consensus_genome]] }
          sample_attributes = [local_cg_sample_attributes.merge(additional_attributes)]
          response = helper.upload_samples_with_metadata(
            sample_attributes,
            metadata_attributes,
            @joe
          )

          expect(response["samples"].length).to eq(0)
          expect(response["errors"]).to eq([
                                             ErrorHelper::SampleUploadErrors.missing_required_technology_for_cg(sample_attributes[0][:project_id]),
                                           ])
        end
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
      create(:metadata_field, name: "host_age", is_required: 0, is_default: 1, is_core: 1, default_for_new_host_genome: 1)
      # while normally required, this field is expected to be not required here
      MetadataField.where(name: "collection_location_v2").update(is_required: 0)
      @sample_one = create(:sample, project: @project, name: "Test Sample 1", host_genome_name: "Human",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                    metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", custom_field_one: "Value One", host_age: MetadataField::MAX_HUMAN_AGE.to_s })
      @sample_two = create(:sample, project: @project, name: "Test Sample 2", host_genome_name: "Mosquito",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                    metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", custom_field_two: "Value Two", host_age: MetadataField::MAX_HUMAN_AGE.to_s })
      @sample_three = create(:sample, project: @project, name: "Test Sample 3", host_genome_name: "Human",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                      metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", custom_field_two: "Value Two", host_age: (MetadataField::MAX_HUMAN_AGE - 1).to_s })
      @sample_four = create(:sample, project: @project, name: "Test Sample 4", host_genome_name: "Human",
                                     pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore] }])
      @sample_five = create(:sample, project: @project, name: "Test Sample 5", host_genome_name: "Human",
                                     pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, total_bases: 42_424, qc_percent: 10.0001, technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore] }])
      create(:job_stat, task: "human_filtered_bases", bases_after: 4242, pipeline_run_id: @sample_four.pipeline_runs.first.id)
      create(:job_stat, task: "quality_filtered_bases", bases_after: 14_242, pipeline_run_id: @sample_four.pipeline_runs.first.id)
      create(:job_stat, task: "original_bases", bases_after: 142_420, pipeline_run_id: @sample_four.pipeline_runs.first.id)
      create(:job_stat, task: "human_filtered_bases", bases_after: 123, pipeline_run_id: @sample_five.pipeline_runs.first.id)
      create(:job_stat, task: "quality_filtered_bases", bases_after: 1234, pipeline_run_id: @sample_five.pipeline_runs.first.id)
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
      samples = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id])
      csv_string = helper.generate_sample_list_csv(samples, include_all_metadata: true)
      headers = csv_string.split("\n")[0]
      expect(headers.include?("sample_type")).to be true
      expect(headers.include?("collection_location")).to be true
      # Doesn't include nucleotide_type because none of the samples have it
      expect(headers.include?("nucleotide_type")).to be false
      # Includes custom metadata
      expect(headers.include?("custom_field_one")).to be true
      expect(headers.include?("custom_field_two")).to be true
      # Metadata is converted to HIPAA-compliant values
      expect(headers.include?("host_age")).to be true
      sample1_metadata = csv_string.split("\n")[1]
      sample2_metadata = csv_string.split("\n")[2]
      sample3_metadata = csv_string.split("\n")[3]
      expect(sample1_metadata).to include("≥ #{MetadataField::MAX_HUMAN_AGE}")
      expect(sample2_metadata).to include(MetadataField::MAX_HUMAN_AGE.to_s)
      expect(sample3_metadata).to include((MetadataField::MAX_HUMAN_AGE - 1).to_s)
    end

    it "includes specific metadata fields for ONT" do
      samples = Sample.where(id: [@sample_four.id, @sample_five.id])
      csv_string = helper.generate_sample_list_csv(samples, include_all_metadata: true, technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore])
      output = csv_string.split("\n")
      headers = output[0].split(",")
      # Include ONT fields
      expect(headers.include?("total_bases")).to be true
      expect(headers.include?("bases_after_quality_filter_percent")).to be true
      expect(headers.include?("bases_after_minimap2_host_filtering")).to be true
      # Doesn't include Illumina fields
      expect(headers.include?("total_ercc_reads")).to be false
      expect(headers.include?("reads_after_star")).to be false
      expect(headers.include?("insert_size_median")).to be false
      # Contains correct ONT data sample 4
      sample_four = output[1].split(",")
      expect(sample_four[headers.find_index("bases_after_minimap2_host_filtering")]).to eq("4242")
      expect(sample_four[headers.find_index("bases_after_quality_filter")]).to eq("14242")
      # Contains correct ONT data sample 5
      sample_five = output[2].split(",")
      expect(sample_five[headers.find_index("total_bases")]).to eq("42424")
      expect(sample_five[headers.find_index("bases_after_quality_filter_percent")]).to eq("10.0")
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

      @sample_five = create(:sample, project: @project, name: "Test Sample Five", initial_workflow: WorkflowRun::WORKFLOW[:long_read_mngs])
      @samples_input = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id, @sample_four.id, @sample_five.id])
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

    it "properly returns only samples with a long-read-mngs workflow" do
      query = [WorkflowRun::WORKFLOW[:long_read_mngs]]
      results = helper.send(:filter_by_workflow, @samples_input, query)
      expect(results.pluck(:id)).to eq([@sample_five.id])
    end

    it "returns an empty response if no sample workflows match the query" do
      query = ["fake_workflow"]
      results = helper.send(:filter_by_workflow, @samples_input, query)
      expect(results).to eq([])
    end
  end

  describe "#filter_by_taxon_threshold" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])

      @sample_one = create(:sample, project: @project, name: "Test Sample One", initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs], pipeline_runs_data: [
                             taxon_counts_data: [{
                               tax_level: 1,
                               tax_id: 573,
                               nr: 99,
                               percent_identity: 50.0,
                               alignment_length: 99.123,
                               e_value: 99,
                               rpm: 99,
                             }, {
                               tax_level: 1,
                               tax_id: 573,
                               nt: 99,
                               percent_identity: 50.0,
                               alignment_length: 99.123,
                               e_value: 99,
                               rpm: 99,
                             }, {
                               tax_level: 2,
                               nt: 99,
                               tax_id: 570,
                               percent_identity: 50.0,
                               alignment_length: 99.123,
                               e_value: -99,
                               rpm: 99,
                             }, {
                               tax_level: 2,
                               nr: 99,
                               tax_id: 570,
                               percent_identity: 50.0,
                               alignment_length: 99.123,
                               e_value: -99,
                               rpm: 99,
                             },],
                             contigs_data: [{
                               genus_taxid_nt: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 573,
                               read_count: 99,
                             },],
                           ])
      @sample_two = create(:sample, project: @project, name: "Test Sample Two", initial_workflow: WorkflowRun::WORKFLOW[:consensus_genome])
      @sample_three = create(:sample, project: @project, name: "Test Sample Three", initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs], pipeline_runs_data: [
                               taxon_counts_data: [{
                                 tax_level: 1,
                                 tax_id: 573,
                                 nr: 200,
                                 percent_identity: 100.0,
                                 alignment_length: 200.123,
                                 e_value: 200,
                                 rpm: 200,
                               }, {
                                 tax_level: 1,
                                 tax_id: 573,
                                 nt: 200,
                                 percent_identity: 100.0,
                                 alignment_length: 200.123,
                                 e_value: 200,
                                 rpm: 200,
                               }, {
                                 tax_level: 2,
                                 nt: 200,
                                 tax_id: 570,
                                 percent_identity: 100.0,
                                 alignment_length: 200.123,
                                 e_value: 200,
                                 rpm: 200,
                               }, {
                                 tax_level: 2,
                                 nr: 200,
                                 tax_id: 570,
                                 percent_identity: 100.0,
                                 alignment_length: 200.123,
                                 e_value: 200,
                                 rpm: 200,
                               },],
                               contigs_data: [{
                                 genus_taxid_nt: 570,
                                 read_count: 100,
                               }, {
                                 genus_taxid_nt: 570,
                                 read_count: 100,
                               }, {
                                 species_taxid_nt: 573,
                                 read_count: 100,
                               }, {
                                 species_taxid_nt: 573,
                                 read_count: 100,
                               },],
                             ])

      @samples_input = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id])
      @tax_ids = [570, 573]
      @tax_levels = ["genus", "species"]
    end

    context "validates threshold filtering input" do
      it "raises error if threshold filter hash keys do not match expected keys" do
        threshold_with_extra_key = [
          {
            metric: "rpm",
            count_type: "NR",
            operator: ">=",
            value: 10,
            additional_key: "this key is not supposed to be here",
          }.to_json,
        ]

        expect { helper.send(:filter_by_taxon_threshold, @samples_input, @tax_ids, @tax_levels, threshold_with_extra_key) }.to raise_error(ArgumentError)
      end

      it "raises error if value is invalid" do
        threshold_with_invalid_value = [
          {
            metric: "rpm",
            count_type: "NR",
            operator: ">=",
            value: "Invalid value",
          }.to_json,
        ]

        expect { helper.send(:filter_by_taxon_threshold, @samples_input, @tax_ids, @tax_levels, threshold_with_invalid_value) }.to raise_error(ArgumentError)
      end

      it "raises error if count_type is invalid" do
        count_type = "Inalid count_type, not NT or NR"
        threshold_with_invalid_count_type = [
          {
            metric: "percent_identity",
            count_type: count_type,
            operator: ">=",
            value: 10,
          }.to_json,
        ]

        expect { helper.send(:filter_by_taxon_threshold, @samples_input, @tax_ids, @tax_levels, threshold_with_invalid_count_type) }.to raise_error(RuntimeError) # , ErrorHelper::ThresholdFilterErrors.invalid_count_type(count_type)
      end

      it "raises error if operator is invalid" do
        operator = "Invalid operator, not <= or >="
        threshold_with_invalid_operator = [
          {
            metric: "e_value",
            count_type: "NT",
            operator: operator,
            value: 10,
          }.to_json,
        ]

        expect { helper.send(:filter_by_taxon_threshold, @samples_input, @tax_ids, @tax_levels, threshold_with_invalid_operator) }.to raise_error(RuntimeError) # ErrorHelper::ThresholdFilterErrors.invalid_operator(operator)
      end

      it "raises error if metric is invalid" do
        metric = "Invalid metric"

        threshold_with_invalid_metric = [
          {
            metric: metric,
            count_type: "NT",
            operator: ">=",
            value: 10,
          }.to_json,
        ]

        expect { helper.send(:filter_by_taxon_threshold, @samples_input, @tax_ids, @tax_levels, threshold_with_invalid_metric) }.to raise_error(RuntimeError) # ErrorHelper::ThresholdFilterErrors.invalid_metric(metric)
      end

      it "raises error if tax_level is invalid" do
        invalid_tax_levels = ["invalid tax level"]
        valid_threshold_filter = [
          {
            metric: "count",
            count_type: "NT",
            operator: ">=",
            value: 10,
          }.to_json,
        ]

        expect { helper.send(:filter_by_taxon_threshold, @samples_input, @tax_ids, invalid_tax_levels, valid_threshold_filter) }.to raise_error(RuntimeError) # ErrorHelper::ThresholdFilterErrors.invalid_metric(tax_level)
      end
    end

    # TODO(omar): Uncomment these tests out when percent_identity, alignment_length, and rpm columns are converted to decimal.
    # Since float's are approximate values, doing equality comparisons (<=, >=, and ==) do not work as expected.

    # Contig::CONTIG_FILTERS.concat(TaxonCount::TAXON_COUNT_METRIC_FILTERS).each do |metric|
    #   TaxonCount::COUNT_TYPES_FOR_FILTERING.each do |count_type|
    #     Sample::FILTERING_OPERATORS.each do |operator|
    #       value = 100
    #       klebsiella_tax_id = 570
    #       threshold_filter = [
    #         {
    #           metric: metric,
    #           count_type: count_type,
    #           operator: operator,
    #           value: value,
    #         }.to_json,
    #       ]

    #       it "filters correctly when metric: #{metric}, count_type: #{count_type}, operator: #{operator}, value: #{value}" do
    #         filtered_samples = helper.send(:filter_by_taxon_threshold, @samples_input, [klebsiella_tax_id], threshold_filter)
    #         filtered_sample_ids = filtered_samples.map(&:id).uniq

    #         if operator == ">="
    #           expect(filtered_sample_ids).to eq([@sample_three.id])
    #         elsif operator == "<="
    #           expect(filtered_sample_ids).to eq([@sample_one.id])
    #         end
    #       end
    #     end
    #   end
    # end
  end

  describe "#filter_by_taxon_annotation" do
    before do
      project = create(:project)

      @sample_one = create(:sample, project: project)
      @sample_two = create(:sample, project: project)
      @sample_three = create(:sample, project: project)

      @pr_one_old = create(:pipeline_run, sample: @sample_one, deprecated: true)
      @pr_one = create(:pipeline_run, sample: @sample_one, deprecated: false)
      @pr_two = create(:pipeline_run, sample: @sample_two, deprecated: false)
      @pr_three = create(:pipeline_run, sample: @sample_three, deprecated: false)

      @taxon = create(:taxon_lineage, tax_name: "taxon", taxid: 1)

      @samples_input = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id])
    end

    it "returns an empty response if no samples contain the specified annotations" do
      annotation_filters = ["{\"name\":\"Hit\"}"]
      results = helper.send(:filter_by_taxon_annotation, @samples_input, annotation_filters, nil)
      expect(results).to eq([])
    end

    it "returns correctly-filtered samples if samples have multiple pipeline runs" do
      create(:annotation, pipeline_run_id: @pr_one_old.id, tax_id: @taxon.taxid, content: "hit")
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "inconclusive")

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], nil)
      expect(results).to eq([])

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Inconclusive\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id])
    end

    it "returns correctly-filtered samples if samples have multiple annotations on the same taxon" do
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "hit")
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "inconclusive")

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], nil)
      expect(results).to eq([])

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Inconclusive\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id])
    end

    it "returns correctly-filtered samples if samples have annotations on multiple taxa" do
      taxon_two = create(:taxon_lineage, tax_name: "taxon", taxid: 2)
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "hit")
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: taxon_two.taxid, content: "inconclusive")

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id])

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Inconclusive\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id])
    end

    it "returns distinct samples if samples have multiple annotations that match filters" do
      taxon_two = create(:taxon_lineage, tax_name: "taxon", taxid: 2)
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "hit")
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: taxon_two.taxid, content: "hit")

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id])
    end

    it "returns correctly-filtered samples with the specified annotation(s)" do
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "hit")
      create(:annotation, pipeline_run_id: @pr_two.id, tax_id: @taxon.taxid, content: "not_a_hit")
      create(:annotation, pipeline_run_id: @pr_three.id, tax_id: @taxon.taxid, content: "inconclusive")

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id])

      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}", "{\"name\":\"Not a hit\"}"], nil)
      expect(results.pluck(:id)).to eq([@sample_one.id, @sample_two.id])
    end

    it "returns correctly-filtered samples with the specified annotations(s) on the specifed taxa" do
      taxon_two = create(:taxon_lineage, tax_name: "taxon", taxid: 2)
      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: taxon_two.taxid, content: "hit")
      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], [@taxon.taxid])
      expect(results.pluck(:id)).to eq([])

      create(:annotation, pipeline_run_id: @pr_one.id, tax_id: @taxon.taxid, content: "hit")
      results = helper.send(:filter_by_taxon_annotation, @samples_input, ["{\"name\":\"Hit\"}"], [@taxon.taxid])
      expect(results.pluck(:id)).to eq([@sample_one.id])
    end
  end

  describe "#filter_samples" do
    before do
      project = create(:project)

      @sample_one = create(:sample, project: project, initial_workflow: WorkflowRun::WORKFLOW[:long_read_mngs])
      @sample_two = create(:sample, project: project, initial_workflow: WorkflowRun::WORKFLOW[:long_read_mngs])
      @samples_input = Sample.where(id: [@sample_one.id, @sample_two.id])
    end

    it "does not apply annotation filters to long-read-mngs samples" do
      filters = {
        workflow: WorkflowRun::WORKFLOW[:long_read_mngs],
        annotations: {
          name: "Hit",
        },
      }
      expect(helper).to receive(:filter_samples).and_return(@samples_input)
      expect(helper).not_to receive(:filter_by_taxon_annotation)
      helper.send(:filter_samples, @samples_input, filters)
    end

    it "does not apply taxon filters to long-read-mngs samples" do
      filters = {
        workflow: WorkflowRun::WORKFLOW[:long_read_mngs],
        taxon: [570, 573],
      }
      expect(helper).to receive(:filter_samples).and_return(@samples_input)
      expect(helper).not_to receive(:filter_by_taxid)
      helper.send(:filter_samples, @samples_input, filters)
    end

    it "does not apply taxon threshold filters to long-read-mngs samples" do
      threshold = [
        {
          metric: "e_value",
          count_type: "NT",
          operator: ">=",
          value: 10,
        }.to_json,
      ]
      filters = {
        workflow: WorkflowRun::WORKFLOW[:long_read_mngs],
        taxon: [570, 573],
        taxaLevels: ["genus", "species"],
        taxonThresholds: threshold,
      }
      expect(helper).to receive(:filter_samples).and_return(@samples_input)
      expect(helper).not_to receive(:filter_by_taxon_threshold)
      helper.send(:filter_samples, @samples_input, filters)
    end
  end

  describe "#validate_user_is_collaborator_or_admin" do
    before do
      @joe = create(:joe)
      @admin = create(:admin)
      sign_in @joe
      @joe_project = create(:project, users: [@joe], name: "Project Joe")
      @admin_project = create(:project, users: [@admin], name: "Admin Project")
      @collaborative_project = create(:project,
                                      users: [@admin, @joe],
                                      creator: @admin,
                                      name: "Collaborative Project")
      @joe_sample = create(:sample, project: @joe_project, user: @joe)
      @admin_sample = create(:sample, project: @admin_project, user: @admin)
      @collaborative_sample = create(:sample, project: @collaborative_project, user: @admin)
    end

    it "returns true for user's own samples" do
      sample_ids = [@joe_sample.id]
      response = helper.send(:validate_user_is_collaborator_or_admin, sample_ids, @joe)
      expect(response).to be(true)
    end

    it "returns true for samples in projects on which user is collaborator" do
      sample_ids = [@collaborative_sample.id]
      response = helper.send(:validate_user_is_collaborator_or_admin, sample_ids, @joe)
      expect(response).to be(true)
    end

    it "returns false for samples on which user is not a collaborator" do
      sample_ids = [@joe_sample.id, @admin_sample.id]
      response = helper.send(:validate_user_is_collaborator_or_admin, sample_ids, @joe)
      expect(response).to be(false)
    end

    it "returns true for admin users for all samples" do
      sign_in @admin
      sample_ids = [@joe_sample.id, @admin_sample.id, @collaborative_sample.id]
      response = helper.send(:validate_user_is_collaborator_or_admin, sample_ids, @admin)
      expect(response).to be(true)
    end
  end

  describe "#format_samples" do
    # TODO: Backfill more tests.
  end
end
