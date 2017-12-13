class AddDiagnosisToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :sample_diagnosis, :text
  end
end
