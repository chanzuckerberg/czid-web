class AddInstitutionToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :institution, :string, limit: 100
  end
end
