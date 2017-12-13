class RenameSampleHostToPatient < ActiveRecord::Migration[5.1]
  def change
    rename_column :samples, :sample_host, :sample_patient
  end
end
