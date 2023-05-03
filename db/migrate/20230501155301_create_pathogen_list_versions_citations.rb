class CreatePathogenListVersionsCitations < ActiveRecord::Migration[6.1]
  def up
    create_join_table :citations, :pathogen_list_versions do |t|
      t.index [:citation_id], name: "index_citation_pathogen_list_version_on_citation_id"
      t.index [:pathogen_list_version_id], name: "index_citation_pathogen_list_version_on_pathogen_list_version_id"
    end
    
    # accomodate longer footnotes
    # strong_migrations advises against using change_column because it blocks writes, but this table gets written to very rarely
    safety_assured { change_column :citations, :footnote, :text }

    PathogenList.connection.execute("
      INSERT INTO citations_pathogen_list_versions
      SELECT citation_id, pathogen_list_version_id
      FROM pathogens
        INNER JOIN pathogen_list_versions_pathogens ON pathogen_list_versions_pathogens.pathogen_id = pathogens.id
      WHERE pathogens.citation_id IS NOT NULL
      GROUP BY citation_id, pathogen_list_version_id
    ")

    # we don't remove the citation_id column from pathogens table so that we can rollback
  end

  def down
    safety_assured { change_column :citations, :footnote, :string } # a rollback will be lossy for footnotes longer than 255 characters

    # you will also lose all citation/pathogen_list_version associations made after this migration
    drop_join_table :citations, :pathogen_list_versions
  end
end
