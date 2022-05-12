class AddIndicesForSorting < ActiveRecord::Migration[6.1]
  def change
    add_index :samples, :name

    add_index :visualizations, :name
    add_index :visualizations, :updated_at 

    add_index :pipeline_runs, :total_reads
    add_index :pipeline_runs, :adjusted_remaining_reads
    add_index :pipeline_runs, :total_ercc_reads
    add_index :pipeline_runs, :pipeline_version
    add_index :pipeline_runs, :fraction_subsampled
    add_index :pipeline_runs, :time_to_finalized

    add_index :insert_size_metric_sets, :mean

    add_index :metadata, :string_validated_value
    add_index :metadata, :number_validated_value
  end
end
