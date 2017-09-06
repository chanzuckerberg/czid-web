class AddBackgroundToReport < ActiveRecord::Migration[5.1]
  def change
    add_reference :reports, :background, foreign_key: true
  end
end
