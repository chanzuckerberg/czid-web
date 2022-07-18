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

  describe "#generate_biom_filter_working" do
    before do
      @joe = create(:joe)
      # Create taxon_lineages for a few species/genus.
      @species_a = create(:taxon_lineage, tax_name: "species a", taxid: 1, species_taxid: 1, species_name: "species a", genus_taxid: 10, superkingdom_taxid: 2)
      @species_b = create(:taxon_lineage, tax_name: "species b", taxid: 2, species_taxid: 2, species_name: "species b", genus_taxid: 10, superkingdom_taxid: 2)
      @species_different_category = create(:taxon_lineage, tax_name: "species c", taxid: 5, species_taxid: 5, species_name: "species c", genus_taxid: 11, superkingdom_taxid: 3)
      @species_d = create(:taxon_lineage, tax_name: "species d", taxid: 3, species_taxid: 3, species_name: "species d", genus_taxid: 10, superkingdom_taxid: 2)

      # Create projects and samples belonging to a normal user.
      @project = create(:project, users: [@joe], name: "new project")
      @sample_one = create(:sample, project: @project, name: "sample_one", metadata_fields: {
                             collection_location_v2: "New York, USA", sample_type: "Nasopharyngeal Swab",
                           })
      @pr_one = create(:pipeline_run,
                       sample: @sample_one,
                       job_status: "CHECKED",
                       taxon_counts_data: [
                         { taxon_name: @species_a.tax_name, tax_level: 1, nt: 70 },
                         { taxon_name: @species_b.tax_name, tax_level: 1, nt: 100 },
                         { taxon_name: @species_different_category.tax_name, tax_level: 1, nt: 120 },
                         { taxon_name: @species_d.tax_name, tax_level: 1, nt: 30 },

                       ],
                       wdl_version: "7.1.2")
    end

    it "returns all taxons from TaxonCountsDataService" do
      pipeline_run_ids = @sample_one.pipeline_runs
      taxon_metrics, = TaxonCountsDataService.call(pipeline_run_ids: pipeline_run_ids, lazy: true)
      expect(taxon_metrics.count).to eq(4)
    end

    it "filters by category correctly" do
      pipeline_run_ids = @sample_one.pipeline_runs
      taxon_metrics, = TaxonCountsDataService.call(pipeline_run_ids: pipeline_run_ids, lazy: true)

      # filtering with empty categories returns same values as input
      all_taxon_metrics = BulkDownloadsHelper.filter_by_category([], taxon_metrics)
      expect(all_taxon_metrics.count).to eq(taxon_metrics.count)

      # filtering bacteria returns only bacterial taxons
      bacteria_taxa = BulkDownloadsHelper.filter_by_category(["Bacteria"], taxon_metrics)
      expect(bacteria_taxa.count).to eq(3)
      expect(bacteria_taxa.pluck(:superkingdom_taxid)).to eq([2, 2, 2])

      # filtering on a fake category returns no results
      no_taxa = BulkDownloadsHelper.filter_by_category(["Not a real category"], taxon_metrics)
      expect(no_taxa.count).to eq(0)
    end

    it "filters by threshold correctly" do
      pipeline_run_ids = @sample_one.pipeline_runs
      taxon_metrics, fields = TaxonCountsDataService.call(pipeline_run_ids: pipeline_run_ids, lazy: true)

      # filtering with empty taxa returns same values as input
      ret0, = BulkDownloadsHelper.filter_by_threshold([], taxon_metrics)
      expect(ret0.count).to eq(taxon_metrics.count)
      expect(ret0).to eq(taxon_metrics)

      # filter out 1 taxa works
      thresholds1 = [{ "metric" => "NT_r", "value" => "31", "operator" => ">=", "metricDisplay" => "NT r" }]
      ret1, = BulkDownloadsHelper.filter_by_threshold(thresholds1, taxon_metrics)
      expect(ret1.count).to eq(3)

      # filter between thresholds
      thresholds2 = thresholds1.append({ "metric" => "NT_r", "value" => "119", "operator" => "<=", "metricDisplay" => "NT r" })
      ret2, = BulkDownloadsHelper.filter_by_threshold(thresholds2, taxon_metrics)
      expect(ret2.count).to eq(2)

      # filters to the correct taxa
      thresholds3 = thresholds2.append({ "metric" => "NT_r", "value" => "71", "operator" => ">=", "metricDisplay" => "NT r" })
      ret3, = BulkDownloadsHelper.filter_by_threshold(thresholds3, taxon_metrics)
      last_taxon = ret3.pluck_to_hash(*fields)
      expect(last_taxon.count).to eq(1)
      expect(last_taxon.first["name"]). to eq(@species_b.tax_name)

      # zscore filter returns separately
      thresholds4 = thresholds3.append({ "metric" => "NT_zscore", "value" => "3", "operator" => ">=", "metricDisplay" => "NT ZScore" })
      ret4, zscore_filter = BulkDownloadsHelper.filter_by_threshold(thresholds4, taxon_metrics)
      expect(ret4.count).to eq(1)
      expect(zscore_filter.count). to eq(1)
    end
  end

  describe "#generate_metadata_csv" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])
      create(:metadata_field, name: "sample_type", is_required: 1, is_default: 1, is_core: 1, default_for_new_host_genome: 1)
      # while normally required, this field is expected to be not required here
      MetadataField.where(name: "collection_location_v2").update(is_required: 0)
      @sample_one = create(:sample, project: @project, name: "Test Sample 1", host_genome_name: "Human",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                    metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", host_age: MetadataField::MAX_HUMAN_AGE.to_s, custom_field_one: "Value One" })
      @sample_two = create(:sample, project: @project, name: "Test Sample 2", host_genome_name: "Mosquito",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                    metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", host_age: MetadataField::MAX_HUMAN_AGE.to_s, custom_field_two: "Value Two" })
      @sample_three = create(:sample, project: @project, name: "Test Sample 3", host_genome_name: "Human",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }],
                                      metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", host_age: (MetadataField::MAX_HUMAN_AGE - 1).to_s, custom_field_one: "Value One" })
    end

    it "returns correct values in basic case" do
      samples = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id])

      csv_string = BulkDownloadsHelper.generate_metadata_csv(samples)

      # Check that
      # 1) Metadata is returned properly.
      # 2) The required field is listed first.
      # 3) collection_location is displayed in the header instead of collection_location_v2.
      # 4) Human metadata (ie. host_age) is HIPAA compliant
      expect(csv_string).to eq(
        generate_expected_csv_str([
                                    ["sample_name", "sample_type", "collection_location", "host_age", "custom_field_one", "custom_field_two"],
                                    ["Test Sample 1", "Serum", "San Francisco, USA", "≥ #{MetadataField::MAX_HUMAN_AGE}", "Value One", nil],
                                    ["Test Sample 2", "CSF", "Los Angeles, USA", MetadataField::MAX_HUMAN_AGE.to_s, nil, "Value Two"],
                                    ["Test Sample 3", "Serum", "San Francisco, USA", (MetadataField::MAX_HUMAN_AGE - 1).to_s, "Value One", nil],
                                  ])
      )
    end

    # It's possible that a very old sample in IDseq has no metadata.
    it "returns reasonable csv if sample has no metadata" do
      # Make sample_type not required for this test.
      MetadataField.where(name: "sample_type").update(is_required: 0)

      # Create a sample with no metadata.
      sample_no_metadata = create(:sample, project: @project, name: "Test Sample 4",
                                           pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      samples = Sample.where(id: [sample_no_metadata.id])

      csv_string = BulkDownloadsHelper.generate_metadata_csv(samples)

      expect(csv_string).to eq(
        generate_expected_csv_str([
                                    ["sample_name"],
                                    ["Test Sample 4"],
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
                          host_genome_name: "Human",
                          metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "CSF", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No", host_age: MetadataField::MAX_HUMAN_AGE.to_s })
        @workflow_run1 = create(:workflow_run, sample: @sample1, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)
        @workflow_run2 = create(:workflow_run, sample: @sample1, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)

        @sample2 = create(:sample,
                          name: "Test Sample 2",
                          project: project,
                          host_genome_name: "Mosquito",
                          metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No", host_age: MetadataField::MAX_HUMAN_AGE.to_s })
        @workflow_run3 = create(:workflow_run, sample: @sample2, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)
        @workflow_run4 = create(:workflow_run, sample: @sample2, cached_results: cached_results, inputs_json: inputs_json.to_json, executed_at: Time.current)

        @sample3 = create(:sample,
                          name: "Test Sample 3",
                          project: project,
                          host_genome_name: "Human",
                          metadata_fields: { collection_location_v2: "Indio, USA", sample_type: "CSF", nucleotide_type: "DNA", collection_date: "2021-04", water_control: "No", host_age: (MetadataField::MAX_HUMAN_AGE - 1).to_s })
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
        expect(@metadata_by_sample_id[@sample1.id][:host_age]).to eq("≥ #{MetadataField::MAX_HUMAN_AGE}")
        expect(@metadata_by_sample_id[@sample2.id][:host_age]).to eq(MetadataField::MAX_HUMAN_AGE.to_s)
        expect(@metadata_by_sample_id[@sample3.id][:host_age]).to eq((MetadataField::MAX_HUMAN_AGE - 1).to_s)
      end
    end
  end
end
