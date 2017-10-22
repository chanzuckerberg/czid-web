require 'rails_helper'

RSpec.describe "taxon_sequence_files/show", type: :view do
  before(:each) do
    @taxon_sequence_file = assign(:taxon_sequence_file, TaxonSequenceFile.create!(
                                                          pipeline_output: nil,
                                                          taxid: 2
    ))
  end

  it "renders attributes in <p>" do
    render
    expect(rendered).to match(//)
    expect(rendered).to match(/2/)
  end
end
