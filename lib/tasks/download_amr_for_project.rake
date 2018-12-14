# Generate a shall script to download SRST2 output from a project to a local destination.
# Example: rake "download_amr_for_project[27, /mnt/test/27]"
task :download_amr_for_project, [:project_id, :output_s3_path] => :environment do |_t, args|
  samples = Sample.where(project_id: args[:project_id])
  s3_output_path = args[:output_s3_path]
  samples.each do |s|
    pr = s.pipeline_runs.first
    if pr
      dest_dir = "#{s3_output_path}/#{s.name.tr(' ', '-')}-SRST2"
      puts "mkdir -p #{dest_dir}; aws s3 cp #{pr.expt_output_s3_path}/ #{dest_dir}/ --recursive"
    end
  end
end
