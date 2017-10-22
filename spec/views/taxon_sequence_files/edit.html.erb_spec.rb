require 'rails_helper'

RSpec.describe "taxon_sequence_files/edit", type: :view do
  before(:each) do
    @taxon_sequence_file = assign(:taxon_sequence_file, TaxonSequenceFile.create!(
                                                          pipeline_output: nil,
                                                          taxid: 1
    ))
  end

  it "renders the edit taxon_sequence_file form" do
    render

    assert_select "form[action=?][method=?]", taxon_sequence_file_path(@taxon_sequence_file), "post" do
      assert_select "input[name=?]", "taxon_sequence_file[pipeline_output_id]"

      assert_select "input[name=?]", "taxon_sequence_file[taxid]"
    end
  end
end
