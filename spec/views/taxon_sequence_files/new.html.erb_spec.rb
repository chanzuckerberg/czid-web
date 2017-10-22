require 'rails_helper'

RSpec.describe "taxon_sequence_files/new", type: :view do
  before(:each) do
    assign(:taxon_sequence_file, TaxonSequenceFile.new(
      :pipeline_output => nil,
      :taxid => 1
    ))
  end

  it "renders new taxon_sequence_file form" do
    render

    assert_select "form[action=?][method=?]", taxon_sequence_files_path, "post" do

      assert_select "input[name=?]", "taxon_sequence_file[pipeline_output_id]"

      assert_select "input[name=?]", "taxon_sequence_file[taxid]"
    end
  end
end
