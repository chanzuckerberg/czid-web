class DropTempCgColumns < ActiveRecord::Migration[5.2]
  def change
    change_table :samples, bulk: true do |t|
      t.remove :temp_sfn_execution_arn
      t.remove :temp_sfn_execution_status
      t.remove :temp_wdl_version
    end
  end
end
