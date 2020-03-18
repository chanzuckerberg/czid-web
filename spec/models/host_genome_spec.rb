require 'rails_helper'

RSpec.describe HostGenome, type: :model do
  it 'new host genomes default to ERCC only' do
    hg = create(:host_genome)
    expect(hg.s3_star_index_path).to include('/ercc/')
  end

  it 'all_without_metadata_field returns all hosts for unknown metadata' do
    expect(HostGenome.all_without_metadata_field('DOESNOTEXIST').count).to eq(HostGenome.all.count)
  end

  it 'all_without_metadata_field returns subset hosts for required metadata' do
    expect(HostGenome.all_without_metadata_field('sample_type').count).to be <= HostGenome.all.count
  end
end
