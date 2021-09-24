class CreatePathogens < ActiveRecord::Migration[6.1]
  def change
    create_table :pathogen_lists do |t|
      t.bigint :creator_id, comment: "The user_id that created the pathogen list. Null if the list is admin-managed."

      t.timestamps
    end

    create_table :pathogen_list_versions do |t|
      t.references :pathogen_list, foreign_key: true
      t.string :version, null: false, comment: "Use semantic versioning numbers."

      t.timestamps
    end

    create_table :pathogens do |t|
      t.integer :tax_id, null: false, comment: "The taxon id of the pathogen."
      t.string :source, null: false, comment: "A constant representing the pathogen source (ie. NIAID_2019)."

      t.timestamps
    end

    # Pathogens can belong to many pathogen list versions.
    # Pathogen list versions can have many pathogens.
    create_join_table :pathogens, :pathogen_list_versions do |t|
      t.index [:pathogen_id], name: "index_pathogen_pathogen_list_version_on_pathogen_id"
      t.index [:pathogen_list_version_id], name: "index_pathogen_pathogen_list_version_on_pathogen_list_version_id"
    end
  end
end
