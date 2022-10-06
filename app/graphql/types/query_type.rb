module Types
  class QueryType < Types::BaseObject
    # Add `node(id: ID!) and `nodes(ids: [ID!]!)`
    include GraphQL::Types::Relay::HasNodeField
    include GraphQL::Types::Relay::HasNodesField
    include ParameterSanitization
    include SamplesHelper

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

    field :project, ProjectType, null: false do
      argument :id, Integer, required: true
    end

    field :samples_list, SampleListType, null: false do
      argument :projectId, Int, required: false
      argument :domain, String, required: false
      argument :limit, Int, required: false
      argument :offset, Int, required: false
      argument :orderBy, String, required: false
      argument :orderDir, String, required: false
      argument :listAllIds, Boolean, required: false
      argument :basic, Boolean, required: false
      argument :sampleIds, [Int], required: false
      argument :host, String, required: false
      argument :location, String, required: false
      argument :locationV2, String, required: false
      argument :taxIds, [Int], required: false
      argument :taxLevels, [String], required: false
      argument :thresholdFilterInfo, String, required: false
      argument :annotations, [String], required: false
      argument :time, GraphQL::Types::ISO8601DateTime, required: false
      argument :sampleType, String, required: false
      argument :visibility, [String], required: false
      argument :searchString, String, required: false
      argument :requestedSampleIds, [Int], required: false
      argument :workflow, String, required: false
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

    def project(id)
      current_power = context[:current_power]
      project = Project.find(id[:id])
      samples = current_power.project_samples(project).order(id: :desc)

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        public_access: project.public_access.to_i,
        created_at: project.created_at,
        total_sample_count: samples.count,
      }
    end

    def samples_list(params)
      current_user = context[:current_user]
      current_power = context[:current_power]
      sorting_v0_allowed = current_user.allowed_feature?("sorting_v0_admin") || (current_user.allowed_feature?("sorting_v0") && params[:domain] == "my_data")

      order_by = if sorting_v0_allowed
                   params["orderBy"] || "createdAt"
                 else
                   :id
                 end

      order_dir = sanitize_order_dir(params[:orderDir], :desc)
      limit = params[limit] ? parmas[limit].to_i : 100
      offset = params[offset].to_i

      list_all_sample_ids = ActiveModel::Type::Boolean.new.cast(params[:listAllIds])

      filters = {
        host: params[:host],
        location: params[:location],
        locationV2: params[:locationV2],
        taxIds: params[:taxIds],
        taxLevels: params[:taxLevels],
        thresholdFilterInfo: params[:thresholdFilterInfo],
        annotations: params[:annotations],
        time: params[:time],
        sampleType: params[:sampleType],
        visibility: params[:visibility],
        projectId: params[:projectId],
        searchString: params[:searchString],
        requestedSampleIds: params[:requestedSampleIds],
        workflow: params[:workflow],
      }

      samples = fetch_samples_with_current_power(current_power, domain: params[:domain], filters: filters)

      samples = if sorting_v0_allowed
                  Sample.sort_samples(samples, order_by, order_dir)
                else
                  samples.order(Hash[order_by => order_dir])
                end

      limited_samples = samples.offset(offset).limit(limit)

      limited_samples_json = limited_samples.includes(:project).as_json(
        only: [:id, :name, :host_genome_id, :project_id, :created_at],
        methods: [:private_until]
      )

      basic = ActiveModel::Type::Boolean.new.cast(params[:basic])
      sample_ids = limited_samples.map(&:id)
      # If basic requested, then don't include extra details (ex: metadata) for each sample.
      unless basic
        samples_visibility = get_visibility_by_sample_id_and_current_power(sample_ids, current_power)
        # format_samples loads a lot of information about samples
        # There are many ways we can refactor: multiple endpoints for client to ask for the information
        # they actually need or at least a configurable function to get only certain data
        # NOTE: `details_json` guarantees the order of samples, but it would be good to make it indexed on id too
        details_json = format_samples(limited_samples).as_json(
          except: [:sfn_results_path]
        )
        limited_samples_json.zip(details_json).map do |sample, details|
          sample[:public] = samples_visibility[sample["id"]]
          sample[:details] = details
        end
      end

      results = { samples: limited_samples_json }
      results[:sampleIds] = sample_ids if list_all_sample_ids

      results = results.deep_transform_keys { |key| key.to_s.camelize(:lower) }
      results
    end
  end
end
