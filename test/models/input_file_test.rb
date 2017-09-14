require 'test_helper'

class InputFileTest < ActiveSupport::TestCase
  setup do
    @input_file = input_files(:one)
  end

  test "file_path" do
    expected = "samples/#{@input_file.sample.project.id}/#{@input_file.sample.id}/#{@input_file.name}"
    assert_equal expected, @input_file.file_path
  end
end
