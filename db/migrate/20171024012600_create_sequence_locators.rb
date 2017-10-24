class CreateSequenceLocators < ActiveRecord::Migration[5.1]
  def change
    create_table :sequence_locators do |t|
      t.string :sequence_file_uri
      t.references :postprocess_run, foreign_key: true
      t.references :pipeline_output, foreign_key: true

      t.timestamps
    end
  end
end
