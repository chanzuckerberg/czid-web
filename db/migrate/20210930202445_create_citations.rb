class CreateCitations < ActiveRecord::Migration[6.1]
  def change
    create_table :citations do |t|
      t.string :key, null: false, comment: "Key used to identify the citation (ie. niaid_2020)."
      t.string :footnote, null: false, comment: "Use MLA footnote citation style."

      t.index :key, unique: true

      t.timestamps
    end

    remove_column :pathogens, :source, :string
    add_reference :pathogens, :citation, foreign_key: true

    add_column :pathogen_lists, :is_global, :boolean, null: false, default: false
  end
end
