require 'rails_helper'
require 'json'

RSpec.describe PipelineReportService, type: :service do
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
end
