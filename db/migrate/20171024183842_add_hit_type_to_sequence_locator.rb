class AddHitTypeToSequenceLocator < ActiveRecord::Migration[5.1]
  def change
    add_column :sequence_locators, :hit_type, :string
  end
end
