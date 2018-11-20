# Generate a shall script to download non_host_fasta from a project to an s3 destiitatioin 
# Example: rake "download_non_host_reads_for_project[70, s3://idseq-samples-development/yunfang/70]"
task :download_non_host_reads_for_project, [:project_id, :output_s3_path] => :environment do |_t, args|
    samples = Sample.where(project_id: args[:project_id])
    s3_output_path = args[:output_s3_path]
    samples.each do |s|
        pr = s.pipeline_runs.first
        if pr and pr.pipeline_run_stages[1] and pr.pipeline_run_stages[1].dag_json
            alignment_json = JSON.parse(pr.pipeline_run_stages[1].dag_json)
            host_filter_out = alignment_json["targets"]["host_filter_out"]
            non_host_file = host_filter_out[-1]
            non_host_s3_path = "#{pr.host_filter_output_s3_path}/#{non_host_file}"
            s3_destnation_path="#{s3_output_path}/#{s.name.gsub(' ', '-')}-non_host.fasta"
            puts "aws s3 cp #{non_host_s3_path} #{s3_destnation_path}"
        end
    end
end
