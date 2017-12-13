class ChangeMetadata < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_outputs, :unmapped_reads, :bigint
    rename_column :samples, :sample_host, :sample_patient
    rename_column :samples, :sample_template, :sample_nucleotide
  end
end
