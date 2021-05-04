class BackfillWetlabProtocolForNanoporeConsensusGenomeWorkflowRuns < ActiveRecord::Migration[5.2]
  def change
    WorkflowRun.all.each do |wr|
      inputs_json = wr.inputs
      if inputs_json["technology"] == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore]
        inputs_json["wetlab_protocol"] = ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic]
        wr.update(inputs_json: inputs_json.to_json)
      end
    end
  end
end
