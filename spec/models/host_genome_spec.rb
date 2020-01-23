require 'rails_helper'

RSpec.describe HostGenome, type: :model do
  it 'new host genomes default to ERCC only' do
    hg = create(:host_genome)
    expect(hg.s3_star_index_path).to include('/ercc/')
  end

  it "should create a new host genome if none is found" do
    expect(false).to eq(true)
  end
end
