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

  describe "#merge_arrays_uniq" do
    it "merges when both lists are empty" do
      a = []
      b = []
      actual = ArrayUtil.merge_arrays_uniq(a, b)
      expected = []
      expect(actual).to eq(expected)
    end

    it "merges a non-empty array with an empty array" do
      a = []
      b = [4, 5, 6, 7]
      actual = ArrayUtil.merge_arrays_uniq(a, b)
      expected = [4, 5, 6, 7]
      expect(actual).to eq(expected)
    end

    it "merges two non-empty arrays that has no duplicates" do
      a = [1, 2, 3]
      b = [4, 5, 6, 7]
      actual = ArrayUtil.merge_arrays_uniq(a, b)
      expected = [1, 2, 3, 4, 5, 6, 7]
      expect(actual).to eq(expected)
    end

    it "merges two non-empty arrays and removes duplicates" do
      a = [1, 2, 3]
      b = [2, 3, 4, 5]
      actual = ArrayUtil.merge_arrays_uniq(a, b)
      expected = [1, 2, 3, 4, 5]
      expect(actual).to eq(expected)
    end

    it "merging the same arrays returns the same array" do
      a = [1, 2, 3]
      b = [1, 2, 3]
      actual = ArrayUtil.merge_arrays_uniq(a, b)
      expected = [1, 2, 3]
      expect(actual).to eq(expected)
    end

    it "merging the same arrays in different order returns the same array" do
      a = [1, 2, 3]
      b = [2, 3, 1]
      actual = ArrayUtil.merge_arrays_uniq(a, b)
      expected = [1, 2, 3]
      expect(actual).to eq(expected)
    end

    it "merging with arguments of type array does not raise an ArgumentError" do
      a = [1, 2, 3]
      b = [2, 3, 1]
      expect { ArrayUtil.merge_arrays_uniq(a, b) }.to_not raise_error
    end

    it "merging with an argument not of type array raises an ArgumentError" do
      a = [1, 2, 3]
      b = 123
      expect { ArrayUtil.merge_arrays_uniq(a, b) }.to raise_error(ArgumentError)
    end

    it "merging with both arguments not of type array raises an ArgumentError" do
      a = "abc"
      b = 123
      expect { ArrayUtil.merge_arrays_uniq(a, b) }.to raise_error(ArgumentError)
    end
  end
end
