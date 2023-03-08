class AddPipelineVersionControlTables < ActiveRecord::Migration[6.1]
  def change
    create_table :project_workflow_versions do |t|
      t.integer :project_id, null: false, comment: "The project to which this workflow version applies"
      t.string :workflow, null: false, comment: "The workflow to which this version applies"
      t.string :version_prefix, null: false, comment: "The version prefix that will be used to run the workflow - can be major, patch, or minor"
      t.index [:project_id, :workflow], unique: true
    end

    create_table :workflow_versions do |t|
      t.string :workflow, null: false, comment: "Name of the workflow (e.g. short-read-mngs)"
      t.string :version, null: false, comment: "The specific version of the workflow (e.g. 1.2.3)"
      t.boolean :deprecated, comment: "A workflow version is deprecated if it's no longer receiving patches, but is runnable"
      t.boolean :runnable, comment: "A workflow version is runnable if the infrastructure can run it"
      t.index [:workflow, :version], unique: true
    end
  end
end
