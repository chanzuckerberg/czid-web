require 'rails_helper'

RSpec.describe "taxon_sequence_files/index", type: :view do
  before(:each) do
    assign(:taxon_sequence_files, [
             TaxonSequenceFile.create!(
               pipeline_output: nil,
               taxid: 2
             ),
             TaxonSequenceFile.create!(
               pipeline_output: nil,
               taxid: 2
             )
           ])
  end

  it "renders a list of taxon_sequence_files" do
    render
    assert_select "tr>td", text: nil.to_s, count: 2
    assert_select "tr>td", text: 2.to_s, count: 2
  end
end
