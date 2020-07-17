require 'rails_helper'
require 'json'

RSpec.describe PipelineReportService, type: :service do
  let(:csv_output_standard_background) { "tax_id,tax_level,genus_tax_id,name,common_name,category,agg_score,max_z_score,nt_z_score,nt_rpm,nt_count,nt_contigs,nt_contig_r,nt_percent_identity,nt_alignment_length,nt_e_value,nt_bg_mean,nt_bg_stdev,nt_bg_mean_mass_normalized,nt_bg_stdev_mass_normalized,nr_z_score,nr_rpm,nr_count,nr_contigs,nr_contig_r,nr_percent_identity,nr_alignment_length,nr_e_value,nr_bg_mean,nr_bg_stdev,nr_bg_mean_mass_normalized,nr_bg_stdev_mass_normalized,species_tax_ids\n570,2,570,Klebsiella,,bacteria,2428411764.7058825,99,99,193404.63458110517,217,6,594,99.7014,149.424,89.5822,18.3311,64.2056,,,99,77540.10695187165,87,6,594,97.9598,46.4253,16.9874,35.0207,238.639,,,[573]\n573,1,570,Klebsiella pneumoniae,,bacteria,2428411764.7058825,99,99,186274.50980392157,209,2,198,99.6995,149.402,89.5641,9.35068,26.4471,,,99,61497.326203208555,69,2,198,97.8565,46.3623,16.9101,29.9171,236.332,,,\n".freeze }
  let(:csv_output_mass_normalized_background) { "tax_id,tax_level,genus_tax_id,name,common_name,category,agg_score,max_z_score,nt_z_score,nt_rpm,nt_count,nt_contigs,nt_contig_r,nt_percent_identity,nt_alignment_length,nt_e_value,nt_bg_mean,nt_bg_stdev,nt_bg_mean_mass_normalized,nt_bg_stdev_mass_normalized,nr_z_score,nr_rpm,nr_count,nr_contigs,nr_contig_r,nr_percent_identity,nr_alignment_length,nr_e_value,nr_bg_mean,nr_bg_stdev,nr_bg_mean_mass_normalized,nr_bg_stdev_mass_normalized,species_tax_ids\n570,2,570,Klebsiella,,bacteria,124107.21969295476,0.7071070808917406,0.7071070808917406,193750.0,217,6,594,99.7014,149.424,89.5822,96875.0,137002.0,54.0,76.3675,0.7071065856289631,77678.57142857143,87,6,594,97.9598,46.4253,16.9874,38839.3,54927.0,21.5,30.4056,[573]\n573,1,570,Klebsiella pneumoniae,,bacteria,124107.21969295476,0.7071076800212964,0.7071068316038678,186607.14285714287,209,2,198,99.6995,149.402,89.5641,93303.6,131951.0,52.0,73.5391,0.7071076800212964,61607.142857142855,69,2,198,97.8565,46.3623,16.9101,30803.6,43562.8,17.0,24.0416,\n".freeze }
  let(:fake_output_prefix) { "s3://fake-output-prefix" }
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      start_date: Time.zone.now,
      state_machine_arn: fake_sfn_execution_arn,
      status: "FAKE_EXECUTION_STATUS",
    }
  end
  let(:fake_wdl_version) { "999".freeze }
  let(:fake_dag_version) { "9.999".freeze }

  before do
    Aws.config[:states] = {
      stub_responses: {
        describe_execution: fake_sfn_execution_description,
        list_tags_for_resource: {
          tags: [
            { key: "wdl_version", value: fake_wdl_version },
            { key: "dag_version", value: fake_dag_version },
          ],
        },
      },
    }
  end

  context "converted report test for species taxid 573" do
    before do
      ResqueSpec.reset!

      # This sample has reads in NT and NR for species taxid 573,
      # which belongs to genus 570. It's compared to a background
      # that also has reads in NT and NR for species taxid 573.
      # This test checks that the report service calculates the
      # expected values for aggregate score and z-score when taxons
      # have NT and NR reads in both the sample and the background model.
      @pipeline_run = create(:pipeline_run,
                             sample: create(:sample, project: create(:project)),
                             sfn_execution_arn: fake_sfn_execution_arn,
                             job_status: "CHECKED",
                             finalized: 1,
                             total_reads: 1122,
                             adjusted_remaining_reads: 316,
                             subsample: 1_000_000,
                             taxon_counts_data: [{
                               tax_id: 573,
                               tax_level: 1,
                               taxon_name: "Klebsiella pneumoniae",
                               nt: 209,
                               percent_identity: 99.6995,
                               alignment_length: 149.402,
                               e_value: -89.5641,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 573,
                               tax_level: 1,
                               taxon_name: "Klebsiella pneumoniae",
                               nr: 69,
                               percent_identity: 97.8565,
                               alignment_length: 46.3623,
                               e_value: -16.9101,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 570,
                               tax_level: 2,
                               nt: 217,
                               taxon_name: "Klebsiella",
                               percent_identity: 99.7014,
                               alignment_length: 149.424,
                               e_value: -89.5822,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 570,
                               tax_level: 2,
                               nr: 87,
                               taxon_name: "Klebsiella",
                               percent_identity: 97.9598,
                               alignment_length: 46.4253,
                               e_value: -16.9874,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             },],
                             contigs_data: [{
                               species_taxid_nt: 573,
                               species_taxid_nr: 573,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 573,
                               species_taxid_nr: 573,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 570,
                               species_taxid_nr: 570,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 570,
                               species_taxid_nr: 570,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             },])
      @background = create(:background,
                           pipeline_run_ids: [
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                           ],
                           taxon_summaries_data: [{
                             tax_id: 573,
                             count_type: "NR",
                             tax_level: 1,
                             mean: 29.9171,
                             stdev: 236.332,
                           }, {
                             tax_id: 573,
                             count_type: "NT",
                             tax_level: 1,
                             mean: 9.35068,
                             stdev: 26.4471,
                           }, {
                             tax_id: 570,
                             count_type: "NR",
                             tax_level: 2,
                             mean: 35.0207,
                             stdev: 238.639,
                           }, {
                             tax_id: 570,
                             count_type: "NT",
                             tax_level: 2,
                             mean: 18.3311,
                             stdev: 64.2056,
                           },])

      @report = PipelineReportService.call(@pipeline_run, @background.id)
    end

    it "should get correct values for species 573" do
      species_result = {
        "genus_tax_id" => 570,
        "name" => "Klebsiella pneumoniae",
        "nt" => {
          "count" => 209,
          "rpm" => 186_274.50980392157, # previously rounded to 186_274.509
          "z_score" => 99.0,
        },
        "nr" => {
          "count" => 69,
          "rpm" => 61_497.326203208555, # previously rounded to 61_497.326
          "z_score" => 99.0,
        },
        "agg_score" => 2_428_411_764.7058825, # previously rounded to 2_428_411_754.8
      }

      expect(JSON.parse(@report)["counts"]["1"]["573"]).to include_json(species_result)
    end

    it "should get correct values for genus 570" do
      genus_result = {
        "genus_tax_id" => 570,
        "nt" => {
          "count" => 217.0,
          "rpm" => 193_404.63458110517, # previously rounded to 193_404.634
          "z_score" => 99.0,
          "e_value" => 89.5822,
        },
        "nr" => {
          "count" => 87.0,
          "rpm" => 77_540.10695187165, # previously rounded to 77_540.106
          "z_score" => 99.0,
          "e_value" => 16.9874,
        },
        "agg_score" => 2_428_411_764.7058825, # previously rounded to  2_428_411_754.8
      }

      expect(JSON.parse(@report)["counts"]["2"]["570"]).to include_json(genus_result)
    end

    it "should show correct values in CSV in consistent order" do
      csv_report = PipelineReportService.call(@pipeline_run, @background.id, csv: true)
      expect(csv_report).to eq(csv_output_standard_background)
    end
  end

  context "converted report test for species taxid 573 with mass normalized background model" do
    before do
      ResqueSpec.reset!

      # This sample has reads in NT and NR for species taxid 573,
      # which belongs to genus 570. It's compared to a background
      # that also has reads in NT and NR for species taxid 573.
      # This test checks that the report service calculates the
      # expected values for aggregate score and z-score when taxons
      # have NT and NR reads in both the sample and the background model.
      @pipeline_run = create(:pipeline_run,
                             sample: create(:sample, project: create(:project)),
                             sfn_execution_arn: fake_sfn_execution_arn,
                             job_status: "CHECKED",
                             finalized: 1,
                             total_reads: 1122,
                             total_ercc_reads: 2,
                             adjusted_remaining_reads: 316,
                             subsample: 1_000_000,
                             taxon_counts_data: [{
                               tax_id: 573,
                               tax_level: 1,
                               taxon_name: "Klebsiella pneumoniae",
                               nt: 209,
                               percent_identity: 99.6995,
                               alignment_length: 149.402,
                               e_value: -89.5641,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 573,
                               tax_level: 1,
                               taxon_name: "Klebsiella pneumoniae",
                               nr: 69,
                               percent_identity: 97.8565,
                               alignment_length: 46.3623,
                               e_value: -16.9101,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 570,
                               tax_level: 2,
                               nt: 217,
                               taxon_name: "Klebsiella",
                               percent_identity: 99.7014,
                               alignment_length: 149.424,
                               e_value: -89.5822,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 570,
                               tax_level: 2,
                               nr: 87,
                               taxon_name: "Klebsiella",
                               percent_identity: 97.9598,
                               alignment_length: 46.4253,
                               e_value: -16.9874,
                               genus_taxid: 570,
                               superkingdom_taxid: 2,
                             },],
                             contigs_data: [{
                               species_taxid_nt: 573,
                               species_taxid_nr: 573,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 573,
                               species_taxid_nr: 573,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 570,
                               species_taxid_nr: 570,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             }, {
                               species_taxid_nt: 570,
                               species_taxid_nr: 570,
                               genus_taxid_nt: 570,
                               genus_taxid_nr: 570,
                               read_count: 99,
                             },])
      @background = create(:background,
                           pipeline_run_ids: [
                             create(:pipeline_run,
                                    total_ercc_reads: 2,
                                    sample: create(:sample, project: create(:project))).id,
                             @pipeline_run.id,
                           ],
                           mass_normalized: true)
      @background.store_summary
      @report = PipelineReportService.call(@pipeline_run, @background.id)
    end

    it "should get correct values for species 573" do
      species_result = {
        "genus_tax_id" => 570,
        "name" => "Klebsiella pneumoniae",
        "nt" => {
          "count" => 209,
          "rpm" => 186_607.14285714287,
          "z_score" => 0.7071068316038678,
        },
        "nr" => {
          "count" => 69,
          "rpm" => 61_607.142857142855,
          "z_score" => 0.7071076800212964,
        },
        "agg_score" => 124_107.21969295476,
      }

      expect(JSON.parse(@report)["counts"]["1"]["573"]).to include_json(species_result)
    end

    it "should get correct values for genus 570" do
      genus_result = {
        "genus_tax_id" => 570,
        "nt" => {
          "count" => 217.0,
          "rpm" => 193_750.0,
          "z_score" => 0.7071070808917406,
          "e_value" => 89.5822,
        },
        "nr" => {
          "count" => 87.0,
          "rpm" => 77_678.57142857143,
          "z_score" => 0.7071065856289631,
          "e_value" => 16.9874,
        },
        "agg_score" => 124_107.21969295476,
      }

      expect(JSON.parse(@report)["counts"]["2"]["570"]).to include_json(genus_result)
    end

    it "should show correct values in CSV in consistent order" do
      csv_report = PipelineReportService.call(@pipeline_run, @background.id, csv: true)
      expect(csv_report).to eq(csv_output_mass_normalized_background)
    end
  end

  context "converted report test for species taxid 1313" do
    before do
      ResqueSpec.reset!

      # This sample only has NR reads for species taxid 1313, and
      # only NT reads for species taxid 28037, both of which belong to
      # genus 1301. It's compared to a background with both NT and NR reads
      # for both 1313 and 28037.
      # This test checks that the report service returns -100 for z-score
      # when reads are present in the background but absent from the sample.
      # This test also checks that the genus aggregate score is taken from
      # the highest aggregate score of all the species within the genus.
      @pipeline_run = create(:pipeline_run,
                             sample: create(:sample, project: create(:project)),
                             sfn_execution_arn: fake_sfn_execution_arn,
                             job_status: "CHECKED",
                             finalized: 1,
                             total_reads: 1122,
                             adjusted_remaining_reads: 316,
                             subsample: 1_000_000,
                             taxon_counts_data: [{
                               tax_id: 1313,
                               tax_level: 1,
                               taxon_name: "Streptococcus pneumoniae",
                               nr: 2,
                               percent_identity: 96.9,
                               alignment_length: 32.0,
                               e_value: -9.3,
                               genus_taxid: 1301,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 1301,
                               tax_level: 2,
                               nr: 2,
                               taxon_name: "Streptococcus",
                               percent_identity: 96.9,
                               alignment_length: 32.0,
                               e_value: -9.3,
                               genus_taxid: 1301,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 1301,
                               tax_level: 2,
                               nt: 4,
                               taxon_name: "Streptococcus",
                               percent_identity: 95.65,
                               alignment_length: 149.75,
                               e_value: -81.478,
                               genus_taxid: 1301,
                               superkingdom_taxid: 2,
                             }, {
                               tax_id: 28_037,
                               tax_level: 1,
                               nt: 4,
                               taxon_name: "Streptococcus mitis",
                               percent_identity: 95.65,
                               alignment_length: 149.75,
                               e_value: -81.478,
                               genus_taxid: 1301,
                               superkingdom_taxid: 2,
                             },])

      @background = create(:background,
                           pipeline_run_ids: [
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                           ],
                           taxon_summaries_data: [{
                             tax_id: 1313,
                             count_type: "NR",
                             tax_level: 1,
                             mean: 81.3845,
                             stdev: 404.076,
                           }, {
                             tax_id: 1313,
                             count_type: "NT",
                             tax_level: 1,
                             mean: 81.6257,
                             stdev: 442.207,
                           }, {
                             tax_id: 1301,
                             count_type: "NR",
                             tax_level: 2,
                             mean: 201.318,
                             stdev: 942.975,
                           }, {
                             tax_id: 1301,
                             count_type: "NT",
                             tax_level: 2,
                             mean: 290.481,
                             stdev: 1482.97,
                           }, {
                             tax_id: 28_037,
                             count_type: "NR",
                             tax_level: 1,
                             mean: 25.6849,
                             stdev: 139.526,
                           }, {
                             tax_id: 28_037,
                             count_type: "NT",
                             tax_level: 1,
                             mean: 65.9058,
                             stdev: 374.243,
                           },])

      @report = PipelineReportService.call(@pipeline_run, @background.id)
    end

    it "should get correct values for species 1313" do
      # Since the sample only has NR reads for this species, but the background
      # also has NT reads, we expect NT to have a z-score of -100.
      species_result = {
        "genus_tax_id" => 1301,
        "name" => "Streptococcus pneumoniae",
        "nt" => {
          "count" => 0,
          "rpm" => 0,
          "z_score" => -100,
          "e_value" => 0,
        },
        "nr" => {
          "count" => 2.0,
          "rpm" => 1782.5311942959001, # previously rounded to 1782.531
          "z_score" => 4.209967170274651, # previously rounded to 4.2099668
          "e_value" => 9.3,
        },
        "agg_score" => 12_583.634591815486 # previously rounded to 12_583.63
      }

      expect(JSON.parse(@report)["counts"]["1"]["1313"]).to include_json(species_result)
    end

    it "should get correct values for species 28037" do
      # Since the sample only has NT reads for this species, but the background
      # also has NR reads, we expect NR to have a z-score of -100.
      species_result = {
        "genus_tax_id" => 1301,
        "name" => "Streptococcus mitis",
        "nr" => {
          "count" => 0,
          "rpm" => 0,
          "z_score" => -100,
          "e_value" => 0,
        },
        "agg_score" => 73_603.80226971892,
      }

      expect(JSON.parse(@report)["counts"]["1"]["28037"]).to include_json(species_result)
    end

    it "should get correct values for genus 1301" do
      # We expect the aggregate score for genus 1301 to equal that of
      # species 28037, since it is the higher than the aggregate score of species 1313.
      genus_result = {
        "genus_tax_id" => 1301,
        "nt" => {
          "count" => 4.0,
          "rpm" => 3565.0623885918003, # previously rounded to 3565.062
          "z_score" => 2.208123824886411, # previously rounded to 2.2081236
          "e_value" => 81.478,
        },
        "nr" => {
          "count" => 2.0,
          "rpm" => 1782.5311942959001, # previously rounded to 1782.531
          "z_score" => 1.6768346926439197, # previously rounded to 1.6768345
          "e_value" => 9.3,
        },
        "agg_score" => 73_603.80226971892 # previously rounded to 73_603.777
      }

      expect(JSON.parse(@report)["counts"]["2"]["1301"]).to include_json(genus_result)
    end
  end

  context "taxon missing from background" do
    before do
      ResqueSpec.reset!

      @pipeline_run = create(:pipeline_run,
                             sample: create(:sample, project: create(:project)),
                             sfn_execution_arn: fake_sfn_execution_arn,
                             job_status: "CHECKED",
                             finalized: 1,
                             total_reads: 1125,
                             adjusted_remaining_reads: 315,
                             subsample: 1_000_000,
                             taxon_counts_data: [{
                               tax_id: 1,
                               tax_level: 1,
                               taxon_name: "species",
                               nt: 200,
                               e_value: -90,
                               genus_taxid: 2,
                             }, {
                               tax_id: 2,
                               tax_level: 2,
                               taxon_name: "genus",
                               nt: 220,
                               e_value: -90,
                               genus_taxid: 2,
                             },])

      @background = create(:background,
                           pipeline_run_ids: [
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                           ])

      @report = PipelineReportService.call(@pipeline_run, @background.id)
    end

    it "should return correct z-score values" do
      # Since NT is present in the sample but missing from the background, expect a z-score of 100.
      expected = {
        "nt" => {
          "z_score" => 100,
        },
      }
      expect(JSON.parse(@report)["counts"]["1"]["1"]).to include_json(expected)

      # Since NR is missing from both the sample and the background model, it won't be returned
      # in the report service. The frontend should fill in the NR row with default 0 values.
      expect(JSON.parse(@report)["counts"]["1"]["1"]).not_to include("nr")
    end
  end

  describe "sample contains pathogenic taxa" do
    before do
      ResqueSpec.reset!

      @pipeline_run = create(:pipeline_run,
                             sample: create(:sample, project: create(:project)),
                             sfn_execution_arn: fake_sfn_execution_arn,
                             finalized: 1,
                             total_reads: 100,
                             adjusted_remaining_reads: 100,
                             taxon_counts_data: [{
                               tax_id: 1,
                               tax_level: 2,
                               taxon_name: "Escherichia", # nonpathogenic genus
                               e_value: 0,
                               genus_taxid: 1,
                             }, {
                               tax_id: 2,
                               tax_level: 1,
                               taxon_name: "Escherichia albertii", # nonpathogenic species
                               e_value: 0,
                               genus_taxid: 1,
                             }, {
                               tax_id: 3,
                               tax_level: 1,
                               taxon_name: "Escherichia coli", # pathogenic species
                               e_value: 0,
                               genus_taxid: 1,
                             }, {
                               tax_id: 4,
                               tax_level: 2,
                               taxon_name: "Salmonella", # pathogenic genus
                               e_value: 0,
                               genus_taxid: 4,
                             }, {
                               tax_id: 5,
                               tax_level: 1,
                               taxon_name: "Salmonella enterica", # species belonging to pathogenic genus
                               e_value: 0,
                               genus_taxid: 4,
                             },])

      @background = create(:background,
                           pipeline_run_ids: [
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                             create(:pipeline_run,
                                    sample: create(:sample, project: create(:project))).id,
                           ])
      @report = PipelineReportService.call(@pipeline_run, @background.id)
    end

    it "should not tag nonpathogenic genera" do
      expect(JSON.parse(@report)["counts"]["2"]["1"]).not_to include("pathogenTag")
    end

    it "should tag pathogenic genera" do
      expect(JSON.parse(@report)["counts"]["2"]["4"]).to include_json("pathogenTag" => "categoryB")
    end

    it "should not tag nonpathogenic species" do
      expect(JSON.parse(@report)["counts"]["1"]["2"]).not_to include("pathogenTag")
    end

    it "should tag pathogenic species" do
      expect(JSON.parse(@report)["counts"]["1"]["3"]).to include_json("pathogenTag" => "categoryB")
    end

    it "should tag species belonging to a pathogenic genus" do
      expect(JSON.parse(@report)["counts"]["1"]["5"]).to include_json("pathogenTag" => "categoryB")
    end
  end
end
