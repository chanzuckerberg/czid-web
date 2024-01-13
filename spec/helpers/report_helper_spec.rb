require "rails_helper"

RSpec.describe ReportHelper, type: :helper do\
  let(:workflow) { "short-read-mngs" }
  let(:taxid) { 11_041 }

  describe "#taxon_counts_cleanup" do
    before do
      @taxon_counts = [
        {
          "count_type" => "NR",
          "stdev" => 0.360932,
          "mean" => 0.0637199,
          "stdev_mass_normalized" => nil,
          "mean_mass_normalized" => nil,
          "rpm" => 60_108.4,
          "zscore" => 99.0,
          "contigs" => 1,
          "r" => 7810.0,
          "percentidentity" => 99.905,
          "logevalue" => -307.653,
          "alignmentlength" => 2116.0,
          "pipeline_run_id" => 29_383,
          "tax_id" => taxid,
          "background_id" => 26,
          "tax_level" => 1,
          "genus_taxid" => 11_040,
          "family_taxid" => 2_560_066,
          "superkingdom_taxid" => 10_239,
          "name" => "Rubella virus",
          "common_name" => "",
          "genus_name" => "Rubivirus",
          "is_phage" => 0,
        },
        {
          "count_type" => "NT",
          "stdev" => 0.360932,
          "mean" => 0.0637199,
          "stdev_mass_normalized" => nil,
          "mean_mass_normalized" => nil,
          "rpm" => 60_108.4,
          "zscore" => 99.0,
          "contigs" => 1,
          "r" => 7810.0,
          "percentidentity" => 99.98,
          "logevalue" => -307.653,
          "alignmentlength" => 9760.0,
          "pipeline_run_id" => 29_383,
          "tax_id" => taxid,
          "background_id" => 26,
          "tax_level" => 1,
          "genus_taxid" => 11_040,
          "family_taxid" => 2_560_066,
          "superkingdom_taxid" => 10_239,
          "name" => "Rubella virus",
          "common_name" => "",
          "genus_name" => "Rubivirus",
          "is_phage" => 0,
        },
      ]
    end

    it "filters out zscore if should_remove_zscore is true" do
      tax_2d = ReportHelper.taxon_counts_cleanup(@taxon_counts, workflow, true)
      nt_zscore = tax_2d[taxid]["NT"]["zscore"]
      expect(nt_zscore).to be_nil
      nr_zscore = tax_2d[taxid]["NR"]["zscore"]
      expect(nr_zscore).to be_nil
    end

    it "includes z-score if should_remove_zscore is unspecified" do
      tax_2d = ReportHelper.taxon_counts_cleanup(@taxon_counts, workflow)
      nt_zscore = tax_2d[taxid]["NT"]["zscore"]
      expect(nt_zscore).to eq(99.0)
      nr_zscore = tax_2d[taxid]["NR"]["zscore"]
      expect(nr_zscore).to eq(99.0)
    end
  end
end
