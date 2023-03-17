class ChangeBaseCountsToBigint < ActiveRecord::Migration[6.1]
  def change
    # WARNING: this migration is not safe, this is being manually deployed with downtime
    safety_assured { change_column :taxon_counts, :base_count, :bigint }
  end
end
