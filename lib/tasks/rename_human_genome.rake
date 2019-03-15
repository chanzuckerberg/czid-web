task rename_human_genome: :environment do
  def old_new(path_column, host_genome)
    prefix = host_genome.name.downcase.gsub(/\W/, '-')
    old_path = host_genome[path_column]
    new_path = "#{File.dirname(old_path)}/#{prefix}_#{File.basename(old_path)}"
    return [old_path, new_path]
  end

  commands = []
  HostGenome.all.each do |host_genome|
    ["s3_star_index_path", "s3_bowtie2_index_path"].each do |path_column|
      old_path, new_path = old_new(path_column, host_genome)
      commands << "aws s3 cp #{old_path} #{new_path}"
      host_genome.update(path_column.to_sym => new_path)
    end
  end
  puts "Please run the following commands to complete the migration: #{commands}"
end
