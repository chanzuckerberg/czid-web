class AddSubsampleToProject < ActiveRecord::Migration[5.1]
  def change
    change_table :projects, bulk: true do |t|
      t.integer :subsample_default, comment: "The default value of subsample for newly uploaded samples. Can be overridden by admin options."
      t.integer :max_input_fragments_default, comment: "The default value of max_input_fragments for newly uploaded samples. Can be overridden by admin options."
    end
  end
end
