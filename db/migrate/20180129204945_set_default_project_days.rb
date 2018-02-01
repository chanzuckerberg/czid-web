class SetDefaultProjectDays < ActiveRecord::Migration[5.1]
  def change
    ActiveRecord::Base.connection.execute(
      "UPDATE projects SET days_to_keep_sample_private = 365
        WHERE days_to_keep_sample_private is null"
    )
    change_column :projects, :days_to_keep_sample_private, :integer, :default => 365 , :null => false
  end
end
