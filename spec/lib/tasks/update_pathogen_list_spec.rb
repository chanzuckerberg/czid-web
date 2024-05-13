require 'rails_helper'

describe "update_pathogen_list" do
  subject { Rake::Task["update_pathogen_list"].invoke() }
  let(:create_version_stdin) { "yes" }
  let(:deny_version_stdin) { "no" }
  let(:deny_dryrun_stdin) { "no" }
  let(:accept_dryrun_stdin) { "yes" }
  let(:deny_nondryrun_confirm_stdin) { "no" }
  let(:accept_nondryrun_stdin) { "yes" }
  let(:overwrite_stdin) { "yes" }
  let(:no_overwrite_stdin) { "no" }
  let(:verify_mismatched_names) { "yes" }
  let(:deny_mismatched_names) { "no" }
  let(:accept_citation_create) { "yes" }
  let(:deny_citation_create) { "no" }

  after(:each) do
    Rake::Task["update_pathogen_list"].reenable
  end

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
    }

    @global_list = create(:pathogen_list, creator_id: nil, is_global: true)
    test_pathogen_csv = CSV.generate do |csv|
      csv << ["Species", "taxID"]
      csv << ["species_a", "1"]
    end
    pathogens = CSV.parse(test_pathogen_csv, headers: true).map(&:to_h)

    test_citation_csv = CSV.generate do |csv|
      csv << ["Source", "Footnote"]
      csv << ["test_source", "test_footnote"]
    end
    citations = CSV.parse(test_citation_csv, headers: true).map(&:to_h)

    @version = "0.1.0"

    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
    allow(PathogenList).to receive(:parse_input_file_csv).with(anything, anything, array_including(["Species", "taxID"])).and_return(pathogens)
    allow(PathogenList).to receive(:parse_input_file_csv).with(anything, anything, array_including(["Source", "Footnote"])).and_return(citations)
  end

  context "uploading a new list version" do
    it "should generate the correct input/output and version if the taxon does not exist" do
      allow(STDIN).to receive(:gets).and_return(@version, deny_dryrun_stdin, accept_nondryrun_stdin, accept_citation_create, create_version_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_NON_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_VERSION_CREATION % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::TAXON_NOT_FOUND_TEMPLATE, "species_a", "1"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::CITATION_NOT_FOUND, "test_source"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::PROMPT_CITATION_CREATE, "test_footnote"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "0", "1"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::NOT_FOUND_PATHOGENS_TEMPLATE, "1", '["1"]'))

      subject

      list_version = PathogenListVersion.find_by(pathogen_list: @global_list)
      expect(list_version.pathogen_list_id).to eq(@global_list.id)
      expect(list_version.pathogens.count).to eq(0)
    end

    it "should generate the correct input/output and version if the taxon exists" do
      taxon = create(:taxon_lineage, species_name: "species_a", taxid: 1, species_taxid: 1)
      allow(TaxonLineage).to receive(:where).with({ taxid: "1" }).and_return([taxon])
      allow(taxon).to receive(:name).and_return("species_a")

      allow(STDIN).to receive(:gets).and_return(@version, deny_dryrun_stdin, accept_nondryrun_stdin, accept_citation_create, create_version_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_NON_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_VERSION_CREATION % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::CITATION_NOT_FOUND, "test_source"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::PROMPT_CITATION_CREATE, "test_footnote"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "1", "1"))

      subject

      list_version = PathogenListVersion.find_by(pathogen_list: @global_list)
      expect(list_version.pathogen_list_id).to eq(@global_list.id)
      expect(list_version.pathogens.count).to eq(1)
      expect(list_version.citations.count).to eq(1)
    end
  end

  context "doing a dry run" do
    before do
      # Redirect stdout from running rake task for this task to a var (otherwise it's
      # very difficult to test for end of output because middle has lots of boilerplate).
      @capture_stdout = StringIO.new
      $stdout = @capture_stdout
    end

    it "should generate the correct dry-run input/output and version if the taxon does not exist" do
      allow(STDIN).to receive(:gets).and_return(@version, accept_dryrun_stdin)
      subject
      @capture_stdout.rewind # StringIO objects are treated like tape
      stdout_lines_for_run = @capture_stdout.read.split("\n")
      # Verify top matter of run matches expectation before going to pathogen misses CSV.
      expect(stdout_lines_for_run[0]).to eq(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(stdout_lines_for_run[1]).to eq(PathogenListHelper::PROMPT_FOR_DRY_RUN)
      expect(stdout_lines_for_run[2]).to eq("Resolving taxids from file: pathogen-list/global_pathogen_list_#{@version}.csv")
      # Pathogen misses CSV is very bottom of output, so check final two lines for that.
      expect(stdout_lines_for_run[-2]).to eq("csv_name,lineage_name,csv_taxid,lineage_species_taxid,appears_in_latest_lineage_version")
      expect(stdout_lines_for_run[-1]).to eq("species_a,NOT_FOUND,1,NOT_FOUND,false")
    end

    after do
      # Return stdout back to original, system STDOUT at end of test.
      $stdout = STDOUT # return to normal stdout interaction
    end
  end

  context "updating an existing list version" do
    before do
      taxon_a = create(:taxon_lineage, species_name: "species_a", taxid: 1, species_taxid: 1)
      allow(TaxonLineage).to receive(:where).with({ taxid: "1" }).and_return([taxon_a])
      allow(taxon_a).to receive(:name).and_return("species_a")

      @pathogen_a = create(:pathogen, tax_id: 1)
      @pathogen_b = create(:pathogen, tax_id: 2)

      @list_version = create(:pathogen_list_version, version: @version, pathogen_list_id: @global_list.id)
      @list_version.pathogens << @pathogen_b
    end

    it "should raise an error if overwrite permission denied" do
      allow(STDIN).to receive(:gets).and_return(@version, deny_dryrun_stdin, accept_nondryrun_stdin, no_overwrite_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_NON_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_LIST_VERSION_OVERWRITE % @version)

      expect do
        subject
      end.to raise_error(RuntimeError)

      expect(@list_version.pathogens.count).to eq(1)
      expect(@list_version.pathogens.first).to eq(@pathogen_b)
    end

    it "should overwrite the version if overwrite permission confirmed" do
      allow(STDIN).to receive(:gets).and_return(@version, deny_dryrun_stdin, accept_nondryrun_stdin, overwrite_stdin)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::PROMPT_FOR_NON_DRY_RUN)
      expect(STDOUT).to receive(:puts).with(PathogenListHelper::CONFIRM_LIST_VERSION_OVERWRITE % @version)
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::CITATION_NOT_FOUND, "test_source"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::PROMPT_CITATION_CREATE, "test_footnote"))
      expect(STDOUT).to receive(:puts).with(format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, "0.1.0", "1", "1"))

      subject

      expect(@list_version.pathogens.count).to eq(1)
      expect(@list_version.pathogens.first).to eq(@pathogen_a)
    end
  end
end
