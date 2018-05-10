task make_background: :environment do
  ### Usage: NAME='my background' SAMPLES='partial_name_1,partial_name_2,...' PROJECT_ID=1 rake make_background
  ### PROJECT_ID is optional. The task will find samples by the partial names and prompt you for validation.
  ### It will then create a background based on the most recent pipeline_run for each sample.

  name = ENV['NAME']
  partial_sample_names = ENV['SAMPLES'].split(",")
  project_id = ENV['PROJECT_ID']

  query = partial_sample_names.map { |s| "name LIKE '%#{s}%'" }.join(" OR ")
  samples = Sample.where(query)
  samples = samples.where(project_id: project_id) if project_id

  sample_display = samples.map {|s| "Name: #{s.name}, id: #{s.id}, project_id: #{s.project_id}"}.join("\n")
  puts sample_display
  puts "Is this the correct sample list? (y/n)"
  answer = STDIN.gets.strip
  unless answer == 'y'
    puts "Aborting"
    return

  pipeline_run_ids = PipelineRun.top_completed_runs.where(sample_id: samples.map(&:id)).map(&:id)
  Background.create(name: name, pipeline_run_ids: pipeline_run_ids)
  puts "Background created"
