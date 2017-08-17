class AddProjectIdToSample < ActiveRecord::Migration[5.1]
  def change
    add_reference :samples, :project, index: true
  end
end
