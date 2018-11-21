class AddLineageToContigs < ActiveRecord::Migration[5.1]
  def change
    add_column :contigs, :lineage_json, :text
  end
end
