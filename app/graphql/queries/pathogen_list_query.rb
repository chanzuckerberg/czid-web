module Queries
  module PathogenListQuery
    extend ActiveSupport::Concern

    included do
      field :pathogen_list, Types::PathogenListType, null: false do
        argument :version, String, required: false
      end
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
