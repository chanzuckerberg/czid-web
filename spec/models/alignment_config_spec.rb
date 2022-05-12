require 'rails_helper'

RSpec.describe AlignmentConfig, type: :model do
  context "#max_lineage_version" do
    let(:taxid) { 100 }
    before do
      @alignment_config_one = create(:alignment_config, lineage_version: 2)
      @alignment_config_two = create(:alignment_config, lineage_version: 2)
      @alignment_config_three = create(:alignment_config, lineage_version: 3)
    end

    it "returns the correct lineage_version" do
      max_lineage_version = AlignmentConfig.max_lineage_version([@alignment_config_one.id, @alignment_config_two.id, @alignment_config_three.id])
      expect(max_lineage_version).to eq(3)
    end
  end
end
