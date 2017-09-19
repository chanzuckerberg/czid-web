class CreateInputFiles < ActiveRecord::Migration[5.1]
  def change
    create_table :input_files do |t|
      t.string :name
      t.text :presigned_url
      t.references :sample, foreign_key: true

      t.timestamps
    end
  end
end
