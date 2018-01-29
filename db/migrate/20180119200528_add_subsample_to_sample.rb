class AddSubsampleToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :subsample, :integer
  end
end
