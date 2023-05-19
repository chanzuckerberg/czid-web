# frozen_string_literal: true

class BackpopulateCreationSource < ActiveRecord::Migration[6.1]
  def up
    wrs = WorkflowRun.consensus_genomes.non_deprecated.where(status: WorkflowRun::STATUS[:succeeded])
    num_wrs = wrs.count
    batch_size = 500
    num_batches = num_wrs/batch_size
    current_batch = 0

    puts "starting to backfill workflow_run.inputs_json[:creation_source]"
    puts "Total batches being processed: #{num_batches}. Total number of workflow_runs per batch: #{batch_size}"
    wrs.in_batches(of: batch_size)  do |cg_workflow_runs|
      # The last batch will have probably not have 500 workflow_runs so I count the number of workflow_runs in the batch here
      size_of_current_batch = cg_workflow_runs.count
      cg_workflow_runs.each_with_index do |cg_workflow_run, cg_workflow_run_index|
        inputs = cg_workflow_run.inputs
        if inputs.instance_of?(Hash)
          inputs["creation_source"] = get_creation_source(cg_workflow_run.sample, inputs)
          cg_workflow_run.update(inputs_json: inputs.to_json)
        else
          puts "inputs_json from workflow_run #{cg_workflow_run.id} did not have expected inputs_json type (Hash), skipping backfill "
        end
        puts "Percent complete in batch #{current_batch}: #{((cg_workflow_run_index + 1)/(size_of_current_batch < 1 ? 1 : size_of_current_batch).to_f) * 100}"
      end
      puts "\t--------- Finished batch #{current_batch} out of #{num_batches} ---------"
      current_batch += 1
    end
    puts "Successfully backfilled `creation_source` on all workflow_runs"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

def get_creation_source(sample, workflow_run_inputs_json)
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
