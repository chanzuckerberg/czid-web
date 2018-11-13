class MakeDagJsonLongText < ActiveRecord::Migration[5.1]
  def change
    change_column :phylo_trees, :dag_json, :longtext
  end
end
