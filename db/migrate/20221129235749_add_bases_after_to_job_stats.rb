class AddBasesAfterToJobStats < ActiveRecord::Migration[6.1]
  def change
    add_column :job_stats, :bases_after, :bigint
  end
end
