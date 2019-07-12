task :find_missing_children, :environment do
  def pipeline_runs_missing_children
    assocs = PipelineRun.reflect_on_all_associations(:has_many)
    PipelineRun.all[0..LIMIT].map do |pr|
      assocs_data = assocs.map { |assoc| [pr.id, assoc.name, pr.send(assoc.name).pluck(:id)] }
      assocs_data.select { |data| data.last.empty? }
    end
  end

  def pipeline_runs_missing_parents
    assocs = PipelineRun.reflect_on_all_associations(:belongs_to)
    PipelineRun.all[0..LIMIT].map do |pr|
      assocs_data = assocs.map { |assoc| [pr.id, assoc.name, pr.send(assoc.name)] }
      assocs_data.select { |data| data.last.nil? }
    end
  end

  puts "hello world find_missing_children"
end
