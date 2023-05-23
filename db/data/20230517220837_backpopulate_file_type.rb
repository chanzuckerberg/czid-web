# frozen_string_literal: true

class BackpopulateFileType < ActiveRecord::Migration[6.1]
  def up
    num_samples = Sample.count
    batch_size = 500
    num_batches = num_samples/batch_size
    current_batch = 0

    puts "starting to backfill sample.input_files.file_type"
    puts "Total batches being processed: #{num_batches}. Total number of samples"

    # eager load to avoid N+1 queries, use each_record to avoid loading all records into memory
    Sample.includes(:workflow_runs, :input_files).in_batches(of: batch_size).each_record.with_index do |sample, sample_index|
        # get first workflow_run for sample if it exists
        workflow_run = sample.workflow_runs.first
        # get creation_source from workflow_run.inputs_json if it exists
        creation_source = workflow_run.inputs["creation_source"] if workflow_run
        input_files = sample.input_files
        input_files.all.each do |input_file|
          if ["fastq.gz", "fastq", "fq.gz", "fq"].include?(input_file.file_extension)
            input_file.update(file_type: InputFile::FILE_TYPE_FASTQ)
          elsif ["bed", "bed.gz"].include?(input_file.file_extension)
            input_file.update(file_type: InputFile::FILE_TYPE_PRIMER_BED)
          elsif ["fasta", "fa", "fasta.gz", "fa.gz"].include?(input_file.file_extension)
            if creation_source == ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload]
              input_file.update(file_type: InputFile::FILE_TYPE_REFERENCE_SEQUENCE)
            else
              # runs other than viral_cg_upload can have fasta files that are treated as fastq files
              input_file.update(file_type: InputFile::FILE_TYPE_FASTQ)
            end
          else
            puts "file type not found for extension #{input_file.file_extension}"
          end
        end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
