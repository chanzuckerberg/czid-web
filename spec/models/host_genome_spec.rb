require 'rails_helper'

RSpec.describe HostGenome, type: :model do
  it 'new host genomes default to ERCC only' do
    hg = create(:host_genome)
    expect(hg.s3_star_index_path).to include('/ercc/')
  end

  it 'new host genome name titleized' do
    hg = create(:host_genome, name: 'asdf')
    expect(hg.name).to eq('Asdf')
  end
end
