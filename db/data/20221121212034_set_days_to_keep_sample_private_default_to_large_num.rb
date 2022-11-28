# frozen_string_literal: true

class SetDaysToKeepSamplePrivateDefaultToLargeNum < ActiveRecord::Migration[6.1]
  def up
    Project.where(days_to_keep_sample_private: 365).update_all(days_to_keep_sample_private: ProjectsController::FAR_FUTURE_DAYS)
    change_column_default :projects, :days_to_keep_sample_private, ProjectsController::FAR_FUTURE_DAYS
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
