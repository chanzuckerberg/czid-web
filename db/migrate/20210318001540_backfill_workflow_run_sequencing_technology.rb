class BackfillWorkflowRunSequencingTechnology < ActiveRecord::Migration[5.2]
  def change
    WorkflowRun.all.each do |wr|
      inputs_json = wr.inputs
      unless inputs_json["technology"]
        inputs_json["technology"] = ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:illumina]
        wr.update(inputs_json: inputs_json.to_json)
      end
    end
  end
end
