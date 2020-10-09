class RemoveTempWetlabProtocol < ActiveRecord::Migration[5.2]
  def change
    remove_column :samples, :temp_wetlab_protocol
  end
end
