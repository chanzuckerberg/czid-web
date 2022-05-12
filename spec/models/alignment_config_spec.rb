require 'rails_helper'

RSpec.describe AlignmentConfig, type: :model do
  context "#max_lineage_version" do
    let(:taxid) { 100 }
    before do
      @alignment_config_one = create(:alignment_config, lineage_version: "2022-01-02")
      @alignment_config_two = create(:alignment_config, lineage_version: "2022-01-02")
      @alignment_config_three = create(:alignment_config, lineage_version: "2022-01-03")
    end

    it "returns the correct lineage_version" do
      max_lineage_version = AlignmentConfig.max_lineage_version([@alignment_config_one.id, @alignment_config_two.id, @alignment_config_three.id])
      expect(max_lineage_version).to eq("2022-01-03")
    end
  end
end
