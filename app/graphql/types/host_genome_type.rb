module Types
  class HostGenomeType < Types::BaseObject
    field :id, Int, null: false
    field :name, String, null: false
    field :s3_star_index_path, String, null: false
    field :s3_bowtie2_index_path, String, null: false
    field :default_background_id, Int, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :skip_deutero_filter, Int, null: false
    field :taxa_category, String, null: false
    field :samples_count, Int, null: false
    field :user_id, Int, null: true
    field :s3_minimap2_index_path, String, null: true

    field :user, Types::UserType, null: true, resolver_method: :host_genome_type_user
    def host_genome_type_user
      host_genome = HostGenome.find(object["id"])
      host_genome.user
    end
  end
end
