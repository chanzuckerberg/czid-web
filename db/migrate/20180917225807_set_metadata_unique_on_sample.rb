class SetMetadataUniqueOnSample < ActiveRecord::Migration[5.1]
  def change
    add_index :metadata, %w[key sample_id], unique: true
  end
end
