class AddWetlabProtocol < ActiveRecord::Migration[5.2]
  def change
    add_column :samples, :temp_wetlab_protocol, :string, comment: "A soft enum (string) for the wetlab protocol. Required for temp_pipeline_workflow=consensus_genome."
  end
end
