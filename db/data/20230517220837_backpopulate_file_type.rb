# frozen_string_literal: true

class BackpopulateFileType < ActiveRecord::Migration[6.1]
  def up
    batch_size = 500
    input_files = InputFile.arel_table
    puts "starting to backfill file_type for fastq files"
    InputFile
      .where(input_files[:name].matches_regexp("\.?fastq$|fq$|\.fastq\.gz$|\.fq\.gz$"))
      .in_batches(of: batch_size)
      .update_all(file_type: InputFile::FILE_TYPE_FASTQ)
    puts "backfill file_type for fastq files complete"

    puts "starting to backfill file_type for bed files"
    InputFile
      .where(input_files[:name].matches_regexp("\.bed$|\.bed\.gz$"))
      .in_batches(of: batch_size)
      .update_all(file_type: InputFile::FILE_TYPE_PRIMER_BED)
    puts "backfill file_type for bed files complete"
    # Update fasta/fa files; they may be viral cg uploads, otherwise treat them as fastqfiles
    puts "starting to backfill file_type for fasta files"
    InputFile
      .includes(sample: [:workflow_runs])
      .where(input_files[:name].matches_regexp("\.fasta$|\.fa$|\.fasta\.gz$|\.fa\.gz$"))
      .in_batches(of: batch_size)
      .each_record do |fasta_file|
        workflow_run = fasta_file.sample.workflow_runs.first
        # get creation_source from workflow_run.inputs_json if workflow_run exists and workflow_run.inputs exists
        creation_source = workflow_run&.inputs&.[]("creation_source")
        if creation_source == ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload]
          fasta_file.update(file_type: InputFile::FILE_TYPE_REFERENCE_SEQUENCE)
        else
          # runs other than viral_cg_upload can have fasta files that are treated as fastq files
          fasta_file.update(file_type: InputFile::FILE_TYPE_FASTQ)
        end
      end
    puts "backfill file_type for fasta files complete"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
