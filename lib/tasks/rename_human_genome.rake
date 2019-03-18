task rename_human_genome: :environment do
  # Before running this task, you need to copy the human host index to a new name:
  # The base name of the file needs to change from STAR_genome.tar to human_STAR_genome.tar.
  # You also need to change the internal naming inside the archive so that it is human_STAR_genome
  # when extracted, not STAR_genome.
  # UPDATE: This has been done for the human/2018-02-15 host index.
  host_genome = HostGenome.find_by(name: "Human")
  ["s3_star_index_path", "s3_bowtie2_index_path"].each do |path_column|
    old_path = host_genome[path_column]
    new_path = "#{File.dirname(old_path)}/human_#{File.basename(old_path)}"
    host_genome.update(path_column.to_sym => new_path)
  end
end
