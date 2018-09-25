class AddRpmListTaxonSummaries < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_summaries, :rpm_list, :text
  end
end
