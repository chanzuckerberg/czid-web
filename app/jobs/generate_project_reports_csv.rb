class GenerateProjectReportsCsv
  @queue = :q03_pipeline_run
  def self.perform(project, params)

    csv_dir = "/app/tmp/report_csvs/#{project.id}"
    `rm -rf #{csv_dir}; mkdir -p #{csv_dir}`
    sample_names_used = []
    project.samples.each do |sample|
      csv_data = report_csv_from_params(sample, params)
      clean_sample_name = sample.name.downcase.gsub(/\W/, "-")
      used_before = sample_names_used.include? clean_sample_name
      sample_names_used << clean_sample_name
      clean_sample_name += "_#{sample.id}" if used_before
      filename = "#{csv_dir}/#{clean_sample_name}.csv"
      File.write(filename, csv_data)
    end
    tar_filename = "#{project.name.gsub(/\W/, '-')}_reports.tar.gz"
    `cd #{csv_dir}; tar cvzf #{tar_filename} .`
    output_file = "#{csv_dir}/#{tar_filename}"
    `rm #{csv_dir}/*.csv`
    # Return output file path, but first ensure project/sample names
    # were not chosen maliciously to download an arbitrary file:
    absolute_path = File.expand_path(output_file)
    return nil unless absolute_path.start_with?(csv_dir)
    output_file

  end
end
