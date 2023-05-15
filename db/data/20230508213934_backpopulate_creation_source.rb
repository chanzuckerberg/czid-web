# frozen_string_literal: true

class BackpopulateCreationSource < ActiveRecord::Migration[6.1]
  def up
    WorkflowRun.consensus_genomes.all.each do |cg_workflow_run|
      inputs = JSON.parse(cg_workflow_run.inputs_json.presence || '{}')
      inputs[:creation_source] = get_creation_source(cg_workflow_run.sample, cg_workflow_run)
      cg_workflow_run.update(inputs_json: inputs.to_json)
    end
  end

  def down
    WorkflowRun.consensus_genomes.all.each do |cg_workflow_run|
      inputs = JSON.parse(cg_workflow_run.inputs_json.presence || '{}')
      inputs[:creation_source] = nil
      cg_workflow_run.update(inputs_json: inputs.to_json)
    end
  end
end

def get_creation_source(sample, cg_workflow_run)
  
  if cg_workflow_run.inputs_json.presence 
    workflow_run_inputs_json =JSON.parse(cg_workflow_run.inputs_json)
    # Modify the logic in this method to return the appropriate creation_source for each sample
    if technology(workflow_run_inputs_json, sample) == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore]
      # CG kickoff is not available through mNGS nanopore report
      return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:sars_cov_2_upload]
    elsif (ref_fasta_input(workflow_run_inputs_json, sample) || workflow_run_inputs_json&.[]("reference_accession"))
      return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload]
    elsif workflow_run_inputs_json&.[]("accession_id") == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID
      return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:sars_cov_2_upload]
    else
      return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:mngs_report]
    end
  else
    nil
  end
end

def technology(workflow_run_inputs_json, sample)
  workflow_run_inputs_json&.[]("technology")
end

def ref_fasta_input(workflow_run_inputs_json, sample)
  ref_fasta_name = workflow_run_inputs_json&.[]("ref_fasta")
  if ref_fasta_name
    sample.input_files.find { |i| i.name != ref_fasta_name }
  end
end
