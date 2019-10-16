require "rails_helper"

RSpec.describe ArrayUtil do
  describe "#merge_arrays" do
    it "zips List A and List B of equal length" do
      a = [1, 3, 5]
      b = [2, 4, 6]
      actual = ArrayUtil.merge_arrays(a, b)
      expected = [1, 2, 3, 4, 5, 6]
      expect(actual).to eq(expected)
    end

    it "zips when List A is longer than List B" do
      a = [1, 3, 5, 6]
      b = [2, 4]
      actual = ArrayUtil.merge_arrays(a, b)
      expected = [1, 2, 3, 4, 5, 6]
      expect(actual).to eq(expected)
    end

    it "zips when List B longer than List A" do
      a = [1, 3]
      b = [2, 4, 5, 6]
      actual = ArrayUtil.merge_arrays(a, b)
      expected = [1, 2, 3, 4, 5, 6]
      expect(actual).to eq(expected)
    end

    it "zips when List A is empty" do
      a = []
      b = [1, 2, 3]
      actual = ArrayUtil.merge_arrays(a, b)
      expected = [1, 2, 3]
      expect(actual).to eq(expected)
    end

    it "zips when List B is empty" do
      a = [1, 2, 3]
      b = []
      actual = ArrayUtil.merge_arrays(a, b)
      expected = [1, 2, 3]
      expect(actual).to eq(expected)
    end

    it "zips when both lists are empty" do
      a = []
      b = []
      actual = ArrayUtil.merge_arrays(a, b)
      expected = []
      expect(actual).to eq(expected)
    end
  end
end
