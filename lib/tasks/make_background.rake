task make_background: :environment do
  ### Usage: NAME='my background' SAMPLES='partial_name_1,partial_name_2,...' PROJECT_ID=1 rake make_background
  ### PROJECT_ID is optional. The task will find samples by the partial names and prompt you for validation.
  ### It will then create a background based on the most recent pipeline_run for each sample.

  name = ENV['NAME']
  partial_sample_names = ENV['SAMPLES'].split(",")
  project_id = ENV['PROJECT_ID']

  eligible_pipeline_runs = Background.eligible_pipeline_runs

  query = partial_sample_names.map { |s| "name LIKE '%#{s}%'" }.join(" OR ")
  query = "(#{query}) AND project_id = #{project_id}" if project_id
  samples = Sample.where(query)

  completed_samples = samples.select { |s| eligible_pipeline_runs.map(&:sample_id).include?(s.id) }
  failed_samples = samples - completed_samples

  def display(sample_array)
    sample_array.map { |s| "Name: #{s.name}, id: #{s.id}, project_id: #{s.project_id}" }.join("\n")
  end

  unless failed_samples.empty?
    puts "The following samples did not have completed pipeline_runs and cannot go into the background:\n"
    puts display(failed_samples)
  end
  puts "\nThe following samples will go into the background:\n"
  puts display(completed_samples)
  puts "Is this the correct sample list? (y/n)"
  answer = STDIN.gets.strip

  if answer == 'y'
    pipeline_run_ids = eligible_pipeline_runs.where(sample_id: completed_samples).map(&:id)
    Background.create(name: name, pipeline_run_ids: pipeline_run_ids)
    puts "Background created"
  else
    puts "Ok, aborting"
    return
  end
end
