class AddDeletedAtToSamples < ActiveRecord::Migration[6.1]
  def change
    add_column :samples, :deleted_at, :datetime, comment: "When the user triggered deletion of the sample"
  end
end
