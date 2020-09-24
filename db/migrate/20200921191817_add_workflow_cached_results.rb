class AddWorkflowCachedResults < ActiveRecord::Migration[5.2]
  def change
    add_column :workflow_runs, :cached_results, :text, comment: "JSON-string of cached results for generic loading. Use for simple outputs."
  end
end
