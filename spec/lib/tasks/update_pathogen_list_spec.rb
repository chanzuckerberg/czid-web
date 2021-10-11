require 'rails_helper'

describe "update_pathogen_list" do
  subject { Rake::Task["update_pathogen_list"].invoke() }
  let(:create_version_stdin) { "yes" }
  let(:deny_version_stdin) { "no" }
  let(:overwrite_stdin) { "yes" }
  let(:no_overwrite_stdin) { "no" }
  let(:verify_mismatched_names) { "yes" }
  let(:deny_mismatched_names) { "no" }

  after(:each) do
    Rake::Task["update_pathogen_list"].reenable
  end

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
    }

    @global_list = create(:pathogen_list, creator_id: nil, is_global: true)
    test_csv = CSV.generate do |csv|
      csv << ["Species", "taxID", "Category", "Source", "Footnote"]
      csv << ["species_a", "1", "test_category", "test_source", "test_footnote"]
    end
    pathogens = CSV.parse(test_csv, headers: true).map(&:to_h)

    @version = "0.1.0"

    @citation = create(:citation, key: "test_source", footnote: "test_footnote")

    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
    allow(PathogenList).to receive(:parse_pathogen_list_csv).and_return(pathogens)
  end

  context "uploading a new list version" do
    it "should generate the correct input/output and version if the taxon does not exist" do
      allow(STDIN).to receive(:gets).and_return(@version, create_version_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_VERSION_CREATION % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::TAXON_NOT_FOUND_TEMPLATE, "species_a", "1"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "0"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UNLISTED_PATHOGENS_TEMPLATE, "1", '["1"]'))

      subject

      list_version = PathogenListVersion.find_by(pathogen_list: @global_list)
      expect(list_version.pathogen_list_id).to eq(@global_list.id)
      expect(list_version.pathogens.count).to eq(0)
    end

    it "should generate the correct input/output and version if the taxon exists" do
      taxon = create(:taxon_lineage, species_name: "species_a", taxid: 1, species_taxid: 1)
      allow(TaxonLineage).to receive(:where).with({ taxid: "1", species_taxid: "1" }).and_return([taxon])
      allow(taxon).to receive(:name).and_return("species_a")

      allow(STDIN).to receive(:gets).and_return(@version, create_version_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_VERSION_CREATION % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "1"))

      subject

      list_version = PathogenListVersion.find_by(pathogen_list: @global_list)
      expect(list_version.pathogen_list_id).to eq(@global_list.id)
      expect(list_version.pathogens.count).to eq(1)
      expect(list_version.pathogens.first.citation_id).to eq(@citation.id)
    end

    it "should generate the correct input/output and version when if taxon exists (mismatched name verified)" do
      taxon = create(:taxon_lineage, species_name: "species a", taxid: 1, species_taxid: 1)
      allow(TaxonLineage).to receive(:where).with({ taxid: "1", species_taxid: "1" }).and_return([taxon])

      allow(STDIN).to receive(:gets).and_return(@version, create_version_stdin, verify_mismatched_names)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_VERSION_CREATION % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::MISMATCHED_PATHOGEN_NAMES_TEMPLATE, "species_a", "species a"))
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_TAXON_NAME_TEMPLATE % "species a")
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "1"))

      subject

      list_version = PathogenListVersion.find_by(pathogen_list: @global_list)
      expect(list_version.pathogen_list_id).to eq(@global_list.id)
      expect(list_version.pathogens.count).to eq(1)
      expect(list_version.pathogens.first.citation_id).to eq(@citation.id)
    end

    it "should generate the correct input/output and version if the taxon exists (mismatched name denied)" do
      taxon = create(:taxon_lineage, species_name: "species a", taxid: 1, species_taxid: 1)
      allow(TaxonLineage).to receive(:where).with({ taxid: "1", species_taxid: "1" }).and_return([taxon])

      allow(STDIN).to receive(:gets).and_return(@version, create_version_stdin, deny_mismatched_names)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_VERSION_CREATION % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::MISMATCHED_PATHOGEN_NAMES_TEMPLATE, "species_a", "species a"))
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_TAXON_NAME_TEMPLATE % "species a")
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "0"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UNLISTED_PATHOGENS_TEMPLATE, "1", '["1"]'))

      subject

      list_version = PathogenListVersion.find_by(pathogen_list: @global_list)
      expect(list_version.pathogen_list_id).to eq(@global_list.id)
      expect(list_version.pathogens.count).to eq(0)
    end
  end

  context "updating an existing list version" do
    before do
      taxon_a = create(:taxon_lineage, species_name: "species_a", taxid: 1, species_taxid: 1)
      allow(TaxonLineage).to receive(:where).with({ taxid: "1", species_taxid: "1" }).and_return([taxon_a])
      allow(taxon_a).to receive(:name).and_return("species_a")

      @pathogen_a = create(:pathogen, tax_id: 1)
      @pathogen_b = create(:pathogen, tax_id: 2)

      @list_version = create(:pathogen_list_version, version: @version, pathogen_list_id: @global_list.id)
      @list_version.pathogens << @pathogen_b
    end

    it "should raise an error if overwrite permission denied" do
      allow(STDIN).to receive(:gets).and_return(@version, no_overwrite_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_LIST_VERSION_OVERWRITE % @version)

      expect do
        subject
      end.to raise_error(RuntimeError)

      expect(@list_version.pathogens.count).to eq(1)
      expect(@list_version.pathogens.first).to eq(@pathogen_b)
    end

    it "should overwrite the version if overwrite permission confirmed" do
      allow(STDIN).to receive(:gets).and_return(@version, overwrite_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_LIST_VERSION_OVERWRITE % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "1"))

      subject

      expect(@list_version.pathogens.count).to eq(1)
      expect(@list_version.pathogens.first).to eq(@pathogen_a)
    end
  end
end
