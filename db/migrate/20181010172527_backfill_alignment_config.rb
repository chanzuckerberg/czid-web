class BackfillAlignmentConfig < ActiveRecord::Migration[5.1]
  def change
    Sample.where(alignment_config_name: nil).update_all(alignment_config_name: AlignmentConfig::DEFAULT_NAME) # rubocop:disable SkipsModelValidations
  end
end
