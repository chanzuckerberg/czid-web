class AddDoNotProcessToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :do_not_process, :boolean, null: false, default: false, comment: "If true, sample will skip pipeline processing."
  end
end
