class AddElasticsearchIndexToSample < ActiveRecord::Migration[5.1]
  def change
    ## Run this in console
    # Sample.__elasticsearch__.create_index!(force: true)
    # Sample.__elasticsearch__.import
  end
end
