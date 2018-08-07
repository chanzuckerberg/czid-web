class AddUserAndModelType < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_scoring_models, :model_type, :string
    add_column :taxon_scoring_models, :user_id, :bigint
  end
end
