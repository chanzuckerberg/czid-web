task create_host_genomes: :environment do
  unless HostGenome.find_by(name: HostGenome::NO_HOST_NAME)
    HostGenome.create!(name: HostGenome::NO_HOST_NAME)
  end
  unless HostGenome.find_by(name: 'Human')
    HostGenome.create!(name: 'Human',
                       s3_star_index_path: 's3://human/STAR_genome.tar.gz',
                       s3_bowtie2_index_path: 's3://human/bowtie2_genome.tar.gz')
  end
  unless HostGenome.find_by(name: 'Mosquito')
    HostGenome.create!(name: 'Mosquito', skip_deutero_filter: 1,
                       s3_star_index_path: 's3://mosquitos/STAR_genome.tar.gz',
                       s3_bowtie2_index_path: 's3://mosquitos/bowtie2_genome.tar.gz')
  end
end
