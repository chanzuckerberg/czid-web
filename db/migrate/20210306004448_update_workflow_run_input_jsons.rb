class UpdateWorkflowRunInputJsons < ActiveRecord::Migration[5.2]
  def up
    WorkflowRun.find_each do |wr|
      puts "Processing workflow run: #{wr.id}" # rubocop:disable Rails/Output

      inputs = wr.inputs
      inputs = {} if inputs.nil?

      inputs[:accession_id] = "MN908947.3"
      inputs[:accession_name] = "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome"
      inputs[:taxon_id] = 2_697_049
      inputs[:taxon_name] = "Severe acute respiratory syndrome coronavirus 2"

      wr.update(inputs_json: inputs.to_json)
    end
  end

  def down
    WorkflowRun.find_each do |wr|
      puts "Processing workflow run: #{wr.id}" # rubocop:disable Rails/Output

      inputs = wr.inputs.except(:accession_id, :accession_name, :taxon_id, :taxon_name)
      inputs = {} if inputs.nil?

      wr.update(inputs_json: inputs.to_json)
    end
  end
end
