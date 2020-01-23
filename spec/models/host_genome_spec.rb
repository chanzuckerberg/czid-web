require 'rails_helper'

RSpec.describe HostGenome, type: :model do
  it 'new host genomes default to ERCC only' do
    hg = create(:host_genome)
    expect(hg.s3_star_index_path).to include('/ercc/')
  end
end
