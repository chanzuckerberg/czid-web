class AddInputsJsonToWorkflowRuns < ActiveRecord::Migration[5.2]
  def up
    add_column :workflow_runs, :inputs_json, :text, comment: "Generic JSON-string field for recording execution inputs."

    WorkflowRun.joins(:sample).where.not(samples: { temp_wetlab_protocol: nil }).each do |wr|
      input = { wetlab_protocol: wr.sample.temp_wetlab_protocol }.to_json
      wr.update(inputs_json: input)
    end
  end

  def down
    remove_column :workflow_runs, :inputs_json
  end
end
