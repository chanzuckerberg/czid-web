module Types
  class AlignmentConfigType < Types::BaseObject
    field :name, String, null: true
    field :index_dir_suffix, String, null: true
    field :s3_nt_db_path, String, null: true
    field :s3_nt_loc_db_path, String, null: true
    field :s3_nr_db_path, String, null: true
    field :s3_nr_loc_db_path, String, null: true
    field :s3_lineage_path, String, null: true
    field :s3_accession2taxid_path, String, null: true
    field :s3_deuterostome_db_path, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :s3_nt_info_db_path, String, null: true
    field :s3_taxon_blacklist_path, String, null: true
    field :lineage_version_old, Int, null: true
    field :lineage_version, String, null: false
  end
end
