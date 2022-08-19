module Types
  class QueryType < Types::BaseObject
    # Add `node(id: ID!) and `nodes(ids: [ID!]!)`
    include GraphQL::Types::Relay::HasNodeField
    include GraphQL::Types::Relay::HasNodesField

    # Add root-level fields here.
    # They will be entry points for queries on your schema.
    field :app_config, AppConfigType, null: true do
      argument :id, ID, required: true
    end

    field :user, UserType, null: false do
      argument :email, String, required: true
      argument :name, String, required: true
      argument :institution, String, required: true
      argument :archetypes, String, required: true
      argument :segments, String, required: true
      argument :role, Int, required: true
    end

    field :pathogen_list, PathogenListType, null: false do
      argument :version, String, required: false
    end

    def app_config(id:)
      AppConfig.find(id)
    end

    def pathogen_list(version: nil)
      launched = AppConfigHelper.get_json_app_config(AppConfig::LAUNCHED_FEATURES, [])
      unless launched.include?("pathogen_list_v0")
        redirect_to page_not_found_path
      end

      global_pathogen_list = PathogenList.find_by(is_global: true)
      @list_version = nil
      if global_pathogen_list.present?
        # TODO: Validate that version is never sent in params and remove commented lines below
        # permitted_params = [:version]
        # version = params.permit(*permitted_params)
        @list_version = global_pathogen_list.fetch_list_version(version)
      end

      if @list_version.present?
        {
          version: @list_version.version,
          updated_at: @list_version.updated_at,
          pathogens: @list_version.fetch_pathogens_info,
          citations: @list_version.fetch_citation_footnotes,
        }
      else
        raise GraphQL::ExecutionError, "Pathogen list not found"
      end
    end
  end
end
