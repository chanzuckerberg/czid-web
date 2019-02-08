class CreateVisualizations < ActiveRecord::Migration[5.1]
  def change
    create_table :visualizations do |t|
      t.references :user, foreign_key: true
      # Can't use "type" because that is reserved by Rails
      t.string :visualization_type
      # TODO: we can use mysql json data type by upgrading to mysql 5.7
      # t.json :data
      t.text :data

      t.timestamps
    end

    create_join_table :visualizations, :samples do |t|
      t.index [:visualization_id]
      t.index [:sample_id]
    end
  end
end
