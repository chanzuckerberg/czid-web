require 'test_helper'

class InputFileTest < ActiveSupport::TestCase
  setup do
    @input_file = input_files(:one)
  end

  test "file_path" do
    expected = "samples/#{@input_file.sample.project.id}/#{@input_file.sample.id}/#{@input_file.name}"
    assert_equal expected, @input_file.file_path
  end

  test "validate name presence" do
    file = InputFile.new
    assert_not file.valid?
    assert_equal [:sample, :name], file.errors.keys
  end

  test "validate name format" do
    invalid_names = ['.fastq', 'a .fastq.gz', 'a/b.fastq.gz']
    invalid_names.each do |name|
      file = InputFile.new
      file.name = name
      assert_not file.valid?
      assert_equal [:sample, :name], file.errors.keys
    end
  end
end
