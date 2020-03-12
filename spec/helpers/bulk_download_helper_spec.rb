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
end
