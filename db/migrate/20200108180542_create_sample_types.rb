class CreateSampleTypes < ActiveRecord::Migration[5.1]
  def change
    create_table :sample_types, &:timestamps
  end
end
