require "rails_helper"

RSpec.describe StringUtil do
  describe "#human_readable_file_size" do
    it "performs correctly in the basic case" do
      expect(StringUtil.human_readable_file_size(12_345)).to eq("12.1 KB")
    end

    it "allows customizable decimal places" do
      expect(StringUtil.human_readable_file_size(12_345, decimal_places: 3)).to eq("12.056 KB")
    end

    it "handles big numbers well" do
      expect(StringUtil.human_readable_file_size(1_024**5 * 100)).to eq("102400 TB")
    end
  end
end
