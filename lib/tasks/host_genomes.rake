task create_host_genomes: :environment do
  unless HostGenome.find_by(name: HostGenome::NO_HOST_NAME)
    HostGenome.create!(name: HostGenome::NO_HOST_NAME)
  end
  unless HostGenome.find_by(name: 'Human')
    HostGenome.create!(name: 'Human',
                       s3_star_index_path: 's3://czbiohub-infectious-disease/references/human/STAR_genome.tar.gz',
                       s3_bowtie2_index_path: 's3://czbiohub-infectious-disease/references/human/bowtie2_genome.tar.gz')
  end
  unless HostGenome.find_by(name: 'Mosquito')
    HostGenome.create!(name: 'Mosquito', skip_deutero_filter: 1,
                       s3_star_index_path: 's3://czbiohub-infectious-disease/references/mosquitos/STAR_genome.tar.gz',
                       s3_bowtie2_index_path: 's3://czbiohub-infectious-disease/references/mosquitos/bowtie2_genome.tar.gz')
  end
end
