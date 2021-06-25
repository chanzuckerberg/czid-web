task :export_dags, [:sample_id, :print, :step] => :environment do |_, args|
  Rails.logger.level = :warn

  class DAGExporter < PipelineRunStage
    attr_accessor :args

    def upload_dag_json_and_return_job_command(dag_json, *)
      if args.print
        puts dag_json
      else
        File.open("#{dag_name}.json", "w") do |f|
          f.write(dag_json)
        end
        puts "Exported #{dag_name}.json"
      end
    end

    def aegea_batch_submit_command(*)
    end

    def extract_dag
      send(job_command_func)
    end
  end

  if args.sample_id
    Sample.find_by(id: args.sample_id).pipeline_runs.each do |pipeline_run|
      PipelineRunStage::STAGE_INFO.each do |step_number, stage_info|
        if args.step && step_number != args.step.to_i
          next
        end

        puts "Exporting DAG #{step_number} for pipeline run #{pipeline_run.id} (sample #{pipeline_run.sample.id})"
        exporter = DAGExporter.new(
          step_number: step_number,
          name: stage_info[:name],
          job_command_func: stage_info[:job_command_func],
          pipeline_run: pipeline_run
        )
        exporter.args = args
        exporter.extract_dag
      end
    end
  else
    puts 'Usage: rake export_dags[12345] (where 12345 is the sample ID)'
  end
end
