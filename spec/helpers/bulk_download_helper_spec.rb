require "rails_helper"
require "webmock/rspec"

def generate_expected_csv_str(lines)
  CSVSafe.generate(headers: true) do |csv|
    lines.each do |line|
      csv << line
    end
  end
end

RSpec.describe BulkDownloadsHelper, type: :helper do
  describe "#generate_combined_sample_taxon_results_csv" do
    def get_mock_metric_value(sample_id, tax_id, metric)
      metrics = ["NT.rpm", "NT.zscore", "NT.r", "NR.rpm", "NR.zscore", "NR.r"]
      metric_index = metrics.index(metric)
      10_000 * sample_id + 100 * tax_id + metric_index
    end

    def generate_fetch_taxon_response(mock_samples, tax_ids)
      response = {}

      mock_samples.each do |sample|
        taxon_counts = []

        tax_ids.each do |tax_id|
          taxon_counts << {
            "count_type" => "NT",
            "rpm" => get_mock_metric_value(sample.id, tax_id, "NT.rpm"),
            "r" => get_mock_metric_value(sample.id, tax_id, "NT.r"),
            "zscore" => get_mock_metric_value(sample.id, tax_id, "NT.zscore"),
            "tax_id" => tax_id,
            "tax_level" => TaxonCount::TAX_LEVEL_SPECIES,
            "name" => "Test Taxon #{tax_id}",
          }
          taxon_counts << {
            "count_type" => "NR",
            "rpm" => get_mock_metric_value(sample.id, tax_id, "NR.rpm"),
            "r" => get_mock_metric_value(sample.id, tax_id, "NR.r"),
            "zscore" => get_mock_metric_value(sample.id, tax_id, "NR.zscore"),
            "tax_id" => tax_id,
            "tax_level" => TaxonCount::TAX_LEVEL_SPECIES,
            "name" => "Test Taxon #{tax_id}",
          }
        end

        response[sample.first_pipeline_run.id] = {
          "sample_id" => sample.id,
          "pr" => sample.first_pipeline_run,
          "taxon_counts" => taxon_counts,
        }
      end

      response
    end

    let(:mock_background_id) { 123 }

    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project, name: "Test Sample 1",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project, name: "Test Sample 2",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    end

    it "returns correct values in basic case" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])
      expect(HeatmapHelper).to receive(:fetch_top_taxons).with(
        samples,
        mock_background_id,
        any_args
      ).exactly(1).times.and_return(generate_fetch_taxon_response(samples, [1, 2, 3]))

      response = BulkDownloadsHelper.generate_combined_sample_taxon_results_csv(
        samples, mock_background_id, "NT.rpm"
      )

      expect(response[:csv_str]).to eq(
        generate_expected_csv_str([
                                    ["Taxon Name", "Test Sample 1", "Test Sample 2"],
                                    ["Test Taxon 1", get_mock_metric_value(@sample_one.id, 1, "NT.rpm"), get_mock_metric_value(@sample_two.id, 1, "NT.rpm")],
                                    ["Test Taxon 2", get_mock_metric_value(@sample_one.id, 2, "NT.rpm"), get_mock_metric_value(@sample_two.id, 2, "NT.rpm")],
                                    ["Test Taxon 3", get_mock_metric_value(@sample_one.id, 3, "NT.rpm"), get_mock_metric_value(@sample_two.id, 3, "NT.rpm")],
                                  ])
      )
      expect(response[:failed_sample_ids]).to eq([])
    end

    it "returns correct values in second basic case" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])
      expect(HeatmapHelper).to receive(:fetch_top_taxons).with(
        samples,
        mock_background_id,
        any_args
      ).exactly(1).times.and_return(generate_fetch_taxon_response(samples, [4, 5, 6]))

      response = BulkDownloadsHelper.generate_combined_sample_taxon_results_csv(
        samples, mock_background_id, "NR.zscore"
      )

      expect(response[:csv_str]).to eq(
        generate_expected_csv_str([
                                    ["Taxon Name", "Test Sample 1", "Test Sample 2"],
                                    ["Test Taxon 4", get_mock_metric_value(@sample_one.id, 4, "NR.zscore"), get_mock_metric_value(@sample_two.id, 4, "NR.zscore")],
                                    ["Test Taxon 5", get_mock_metric_value(@sample_one.id, 5, "NR.zscore"), get_mock_metric_value(@sample_two.id, 5, "NR.zscore")],
                                    ["Test Taxon 6", get_mock_metric_value(@sample_one.id, 6, "NR.zscore"), get_mock_metric_value(@sample_two.id, 6, "NR.zscore")],
                                  ])
      )
      expect(response[:failed_sample_ids]).to eq([])
    end

    it "filters out homo sapiens taxid" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])
      expect(HeatmapHelper).to receive(:fetch_top_taxons).with(
        samples,
        mock_background_id,
        any_args
      ).exactly(1).times.and_return(generate_fetch_taxon_response(samples, [4, 5, TaxonLineage::HOMO_SAPIENS_TAX_IDS[1]]))

      response = BulkDownloadsHelper.generate_combined_sample_taxon_results_csv(
        samples, mock_background_id, "NR.zscore"
      )

      expect(response[:csv_str]).to eq(
        generate_expected_csv_str([
                                    ["Taxon Name", "Test Sample 1", "Test Sample 2"],
                                    ["Test Taxon 4", get_mock_metric_value(@sample_one.id, 4, "NR.zscore"), get_mock_metric_value(@sample_two.id, 4, "NR.zscore")],
                                    ["Test Taxon 5", get_mock_metric_value(@sample_one.id, 5, "NR.zscore"), get_mock_metric_value(@sample_two.id, 5, "NR.zscore")],
                                  ])
      )
      expect(response[:failed_sample_ids]).to eq([])
    end

    it "returns samples with no results as failed" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])
      expect(HeatmapHelper).to receive(:fetch_top_taxons).with(
        samples,
        mock_background_id,
        any_args
      ).exactly(1).times.and_return(generate_fetch_taxon_response([@sample_one], [4, 5, 6])) # don't generate results for sample two.

      response = BulkDownloadsHelper.generate_combined_sample_taxon_results_csv(
        samples, mock_background_id, "NR.zscore"
      )

      expect(response[:csv_str]).to eq(
        generate_expected_csv_str([
                                    ["Taxon Name", "Test Sample 1"],
                                    ["Test Taxon 4", get_mock_metric_value(@sample_one.id, 4, "NR.zscore")],
                                    ["Test Taxon 5", get_mock_metric_value(@sample_one.id, 5, "NR.zscore")],
                                    ["Test Taxon 6", get_mock_metric_value(@sample_one.id, 6, "NR.zscore")],
                                  ])
      )
      expect(response[:failed_sample_ids]).to eq([@sample_two.id])
    end

    it "omits 0s as empty string for rpm and r" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])

      mock_fetch_taxon_response = generate_fetch_taxon_response(samples, [4, 5, 6])

      mock_fetch_taxon_response[@sample_one.first_pipeline_run.id]["taxon_counts"][0]["rpm"] = 0 # Set the NT.rpm of taxid 4 to 0.
      mock_fetch_taxon_response[@sample_one.first_pipeline_run.id]["taxon_counts"][4]["rpm"] = 0 # Set the NT.rpm of taxid 6 to 0.

      expect(HeatmapHelper).to receive(:fetch_top_taxons).with(
        samples,
        mock_background_id,
        any_args
      ).exactly(1).times.and_return(mock_fetch_taxon_response)

      response = BulkDownloadsHelper.generate_combined_sample_taxon_results_csv(
        samples, mock_background_id, "NT.rpm"
      )

      expect(response[:csv_str]).to eq(
        generate_expected_csv_str([
                                    ["Taxon Name", "Test Sample 1", "Test Sample 2"],
                                    ["Test Taxon 5", get_mock_metric_value(@sample_one.id, 5, "NT.rpm"), get_mock_metric_value(@sample_two.id, 5, "NT.rpm")],
                                    ["Test Taxon 4", nil, get_mock_metric_value(@sample_two.id, 4, "NT.rpm")],
                                    ["Test Taxon 6", nil, get_mock_metric_value(@sample_two.id, 6, "NT.rpm")],
                                  ])
      )
      expect(response[:failed_sample_ids]).to eq([])
    end
  end

  describe "#generate_metadata_csv" do
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

    it "returns correct values in basic case" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id])

      csv_string = BulkDownloadsHelper.generate_metadata_csv(samples)

      # Check that
      # 1) Metadata is returned properly.
      # 2) The required field is listed first.
      # 3) collection_location is displayed in the header instead of collection_location_v2.
      expect(csv_string).to eq(
        generate_expected_csv_str([
                                    ["sample_name", "sample_type", "collection_location", "custom_field_one", "custom_field_two"],
                                    ["Test Sample 1", "Serum", "San Francisco, USA", "Value One", nil],
                                    ["Test Sample 2", "CSF", "Los Angeles, USA", nil, "Value Two"],
                                  ])
      )
    end

    # It's possible that a very old sample in IDseq has no metadata.
    it "returns reasonable csv if sample has no metadata" do
      # Make sample_type not required for this test.
      MetadataField.where(name: "sample_type").update(is_required: 0)

      # Create a sample with no metadata.
      sample_no_metadata = create(:sample, project: @project, name: "Test Sample 3",
                                           pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      samples = Sample.where(id: [sample_no_metadata.id])

      csv_string = BulkDownloadsHelper.generate_metadata_csv(samples)

      expect(csv_string).to eq(
        generate_expected_csv_str([
                                    ["sample_name"],
                                    ["Test Sample 3"],
                                  ])
      )
    end
  end

  describe "#prepare_workflow_run_metrics_csv_info" do
    let(:empty_metrics_csv_values) { (0...ConsensusGenomeMetricsService::ALL_METRICS.keys.length).map { |_| '' } }

    before do
      project = create(:project)
      @sample = create(:sample, project: project)
    end

    context "consensus-genome workflow run has cached_results and quality_metrics" do
      let(:parsed_results) do
        {
          "coverage_viz" => {},
          # Creates a hash of where the ALL_METRICS are the keys and 1 are the values
          "quality_metrics" => ConsensusGenomeMetricsService::ALL_METRICS.keys.index_with { |_key| 1 },
          "taxon_info" => {},
        }
      end
      let(:quality_metrics) { parsed_results["quality_metrics"] }
      let(:cached_results) { parsed_results.to_json }

      before do
        @workflow_run = create(:workflow_run, sample: @sample, cached_results: cached_results)
      end

      it "returns the correct quality_metrics csv values" do
        wr_csv_metric_values = BulkDownloadsHelper.prepare_workflow_run_metrics_csv_info(workflow_run: @workflow_run)

        expect(wr_csv_metric_values).to eq(quality_metrics.values)
      end
    end

    context "consensus-genome workflow run has cached_results but no quality_metrics" do
      let(:parsed_results) do
        {
          "coverage_viz" => {},
          "quality_metrics" => {},
          "taxon_info" => {},
        }
      end
      let(:cached_results) { parsed_results.to_json }

      before do
        @workflow_run = create(:workflow_run, sample: @sample, cached_results: cached_results)
      end

      it "returns an array of '' with length equal to the number of ALL_METRICS instead of metric values" do
        wr_csv_metric_values = BulkDownloadsHelper.prepare_workflow_run_metrics_csv_info(workflow_run: @workflow_run)

        expect(wr_csv_metric_values).to eq(empty_metrics_csv_values)
      end
    end

    context "consensus-genome workflow runs does not have cached_results" do
      before do
        @workflow_run = create(:workflow_run, sample: @sample)
      end

      it "returns an array of '' with length equal to the number of ALL_METRICS instead of metric values" do
        wr_csv_metric_values = BulkDownloadsHelper.prepare_workflow_run_metrics_csv_info(workflow_run: @workflow_run)

        expect(wr_csv_metric_values).to eq(empty_metrics_csv_values)
      end
    end
  end

  describe "#generate_cg_overview_csv" do
    let(:project) { create(:project) }
    let(:cg_metric_headers) { ["Sample Name", "Reference Accession", "Reference Accession ID", *ConsensusGenomeMetricsService::ALL_METRICS.values] }
    let(:cg_metadata_headers) { ["Wetlab Protocol", "Executed At"] }
    let(:inputs_json) do
      {
        accession_id: "OV123456.7",
        accession_name: "Test Accession Name",
        taxon_id: 5_678_910,
        taxon_name: "omarvirus",
        wetlab_protocol: "artic",
      }
    end
    let(:parsed_results) do
      {
        "coverage_viz" => {},
        # Creates a hash of where the ALL_METRICS are the keys and 1 are the values
        "quality_metrics" => ConsensusGenomeMetricsService::ALL_METRICS.keys.index_with { |_key| 1 },
        "taxon_info" => {},
      }
    end
    let(:quality_metrics) { parsed_results["quality_metrics"] }
    let(:cached_results) { parsed_results.to_json }

    context "user selected 1 sample with 3 valid CG but did not select 'include metadata'" do
      before do
        create(:metadata_field, name: "sample_type", is_required: 1, is_default: 1, is_core: 1, default_for_new_host_genome: 1)
        # while normally required, this field is expected to be not required here
        MetadataField.where(name: "collection_location_v2").update(is_required: 0)
        @sample = create(:sample,
                         name: "Test Sample 1",
                         project: project,
                         metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No" })
        @workflow_run1 = create(:workflow_run, sample: @sample, cached_results: cached_results, inputs_json: inputs_json.to_json)
        @workflow_run2 = create(:workflow_run, sample: @sample, cached_results: cached_results, inputs_json: inputs_json.to_json)
        @workflow_run3 = create(:workflow_run, sample: @sample, cached_results: cached_results, inputs_json: inputs_json.to_json)
      end

      it "returns correct csv values without metadata" do
        consensus_genome_overview_csv_string = BulkDownloadsHelper.generate_cg_overview_csv(workflow_runs: @sample.workflow_runs, include_metadata: false)

        expect(consensus_genome_overview_csv_string).to eq(generate_expected_csv_str([
                                                                                       cg_metric_headers,
                                                                                       ["Test Sample 1", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values),
                                                                                       ["Test Sample 1", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values),
                                                                                       ["Test Sample 1", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values),
                                                                                     ]))
      end
    end

    context "user selected 3 samples with each sample containing 2 valid CG and selected 'include metadata'" do
      before do
        create(:metadata_field, name: "sample_type", is_required: 1, is_default: 1, is_core: 1, default_for_new_host_genome: 1)
        create(:metadata_field, name: "collection_location_v2", base_type: 3)
        create(:metadata_field, name: "nucleotide_type", base_type: 0)
        create(:metadata_field, name: "collection_date", base_type: 0)
        create(:metadata_field, name: "water_control", base_type: 0)

        # while normally required, this field is expected to be not required here
        MetadataField.where(name: "collection_location_v2").update(is_required: 0)
        @sample1 = create(:sample,
                          name: "Test Sample 1",
                          project: project,
                          metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "CSF", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No" })
        @workflow_run1 = create(:workflow_run, sample: @sample1, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)
        @workflow_run2 = create(:workflow_run, sample: @sample1, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)

        @sample2 = create(:sample,
                          name: "Test Sample 2",
                          project: project,
                          metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No" })
        @workflow_run3 = create(:workflow_run, sample: @sample2, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)
        @workflow_run4 = create(:workflow_run, sample: @sample2, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)

        @sample3 = create(:sample,
                          name: "Test Sample 3",
                          project: project,
                          metadata_fields: { collection_location_v2: "Indio, USA", sample_type: "CSF", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No" })
        @workflow_run5 = create(:workflow_run, sample: @sample3, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)
        @workflow_run6 = create(:workflow_run, sample: @sample3, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)

        @samples = [@sample1, @sample2, @sample3]
        @sample_metadata_headers, @metadata_keys, @metadata_by_sample_id = BulkDownloadsHelper.generate_sample_metadata_csv_info(samples: @samples)
      end

      it "returns correct csv values with metadata" do
        consensus_genome_overview_csv_string = BulkDownloadsHelper.generate_cg_overview_csv(workflow_runs: WorkflowRun.where(sample_id: @samples.map(&:id)), include_metadata: true)

        expect(consensus_genome_overview_csv_string).to eq(generate_expected_csv_str([
                                                                                       cg_metric_headers.concat(cg_metadata_headers, @sample_metadata_headers.map { |h| h.humanize.titleize }),
                                                                                       ["Test Sample 1", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values, [@workflow_run1.inputs["wetlab_protocol"], @workflow_run1.executed_at], @metadata_by_sample_id[@sample1.id].values_at(*@metadata_keys)),
                                                                                       ["Test Sample 1", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values, [@workflow_run2.inputs["wetlab_protocol"], @workflow_run2.executed_at], @metadata_by_sample_id[@sample1.id].values_at(*@metadata_keys)),
                                                                                       ["Test Sample 2", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values, [@workflow_run3.inputs["wetlab_protocol"], @workflow_run3.executed_at], @metadata_by_sample_id[@sample2.id].values_at(*@metadata_keys)),
                                                                                       ["Test Sample 2", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values, [@workflow_run4.inputs["wetlab_protocol"], @workflow_run4.executed_at], @metadata_by_sample_id[@sample2.id].values_at(*@metadata_keys)),
                                                                                       ["Test Sample 3", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values, [@workflow_run5.inputs["wetlab_protocol"], @workflow_run5.executed_at], @metadata_by_sample_id[@sample3.id].values_at(*@metadata_keys)),
                                                                                       ["Test Sample 3", "Test Accession Name", "OV123456.7"].concat(quality_metrics.values, [@workflow_run6.inputs["wetlab_protocol"], @workflow_run6.executed_at], @metadata_by_sample_id[@sample3.id].values_at(*@metadata_keys)),
                                                                                     ]))
      end
    end
  end
end
