class CreateJoinTableBackgroundsSamples < ActiveRecord::Migration[5.1]
  def change
    create_join_table :backgrounds, :samples do |t|
      # t.index [:background_id, :sample_id]
      # t.index [:sample_id, :background_id]
    end
  end
end
